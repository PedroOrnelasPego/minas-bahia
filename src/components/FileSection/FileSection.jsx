import axios from "axios";
import { useEffect, useState } from "react";
import { Button, Modal, Form } from "react-bootstrap";
const API = import.meta.env.VITE_API_URL;

export default function FileSection({ pasta, canUpload }) {
  const [arquivos, setArquivos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);

  // lista
  const listar = async () => {
    try {
      const res = await axios.get(`${API}/upload/public?pasta=${pasta}`);
      setArquivos(res.data.arquivos || []);
    } catch {
      alert("Erro ao listar arquivos.");
    }
  };

  // upload
  const enviar = async () => {
    if (!file) return alert("Selecione um arquivo.");
    const form = new FormData();
    form.append("arquivo", file);
    setUploading(true);
    try {
      await axios.post(`${API}/upload/public?pasta=${pasta}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await listar();
    } catch {
      alert("Erro ao enviar.");
    } finally {
      setUploading(false);
      setShowModal(false);
      setFile(null);
    }
  };

  // delete
  const remover = async (nome) => {
    try {
      await axios.delete(`${API}/upload/public?pasta=${pasta}&arquivo=${nome}`);
      await listar();
    } catch {
      alert("Erro ao remover.");
    }
  };

  // download via criação de blob
  const download = async (url) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const urlBlob = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlBlob;
      // retira o timestamp do nome
      let filename = url.split("/").pop().replace(/^\d+-/, "");
      a.download = decodeURIComponent(escape(filename));
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(urlBlob);
    } catch {
      alert("Erro ao baixar.");
    }
  };

  useEffect(() => {
    listar();
  }, []);

  return (
    <div>
      {canUpload && (
        <div className="mb-3">
          <Button onClick={() => setShowModal(true)}>📌 Enviar Arquivo</Button>
        </div>
      )}

      {arquivos.length === 0 ? (
        <p>Nenhum arquivo.</p>
      ) : (
        <ul className="list-unstyled">
          {arquivos.map(({ nome, url }) => (
            <li
              key={nome}
              className="d-flex justify-content-between align-items-center border rounded px-3 py-2 mb-2"
            >
              <span className="text-truncate" style={{ maxWidth: "60%" }}>
                {decodeURIComponent(escape(nome.replace(/^\d+-/, "")))}
              </span>
              <div className="d-flex gap-2">
                <Button size="sm" onClick={() => window.open(url, "_blank")}>
                  📄
                </Button>
                <Button size="sm" onClick={() => download(url)}>
                  ⬇️
                </Button>
                {canUpload && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => remover(nome)}
                  >
                    🗑️
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Enviar {pasta}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            accept=".pdf,image/png,image/jpeg"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button onClick={enviar} disabled={uploading}>
            {uploading ? "Enviando…" : "Enviar"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
