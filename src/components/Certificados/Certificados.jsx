import { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const Certificados = ({ email }) => {
  const [arquivos, setArquivos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [arquivo, setArquivo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const listar = async () => {
    try {
      const res = await axios.get(`${API_URL}/upload?email=${email}`);
      setArquivos(res.data.arquivos);
    } catch {
      alert("Erro ao listar arquivos.");
    }
  };

  const enviarArquivo = async () => {
    if (!arquivo) return alert("Selecione um arquivo válido.");
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
    if (!allowedTypes.includes(arquivo.type)) {
      alert("Tipo de arquivo inválido. Envie apenas PDF, PNG ou JPG.");
      return;
    }

    const formData = new FormData();
    formData.append("arquivo", arquivo);

    setUploading(true);
    try {
      await axios.post(`${API_URL}/upload?email=${email}`, formData);
      listar();
    } catch {
      alert("Erro ao enviar.");
    } finally {
      setUploading(false);
      setShowModal(false);
      setArquivo(null);
    }
  };

  const remover = async (name) => {
    try {
      await axios.delete(`${API_URL}/upload?email=${email}&arquivo=${name}`);
      listar();
    } catch {
      alert("Erro ao deletar.");
    }
  };

  useEffect(() => {
    if (email) listar();
  }, [email]);

  return (
    <div>
      <h5 className="text-center mb-3">Arquivos Pessoais</h5>
      <div className="d-flex justify-content-center mb-3">
        <Button variant="secondary" onClick={() => setShowModal(true)}>
          📌 Enviar Arquivo
        </Button>
      </div>

      {arquivos.length === 0 ? (
        <p className="text-center">Nenhum arquivo enviado</p>
      ) : (
        <ul className="list-unstyled">
          {arquivos.map((name) => (
            <li
              key={name}
              className="d-flex justify-content-between align-items-center border rounded px-3 py-2 mb-2"
            >
              <span className="text-truncate" style={{ maxWidth: "60%" }}>
                {name}
              </span>
              <div className="d-flex gap-2">
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => {
                    setPreviewUrl(`${API_URL}/certificados/${email}/${name}`);
                    setShowPreview(true);
                  }}
                >
                  🔍
                </Button>
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => remover(name)}
                >
                  🗑
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal Upload */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Enviar Certificado</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="formArquivo">
            <Form.Label>Escolha o arquivo</Form.Label>
            <Form.Control
              type="file"
              accept=".pdf,image/png,image/jpeg"
              onChange={(e) => {
                const file = e.target.files[0];
                const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
                if (file && !allowedTypes.includes(file.type)) {
                  alert("Tipo de arquivo inválido. Envie apenas PDF, PNG ou JPG.");
                  e.target.value = null;
                  return;
                }
                setArquivo(file);
              }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={enviarArquivo} disabled={uploading}>
            {uploading ? "Enviando..." : "Enviar"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Preview */}
      <Modal
        show={showPreview}
        onHide={() => setShowPreview(false)}
        size="lg"
        centered
      >
        <Modal.Body>
          <img src={previewUrl} alt="Preview" className="img-fluid" />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Certificados;
