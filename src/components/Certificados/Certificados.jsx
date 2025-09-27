// src/components/Certificados.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Form, Modal, Alert, Spinner } from "react-bootstrap";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

/* ================= Helpers ================= */
const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
const isPdfType = (mime) => mime === "application/pdf";
const getExt = (filename) =>
  filename && filename.includes(".")
    ? filename.split(".").pop().toLowerCase()
    : "";
const stripExt = (name) => name.replace(/\.[^/.]+$/, "");
const stripTimestampPrefix = (name) => name.replace(/^\d+-/, "");

// Permitir letras (com acento), números, espaço, -, _, .
const DISPLAY_ALLOWED_REGEX = /^[A-Za-z0-9 À-ÿ._-]+$/u;
const MAX_DISPLAY_LEN = 150;

// remove SOMENTE espaços do final
function trimEndOnly(s) {
  return String(s || "").replace(/\s+$/g, "");
}

// slug só para STORAGE (com traços, **preservando o casing**)
function toSlugForStorage(text) {
  return (text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // tira acento
    .replace(/[^\w\s.-]/g, "") // mantém letra/dígito/underscore/espaço/.- (tira o resto)
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, ""); // ⬅️ sem .toLowerCase()
}

// caso o back ainda não mande displayName, gera um legível a partir do filename
// sem forçar maiúsculas/minúsculas: apenas substitui '-' por ' ' e mantém casing
function prettifyFromFilename(filename) {
  const base = stripExt(stripTimestampPrefix(filename || ""));
  if (!base) return filename || "";
  return base.split("-").filter(Boolean).join(" ");
}

// resolve nomes potencialmente url-encoded sem quebrar (mojibake)
function decodeSafe(s) {
  try {
    return /%|\+/.test(s) ? decodeURIComponent(s.replace(/\+/g, "%20")) : s;
  } catch {
    return s;
  }
}

// validação só na hora de enviar/habilitar botão
function isDisplayNameValid(raw) {
  const s = trimEndOnly(raw || "");
  return (
    s.length > 0 && s.length <= MAX_DISPLAY_LEN && DISPLAY_ALLOWED_REGEX.test(s)
  );
}

