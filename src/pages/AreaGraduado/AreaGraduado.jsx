// src/pages/AreaGraduado.jsx
import { useEffect, useState } from "react";
import { Container, Row, Col, Modal, Button } from "react-bootstrap";
import { useMsal } from "@azure/msal-react";

const AreaGraduado = () => {
  const { instance, accounts } = useMsal();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({ nome: "", email: "" });
  const [perfil, setPerfil] = useState({
    nome: "",
    apelido: "",
    idade: "",
    sexo: "",
    endereco: "",
  });
  const [arquivos, setArquivos] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const account = accounts[0];
    if (account) {
      setSession(account);
      setUserData({ nome: account.name, email: account.username });
      setLoading(false);
    }
  }, [accounts]);

  const handleSignOut = async () => {
    await instance.logoutRedirect();
  };

  const listarArquivos = async () => {
    // Aqui você pode integrar com Azure Blob Storage futuramente
    // Por enquanto, simula arquivos locais
    setArquivos([{ name: "certificado1.pdf" }, { name: "certificado2.jpg" }]);
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !session) return;

    setUploading(true);
    // Simulação de upload
    setTimeout(() => {
      setArquivos((prev) => [...prev, { name: file.name }]);
      setUploading(false);
      setShowUploadModal(false);
    }, 1000);
  };

  const handleDelete = async (filename) => {
    setArquivos((prev) => prev.filter((arq) => arq.name !== filename));
  };

  const handlePreview = async (filename) => {
    // Simula uma URL de preview local
    setPreviewUrl(`/fake-previews/${filename}`);
    setShowPreview(true);
  };

  const salvarPerfil = async () => {
    // Aqui você pode salvar no seu backend (ex: API ou Azure)
    setShowEditModal(false);
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <Container fluid className="min-h-screen p-4">
      <Row className="mb-4">
        <Col className="bg-light p-3">
          <h4>
            Graduado(a): {userData.nome} - {perfil.apelido}
          </h4>
        </Col>
      </Row>

      <Row>
        <Col md={2} className="border p-3 d-flex flex-column gap-2">
          <button
            className="btn btn-primary"
            onClick={() => setShowEditModal(true)}
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
            <p>Idade: {perfil.idade || "-"}</p>
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
          <h5 className="text-center mb-3">Arquivos Pessoais</h5>
          <div className="d-flex justify-content-center mb-3">
            <Button
              variant="secondary"
              onClick={() => {
                listarArquivos();
                setShowUploadModal(true);
              }}
            >
              📎 Enviar Arquivo
            </Button>
          </div>

          {arquivos.length === 0 ? (
            <p className="text-center">Nenhum arquivo enviado</p>
          ) : (
            <ul className="list-unstyled">
              {arquivos.map((arq) => (
                <li
                  key={arq.name}
                  className="d-flex justify-content-between align-items-center border rounded px-3 py-2 mb-2"
                >
                  <span className="text-truncate" style={{ maxWidth: "60%" }}>
                    {arq.name}
                  </span>
                  <div className="d-flex gap-2">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => handlePreview(arq.name)}
                    >
                      🔍
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(arq.name)}
                    >
                      🗑
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Col>
      </Row>

      {/* Modal Upload */}
      <Modal
        show={showUploadModal}
        onHide={() => setShowUploadModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Enviar Arquivo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="form-control"
          />
          {uploading && <p className="mt-2">Enviando...</p>}
        </Modal.Body>
      </Modal>

      {/* Modal Preview */}
      <Modal
        show={showPreview}
        onHide={() => setShowPreview(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Pré-visualização do Arquivo</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <img
            src={previewUrl}
            alt="Preview"
            style={{
              maxWidth: "100%",
              maxHeight: "70vh",
              objectFit: "contain",
            }}
          />
        </Modal.Body>
      </Modal>

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
            value={perfil.nome}
            onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
          />
          <input
            className="form-control mb-2"
            placeholder="Apelido"
            value={perfil.apelido}
            onChange={(e) => setPerfil({ ...perfil, apelido: e.target.value })}
          />
          <input
            className="form-control mb-2"
            placeholder="Idade"
            type="number"
            value={perfil.idade}
            onChange={(e) =>
              setPerfil({ ...perfil, idade: parseInt(e.target.value) })
            }
          />
          <input
            className="form-control mb-2"
            placeholder="Sexo"
            value={perfil.sexo}
            onChange={(e) => setPerfil({ ...perfil, sexo: e.target.value })}
          />
          <input
            className="form-control mb-2"
            placeholder="Endereço"
            value={perfil.endereco}
            onChange={(e) => setPerfil({ ...perfil, endereco: e.target.value })}
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
    </Container>
  );
};

export default AreaGraduado;
