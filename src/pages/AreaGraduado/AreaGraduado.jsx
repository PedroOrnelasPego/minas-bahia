import { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
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
import { AVATAR, optimizeProfilePhoto, makeProfileThumb } from "../../utils/imagePerfil";

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
  const [fotoFile, setFotoFile] = useState(null);
  const [cropModal, setCropModal] = useState(false);
  const [rawImage, setRawImage] = useState(null);
  const [fotoCarregando, setFotoCarregando] = useState(true);

  useEffect(() => {
    const account = accounts[0];
    if (!account) return;

    setSession(account);
    setUserData({ nome: account.name, email: account.username });

    buscarPerfil(account.username)
      .then((perfilBuscado) => {
        if (perfilBuscado) {
          setPerfil(perfilBuscado);
        } else {
          setShowCadastroInicial(true);
        }
      })
      .catch(() => setShowCadastroInicial(true))
      .finally(() => setLoading(false));

    const fotoUrl = `https://certificadoscapoeira.blob.core.windows.net/certificados/${
      account.username
    }/foto-perfil.jpg?${Date.now()}`;

    const img = new Image();
    img.onload = () => {
      setFotoPreview(fotoUrl);
      setTemFotoRemota(true);
      setFotoCarregando(false);
      console.log("✅ Foto carregada com sucesso:", fotoUrl);
    };
    img.onerror = () => {
      setFotoPreview(fotoPadrao);
      setTemFotoRemota(false);
      setFotoCarregando(false);
      console.warn("❌ Foto remota não encontrada. Usando padrão.");
    };
    img.src = fotoUrl;
  }, [accounts]);

  const handleFotoChange = (e) => {
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
      alert("Envie uma imagem JPG ou PNG.");
    }
  };

  const handleCroppedSave = async (croppedFile) => {
  try {
    const optimized = await optimizeProfilePhoto(croppedFile, {
      width: AVATAR.width,
      height: AVATAR.height,
      quality: AVATAR.quality,
      mime: AVATAR.mime,
    });

    setFotoFile(optimized);
    setFotoPreview(URL.createObjectURL(optimized));
  } catch (err) {
    console.error(err);
    alert("Não foi possível processar a imagem.");
  } finally {
    setCropModal(false);
  }
};



  const salvarFoto = async () => {
    if (!fotoFile) return;
    const formData = new FormData();
    formData.append("arquivo", fotoFile);
    try {
      await axios.post(
        `${API_URL}/upload/foto-perfil?email=${userData.email}`,
        formData
      );
      alert("Foto atualizada com sucesso!");
      setFotoFile(null);
      setTemFotoRemota(true);
    } catch {
      alert("Erro ao enviar a foto.");
    }
  };

  const handleRemoverFoto = async () => {
    try {
      await axios.delete(
        `${API_URL}/upload/foto-perfil?email=${userData.email}`
      );
      setFotoPreview(fotoPadrao);
      setFotoFile(null);
      setTemFotoRemota(false);
      alert("Foto removida com sucesso!");
    } catch {
      alert("Erro ao remover a foto.");
    }
  };

  const buscarEnderecoPorCep = async () => {
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
    } catch {
      alert(e.message || "Erro ao buscar o CEP.");
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleNumeroChange = (e) => {
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
      alert("Preencha todos os campos obrigatórios.");
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
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <Container fluid className="min-h-screen p-4">
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

          <div className="d-flex align-items-start mb-3 justify-content-between flex-wrap">
            <div className="pe-3">
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

            <div className="d-flex flex-column align-items-center">
              {fotoCarregando ? (
                <div
                  className="spinner-border text-secondary mb-3"
                  role="status"
                >
                  <span className="visually-hidden">Carregando...</span>
                </div>
              ) : (
                <img
                  src={fotoFile ? URL.createObjectURL(fotoFile) : fotoPreview}
                  alt="Foto de perfil"
                  className="rounded mb-2"
                  style={{
                    width: 150,
                    height: 200,
                    objectFit: "cover",
                    border: "2px solid #ccc",
                  }}
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

              {fotoFile && (
                <button
                  className="btn btn-success btn-sm mb-2"
                  onClick={salvarFoto}
                >
                  Salvar Foto
                </button>
              )}

              {temFotoRemota && !fotoFile && (
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={handleRemoverFoto}
                >
                  Remover Foto
                </button>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* Arquivos Pessoais*/}
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

      {/* Arquivos para Graduado */}
      {canAccess(2) && (
        <Row className="mt-4">
          <Col md={12} className="border p-3 text-center">
            <h5>Arquivos para Graduado</h5>
            <p>Área para documentos de download público</p>
            <FileSection pasta="graduado" canUpload={isMestre} />
          </Col>
        </Row>
      )}

      {/* Arquivos para Monitores */}
      {canAccess(3) && (
        <Row className="mt-4">
          <Col md={12} className="border p-3 text-center">
            <h5>Arquivos para Monitores</h5>
            <p>Área para documentos de download público</p>
            <FileSection pasta="monitor" canUpload={isMestre} />
          </Col>
        </Row>
      )}

      {/* Arquivos para Instrutores */}
      {canAccess(4) && (
        <Row className="mt-4">
          <Col md={12} className="border p-3 text-center">
            <h5>Arquivos para Instrutores</h5>
            <p>Área para documentos de download público</p>
            <FileSection pasta="instrutor" canUpload={isMestre} />
          </Col>
        </Row>
      )}

      {/* Arquivos para Professores */}
      {canAccess(5) && (
        <Row className="mt-4">
          <Col md={12} className="border p-3 text-center">
            <h5>Arquivos para Professores</h5>
            <p>Área para documentos de download público</p>
            <FileSection pasta="professor" canUpload={isMestre} />
          </Col>
        </Row>
      )}

      {/* Arquivos para Contramestre */}
      {canAccess(6) && (
        <Row className="mt-4">
          <Col md={12} className="border p-3 text-center">
            <h5>Arquivos para Contramestre</h5>
            <p>Área para documentos de download público</p>
            <FileSection pasta="contramestre" canUpload={isMestre} />
          </Col>
        </Row>
      )}

      <ModalEditarPerfil
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
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
            setUserData((prev) => ({ ...prev, nome: dados.nome }));
            setShowCadastroInicial(false);
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
    </Container>
  );
};

export default AreaGraduado;
