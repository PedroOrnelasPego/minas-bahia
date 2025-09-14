// src/pages/Eventos/AlbumPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Container, Modal } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { loadGroups, saveGroups } from "./store";
import "./Eventos.scss";

const MAX_PER_UPLOAD = 5;

const AlbumPage = () => {
  const { groupSlug, albumSlug } = useParams();
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // seleção pendente
  const [pending, setPending] = useState([]);
  const [infoMsg, setInfoMsg] = useState("");
  const [warnMsg, setWarnMsg] = useState("");

  // lightbox
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const data = loadGroups();
    setGroups(data);
    setLoaded(true);
  }, []);

  const group = useMemo(
    () => groups.find((g) => g.slug === groupSlug),
    [groups, groupSlug]
  );

  const album = useMemo(
    () => group?.albums?.find((a) => a.slug === albumSlug),
    [group, albumSlug]
  );

  useEffect(() => {
    if (album) document.title = `${album.title} | ${group?.title} | Eventos`;
  }, [album, group]);

  // ====== Navegação do lightbox (deve ficar ANTES de qualquer return) ======
  const total = album?.photos?.length ?? 0;
  const goPrev = () =>
    setViewerIndex((i) => (i - 1 + Math.max(total, 1)) % Math.max(total, 1));
  const goNext = () =>
    setViewerIndex((i) => (i + 1) % Math.max(total, 1));

  useEffect(() => {
    if (!viewerOpen) return;
    const onKey = (e) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape") setViewerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerOpen, total]);
  // ========================================================================

  // returns condicionais
  if (!loaded) {
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

  const persist = (nextGroups) => {
    setGroups(nextGroups);
    saveGroups(nextGroups);
  };

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
    const ignoredCount = files.length - allowed.length;

    setPending((prev) => [...prev, ...allowed]);

    if (ignoredCount > 0) {
      setWarnMsg(
        `${ignoredCount} arquivo(s) ignorado(s) por exceder o limite de ${MAX_PER_UPLOAD}.`
      );
    } else {
      setWarnMsg("");
    }

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
    setWarnMsg("");
    const nextLen = pending.length - 1;
    setInfoMsg(nextLen > 0 ? `Selecionados: ${nextLen}/${MAX_PER_UPLOAD}` : "");
  };

  const clearPending = () => {
    setPending([]);
    setWarnMsg("");
    setInfoMsg("");
  };

  const handleSend = () => {
    if (pending.length === 0) return;

    const newPhotos = pending.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      url: URL.createObjectURL(f),
    }));

    const next = groups.map((g) =>
      g.id !== group.id
        ? g
        : {
            ...g,
            albums: g.albums.map((a) =>
              a.id !== album.id
                ? a
                : { ...a, photos: [...(a.photos || []), ...newPhotos] }
            ),
          }
    );

    persist(next);
    clearPending();
  };

  const handleDeletePhoto = (photoId) => {
    const next = groups.map((g) =>
      g.id !== group.id
        ? g
        : {
            ...g,
            albums: g.albums.map((a) =>
              a.id !== album.id
                ? a
                : {
                    ...a,
                    photos: (a.photos || []).filter((p) => p.id !== photoId),
                  }
            ),
          }
    );
    persist(next);
  };

  // drag & drop
  const onDrop = (ev) => {
    ev.preventDefault();
    if (ev.dataTransfer?.files?.length)
      addFilesToPending(ev.dataTransfer.files);
  };
  const onDragOver = (ev) => ev.preventDefault();

  // abrir/fechar lightbox
  const openViewer = (startIndex) => {
    setViewerIndex(startIndex);
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
              {pending.length > 0 ? `(${pending.length}/${MAX_PER_UPLOAD})` : ""}
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
                    aria-label="Remover"
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

      {(album.photos || []).length === 0 ? (
        <div
          className="p-4 text-center border rounded bg-white"
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <p className="mb-1">Nenhuma foto neste álbum ainda.</p>
          <small className="text-muted d-block mb-2">
            Clique em “Selecionar fotos” (pode escolher várias de uma vez) —
            aceitamos no máximo {MAX_PER_UPLOAD} por envio.
          </small>
          <small className="text-muted">
            Dica: você também pode <strong>arrastar e soltar</strong> arquivos
            aqui.
          </small>
        </div>
      ) : (
        <div onDrop={onDrop} onDragOver={onDragOver}>
          <div className="d-flex align-items-center gap-3 mb-2">
            <h2 className="mb-0">{album.title}</h2>
            <span className="text-muted">
              · {(album.photos || []).length} fotos
            </span>
          </div>

          <div className="album-grid">
            {album.photos.map((p, idx) => (
              <div
                key={p.id}
                className="photo-card"
                onClick={() => openViewer(idx)}
              >
                <img src={p.url} alt={p.name || "foto"} />
                <button
                  type="button"
                  className="photo-del"
                  title="Excluir"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePhoto(p.id);
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
              <button
                className="lightbox-nav left"
                onClick={goPrev}
                aria-label="Anterior"
              >
                ‹
              </button>

              <img
                className="lightbox-img"
                src={album.photos[viewerIndex]?.url}
                alt={album.photos[viewerIndex]?.name || "foto"}
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
                {viewerIndex + 1} / {total} — {album.photos[viewerIndex]?.name}
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default AlbumPage;
