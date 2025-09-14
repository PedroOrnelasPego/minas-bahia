import { useEffect, useMemo, useState } from "react";
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
import { loadGroups, saveGroups, slugify } from "./store";
import EditAlbumModal from "./EditAlbumModal";
import RequireAccess from "../../components/RequireAccess/RequireAccess";

const AlbumGroup = () => {
  const { groupSlug } = useParams();
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // novo álbum
  const [showNewAlbum, setShowNewAlbum] = useState(false);
  const [albumTitle, setAlbumTitle] = useState("");
  const [cover, setCover] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");

  // editar álbum
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [showEditAlbum, setShowEditAlbum] = useState(false);

  // excluir álbum
  const [deletingAlbum, setDeletingAlbum] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const data = loadGroups();
    setGroups(data);
    setLoaded(true);
  }, []);

  const group = useMemo(
    () => groups.find((g) => g.slug === groupSlug),
    [groups, groupSlug]
  );

  useEffect(() => {
    if (group) document.title = `${group.title} | Eventos`;
  }, [group]);

  // ainda carregando
  if (!loaded) {
    return (
      <Container className="py-4">
        <p className="text-muted">Carregando…</p>
      </Container>
    );
  }

  // não achou
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

  const persist = (nextGroups) => {
    setGroups(nextGroups);
    saveGroups(nextGroups);
  };

  const onCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCover(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const createAlbum = () => {
    if (!albumTitle.trim()) return;
    const albumSlug = slugify(albumTitle);

    const nextGroups = groups.map((g) =>
      g.id === group.id
        ? {
            ...g,
            albums: [
              ...g.albums,
              {
                id: crypto.randomUUID(),
                title: albumTitle.trim(),
                slug: albumSlug,
                coverUrl: coverPreview || "",
                photos: [],
              },
            ],
          }
        : g
    );

    persist(nextGroups);

    // limpa modal
    setAlbumTitle("");
    setCover(null);
    setCoverPreview("");
    setShowNewAlbum(false);
  };

  const openAlbum = (album) => {
    navigate(`/eventos/${group.slug}/${album.slug}`);
  };

  // ====== editar álbum ======
  const askEditAlbum = (album) => {
    setEditingAlbum(album);
    setShowEditAlbum(true);
  };

  const saveEditedAlbum = (updated) => {
    // Se o título mudou, atualiza o slug para manter URL amigável
    const nextTitle = (updated.title || "").trim();
    const nextSlug =
      nextTitle && nextTitle !== editingAlbum.title
        ? slugify(nextTitle)
        : editingAlbum.slug;

    const nextGroups = groups.map((g) =>
      g.id === group.id
        ? {
            ...g,
            albums: g.albums.map((a) =>
              a.id === updated.id
                ? {
                    ...a,
                    title: nextTitle || a.title,
                    slug: nextSlug,
                    coverUrl: updated.coverUrl ?? a.coverUrl,
                  }
                : a
            ),
          }
        : g
    );

    persist(nextGroups);
    setShowEditAlbum(false);
    setEditingAlbum(null);
  };

  // ====== excluir álbum ======
  const askDeleteAlbum = (album) => {
    setDeletingAlbum(album);
    setShowDeleteModal(true);
  };

  const confirmDeleteAlbum = () => {
    if (!deletingAlbum) return;

    const nextGroups = groups.map((g) =>
      g.id === group.id
        ? {
            ...g,
            albums: g.albums.filter((a) => a.id !== deletingAlbum.id),
          }
        : g
    );

    persist(nextGroups);
    setShowDeleteModal(false);
    setDeletingAlbum(null);
  };

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
        <Button onClick={() => setShowNewAlbum(true)}>+ Novo álbum</Button>
      </div>

      {group.albums.length === 0 ? (
        <Card className="p-4 text-center">
          <p className="mb-1">Nenhum álbum neste grupo ainda.</p>
          <small className="text-muted">
            Clique em “Novo álbum” para começar e selecione um título e uma
            imagem de capa.
          </small>
        </Card>
      ) : (
        <Row className="g-3">
          {group.albums.map((a) => (
            <Col key={a.id} xs={12} sm={6} md={4} lg={3}>
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

                {/* Lixeira */}
                <button
                  type="button"
                  className="icon-btn trash-btn"
                  title="Excluir álbum"
                  aria-label={`Excluir álbum ${a.title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    askDeleteAlbum(a);
                  }}
                >
                  🗑️
                </button>

                {/* Lápis */}
                <button
                  type="button"
                  className="icon-btn edit-btn"
                  title="Editar álbum"
                  aria-label={`Editar álbum ${a.title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    askEditAlbum(a);
                  }}
                >
                  ✏️
                </button>

                <div className="card-overlay-title">
                  <div>{a.title}</div>
                  <div className="card-sub">{a.photos?.length ?? 0} fotos</div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      )}

      {/* Modal novo álbum */}
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

          <Button onClick={createAlbum} disabled={!albumTitle.trim()}>
            Criar álbum
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal editar álbum */}
      <EditAlbumModal
        show={showEditAlbum}
        initial={editingAlbum}
        onClose={() => setShowEditAlbum(false)}
        onSave={saveEditedAlbum}
      />

      {/* Modal confirmar exclusão */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Excluir álbum</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Tem certeza que deseja excluir o álbum{" "}
          <strong>{deletingAlbum?.title}</strong>?
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
