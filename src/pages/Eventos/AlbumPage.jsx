// src/pages/Eventos/AlbumPage.jsx
import { useEffect, useRef, useState } from "react";
import { Alert, Button, Container, Modal } from "react-bootstrap";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { listPhotos, uploadPhotos, deletePhoto } from "../../services/eventos";
import "./Eventos.scss";
import RequireAccess from "../../components/RequireAccess/RequireAccess";

const API_URL = import.meta.env.VITE_API_URL;

const MAX_PER_UPLOAD = 10;
// Tamanho VISUAL da miniatura (3:2). O servidor entrega 1x/2x com nitidez.
const THUMB_W = 420;
const THUMB_H = 280;

// caches por grupo/álbum
const photosKey = (g, a) => `eventos_photos_cache_v1:${g}:${a}`;
const albumTitleKey = (g, a) => `eventos_album_title_v1:${g}:${a}`;

// debounce só em DEV
const DEV_STRICT_DEBOUNCE_MS = 30;

const AlbumPage = () => {
  const { groupSlug, albumSlug } = useParams();
  const location = useLocation();
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

  // cancelamento/concorrência
  const abortRef = useRef(null);
  const reqSeq = useRef(0);

  // boot com state + cache instantâneo
  useEffect(() => {
    // 1) se veio com state do álbum, usa de cara
    const fromState = location.state?.album;
    if (fromState?.slug === albumSlug && fromState?.title) {
      setAlbumTitle(fromState.title);
      try {
        sessionStorage.setItem(
          albumTitleKey(groupSlug, albumSlug),
          fromState.title
        );
      } catch {}
    } else {
      // 2) tenta cache do título
      try {
        const cachedTitle = sessionStorage.getItem(
          albumTitleKey(groupSlug, albumSlug)
        );
        if (cachedTitle) setAlbumTitle(cachedTitle);
        else setAlbumTitle(albumSlug);
      } catch {
        setAlbumTitle(albumSlug);
      }
    }

    // fotos do cache
    try {
      const cachedPhotos = sessionStorage.getItem(
        photosKey(groupSlug, albumSlug)
      );
      if (cachedPhotos) {
        const arr = JSON.parse(cachedPhotos);
        if (Array.isArray(arr)) {
          setPhotos(arr);
          setLoading(false);
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupSlug, albumSlug]);

  const refresh = async () => {
    // se já tem cache, não volta pro spinner pesado
    if (!photos?.length) setLoading(true);
    setWarnMsg("");
    setInfoMsg("");

    // aborta anterior
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const mySeq = ++reqSeq.current;

    let lastErr = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        // >>> só chamo /photos (não preciso mais de /albums aqui)
        const resp = await listPhotos(groupSlug, albumSlug, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;
        if (mySeq !== reqSeq.current) return;

        const arr = Array.isArray(resp) ? resp : resp.photos || [];
        const titleFromApi =
          !Array.isArray(resp) && resp?.title?.trim() ? resp.title.trim() : "";

        const title =
          titleFromApi ||
          sessionStorage.getItem(albumTitleKey(groupSlug, albumSlug)) ||
          albumSlug;

        setPhotos(arr);
        setAlbumTitle(title);
        setLoading(false);

        // cache
        try {
          sessionStorage.setItem(
            photosKey(groupSlug, albumSlug),
            JSON.stringify(arr)
          );
          sessionStorage.setItem(albumTitleKey(groupSlug, albumSlug), title);
        } catch {}

        return;
      } catch (e) {
        if (controller.signal.aborted || e?.code === "ERR_CANCELED") return;
        lastErr = e;
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }

    if (mySeq !== reqSeq.current) return;
    setLoading(false);
    console.error("Erro ao listar fotos:", lastErr);
  };

  // monta/troca com debounce em DEV
  useEffect(() => {
    let cancelled = false;
    let timerId = null;

    const run = () => {
      if (!cancelled) refresh();
    };

    if (import.meta.env?.DEV) {
      timerId = setTimeout(run, DEV_STRICT_DEBOUNCE_MS);
    } else {
      run();
    }

    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupSlug, albumSlug]);

  useEffect(() => {
    const t = albumTitle || albumSlug;
    document.title = `${t} | ${groupSlug} | Eventos`;
  }, [albumTitle, groupSlug, albumSlug]);

  // ===== Lightbox =====
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

  // helper pra montar src/srcSet das thumbs do back
  const thumbUrl = (name, w, h, dpr = 1) =>
    `${API_URL}/eventos/thumb/${encodeURIComponent(
      groupSlug
    )}/${encodeURIComponent(albumSlug)}/${encodeURIComponent(
      name
    )}?w=${Math.round(w * dpr)}&h=${Math.round(h * dpr)}&fit=cover`;

  return (
    <Container className="py-4">
      {/* ===== CABEÇALHO PADRÃO (Voltar | Título | Ações) ===== */}
      <div className="page-head mb-3">
        <button
          type="button"
          className="page-back"
          onClick={() => navigate(`/eventos/${groupSlug}`)}
          aria-label="Voltar para o grupo"
        >
          <i className="bi bi-arrow-left" /> Voltar
        </button>

        <h2 className="page-title">{albumTitle || albumSlug}</h2>

        <div className="page-cta">
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
            <RequireAccess nivelMinimo="graduado" requireEditor>
              Clique em “Selecionar fotos” (máx. {MAX_PER_UPLOAD} por envio) ou
              arraste aqui.
            </RequireAccess>
          </small>
        </div>
      ) : (
        <div onDrop={onDrop} onDragOver={onDragOver}>
          <div className="d-flex align-items-center gap-3 mb-2">
            <span className="text-muted">· {photos.length} fotos</span>
          </div>

          {/* grade responsiva simples */}
          <div className="flex flex-wrap gap-3 justify-content-center">
            {photos.map((p, idx) => {
              const src1x = thumbUrl(p.name, THUMB_W, THUMB_H, 1);
              const src2x = thumbUrl(p.name, THUMB_W, THUMB_H, 2);
              return (
                <div
                  key={p.name}
                  className="photo-card"
                  title={p.displayName || p.name}
                  onClick={() => openViewer(idx)}
                  style={{ height: 240, width: 400 }}
                >
                  <img
                    src={src1x}
                    srcSet={`${src1x} 1x, ${src2x} 2x`}
                    sizes={`${THUMB_W}px`}
                    alt={p.displayName || p.name}
                    width={THUMB_W}
                    height={THUMB_H}
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      imageRendering: "auto",
                    }}
                  />
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
              );
            })}
          </div>
        </div>
      )}

      {/* LIGHTBOX — usa a foto original em resolução cheia */}
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
