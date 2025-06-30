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
      setArquivos(res.data.arquivos || []); // garante array mesmo se vier undefined
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
      await axios.post(
        `${API_URL}/upload?email=${email}&pasta=certificados_do_usuario`,
        formData
      );
      listar();
    } catch {
      alert("Erro ao enviar.");
    } finally {
      setUploading(false);
      setShowModal(false);
      setArquivo(null);
    }
  };

  const remover = async (nome) => {
    try {
      await axios.delete(`${API_URL}/upload?email=${email}&arquivo=${nome}`);
      listar();
    } catch {
      alert("Erro ao deletar.");
    }
  };

  useEffect(() => {
    if (email) listar();
  }, [email]);

  const arquivosSeguros = Array.isArray(arquivos) ? arquivos : [];

  return (
    <div>
      <h5 className="text-center mb-3">Arquivos Pessoais</h5>
      <div className="d-flex justify-content-center mb-3">
        <Button variant="secondary" onClick={() => setShowModal(true)}>
          📌 Enviar Arquivo
        </Button>
      </div>

      {arquivosSeguros.length === 0 ? (
        <p className="text-center">Nenhum arquivo enviado</p>
      ) : (
        <ul className="list-unstyled">
          {arquivosSeguros.map(({ nome, url }) => {
            const nomeLimpo = nome.replace(
              `${email}/certificados_do_usuario/`,
              ""
            );
            const ext = nomeLimpo.split(".").pop()?.toLowerCase();
            const isPdf = ext === "pdf";

            return (
              <li
                key={nome}
                className="d-flex justify-content-between align-items-center border rounded px-3 py-2 mb-2"
              >
                <span className="text-truncate" style={{ maxWidth: "60%" }}>
                  {decodeURIComponent(escape(nomeLimpo.replace(/^\d+-/, "")))}
                </span>
                <div className="d-flex gap-2">
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => {
                      if (isPdf) {
                        window.open(url, "_blank");
                      } else {
                        setPreviewUrl(url);
                        setShowPreview(true);
                      }
                    }}
                  >
                    {isPdf ? "📄" : "🔍"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => remover(nome)}
                  >
                    🗑
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

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
                const allowedTypes = [
                  "application/pdf",
                  "image/png",
                  "image/jpeg",
                ];
                if (file && !allowedTypes.includes(file.type)) {
                  alert("Tipo de arquivo inválido.");
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
          <Button
            variant="primary"
            onClick={enviarArquivo}
            disabled={uploading}
          >
            {uploading ? "Enviando..." : "Enviar"}
          </Button>
        </Modal.Footer>
      </Modal>

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
