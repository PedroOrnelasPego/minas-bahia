import { useEffect, useState } from "react";
import { Container, Button, Modal, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import AlbumCard from "./AlbumCard";
import EditGroupModal from "./EditGroupModal";
import { loadGroups, saveGroups, slugify } from "./store";
import "./Eventos.scss";

const Eventos = () => {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const [editingGroup, setEditingGroup] = useState(null);
  const [showEditGroup, setShowEditGroup] = useState(false);

  // exclusão
  const [deletingGroup, setDeletingGroup] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => setGroups(loadGroups()), []);

  const persist = (next) => {
    setGroups(next);
    saveGroups(next);
  };

  const handleCreateGroup = () => {
    const title = newTitle.trim();
    if (!title) return;

    const group = {
      id: crypto.randomUUID(),
      title,
      slug: slugify(title),
      coverUrl: "",
      albums: [],
    };

    const next = [...groups, group];
    persist(next);

    setNewTitle("");
    setShowNewGroup(false);

    setEditingGroup(group);
    setShowEditGroup(true);
  };

  const handleOpenGroup = (group) => {
    navigate(`/eventos/${group.slug}`);
  };

  const handleOpenEdit = (group) => {
    setEditingGroup(group);
    setShowEditGroup(true);
  };

  const handleAskDelete = (group) => {
    setDeletingGroup(group);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingGroup) return;
    const next = groups.filter((g) => g.id !== deletingGroup.id);
    persist(next);
    setShowDeleteConfirm(false);
    setDeletingGroup(null);
  };

  const handleSaveGroup = (updated) => {
    const next = groups.map((g) => (g.id === updated.id ? { ...g, ...updated } : g));
    persist(next);
    setShowEditGroup(false);
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">Eventos (grupos)</h1>
        <Button onClick={() => setShowNewGroup(true)}>+ Novo grupo</Button>
      </div>

      {groups.length === 0 ? (
        <div className="p-4 text-center border rounded bg-white">
          <p className="mb-1">Nenhum grupo ainda.</p>
          <small className="text-muted">
            Crie um grupo para organizar seus álbuns (ex.: “UAI Minas Bahia”, “Batizado e Troca de Cordas”...).
          </small>
        </div>
      ) : (
        <div className="d-flex flex-wrap gap-4">
          {groups.map((g) => (
            <AlbumCard
              key={g.id}
              group={g}
              onOpen={handleOpenGroup}
              onEdit={handleOpenEdit}
              onDelete={handleAskDelete}    // << novo
            />
          ))}
        </div>
      )}

      {/* Modal: novo grupo */}
      <Modal show={showNewGroup} onHide={() => setShowNewGroup(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Novo grupo de álbuns</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Título do grupo</Form.Label>
            <Form.Control
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder='Ex.: "UAI Minas Bahia"'
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewGroup(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreateGroup} disabled={!newTitle.trim()}>
            Criar grupo
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal: editar grupo */}
      <EditGroupModal
        show={showEditGroup}
        initial={editingGroup}
        onClose={() => setShowEditGroup(false)}
        onSave={handleSaveGroup}
      />

      {/* Modal: confirmar exclusão */}
      <Modal
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Excluir grupo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Tem certeza que deseja excluir o grupo{" "}
          <strong>{deletingGroup?.title}</strong>?<br />
          <small className="text-muted">
            Todos os álbuns deste grupo serão removidos desta lista.
          </small>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Excluir
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Eventos;
