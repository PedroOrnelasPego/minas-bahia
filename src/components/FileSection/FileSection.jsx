import http from "../../services/http";
import { useEffect, useState } from "react";
import { Button, Modal, Form } from "react-bootstrap";

const API = import.meta.env.VITE_API_URL;

export default function FileSection({ pasta, canUpload }) {
  const [arquivos, setArquivos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);

  // preview
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewIsPdf, setPreviewIsPdf] = useState(false);

  // ---- API ----
  const listar = async () => {
    try {
      const res = await http.get(
        `${API}/upload/public?pasta=${encodeURIComponent(pasta)}`
      );
      setArquivos(res.data.arquivos || []);
    } catch {
      alert("Erro ao listar arquivos.");
    }
  };

  const enviar = async () => {
    if (!file) return alert("Selecione um arquivo.");
    const form = new FormData();
    form.append("arquivo", file);

    setUploading(true);
    try {
      await http.post(
        `${API}/upload/public?pasta=${encodeURIComponent(pasta)}`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      await listar();
    } catch {
      alert("Erro ao enviar.");
    } finally {
      setUploading(false);
      setShowModal(false);
      setFile(null);
    }
  };

  const remover = async (nome) => {
    try {
      await http.delete(
        `${API}/upload/public?pasta=${encodeURIComponent(
          pasta
        )}&arquivo=${encodeURIComponent(nome)}`
      );
      await listar();
    } catch {
      alert("Erro ao remover.");
    }
  };

  // ---- download “de verdade” com fallback ----
  const baixar = async (url, fallbackName = "arquivo") => {
    const tryFetch = async (u) => {
      const r = await fetch(u, { mode: "cors" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r;
    };

    try {
      // 1) usa a URL como veio do back (já é encoded)
      let resp;
      try {
        resp = await tryFetch(url);
      } catch {
        // 2) fallback: tenta encodeURI se a primeira falhar
        resp = await tryFetch(encodeURI(url));
      }

      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fallbackName.replace(/^\d+-/, "");
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error("Falha ao baixar:", e);
      window.open(url, "_blank"); // último recurso
    }
  };

  // ---- preview (mesma página) ----
  const abrirPreview = (url, isPdf) => {
    setPreviewIsPdf(isPdf);
    setPreviewUrl(url); // NÃO encodeURI (evita %2520)
    setShowPreview(true);
  };

  useEffect(() => {
    listar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          {arquivos.map(({ nome, url }) => {
            const nomeArquivo = nome.split("/").pop() || "arquivo";
            const nomeVisivel = (() => {
              try {
                return decodeURIComponent(nomeArquivo.replace(/^\d+-/, ""));
              } catch {
                return nomeArquivo.replace(/^\d+-/, "");
              }
            })();
            const ext = nomeArquivo.split(".").pop()?.toLowerCase();
            const isPdf = ext === "pdf";

            return (
              <li
                key={nome}
                className="d-flex justify-content-between align-items-center border rounded px-3 py-2 mb-2"
              >
                <span className="text-truncate" style={{ maxWidth: "60%" }}>
                  {nomeVisivel}
                </span>
                <div className="d-flex gap-2">
                  {/* Preview no modal */}
                  <Button
                    size="sm"
                    variant="outline-primary"
                    title={isPdf ? "Visualizar PDF" : "Visualizar imagem"}
                    onClick={() => abrirPreview(url, isPdf)}
                  >
                    {isPdf ? "📄" : "🔍"}
                  </Button>

                  {/* Download */}
                  <Button
                    size="sm"
                    variant="outline-success"
                    title="Baixar"
                    onClick={() => baixar(url, nomeArquivo)}
                  >
                    ⬇️
                  </Button>

                  {canUpload && (
                    <Button
                      size="sm"
                      variant="outline-danger"
                      title="Excluir"
                      onClick={() => remover(nome)}
                    >
                      🗑️
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Modal de upload */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Enviar {pasta}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            type="file"
            accept=".pdf,image/png,image/jpeg"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
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

      {/* Modal de preview */}
      <Modal
        show={showPreview}
        onHide={() => setShowPreview(false)}
        size="lg"
        centered
      >
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
}
