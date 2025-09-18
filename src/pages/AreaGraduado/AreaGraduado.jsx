import { useEffect, useRef, useState } from "react";
import { Container, Row, Col, Alert, Modal } from "react-bootstrap";
import { useMsal } from "@azure/msal-react";
import {
  criarPerfil,
  buscarPerfil,
  atualizarPerfil as apiAtualizarPerfil,
} from "../../services/backend";
import CadastroInicial from "../../components/CadastroInicial/CadastroInicial";
import Certificados from "../../components/Certificados/Certificados";
import { getCordaNome } from "../../constants/nomesCordas";
import calcularIdade from "../../utils/calcularIdade";
import ModalEditarPerfil from "../../components/Modals/ModalEditarPerfil";
import axios from "axios";
import fotoPadrao from "../../assets/foto-perfil/foto-perfil-padrao.jpg";
import CropImageModal from "../../components/CropImageModal";
import { nivelMap } from "../../utils/roles";
import FileSection from "../../components/FileSection/FileSection";
import { getHorarioLabel } from "../../helpers/agendaTreino";
import { buscarCep } from "../../services/cep";
import { buildFullAddress } from "../../utils/address";
import { formatarData } from "../../utils/formatarData";
import {
  makeAvatarVariants, // gera @1x e @2x
} from "../../utils/imagePerfil";
import { setPerfilCache } from "../../utils/profileCache";

const API_URL = import.meta.env.VITE_API_URL;

// evita 1º efeito duplicado no StrictMode (apenas DEV)
const DEV_STRICT_DEBOUNCE_MS = 30;

/* ============================
   Enum/labels de nível de acesso
   ============================ */
const NIVEL_LABELS = {
  visitante: "Visitante",
  aluno: "Aluno",
  graduado: "Graduado",
  monitor: "Monitor",
  instrutor: "Instrutor",
  professor: "Professor",
  contramestre: "Contramestre",
};

function getNivelLabel(nivel) {
  if (!nivel) return "";
  const key = String(nivel).trim().toLowerCase();
  return NIVEL_LABELS[key] || "";
}

