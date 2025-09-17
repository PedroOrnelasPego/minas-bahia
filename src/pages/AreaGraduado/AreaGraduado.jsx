import { useEffect, useState } from "react";
import { Container, Row, Col, Alert, Modal } from "react-bootstrap";
import { useMsal } from "@azure/msal-react";
import {
  criarPerfil,
  buscarPerfil,
  atualizarPerfil,
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
  AVATAR,
  optimizeProfilePhoto,
  makeProfileThumb,
  makeAvatarVariants, // <- IMPORTANTE
} from "../../utils/imagePerfil";
import { setPerfilCache } from "../../utils/profileCache";

const API_URL = import.meta.env.VITE_API_URL;

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
    nivelAcesso: "",
  });
  const [formEdit, setFormEdit] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCadastroInicial, setShowCadastroInicial] = useState(false);
  const [cep, setCep] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [logradouro, setLogradouro] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [fotoPreview, setFotoPreview] = useState(null);
  const [temFotoRemota, setTemFotoRemota] = useState(false);
  const [cropModal, setCropModal] = useState(false);
  const [rawImage, setRawImage] = useState(null);
  const [fotoCarregando, setFotoCarregando] = useState(true);

  // NOVO: arquivos prontos para upload
  const [avatar1x, setAvatar1x] = useState(null);
  const [avatar2x, setAvatar2x] = useState(null);

  // MODAL de visualização da foto (2x)
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarModalUrl, setAvatarModalUrl] = useState(null);

  // ===== Feedback (substitui window.alert) =====
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
    setFeedback((prev) => ({ ...prev, show: false, message: "" }));

  // helper: testa se existe
  const testImage = (url) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });

  useEffect(() => {
    const account = accounts[0];
    if (!account) return;

    setSession(account);
    setUserData({ nome: account.name, email: account.username });

    buscarPerfil(account.username)
      .then((perfilBuscado) => {
        if (perfilBuscado) {
          setPerfil(perfilBuscado);
          setPerfilCache(account.username, perfilBuscado);
        } else {
          setShowCadastroInicial(true);
        }
      })
      .catch(() => setShowCadastroInicial(true))
      .finally(() => setLoading(false));

    // tentar @1x; se não existir, tentar legado; senão, default
    (async () => {
      const base = `https://certificadoscapoeira.blob.core.windows.net/certificados/${account.username}`;
      const url1x = `${base}/foto-perfil@1x.jpg?${Date.now()}`;
      const urlLegacy = `${base}/foto-perfil.jpg?${Date.now()}`;

      if (await testImage(url1x)) {
        setFotoPreview(url1x);
        setTemFotoRemota(true);
      } else if (await testImage(urlLegacy)) {
        setFotoPreview(urlLegacy); // sem srcSet nesse caso
        setTemFotoRemota(true);
      } else {
        setFotoPreview(fotoPadrao);
        setTemFotoRemota(false);
      }
      setFotoCarregando(false);
    })();
  }, [accounts]);

  const handleFotoChange = (e) => {
    hideFeedback();
    const file = e.target.files[0];
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
      setFotoPreview(URL.createObjectURL(oneXFile)); // preview local rápido
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
      // força recarregar remoto @1x
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

  const handleSignOut = async () => {
    await instance.logoutRedirect();
  };

  const nivelUsuario = nivelMap[perfil.nivelAcesso] ?? 0;
  const canAccess = (minLevel) => nivelUsuario >= minLevel;
  const isMestre = userData.email === "contato@capoeiraminasbahia.com.br";

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
    await atualizarPerfil(userData.email, atualizado);
    setPerfil(atualizado);
    setShowEditModal(false);
    showSuccess("Perfil atualizado com sucesso!");
  };

  if (loading) return <p>Carregando...</p>;

  const isRemotePreview =
    typeof fotoPreview === "string" && fotoPreview.startsWith("http");

  // abre modal com a imagem 2x, com fallbacks
  const openAvatarModal = () => {
    let url = fotoPreview;
    if (isRemotePreview && fotoPreview.includes("@1x")) {
      url = fotoPreview.replace("@1x", "@2x");
    } else if (!isRemotePreview && avatar2x) {
      // preview local (antes do upload)
      url = URL.createObjectURL(avatar2x);
    }
    setAvatarModalUrl(url);
    setShowAvatarModal(true);
  };

  return (
    <Container fluid className="min-h-screen p-4">
      {/* Feedback global */}
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
            Graduado(a): {perfil.nome || userData.nome}
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
            {/* FOTO: à direita no md+, centralizada em cima no mobile */}
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

            {/* TEXTO: à esquerda no md+, abaixo da foto no mobile */}
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

      {/* Arquivos Pessoais */}
      {canAccess(1) && (
        <Row className="mt-4">
          <Col md={12} className="border p-3">
            <Certificados email={userData.email} />
          </Col>
        </Row>
      )}

      {/* Arquivos para Alunos */}
      {canAccess(1) && (
        <Row className="mt-4">
          <Col md={12} className="border p-3 text-center">
            <h5>Arquivos para Alunos</h5>
            <p>Área para documentos de download público</p>
            <FileSection pasta="aluno" canUpload={isMestre} />
          </Col>
        </Row>
      )}

      {/* ...demais seções inalteradas... */}

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

      {/* MODAL da foto de perfil (2x/fallback) */}
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
              // Fallback: se 2x falhar, tenta 1x; se falhar, legado; por fim, padrão.
              const img = e.currentTarget;
              const url = img.src || "";
              if (url.includes("@2x")) {
                img.src = url.replace("@2x", "@1x");
              } else if (url.includes("@1x")) {
                img.src = url.replace("@1x", "");
              } else {
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
