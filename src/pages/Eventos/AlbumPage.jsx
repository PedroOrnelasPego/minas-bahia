import { useEffect, useRef, useState, useMemo } from "react";
import {
  Alert,
  Button,
  Container,
  Modal,
  Placeholder,
  ProgressBar,
} from "react-bootstrap";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { listPhotos, uploadPhotos, deletePhoto } from "../../services/eventos";
import "./Eventos.scss";
import RequireAccess from "../../components/RequireAccess/RequireAccess";

const API_URL = import.meta.env.VITE_API_URL;

const MAX_PER_UPLOAD = 25;
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
  const [pending, setPending] = useState([]); // [{file, url, status: 'queued'|'uploading'|'done'|'error'}]
  const [warnMsg, setWarnMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [albumTitle, setAlbumTitle] = useState("");

  // envio / progresso
  const [isUploading, setIsUploading] = useState(false);
  const [uploadIndex, setUploadIndex] = useState(0); // 0..n-1 do pending
  const [overallProgress, setOverallProgress] = useState(0); // 0..100

  // lightbox
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const fileInputRef = useRef(null);

  // cancelamento/concorrência
  const abortRef = useRef(null);
  const reqSeq = useRef(0);

  // --- DEBUG FLAG: ?skeleton=1 ou localStorage 'debug:skeleton' === '1'
  const forceSkeleton = useMemo(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.has("skeleton")) return true;
      return localStorage.getItem("debug:skeleton") === "1";
    } catch {
      return false;
    }
  }, []);

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

  
  //useEffect(() => {
    //const t = albumTitle || albumSlug;
    //document.title = `${t} | ${groupSlug} | Eventos`;
  //}, [albumTitle, groupSlug, albumSlug]);

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

  // cria URL de preview e item de fila
  const toPendingItem = (file) => ({
    file,
    url: URL.createObjectURL(file),
    status: "queued", // 'queued' | 'uploading' | 'done' | 'error'
  });

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

    setPending((prev) => [...prev, ...allowed.map(toPendingItem)]);

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
    setPending((prev) => {
      const item = prev[idx];
      if (item?.url) URL.revokeObjectURL(item.url);
      const next = prev.filter((_, i) => i !== idx);
      const nextLen = Math.max(0, next.length);
      setInfoMsg(
        nextLen > 0 ? `Selecionados: ${nextLen}/${MAX_PER_UPLOAD}` : ""
      );
      return next;
    });
    setWarnMsg("");
  };

  const clearPending = () => {
    setPending((prev) => {
      prev.forEach((p) => p?.url && URL.revokeObjectURL(p.url));
      return [];
    });
    setWarnMsg("");
    setInfoMsg("");
  };

  // envio sequencial para mostrar status por item
  const handleSend = async () => {
    if (pending.length === 0 || isUploading) return;

    setIsUploading(true);
    setUploadIndex(0);
    setOverallProgress(0);

    let sent = 0;

    for (let i = 0; i < pending.length; i++) {
      setUploadIndex(i);
      // marca como "uploading"
      setPending((prev) =>
        prev.map((it, idx) => (idx === i ? { ...it, status: "uploading" } : it))
      );

      try {
        // usa a mesma API, porém 1 arquivo por vez p/ termos granularidade
        await uploadPhotos(groupSlug, albumSlug, [pending[i].file]);

        // sucesso → done
        setPending((prev) =>
          prev.map((it, idx) => (idx === i ? { ...it, status: "done" } : it))
        );
        sent += 1;
      } catch (e) {
        console.error("Erro ao enviar foto:", e);
        // erro → marca e segue com as demais
        setPending((prev) =>
          prev.map((it, idx) => (idx === i ? { ...it, status: "error" } : it))
        );
      } finally {
        // progresso global baseado nos itens concluídos (ok ou erro)
        const pct = Math.round(((i + 1) / pending.length) * 100);
        setOverallProgress(pct);
      }
    }

    setIsUploading(false);

    // remove do pending os que foram enviados com sucesso, mantém erros na fila
    setPending((prev) => {
      prev.forEach((p) => {
        if (p.status === "done" && p.url) URL.revokeObjectURL(p.url);
      });
      const onlyErrors = prev.filter((p) => p.status !== "done");
      const nextLen = Math.max(0, onlyErrors.length);
      setInfoMsg(
        nextLen > 0
          ? `Restantes (com erro ou pendentes): ${nextLen}/${MAX_PER_UPLOAD}`
          : ""
      );
      if (nextLen > 0) {
        setWarnMsg("Alguns arquivos falharam. Tente reenviar os restantes.");
      } else {
        setWarnMsg("");
      }
      return onlyErrors;
    });

    if (sent > 0) {
      await refresh();
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

  // ===== Skeleton no padrão dos cards =====
  const SkeletonGrid = useMemo(() => {
    const CardSkeleton = () => (
      <div className="cards-eventos skeleton">
        <div className="skeleton-shimmer" />
        <div className="card-overlay-title">
          <Placeholder animation="glow">
            <Placeholder xs={6} />{" "}
          </Placeholder>
          <div className="card-sub">
            <Placeholder animation="glow">
              <Placeholder xs={3} />
            </Placeholder>
          </div>
        </div>
      </div>
    );
    return (
      <div className="d-flex flex-wrap gap-3 items-center justify-content-center">
        {Array.from({ length: 8 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }, []);

  // limpa URLs de preview ao desmontar
  useEffect(() => {
    return () => {
      pending.forEach((p) => p?.url && URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              <Button
                variant="outline-primary"
                onClick={openPicker}
                disabled={isUploading || pending.length >= MAX_PER_UPLOAD}
              >
                + Selecionar fotos
              </Button>
              <Button
                onClick={handleSend}
                disabled={pending.length === 0 || isUploading}
              >
                {isUploading
                  ? `Enviando (${Math.min(uploadIndex + 1, pending.length)}/${
                      pending.length
                    })`
                  : `Enviar${
                      pending.length
                        ? ` (${pending.length}/${MAX_PER_UPLOAD})`
                        : ""
                    }`}
              </Button>
              <Button
                variant="outline-secondary"
                onClick={clearPending}
                disabled={pending.length === 0 || isUploading}
              >
                Limpar seleção
              </Button>
            </div>
          </RequireAccess>

          {isUploading && (
            <div className="mt-2">
              <ProgressBar now={overallProgress} animated striped />
            </div>
          )}

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

      {/* Lista de arquivos selecionados (pré-visualização) */}
      {pending.length > 0 && (
        <div
          className="border rounded p-2 mb-3"
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <div className="d-flex flex-wrap gap-2 justify-content-center">
            {pending.map((p, idx) => (
              <div
                key={idx}
                className="photo-card"
                style={{ width: 180, height: 120, position: "relative" }}
                title={p.file.name}
              >
                <img
                  src={p.url}
                  alt={p.file.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                {/* status overlay */}
                <div
                  style={{
                    position: "absolute",
                    left: 6,
                    bottom: 6,
                    background: "rgba(0,0,0,.55)",
                    color: "#fff",
                    borderRadius: 6,
                    padding: "2px 6px",
                    fontSize: 12,
                  }}
                >
                  {p.status === "queued" && "Fila"}
                  {p.status === "uploading" && "Enviando…"}
                  {p.status === "done" && "OK"}
                  {p.status === "error" && "Erro"}
                </div>

                <button
                  type="button"
                  className="photo-del"
                  title="Remover da seleção"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isUploading) return;
                    removePending(idx);
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="mt-2 text-center small text-muted">
            {pending[uploadIndex]?.file?.name
              ? `Atual: ${pending[uploadIndex].file.name} (${Math.round(
                  pending[uploadIndex].file.size / 1024
                )} KB)`
              : null}
          </div>
        </div>
      )}

      {/* GRID / SKELETON */}
      {loading || forceSkeleton ? (
        <div className="p-2">{SkeletonGrid}</div>
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
