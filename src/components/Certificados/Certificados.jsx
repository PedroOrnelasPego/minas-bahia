// src/components/Certificados.jsx
import { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const Certificados = ({ email }) => {
  const [arquivos, setArquivos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [arquivo, setArquivo] = useState(null);

  // preview
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewIsPdf, setPreviewIsPdf] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // ---- API ----
  const listar = async () => {
    try {
      const res = await axios.get(`${API_URL}/upload?email=${encodeURIComponent(email)}`);
      setArquivos(Array.isArray(res.data?.arquivos) ? res.data.arquivos : []);
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
      // ⬇️ sem “pasta”, esse endpoint já salva em email/certificados/
      await axios.post(`${API_URL}/upload?email=${encodeURIComponent(email)}`, formData);
      listar();
    } catch {
      alert("Erro ao enviar.");
    } finally {
      setUploading(false);
      setShowModal(false);
      setArquivo(null);
    }
  };

  const remover = async (nomeArquivo) => {
    try {
      await axios.delete(
        `${API_URL}/upload?email=${encodeURIComponent(email)}&arquivo=${encodeURIComponent(nomeArquivo)}`
      );
      listar();
    } catch {
      alert("Erro ao deletar.");
    }
  };

  // download que sempre funciona (via proxy do back)
  const baixar = async (proxyUrl, fallbackName = "arquivo") => {
    try {
      const resp = await fetch(proxyUrl, { mode: "cors" });
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const blob = await resp.blob();
      const objUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = objUrl;
      a.download = fallbackName.replace(/^\d+-/, "");
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
    } catch (e) {
      // fallback: abre em nova aba
      window.open(proxyUrl, "_blank");
    }
  };

  const openPreview = (proxyUrl, isPdf) => {
    setPreviewIsPdf(isPdf);
    setPreviewUrl(proxyUrl); // usa o endpoint do back
    setShowPreview(true);
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
          {arquivosSeguros.map(({ nome /*, url */ }) => {
            // no back, "nome" já vem sem o prefixo (é o arquivo mesmo)
            const nomeArquivo = nome; // ex.: 1729107843000-certificado.jpg
            const nomeVisivel = decodeURIComponent(nomeArquivo.replace(/^\d+-/, ""));
            const ext = nomeArquivo.split(".").pop()?.toLowerCase();
            const isPdf = ext === "pdf";

            // 🔴 use o proxy do back (sem CORS e funciona mesmo com container privado)
            const proxyUrl = `${API_URL}/upload/certificados/${encodeURIComponent(
              email
            )}/${encodeURIComponent(nomeArquivo)}`;

            return (
              <li
                key={nomeArquivo}
                className="d-flex justify-content-between align-items-center border rounded px-3 py-2 mb-2"
              >
                <span className="text-truncate" style={{ maxWidth: "55%" }}>
                  {nomeVisivel}
                </span>

                <div className="d-flex gap-2">
                  {/* Preview */}
                  <Button
                    size="sm"
                    variant="outline-primary"
                    title={isPdf ? "Visualizar PDF" : "Visualizar imagem"}
                    onClick={() => openPreview(proxyUrl, isPdf)}
                  >
                    {isPdf ? "📄" : "🔍"}
                  </Button>

                  {/* Download */}
                  <Button
                    size="sm"
                    variant="outline-success"
                    title="Baixar"
                    onClick={() => baixar(proxyUrl, nomeArquivo)}
                  >
                    ⬇️
                  </Button>

                  {/* Excluir */}
                  <Button
                    size="sm"
                    variant="outline-danger"
                    title="Excluir"
                    onClick={() => remover(nomeArquivo)}
                  >
                    🗑
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Modal de upload */}
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
                const file = e.target.files?.[0] || null;
                const allowed = ["application/pdf", "image/png", "image/jpeg"];
                if (file && !allowed.includes(file.type)) {
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
          <Button variant="primary" onClick={enviarArquivo} disabled={uploading}>
            {uploading ? "Enviando..." : "Enviar"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de preview */}
      <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Visualizar arquivo</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {previewIsPdf ? (
            <iframe
              src={previewUrl}
              style={{ width: "100%", height: "70vh", border: "none" }}
              title="PDF Preview"
            />
          ) : (
            <img
              src={previewUrl}
              alt="Preview"
              className="img-fluid"
              style={{ maxHeight: "70vh" }}
              onError={() => alert("Não foi possível abrir a imagem.")}
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Certificados;