const AreaGraduado = () => {
  const { instance, accounts } = useMsal();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({ nome: "", email: "" });
  const [perfil, setPerfil] = useState({
    nome: "",
    apelido: "",
    corda: "",
    genero: "",
    racaCor: "",
    numero: "",
    endereco: "",
    dataNascimento: "",
    nivelAcesso: "", // <- vem do backend e alimenta o label dinâmico
  });

  const [formEdit, setFormEdit] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCadastroInicial, setShowCadastroInicial] = useState(false);

  // CEP helpers
  const [cep, setCep] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [logradouro, setLogradouro] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");

  // foto
  const [fotoPreview, setFotoPreview] = useState(null);
  const [temFotoRemota, setTemFotoRemota] = useState(false);
  const [cropModal, setCropModal] = useState(false);
  const [rawImage, setRawImage] = useState(null);
  const [fotoCarregando, setFotoCarregando] = useState(true);
  const [avatar1x, setAvatar1x] = useState(null);
  const [avatar2x, setAvatar2x] = useState(null);

  // modal de zoom
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarModalUrl, setAvatarModalUrl] = useState(null);

  // feedback
  const [feedback, setFeedback] = useState({
    show: false,
    variant: "danger",
    message: "",
  });
  const showError = (message) =>
    setFeedback({ show: true, variant: "danger", message });
  const showSuccess = (message) =>
    setFeedback({ show: true, variant: "success", message });
  const hideFeedback = () =>
    setFeedback((p) => ({ ...p, show: false, message: "" }));

  // ==== Controle de concorrência / cancelamento ====
  const abortRef = useRef(null);
  const reqSeq = useRef(0);

  // util: checa se imagem existe (com guarda por sequência)
  const testImage = (url, mySeq) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () =>
        mySeq === reqSeq.current ? resolve(true) : resolve(false);
      img.onerror = () =>
        mySeq === reqSeq.current ? resolve(false) : resolve(false);
      img.src = url;
    });

  // ===== Boot / carregamento principal =====
  useEffect(() => {
    const account = accounts[0];
    if (!account) return;

    setSession(account);
    setUserData({ nome: account.name, email: account.username });

    let cancelled = false;
    let timer = null;

    const run = async () => {
      if (cancelled) return;

      // cancela requisição anterior
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const mySeq = ++reqSeq.current;

      try {
        // Perfil e foto rodam em paralelo
        const perfilPromise = (async () => {
          try {
            const p = await buscarPerfil(account.username, {
              signal: controller.signal,
            });
            if (mySeq !== reqSeq.current) return;
            if (p) {
              setPerfil(p);
              setPerfilCache(account.username, p);
              setShowCadastroInicial(false);
            } else {
              setShowCadastroInicial(true);
            }
          } catch {
            if (mySeq !== reqSeq.current) return;
            setShowCadastroInicial(true);
          }
        })();

        const fotoPromise = (async () => {
          const base = `https://certificadoscapoeira.blob.core.windows.net/certificados/${account.username}`;
          const url1x = `${base}/foto-perfil@1x.jpg?${Date.now()}`;
          const urlLegacy = `${base}/foto-perfil.jpg?${Date.now()}`;

          let url = fotoPadrao;
          let hasRemote = false;

          if (await testImage(url1x, mySeq)) {
            url = url1x;
            hasRemote = true;
          } else if (await testImage(urlLegacy, mySeq)) {
            url = urlLegacy;
            hasRemote = true;
          }

          if (mySeq !== reqSeq.current) return;
          setFotoPreview(url);
          setTemFotoRemota(hasRemote);
          setFotoCarregando(false);
        })();

        await Promise.allSettled([perfilPromise, fotoPromise]);
      } finally {
        if (mySeq === reqSeq.current) setLoading(false);
      }
    };

    if (import.meta.env?.DEV) {
      timer = setTimeout(run, DEV_STRICT_DEBOUNCE_MS);
    } else {
      run();
    }

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [accounts]);

  // ===== Foto: seleção / corte / upload =====
  const handleFotoChange = (e) => {
    hideFeedback();
    const file = e.target.files?.[0];
    const allowedTypes = ["image/png", "image/jpeg"];
    if (file && allowedTypes.includes(file.type)) {
      const reader = new FileReader();
      reader.onload = () => {
        setRawImage(reader.result);
        setCropModal(true);
      };
      reader.readAsDataURL(file);
    } else {
      showError("Envie uma imagem JPG ou PNG.");
    }
  };

  const handleCroppedSave = async (croppedFile) => {
    hideFeedback();
    try {
      const { oneXFile, twoXFile } = await makeAvatarVariants(croppedFile);
      setAvatar1x(oneXFile);
      setAvatar2x(twoXFile);
      setFotoPreview(URL.createObjectURL(oneXFile));
    } catch (err) {
      console.error(err);
      showError("Não foi possível processar a imagem.");
    } finally {
      setCropModal(false);
    }
  };

  const salvarFoto = async () => {
    hideFeedback();
    if (!avatar1x || !avatar2x) return;

    const urlBase = `${API_URL}/upload/foto-perfil?email=${userData.email}`;
    const f1 = new FormData();
    f1.append("arquivo", avatar1x);
    const f2 = new FormData();
    f2.append("arquivo", avatar2x);

    try {
      await Promise.all([
        axios.post(`${urlBase}&name=foto-perfil@1x.jpg`, f1),
        axios.post(`${urlBase}&name=foto-perfil@2x.jpg`, f2),
      ]);
      showSuccess("Foto atualizada com sucesso!");
      setAvatar1x(null);
      setAvatar2x(null);
      setTemFotoRemota(true);
      setFotoPreview(
        `https://certificadoscapoeira.blob.core.windows.net/certificados/${
          userData.email
        }/foto-perfil@1x.jpg?${Date.now()}`
      );
    } catch (e) {
      console.error(e);
      showError("Erro ao enviar a foto.");
    }
  };

  const handleRemoverFoto = async () => {
    hideFeedback();
    try {
      await axios.delete(
        `${API_URL}/upload/foto-perfil?email=${userData.email}`
      );
      setFotoPreview(fotoPadrao);
      setAvatar1x(null);
      setAvatar2x(null);
      setTemFotoRemota(false);
      showSuccess("Foto removida com sucesso!");
    } catch {
      showError("Erro ao remover a foto.");
    }
  };

  // ===== Endereço / CEP =====
  const buscarEnderecoPorCep = async () => {
    hideFeedback();
    if (!cep) return;
    setBuscandoCep(true);
    try {
      const data = await buscarCep(cep);
      setLogradouro(data.logradouro);
      setBairro(data.bairro);
      setCidade(data.cidade);
      setUf(data.uf);
      if (formEdit?.numero) {
        setFormEdit((prev) => ({
          ...prev,
          endereco: buildFullAddress({ ...data, numero: prev.numero }),
        }));
      }
    } catch (e) {
      showError(e?.message || "Erro ao buscar o CEP.");
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleNumeroChange = (e) => {
    hideFeedback();
    const numero = e.target.value;
    setFormEdit((prev) => ({
      ...prev,
      numero,
      endereco: logradouro
        ? `${logradouro}, ${numero} - ${bairro}, ${cidade} - ${uf}`
        : "",
    }));
  };

  // ===== Sair =====
  const handleSignOut = async () => {
    await instance.logoutRedirect();
  };

  // ===== Permissões =====
  const nivelUsuario = nivelMap[perfil.nivelAcesso] ?? 0;
  const canAccess = (minLevel) => nivelUsuario >= minLevel;
  const isMestre = userData.email === "contato@capoeiraminasbahia.com.br";

  // ===== Salvar Perfil =====
  const salvarPerfil = async () => {
    hideFeedback();
    const obrigatorios = [
      "nome",
      "genero",
      "numero",
      "endereco",
      "racaCor",
      "whatsapp",
      "contatoEmergencia",
      "dataNascimento",
      "corda",
    ];
    const vazios = obrigatorios.filter(
      (campo) => !formEdit[campo] || formEdit[campo].trim() === ""
    );
    if (vazios?.length > 0) {
      showError("Preencha todos os campos obrigatórios.");
      return;
    }
    const atualizado = {
      ...formEdit,
      apelido: formEdit.apelido?.trim() || "",
      id: userData.email,
      email: userData.email,
    };
    await apiAtualizarPerfil(userData.email, atualizado);
    setPerfil(atualizado);
    setShowEditModal(false);
    showSuccess("Perfil atualizado com sucesso!");
  };

  if (loading) return <p>Carregando...</p>;

  const isRemotePreview =
    typeof fotoPreview === "string" && fotoPreview.startsWith("http");

  const openAvatarModal = () => {
    let url = fotoPreview;
    if (isRemotePreview && fotoPreview.includes("@1x")) {
      url = fotoPreview.replace("@1x", "@2x");
    } else if (!isRemotePreview && avatar2x) {
      url = URL.createObjectURL(avatar2x);
    }
    setAvatarModalUrl(url);
    setShowAvatarModal(true);
  };

  // label dinâmico do nível
  const nivelDisplay = getNivelLabel(perfil.nivelAcesso) || "-";

  return (
    <Container fluid className="min-h-screen p-4">
      {feedback.show && (
        <Alert
          variant={feedback.variant}
          dismissible
          onClose={hideFeedback}
          className="mb-3"
        >
          {feedback.message}
        </Alert>
      )}

      <Row className="mb-4">
        <Col className="bg-light p-3">
          <h4>
            {nivelDisplay}(a): {perfil.nome || userData.nome}
            {perfil.apelido ? ` - ${perfil.apelido}` : ""}
          </h4>
        </Col>
      </Row>

      <Row>
        <Col md={2} className="border p-3 d-flex flex-column gap-2">
          <button
            className="btn btn-primary"
            onClick={() => {
              hideFeedback();
              setFormEdit({ ...perfil });
              setShowEditModal(true);
            }}
          >
            Editar Perfil
          </button>
          <button onClick={handleSignOut} className="btn btn-danger">
            Sair
          </button>
        </Col>

        <Col md={10} className="border p-3">
          <h5 className="text-center">Perfil</h5>

          <Row className="align-items-start gy-3 gx-0">
            <Col
              xs={12}
              md={4}
              className="order-1 order-md-2 d-flex flex-column align-items-center"
            >
              {fotoCarregando ? (
                <div
                  className="spinner-border text-secondary mb-3"
                  role="status"
                >
                  <span className="visually-hidden">Carregando...</span>
                </div>
              ) : (
                <img
                  src={fotoPreview}
                  srcSet={
                    isRemotePreview && fotoPreview.includes("@1x")
                      ? `${fotoPreview} 1x, ${fotoPreview.replace(
                          "@1x",
                          "@2x"
                        )} 2x`
                      : undefined
                  }
                  alt="Foto de perfil"
                  className="rounded mb-2"
                  width={150}
                  height={200}
                  style={{
                    objectFit: "cover",
                    border: "2px solid #ccc",
                    imageRendering: "auto",
                    cursor: "zoom-in",
                  }}
                  onClick={() =>
                    temFotoRemota || avatar1x ? openAvatarModal() : null
                  }
                />
              )}

              <label className="btn btn-outline-secondary btn-sm mb-2">
                Trocar Foto
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleFotoChange}
                  hidden
                />
              </label>

              {avatar1x && (
                <button
                  className="btn btn-success btn-sm mb-2"
                  onClick={salvarFoto}
                >
                  Salvar Foto
                </button>
              )}

              {temFotoRemota && !avatar1x && (
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={handleRemoverFoto}
                >
                  Remover Foto
                </button>
              )}
            </Col>

            <Col xs={12} md={8} className="order-2 order-md-1">
              <div className="pe-md-3">
                <p>
                  <strong>Nome: </strong> {perfil.nome || "-"}
                </p>
                <p>
                  <strong>Apelido: </strong> {perfil.apelido || "-"}
                </p>
                <p>
                  <strong>Corda: </strong>
                  {getCordaNome(perfil.corda) || "-"}
                </p>
                <p>
                  <strong>Gênero:</strong> {perfil.genero || "-"}
                </p>
                <p>
                  <strong>Raça/Cor:</strong> {perfil.racaCor || "-"}
                </p>
                <p>
                  <strong>Data de Nascimento e Idade: </strong>
                  {perfil.dataNascimento
                    ? `${formatarData(perfil.dataNascimento)} | ${calcularIdade(
                        perfil.dataNascimento
                      )} anos`
                    : "-"}
                </p>
                <p>
                  <strong>WhatsApp (pessoal):</strong> {perfil.whatsapp || "-"}
                </p>
                <p>
                  <strong>Contato de emergência / responsável:</strong>{" "}
                  {perfil.contatoEmergencia || "-"}
                </p>
                <p>
                  <strong>Endereço: </strong>
                  {perfil.endereco || "-"}
                </p>
                <p>
                  <strong>Local e horário de treino: </strong>
                  {perfil.localTreino || "-"} |{" "}
                  {getHorarioLabel(perfil.localTreino, perfil.horarioTreino) ||
                    "-"}
                </p>
                <p>
                  <strong>Professor referência: </strong>
                  {perfil.professorReferencia || "-"}
                </p>
              </div>
            </Col>
          </Row>
        </Col>
      </Row>

      {canAccess(1) && (
        <Row className="mt-4">
          <Col md={12} className="border p-3">
            <div className="grid-list-3">
              <Certificados email={userData.email} />
            </div>
          </Col>
        </Row>
      )}

      {canAccess(1) && (
        <Row className="mt-4">
          <Col md={12} className="border p-3 text-center">
            <h5>Arquivos para Alunos</h5>
            <p>Área para documentos de download público</p>
            <div className="grid-list-3">
              <FileSection pasta="aluno" canUpload={isMestre} />
            </div>
          </Col>
        </Row>
      )}

      <ModalEditarPerfil
        show={showEditModal}
        onHide={() => {
          hideFeedback();
          setShowEditModal(false);
        }}
        formEdit={formEdit}
        setFormEdit={setFormEdit}
        salvarPerfil={salvarPerfil}
        cep={cep}
        setCep={setCep}
        buscarEnderecoPorCep={buscarEnderecoPorCep}
        handleNumeroChange={handleNumeroChange}
        logradouro={logradouro}
        bairro={bairro}
        cidade={cidade}
        uf={uf}
        buscandoCep={buscandoCep}
      />

      {showCadastroInicial && (
        <CadastroInicial
          show={showCadastroInicial}
          onSave={async (dados) => {
            const perfilFinal = {
              ...dados,
              id: userData.email,
              email: userData.email,
            };
            await criarPerfil(perfilFinal);
            setPerfil(perfilFinal);
            setPerfilCache(userData.email, perfilFinal);
            setUserData((prev) => ({ ...prev, nome: dados.nome }));
            setShowCadastroInicial(false);
            showSuccess("Cadastro criado com sucesso!");
          }}
        />
      )}

      {cropModal && (
        <CropImageModal
          imageSrc={rawImage}
          onSave={handleCroppedSave}
          onClose={() => setCropModal(false)}
        />
      )}

      <Modal
        show={showAvatarModal}
        onHide={() => setShowAvatarModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Foto de perfil</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <img
            src={avatarModalUrl || fotoPreview}
            alt="Foto de perfil ampliada"
            className="img-fluid"
            style={{ maxHeight: "80vh" }}
            onError={(e) => {
              const img = e.currentTarget;
              const url = img.src || "";
              if (url.includes("@2x")) img.src = url.replace("@2x", "@1x");
              else if (url.includes("@1x")) img.src = url.replace("@1x", "");
              else {
                img.onerror = null;
                img.src = fotoPadrao;
              }
            }}
          />
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default AreaGraduado;