/* ================= Componente ================= */
const Certificados = ({ email }) => {
  const [arquivos, setArquivos] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // upload state
  const [uploading, setUploading] = useState(false);
  const [arquivo, setArquivo] = useState(null);
  const [arquivoPreviewUrl, setArquivoPreviewUrl] = useState("");
  const [arquivoIsPdf, setArquivoIsPdf] = useState(false);
  const [displayName, setDisplayName] = useState(""); // nome que o usuário vê
  const [erroUpload, setErroUpload] = useState("");

  // preview a partir da lista
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewIsPdf, setPreviewIsPdf] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const fileInputRef = useRef(null);

  // ---- API ----
  const listar = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/upload?email=${encodeURIComponent(email)}`
      );
      const lista = Array.isArray(res.data?.arquivos) ? res.data.arquivos : [];
      setArquivos(lista);
    } catch {
      alert("Erro ao listar arquivos.");
    }
  };

  const enviarArquivo = async () => {
    setErroUpload("");

    if (!arquivo) {
      setErroUpload("Selecione um arquivo válido.");
      return;
    }
    const ext = getExt(arquivo.name);
    if (!allowedTypes.includes(arquivo.type) || !ext) {
      setErroUpload("Tipo de arquivo inválido. Envie apenas PDF, PNG ou JPG.");
      return;
    }

    // Apenas TRIM-END antes de validar/salvar
    const cleanDisplay = trimEndOnly(displayName || "");
    if (!isDisplayNameValid(cleanDisplay)) {
      setErroUpload(
        "Nome inválido. Use apenas letras (pode acento), números, espaços e os símbolos . _ -, sem espaço no final."
      );
      return;
    }

    // nome salvo no STORAGE (slug com traços e casing preservado)
    const storageBase = toSlugForStorage(cleanDisplay);
    if (!storageBase) {
      setErroUpload("O nome informado ficou inválido após normalização.");
      return;
    }

    // Se quiser prefixar timestamp, troque aqui:
    // const finalName = `${Date.now()}-${storageBase}.${ext}`;
    const finalName = `${storageBase}.${ext}`;

    // Envia **renomeado** e com `displayName` no body (pra back salvar como metadado)
    const renamedFile =
      typeof File !== "undefined"
        ? new File([arquivo], finalName, { type: arquivo.type })
        : arquivo;

    const formData = new FormData();
    formData.append("arquivo", renamedFile, finalName);
    formData.append("displayName", cleanDisplay); // <— salve isso no back se quiser

    setUploading(true);
    try {
      await axios.post(
        `${API_URL}/upload?email=${encodeURIComponent(
          email
        )}&name=${encodeURIComponent(finalName)}`,
        formData
      );
      await listar();
      fecharModalUpload();
    } catch {
      setErroUpload("Erro ao enviar. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const remover = async (nomeArquivo) => {
    try {
      await axios.delete(
        `${API_URL}/upload?email=${encodeURIComponent(
          email
        )}&arquivo=${encodeURIComponent(nomeArquivo)}`
      );
      listar();
    } catch {
      alert("Erro ao deletar.");
    }
  };

  // download via proxy do back
  const baixar = async (proxyUrl, fallbackName = "arquivo") => {
    try {
      const resp = await fetch(proxyUrl, { mode: "cors" });
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const blob = await resp.blob();
      const objUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = objUrl;
      a.download = stripTimestampPrefix(fallbackName);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
    } catch {
      window.open(proxyUrl, "_blank");
    }
  };

  const openPreview = (proxyUrl, isPdf) => {
    setPreviewIsPdf(isPdf);
    setPreviewUrl(proxyUrl);
    setShowPreview(true);
  };

  useEffect(() => {
    if (email) listar();
  }, [email]);

  // Modal de upload
  const abrirModalUpload = () => {
    setShowModal(true);
    setErroUpload("");
    setArquivo(null);
    setArquivoPreviewUrl("");
    setArquivoIsPdf(false);
    setDisplayName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const fecharModalUpload = () => {
    setShowModal(false);
    setErroUpload("");
    if (arquivoPreviewUrl) URL.revokeObjectURL(arquivoPreviewUrl);
    setArquivoPreviewUrl("");
    setArquivo(null);
    setDisplayName("");
    setArquivoIsPdf(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Seleção + preview + sugestão de displayName (sem bloquear espaços e sem mudar casing)
  const onSelectFile = (e) => {
    setErroUpload("");
    const file = e.target.files?.[0] || null;

    if (!file) {
      if (arquivoPreviewUrl) URL.revokeObjectURL(arquivoPreviewUrl);
      setArquivo(null);
      setArquivoPreviewUrl("");
      setArquivoIsPdf(false);
      setDisplayName("");
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setErroUpload("Tipo de arquivo inválido. Envie apenas PDF, PNG ou JPG.");
      e.target.value = null;
      return;
    }

    if (arquivoPreviewUrl) URL.revokeObjectURL(arquivoPreviewUrl);
    const objUrl = URL.createObjectURL(file);

    setArquivo(file);
    setArquivoPreviewUrl(objUrl);
    setArquivoIsPdf(isPdfType(file.type));

    const base = stripExt(file.name);
    setDisplayName((base || "arquivo").slice(0, MAX_DISPLAY_LEN));
  };

  const arquivosSeguros = Array.isArray(arquivos) ? arquivos : [];

  const podeEnviar = useMemo(() => {
    return !uploading && arquivo && isDisplayNameValid(displayName);
  }, [uploading, arquivo, displayName]);

  return (
    <div>
      <h5 className="text-center mb-3">Arquivos Pessoais</h5>
      <div className="d-flex justify-content-center mb-3">
        <Button variant="secondary" onClick={abrirModalUpload}>
          📌 Enviar Arquivo
        </Button>
      </div>

      {arquivosSeguros.length === 0 ? (
        <p className="text-center">Nenhum arquivo enviado</p>
      ) : (
        <ul className="list-unstyled">
          {arquivosSeguros.map(({ nome, displayName: apiDisplayName }) => {
            const nomeArquivo = nome;
            const decoded = decodeSafe(nomeArquivo);
            const ext = getExt(decoded);
            const isPdf = ext === "pdf";

            const nomeVisivel =
              (apiDisplayName && trimEndOnly(apiDisplayName)) ||
              prettifyFromFilename(decoded) + (ext ? `.${ext}` : "");

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
                  <Button
                    size="sm"
                    variant="outline-primary"
                    title={isPdf ? "Visualizar PDF" : "Visualizar imagem"}
                    onClick={() => openPreview(proxyUrl, isPdf)}
                  >
                    {isPdf ? "📄" : "🔍"}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline-success"
                    title="Baixar"
                    onClick={() => baixar(proxyUrl, nomeVisivel)}
                  >
                    ⬇️
                  </Button>

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

      {/* Modal de upload com pré-visualização e nome “bonito” obrigatório */}
      <Modal show={showModal} onHide={fecharModalUpload} centered>
        <Modal.Header closeButton>
          <Modal.Title>Enviar Certificado</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {erroUpload && (
            <Alert variant="danger" className="mb-3">
              {erroUpload}
            </Alert>
          )}

          <Form.Group controlId="formArquivo" className="mb-3">
            <Form.Label>Escolha o arquivo (PDF, PNG ou JPG)</Form.Label>
            <Form.Control
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg"
              onChange={onSelectFile}
              disabled={uploading}
            />
          </Form.Group>

          {arquivo && (
            <>
              <div className="mb-3">
                {arquivoIsPdf ? (
                  <div className="border rounded p-2">
                    <div className="small text-muted mb-2">
                      Pré-visualização do PDF
                    </div>
                    <iframe
                      src={arquivoPreviewUrl}
                      title="Pré-visualização PDF"
                      style={{ width: "100%", height: "300px", border: "none" }}
                    />
                  </div>
                ) : (
                  <div className="text-center">
                    <img
                      src={arquivoPreviewUrl}
                      alt="Pré-visualização"
                      className="img-fluid border rounded"
                      style={{ maxHeight: "300px" }}
                    />
                  </div>
                )}
              </div>

              <Form.Group controlId="formDisplayName" className="mb-1">
                <Form.Label>Nome do arquivo:</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ex.: Certificado Batizado 2024"
                  value={displayName}
                  onChange={(e) =>
                    setDisplayName(e.target.value.slice(0, MAX_DISPLAY_LEN))
                  }
                  disabled={uploading}
                  isInvalid={
                    displayName.length > 0 && !isDisplayNameValid(displayName)
                  }
                />
                <Form.Control.Feedback type="invalid">
                  Use apenas letras (pode acento), números, espaços e os
                  símbolos . _ -. Não termine com espaço.
                </Form.Control.Feedback>
              </Form.Group>
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={fecharModalUpload}
            disabled={uploading}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={enviarArquivo}
            disabled={!podeEnviar}
          >
            {uploading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />{" "}
                Enviando...
              </>
            ) : (
              "Enviar"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de preview da lista */}
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
};

export default Certificados;
