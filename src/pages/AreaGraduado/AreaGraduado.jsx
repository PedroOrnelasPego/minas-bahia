import { useEffect, useState } from "react";
import { Container, Row, Col, Modal, Button } from "react-bootstrap";
import { useMsal } from "@azure/msal-react";
import {
  criarPerfil,
  buscarPerfil,
  atualizarPerfil,
} from "../../services/backend";
import CadastroInicial from "../../components/CadastroInicial/CadastroInicial";
import Certificados from "../../components/Certificados/Certificados";

const AreaGraduado = () => {
  const { instance, accounts } = useMsal();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({ nome: "", email: "" });
  const [perfil, setPerfil] = useState({
    nome: "",
    apelido: "",
    sexo: "",
    numero: "",
    endereco: "",
    dataNascimento: "",
  });
  const [formEdit, setFormEdit] = useState(null);
  const [arquivos, setArquivos] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCadastroInicial, setShowCadastroInicial] = useState(false);
  const [cep, setCep] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [logradouro, setLogradouro] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");

  const calcularIdade = (dataNascimento) => {
    const nascimento = new Date(dataNascimento);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  useEffect(() => {
    const account = accounts[0];
    if (account) {
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
    }
  }, [accounts]);

  const buscarEnderecoPorCep = async () => {
    if (!cep) return;
    setBuscandoCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        alert("CEP não encontrado.");
        return;
      }

      setLogradouro(data.logradouro);
      setBairro(data.bairro);
      setCidade(data.localidade);
      setUf(data.uf);

      if (formEdit.numero) {
        const enderecoFinal = `${data.logradouro}, ${formEdit.numero} - ${data.bairro}, ${data.localidade} - ${data.uf}`;
        setFormEdit((prev) => ({ ...prev, endereco: enderecoFinal }));
      }
    } catch {
      alert("Erro ao buscar o CEP.");
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

  const handleDelete = async (filename) => {
    setArquivos((prev) => prev.filter((arq) => arq.name !== filename));
  };

  const handlePreview = async (filename) => {
    setPreviewUrl(`/fake-previews/${filename}`);
    setShowPreview(true);
  };

  const salvarPerfil = async () => {
    const obrigatorios = [
      "nome",
      "sexo",
      "numero",
      "endereco",
      "dataNascimento",
    ];
    const vazios = obrigatorios.filter(
      (campo) => !formEdit[campo] || formEdit[campo].trim() === ""
    );

    if (vazios.length > 0) {
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
            Graduado(a): {perfil.nome || userData.nome}{" "}
            {perfil.apelido ? `- ${perfil.apelido}` : ""}
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
          <h5 className="text-center">Meu Currículo</h5>
          <div className="ps-3 pt-2">
            <p>Nome: {perfil.nome || "-"}</p>
            <p>Apelido: {perfil.apelido || "-"}</p>
            <p>
              Idade:{" "}
              {perfil.dataNascimento
                ? calcularIdade(perfil.dataNascimento) + " anos"
                : "-"}
            </p>
            <p>Sexo: {perfil.sexo || "-"}</p>
            <p>Endereço: {perfil.endereco || "-"}</p>
          </div>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={6} className="border p-3 text-center">
          <h5>Arquivos Públicos</h5>
          <p>Área para documentos de download público</p>
        </Col>

        <Col md={6} className="border p-3">
          <Certificados email={userData.email} />
        </Col>
      </Row>

      {/* Modal Editar Perfil */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Editar Perfil</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <input
            className="form-control mb-2"
            placeholder="Nome"
            value={formEdit?.nome || ""}
            onChange={(e) => setFormEdit({ ...formEdit, nome: e.target.value })}
          />
          <input
            className="form-control mb-2"
            placeholder="Apelido"
            value={formEdit?.apelido || ""}
            onChange={(e) =>
              setFormEdit({ ...formEdit, apelido: e.target.value })
            }
          />
          <input
            className="form-control mb-2"
            type="date"
            placeholder="Data de Nascimento"
            value={formEdit?.dataNascimento || ""}
            onChange={(e) =>
              setFormEdit({ ...formEdit, dataNascimento: e.target.value })
            }
          />
          <select
            className="form-control mb-2"
            value={formEdit?.sexo || ""}
            onChange={(e) => setFormEdit({ ...formEdit, sexo: e.target.value })}
          >
            <option value="">Selecione o sexo</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
            <option value="Não informar">Não informar</option>
          </select>
          <div className="d-flex gap-2 mb-2">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por CEP"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
            />
            <Button onClick={buscarEnderecoPorCep} disabled={buscandoCep}>
              {buscandoCep ? "Buscando..." : "Buscar"}
            </Button>
          </div>
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Rua"
            value={logradouro}
            disabled
          />
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Bairro"
            value={bairro}
            disabled
          />
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Cidade"
            value={cidade}
            disabled
          />
          <input
            type="text"
            className="form-control mb-2"
            placeholder="UF"
            value={uf}
            disabled
          />
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Número"
            name="numero"
            value={formEdit?.numero || ""}
            onChange={handleNumeroChange}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={salvarPerfil}>
            Salvar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Cadastro Inicial */}
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
    </Container>
  );
};

export default AreaGraduado;
