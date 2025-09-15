// src/pages/Eventos/AlbumPage.jsx
import { useEffect, useRef, useState } from "react";
import { Alert, Button, Container, Modal } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { listPhotos, uploadPhotos, deletePhoto } from "../../services/eventos";
import { listAlbums } from "../../services/eventos";
import "./Eventos.scss";
import RequireAccess from "../../components/RequireAccess/RequireAccess";

const MAX_PER_UPLOAD = 5;

const AlbumPage = () => {
  const { groupSlug, albumSlug } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState([]); // [{name, displayName, url, ...}]
  const [pending, setPending] = useState([]);
  const [warnMsg, setWarnMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [albumTitle, setAlbumTitle] = useState("");

  // lightbox
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const fileInputRef = useRef(null);

  const refresh = async () => {
    setLoading(true);
    try {
      // 1) tenta pegar o título bonito da lista de álbuns
      const albums = await listAlbums(groupSlug);
      const meta = albums.find((a) => a.slug === albumSlug);
      if (meta?.title) setAlbumTitle(meta.title.trim());
      else setAlbumTitle(albumSlug); // fallback enquanto carrega

      // 2) carrega as fotos; se o endpoint também devolver o title, usamos
      const resp = await listPhotos(groupSlug, albumSlug);
      const arr = Array.isArray(resp) ? resp : resp.photos || [];
      setPhotos(arr);
      if (!Array.isArray(resp) && resp?.title?.trim()) {
        setAlbumTitle(resp.title.trim());
      }
    } catch (e) {
      console.error("Erro ao listar fotos:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [groupSlug, albumSlug]);

  useEffect(() => {
    const t = albumTitle || albumSlug;
    document.title = `${t} | ${groupSlug} | Eventos`;
  }, [albumTitle, groupSlug, albumSlug]);

  // ===== Lightbox com proteção =====
  const total = photos.length;
  const goPrev = () =>
    setViewerIndex((i) => (total ? (i - 1 + total) % total : 0));
  const goNext = () => setViewerIndex((i) => (total ? (i + 1) % total : 0));

  useEffect(() => {
    if (!viewerOpen || total === 0) return;
    const onKey = (e) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape") setViewerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerOpen, total]);

  // ===== upload =====
  const remaining = Math.max(0, MAX_PER_UPLOAD - pending.length);

  const openPicker = () => {
    setWarnMsg("");
    setInfoMsg("");
    fileInputRef.current?.click();
  };

  const addFilesToPending = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    if (remaining === 0) {
      setWarnMsg(
        `Limite de ${MAX_PER_UPLOAD} por envio já atingido. Envie ou limpe a seleção.`
      );
      return;
    }

    const allowed = files.slice(0, remaining);
    const ignored = files.length - allowed.length;

    setPending((prev) => [...prev, ...allowed]);

    if (ignored > 0) {
      setWarnMsg(`${ignored} arquivo(s) ignorado(s) por exceder o limite.`);
    } else {
      setWarnMsg("");
    }

    const nextLen = Math.min(MAX_PER_UPLOAD, pending.length + allowed.length);
    setInfoMsg(`Selecionados: ${nextLen}/${MAX_PER_UPLOAD}`);
  };

  const handleFilesChosen = (e) => {
    addFilesToPending(e.target.files);
    e.target.value = "";
  };

  const removePending = (idx) => {
    setPending((prev) => prev.filter((_, i) => i !== idx));
    setWarnMsg("");
    const nextLen = Math.max(0, pending.length - 1);
    setInfoMsg(nextLen > 0 ? `Selecionados: ${nextLen}/${MAX_PER_UPLOAD}` : "");
  };

  const clearPending = () => {
    setPending([]);
    setWarnMsg("");
    setInfoMsg("");
  };

  const handleSend = async () => {
    if (pending.length === 0) return;
    try {
      await uploadPhotos(groupSlug, albumSlug, pending);
      clearPending();
      await refresh();
    } catch (e) {
      console.error("Erro ao enviar fotos:", e);
      alert("Erro ao enviar fotos.");
    }
  };

  const handleDeletePhoto = async (name) => {
    try {
      await deletePhoto(groupSlug, albumSlug, name);
      await refresh();
    } catch (e) {
      console.error("Erro ao deletar foto (front):", e);
      alert("Erro ao deletar foto.");
    }
  };

  // drag & drop
  const onDrop = (ev) => {
    ev.preventDefault();
    if (ev.dataTransfer?.files?.length)
      addFilesToPending(ev.dataTransfer.files);
  };
  const onDragOver = (ev) => ev.preventDefault();

  const openViewer = (idx) => {
    if (!photos.length) return;
    setViewerIndex(idx);
    setViewerOpen(true);
  };
  const closeViewer = () => setViewerOpen(false);

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <Button
            variant="link"
            className="px-0 me-2"
            onClick={() => navigate(`/eventos/${groupSlug}`)}
          >
            ← Voltar
          </Button>
          <h2 className="d-inline">{albumTitle || albumSlug}</h2>
        </div>

        <div className="text-end">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            hidden
            onChange={handleFilesChosen}
          />

          <RequireAccess nivelMinimo="graduado" requireEditor>
            <div className="d-flex flex-wrap gap-2 justify-content-end">
              <Button variant="outline-primary" onClick={openPicker}>
                + Selecionar fotos
              </Button>
              <Button onClick={handleSend} disabled={pending.length === 0}>
                Enviar{" "}
                {pending.length > 0
                  ? `(${pending.length}/${MAX_PER_UPLOAD})`
                  : ""}
              </Button>
              <Button
                variant="outline-secondary"
                onClick={clearPending}
                disabled={pending.length === 0}
              >
                Limpar seleção
              </Button>
            </div>
          </RequireAccess>

          {warnMsg && (
            <Alert variant="warning" className="py-1 px-2 mt-2 mb-0">
              {warnMsg}
            </Alert>
          )}
          {infoMsg && !warnMsg && (
            <div className="text-muted small mt-2">{infoMsg}</div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-4 text-center border rounded bg-white">
          Carregando…
        </div>
      ) : photos.length === 0 ? (
        <div
          className="p-4 text-center border rounded bg-white"
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <p className="mb-1">Nenhuma foto neste álbum ainda.</p>
          <small className="text-muted d-block mb-2">
            Clique em “Selecionar fotos” (máx. {MAX_PER_UPLOAD} por envio) ou
            arraste aqui.
          </small>
        </div>
      ) : (
        <div onDrop={onDrop} onDragOver={onDragOver}>
          <div className="d-flex align-items-center gap-3 mb-2">
            <span className="text-muted">· {photos.length} fotos</span>
          </div>

          <div className="album-grid">
            {photos.map((p, idx) => (
              <div
                key={p.name}
                className="photo-card"
                title={p.displayName || p.name}
                onClick={() => openViewer(idx)}
              >
                {/* preview vem da URL pública do blob */}
                <img src={p.url} alt={p.displayName || p.name} />
                <RequireAccess nivelMinimo="graduado" requireEditor>
                  <button
                    type="button"
                    className="photo-del"
                    title="Excluir"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(p.name);
                    }}
                  >
                    🗑️
                  </button>
                </RequireAccess>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LIGHTBOX (com checagens) */}
      <Modal show={viewerOpen} onHide={closeViewer} fullscreen centered>
        <Modal.Body className="p-0 d-flex align-items-center justify-content-center bg-black">
          {total > 0 && photos[viewerIndex] && (
            <>
              <button
                className="lightbox-nav left"
                onClick={goPrev}
                aria-label="Anterior"
              >
                ‹
              </button>

              <img
                className="lightbox-img"
                src={photos[viewerIndex].url}
                alt={
                  photos[viewerIndex].displayName || photos[viewerIndex].name
                }
              />

              <button
                className="lightbox-nav right"
                onClick={goNext}
                aria-label="Próxima"
              >
                ›
              </button>

              <button
                className="lightbox-close"
                onClick={closeViewer}
                aria-label="Fechar"
              >
                ×
              </button>

              <div className="lightbox-caption">
                {viewerIndex + 1} / {total} —{" "}
                {photos[viewerIndex].displayName || photos[viewerIndex].name}
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default AlbumPage;
