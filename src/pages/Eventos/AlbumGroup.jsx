import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Placeholder,
} from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import RequireAccess from "../../components/RequireAccess/RequireAccess";
import EditAlbumModal from "./EditAlbumModal";
import {
  listGroups,
  listAlbums,
  createAlbum,
  deleteAlbum,
  uploadAlbumCover,
  updateAlbumTitle,
} from "../../services/eventos";
import SmartCover from "../../components/SmartCover";

const slugify = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// helper
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const AlbumGroup = () => {
  const { groupSlug } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // novo álbum
  const [showNewAlbum, setShowNewAlbum] = useState(false);
  const [albumTitle, setAlbumTitle] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");

  // editar/excluir
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [showEditAlbum, setShowEditAlbum] = useState(false);
  const [deletingAlbum, setDeletingAlbum] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ---------- bootstrap com retry (mesmo padrão da listagem de grupos) ----------
  const refresh = async () => {
    setLoading(true);
    setError(null);

    let lastErr = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const groups = await listGroups();
        const g = groups.find((x) => x.slug === groupSlug) || null;
        const alb = g ? await listAlbums(groupSlug) : [];
        setGroup(g);
        setAlbums(alb);
        setLoading(false);
        setError(null);
        return;
      } catch (e) {
        lastErr = e;
        await sleep(400 * (attempt + 1));
      }
    }

    setGroup(null);
    setAlbums([]);
    setLoading(false);
    setError(lastErr || new Error("Falha ao carregar"));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupSlug]);

  const onCoverChange = (e) => {
    const f = e.target.files?.[0] || null;
    setCoverFile(f);
    setCoverPreview(f ? URL.createObjectURL(f) : "");
  };

  const handleCreateAlbum = async () => {
    const title = albumTitle.trim();
    if (!title) return;

    const slug = slugify(title);
    await createAlbum(group.slug, { slug, title });

    let coverUrl = "";
    if (coverFile) {
      const { url } = await uploadAlbumCover(group.slug, slug, coverFile);
      coverUrl = `${url}?v=${Date.now()}`;
    }

    // adiciona localmente para resposta rápida
    setAlbums((arr) => [...arr, { slug, title, coverUrl, count: 0 }]);

    setShowNewAlbum(false);
    setAlbumTitle("");
    setCoverFile(null);
    setCoverPreview("");
  };

  const askEditAlbum = (album) => {
    setEditingAlbum(album);
    setShowEditAlbum(true);
  };

  const saveEditedAlbum = async (updated) => {
    const target = editingAlbum;
    try {
      const nextTitle = (updated.title || "").trim();
      if (nextTitle && nextTitle !== target.title) {
        await updateAlbumTitle(group.slug, target.slug, nextTitle);
        setAlbums((arr) =>
          arr.map((a) =>
            a.slug === target.slug ? { ...a, title: nextTitle } : a
          )
        );
      }

      if (updated.newCoverFile) {
        const { url } = await uploadAlbumCover(
          group.slug,
          target.slug,
          updated.newCoverFile
        );
        const coverUrl = `${url}?v=${Date.now()}`;
        setAlbums((arr) =>
          arr.map((a) => (a.slug === target.slug ? { ...a, coverUrl } : a))
        );
      }
    } finally {
      setShowEditAlbum(false);
      setEditingAlbum(null);
    }
  };

  const askDeleteAlbum = (album) => {
    setDeletingAlbum(album);
    setShowDeleteModal(true);
  };

  const confirmDeleteAlbum = async () => {
    if (!deletingAlbum) return;
    await deleteAlbum(group.slug, deletingAlbum.slug);
    setShowDeleteModal(false);
    setDeletingAlbum(null);
    await refresh();
  };

  const openAlbum = (album) => navigate(`/eventos/${group.slug}/${album.slug}`);

  // ---------- Skeleton (cards) ----------
  const SkeletonGrid = useMemo(() => {
    const CardSkeleton = () => (
      <Col xs={12} sm={6} md={4} lg={3}>
        <div className="cards-eventos skeleton">
          <div className="skeleton-shimmer" />
          <div className="card-overlay-title">
            <Placeholder animation="glow">
              <Placeholder xs={6} />
            </Placeholder>
            <div className="card-sub">
              <Placeholder animation="glow">
                <Placeholder xs={3} />
              </Placeholder>
            </div>
          </div>
        </div>
      </Col>
    );
    return (
      <Row className="g-3">
        {Array.from({ length: 8 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </Row>
    );
  }, []);

  // ---------- Render ----------
  if (loading) {
    return (
      <Container className="py-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <Button variant="link" className="px-0 me-2" disabled>
              ← Voltar
            </Button>
            <Placeholder as="h2" animation="glow" className="d-inline">
              <Placeholder xs={6} />
            </Placeholder>
          </div>
          <RequireAccess nivelMinimo="graduado" requireEditor>
            <Button disabled>+ Novo álbum</Button>
          </RequireAccess>
        </div>

        <div className="d-flex flex-wrap gap-3 justify-content-center">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="cards-eventos skeleton">
              <div className="skeleton-shimmer" />
              <div className="card-overlay-title">
                <Placeholder animation="glow">
                  <Placeholder xs={6} />
                </Placeholder>
                <div className="card-sub">
                  <Placeholder animation="glow">
                    <Placeholder xs={3} />
                  </Placeholder>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Card className="p-4 text-center">
          <p className="mb-2">Não foi possível carregar este grupo agora.</p>
          <small className="text-muted d-block mb-3">
            {String(error?.message || "Erro de rede")}
          </small>
          <Button onClick={refresh}>Tentar novamente</Button>
        </Card>
      </Container>
    );
  }

  if (!group) {
    return (
      <Container className="py-4">
        <p className="text-muted">Grupo não encontrado.</p>
        <Button variant="secondary" onClick={() => navigate("/eventos")}>
          Voltar
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <Button
            variant="link"
            className="px-0 me-2"
            onClick={() => navigate("/eventos")}
          >
            ← Voltar
          </Button>
          <h2 className="d-inline">{group.title}</h2>
        </div>
        <RequireAccess nivelMinimo="graduado" requireEditor>
          <Button onClick={() => setShowNewAlbum(true)}>+ Novo álbum</Button>
        </RequireAccess>
      </div>

      {albums.length === 0 ? (
        <Card className="p-4 text-center">
          <p className="mb-1">Nenhum álbum neste grupo ainda.</p>
        </Card>
      ) : (
        <div className="d-flex flex-wrap gap-3 justify-content-center">
          {albums.map((a) => (
            <div
              key={a.slug}
              className="cards-eventos position-relative"
              onClick={() => openAlbum(a)}
              role="button"
              aria-label={`Abrir álbum ${a.title}`}
            >
              {a.coverUrl ? (
                <SmartCover
                  url={a.coverUrl}
                  alt={a.title}
                  className="cover-img"
                />
              ) : (
                <div className="w-100 h-100 card-placeholder">
                  capa do álbum
                </div>
              )}

              <RequireAccess nivelMinimo="graduado" requireEditor>
                <button
                  type="button"
                  className="icon-btn trash-btn"
                  title="Excluir álbum"
                  onClick={(e) => {
                    e.stopPropagation();
                    askDeleteAlbum(a);
                  }}
                >
                  🗑️
                </button>
              </RequireAccess>
              <RequireAccess nivelMinimo="graduado" requireEditor>
                <button
                  type="button"
                  className="icon-btn edit-btn"
                  title="Editar álbum"
                  onClick={(e) => {
                    e.stopPropagation();
                    askEditAlbum(a);
                  }}
                >
                  ✏️
                </button>
              </RequireAccess>

              <div className="card-overlay-title">
                <div>{a.title}</div>
                <div className="card-sub">
                  {a.totalPhotos ?? a.count ?? 0} fotos
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* novo álbum */}
      <Modal show={showNewAlbum} onHide={() => setShowNewAlbum(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Novo álbum</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Título do álbum</Form.Label>
            <Form.Control
              value={albumTitle}
              onChange={(e) => setAlbumTitle(e.target.value)}
              placeholder='Ex.: "Batizado 2024"'
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Imagem de capa</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={onCoverChange}
            />
            {coverPreview && (
              <div className="mt-2">
                <img
                  src={coverPreview}
                  alt="Capa"
                  style={{
                    width: 240,
                    height: 160,
                    objectFit: "cover",
                    border: "1px solid #ddd",
                    borderRadius: 6,
                  }}
                />
              </div>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewAlbum(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreateAlbum} disabled={!albumTitle.trim()}>
            Criar álbum
          </Button>
        </Modal.Footer>
      </Modal>

      <EditAlbumModal
        show={showEditAlbum}
        initial={editingAlbum}
        onClose={() => setShowEditAlbum(false)}
        onSave={saveEditedAlbum}
      />

      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Excluir álbum</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Excluir <strong>{deletingAlbum?.title}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmDeleteAlbum}>
            Excluir
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AlbumGroup;
