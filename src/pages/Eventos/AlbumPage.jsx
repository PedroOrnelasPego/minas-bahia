// src/pages/Eventos/AlbumPage.jsx
import { useEffect, useState, useRef } from "react";
import { Alert, Button, Container, Modal } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import {
  listGroups,
  listAlbums,
  listPhotos,
  uploadPhotos,
  deletePhoto,
} from "../../services/eventos";
import "./Eventos.scss";

const MAX_PER_UPLOAD = 5;

const AlbumPage = () => {
  const { groupSlug, albumSlug } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [album, setAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  // seleção
  const [pending, setPending] = useState([]);
  const [infoMsg, setInfoMsg] = useState("");
  const [warnMsg, setWarnMsg] = useState("");

  // lightbox
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const fileInputRef = useRef(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const groups = await listGroups();
      const g = groups.find((x) => x.slug === groupSlug) || null;
      setGroup(g);
      if (!g) return;

      const albums = await listAlbums(groupSlug);
      const a = albums.find((x) => x.slug === albumSlug) || null;
      setAlbum(a);

      if (a) setPhotos(await listPhotos(groupSlug, albumSlug));
      else setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [groupSlug, albumSlug]);

  // navegação lightbox
  const total = photos.length;
  const goPrev = () =>
    setViewerIndex((i) => (i - 1 + Math.max(total, 1)) % Math.max(total, 1));
  const goNext = () => setViewerIndex((i) => (i + 1) % Math.max(total, 1));

  useEffect(() => {
    if (!viewerOpen) return;
    const onKey = (e) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape") setViewerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewerOpen, total]);

  if (loading) {
    return (
      <Container className="py-4">
        <p className="text-muted">Carregando…</p>
      </Container>
    );
  }
  if (!group || !album) {
    return (
      <Container className="py-4">
        <p className="text-muted">Álbum não encontrado.</p>
        <Button variant="secondary" onClick={() => navigate("/eventos")}>
          Voltar
        </Button>
      </Container>
    );
  }

  // upload
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
      setWarnMsg(`Limite de ${MAX_PER_UPLOAD} por envio já atingido.`);
      return;
    }
    const allowed = files.slice(0, remaining);
    const ignored = files.length - allowed.length;
    setPending((prev) => [...prev, ...allowed]);
    setWarnMsg(ignored > 0 ? `${ignored} arquivo(s) ignorado(s).` : "");
    setInfoMsg(
      `Selecionados: ${Math.min(
        MAX_PER_UPLOAD,
        pending.length + allowed.length
      )}/${MAX_PER_UPLOAD}`
    );
  };
  const handleFilesChosen = (e) => {
    addFilesToPending(e.target.files);
    e.target.value = "";
  };
  const removePending = (idx) => {
    setPending((prev) => prev.filter((_, i) => i !== idx));
    const nextLen = pending.length - 1;
    setInfoMsg(nextLen > 0 ? `Selecionados: ${nextLen}/${MAX_PER_UPLOAD}` : "");
  };
  const clearPending = () => {
    setPending([]);
    setWarnMsg("");
    setInfoMsg("");
  };

  const handleSend = async () => {
    if (pending.length === 0) return;
    await uploadPhotos(group.slug, album.slug, pending);
    clearPending();
    await refresh();
  };

  const handleDelete = async (name) => {
    await deletePhoto(group.slug, album.slug, name);
    await refresh();
  };

  // drag & drop
  const onDrop = (ev) => {
    ev.preventDefault();
    if (ev.dataTransfer?.files?.length)
      addFilesToPending(ev.dataTransfer.files);
  };
  const onDragOver = (ev) => ev.preventDefault();

  const openViewer = (idx) => {
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
            onClick={() => navigate(`/eventos/${group.slug}`)}
          >
            ← Voltar
          </Button>
          <h2 className="d-inline">{album.title}</h2>
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
          {warnMsg && (
            <Alert variant="warning" className="py-1 px-2 mt-2 mb-0">
              {warnMsg}
            </Alert>
          )}
          {infoMsg && !warnMsg && (
            <div className="text-muted small mt-2">{infoMsg}</div>
          )}
          {pending.length > 0 && (
            <div className="pending-list mt-2">
              {pending.map((f, i) => (
                <span key={`${f.name}-${i}`} className="pending-chip">
                  {f.name}
                  <button
                    type="button"
                    className="chip-x"
                    onClick={() => removePending(i)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="text-muted small mt-1">
            limite de {MAX_PER_UPLOAD} por envio
          </div>
        </div>
      </div>

      {photos.length === 0 ? (
        <div
          className="p-4 text-center border rounded bg-white"
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <p className="mb-1">Nenhuma foto neste álbum ainda.</p>
          <small className="text-muted">
            Arraste e solte ou use “Selecionar fotos”.
          </small>
        </div>
      ) : (
        <div onDrop={onDrop} onDragOver={onDragOver}>
          <div className="album-grid">
            {photos.map((p, idx) => (
              <div
                key={p.name}
                className="photo-card"
                onClick={() => openViewer(idx)}
              >
                <img src={p.url} alt={p.name} />
                <button
                  type="button"
                  className="photo-del"
                  title="Excluir"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(p.name);
                  }}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LIGHTBOX */}
      <Modal show={viewerOpen} onHide={closeViewer} fullscreen centered>
        <Modal.Body className="p-0 d-flex align-items-center justify-content-center bg-black">
          {total > 0 && (
            <>
              <button className="lightbox-nav left" onClick={goPrev}>
                ‹
              </button>
              <img
                className="lightbox-img"
                src={photos[viewerIndex]?.url}
                alt={photos[viewerIndex]?.name}
              />
              <button className="lightbox-nav right" onClick={goNext}>
                ›
              </button>
              <button className="lightbox-close" onClick={closeViewer}>
                ×
              </button>
              <div className="lightbox-caption">
                {viewerIndex + 1} / {total} — {photos[viewerIndex]?.name}
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default AlbumPage;
