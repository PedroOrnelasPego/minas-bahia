// src/pages/Eventos/AlbumGroup.jsx
import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
} from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import RequireAccess from "../../components/RequireAccess/RequireAccess";
import EditAlbumModal from "./EditAlbumModal";
import {
  listGroups,
  listAlbums,
  createAlbum,
  deleteAlbum,
  updateAlbumTitle,
  uploadAlbumCover,
} from "../../services/eventos";

const slugify = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const AlbumGroup = () => {
  const { groupSlug } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const refresh = async () => {
    setLoading(true);
    try {
      const groups = await listGroups();
      const g = groups.find((x) => x.slug === groupSlug) || null;
      setGroup(g);
      if (g) setAlbums(await listAlbums(groupSlug));
      else setAlbums([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [groupSlug]);

  if (loading) {
    return (
      <Container className="py-4">
        <p className="text-muted">Carregando…</p>
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

  const onCoverChange = (e) => {
    const f = e.target.files?.[0];
    setCoverFile(f || null);
    setCoverPreview(f ? URL.createObjectURL(f) : "");
  };

  const handleCreateAlbum = async () => {
    const title = albumTitle.trim();
    if (!title) return;

    const slug = slugify(title);
    await createAlbum(group.slug, { slug, title });
    if (coverFile) await uploadAlbumCover(group.slug, slug, coverFile);

    setShowNewAlbum(false);
    setAlbumTitle("");
    setCoverFile(null);
    setCoverPreview("");
    await refresh();
  };

  const askEditAlbum = (album) => {
    setEditingAlbum(album);
    setShowEditAlbum(true);
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

  const saveEditedAlbum = async (updated) => {
    const nextTitle = (updated.title || "").trim();
    if (nextTitle && nextTitle !== editingAlbum.title) {
      await updateAlbumTitle(group.slug, editingAlbum.slug, nextTitle);
    }
    if (updated.newCoverFile) {
      await uploadAlbumCover(
        group.slug,
        editingAlbum.slug,
        updated.newCoverFile
      );
    }
    setShowEditAlbum(false);
    setEditingAlbum(null);
    await refresh();
  };

  const openAlbum = (album) => navigate(`/eventos/${group.slug}/${album.slug}`);

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
        <Row className="g-3">
          {albums.map((a) => (
            <Col key={a.slug} xs={12} sm={6} md={4} lg={3}>
              <div
                className="cards-eventos position-relative"
                style={{
                  backgroundImage: a.coverUrl ? `url(${a.coverUrl})` : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  cursor: "pointer",
                }}
                onClick={() => openAlbum(a)}
              >
                {!a.coverUrl && (
                  <div className="w-100 h-100 card-placeholder">
                    capa do álbum
                  </div>
                )}

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

                <div className="card-overlay-title">
                  <div>{a.title}</div>
                  <div className="card-sub">{a.count ?? 0} fotos</div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
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
