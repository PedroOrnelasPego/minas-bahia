// src/pages/Eventos/Eventos.jsx
import { useEffect, useState } from "react";
import { Container, Button, Modal, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import AlbumCard from "./AlbumCard";
import EditGroupModal from "./EditGroupModal";
import RequireAccess from "../../components/RequireAccess/RequireAccess";
import {
  listGroups,
  createGroup as apiCreateGroup,
  deleteGroup as apiDeleteGroup,
  uploadGroupCover,
  updateGroupTitle,
} from "../../services/eventos";
import "./Eventos.scss";

// slug util
const slugify = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const Eventos = () => {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const [editingGroup, setEditingGroup] = useState(null);
  const [showEditGroup, setShowEditGroup] = useState(false);

  const [deletingGroup, setDeletingGroup] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await listGroups();
      setGroups(list || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleCreateGroup = async () => {
    const title = newTitle.trim();
    if (!title) return;
    const slug = slugify(title);

    await apiCreateGroup({ slug, title });
    setShowNewGroup(false);
    setNewTitle("");
    await refresh();

    // abre edição pro usuário já trocar capa
    const created = (groups || []).find((g) => g.slug === slug) || {
      slug,
      title,
      coverUrl: "",
    };
    setEditingGroup(created);
    setShowEditGroup(true);
  };

  const handleOpenGroup = (group) => navigate(`/eventos/${group.slug}`);

  const handleOpenEdit = (group) => {
    setEditingGroup(group);
    setShowEditGroup(true);
  };

  const handleAskDelete = (group) => {
    setDeletingGroup(group);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingGroup) return;
    await apiDeleteGroup(deletingGroup.slug);
    setShowDeleteConfirm(false);
    setDeletingGroup(null);
    await refresh();
  };

  const handleSaveGroup = async (updated) => {
    const current = editingGroup;
    try {
      const nextTitle = (updated.title || "").trim();
      if (current && nextTitle && nextTitle !== current.title) {
        await updateGroupTitle(current.slug, nextTitle);
        // atualiza UI local
        setGroups((gs) =>
          gs.map((g) =>
            g.slug === current.slug ? { ...g, title: nextTitle } : g
          )
        );
      }

      if (updated.newCoverFile) {
        const { url } = await uploadGroupCover(
          current.slug,
          updated.newCoverFile
        );
        // cache-buster p/ aparecer sem F5
        const coverUrl = `${url}?v=${Date.now()}`;
        setGroups((gs) =>
          gs.map((g) => (g.slug === current.slug ? { ...g, coverUrl } : g))
        );
      }

      setShowEditGroup(false);
      setEditingGroup(null);
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar grupo.");
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">Eventos (grupos)</h1>
        <RequireAccess nivelMinimo="graduado" requireEditor>
          <Button onClick={() => setShowNewGroup(true)}>+ Novo grupo</Button>
        </RequireAccess>
      </div>

      {loading ? (
        <div className="p-4 text-center border rounded bg-white">
          Carregando…
        </div>
      ) : groups.length === 0 ? (
        <div className="p-4 text-center border rounded bg-white">
          <p className="mb-1">Nenhum grupo ainda.</p>
          <small className="text-muted">
            Crie um grupo para organizar seus álbuns (ex.: “UAI Minas Bahia”…).
          </small>
        </div>
      ) : (
        <div className="d-flex flex-wrap gap-4">
          {groups.map((g) => (
            <AlbumCard
              key={g.slug}
              group={g}
              onOpen={handleOpenGroup}
              onEdit={handleOpenEdit}
              onDelete={handleAskDelete}
            />
          ))}
        </div>
      )}

      {/* novo grupo */}
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

      {/* editar grupo */}
      <EditGroupModal
        show={showEditGroup}
        initial={editingGroup}
        onClose={() => setShowEditGroup(false)}
        onSave={handleSaveGroup}
      />

      {/* confirmar exclusão */}
      <Modal
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Excluir grupo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Tem certeza que deseja excluir <strong>{deletingGroup?.title}</strong>
          ?
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteConfirm(false)}
          >
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
