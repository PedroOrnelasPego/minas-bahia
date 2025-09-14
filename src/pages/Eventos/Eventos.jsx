// src/pages/Eventos/index.jsx
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
} from "../../services/eventos";

// util simples p/ slug
const slugify = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

import "./Eventos.scss";

const Eventos = () => {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const [editingGroup, setEditingGroup] = useState(null);
  const [showEditGroup, setShowEditGroup] = useState(false);

  // exclusão
  const [deletingGroup, setDeletingGroup] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // carregar grupos da API
  const refresh = async () => {
    setLoading(true);
    try {
      const data = await listGroups();
      setGroups(data || []);
    } catch (e) {
      console.error("Erro ao listar grupos:", e);
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

    const payload = { title, slug: slugify(title) };

    try {
      await apiCreateGroup(payload);
      setShowNewGroup(false);
      setNewTitle("");
      // recarrega da API
      await refresh();
      // abre modal de edição com o grupo recém-criado
      const created = (groups || []).find((g) => g.slug === payload.slug) || {
        id: undefined,
        ...payload,
        coverUrl: "",
        albums: [],
      };
      setEditingGroup(created);
      setShowEditGroup(true);
    } catch (e) {
      console.error("Erro ao criar grupo:", e);
      alert("Erro ao criar grupo.");
    }
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

  const handleConfirmDelete = async () => {
    if (!deletingGroup) return;
    try {
      await apiDeleteGroup(deletingGroup.slug);
      setShowDeleteConfirm(false);
      setDeletingGroup(null);
      await refresh();
    } catch (e) {
      console.error("Erro ao excluir grupo:", e);
      alert("Erro ao excluir grupo.");
    }
  };

  const handleSaveGroup = () => {
    // o EditGroupModal deve chamar a API dele; aqui só fechamos e recarregamos
    setShowEditGroup(false);
    refresh();
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
          Carregando grupos…
        </div>
      ) : groups.length === 0 ? (
        <div className="p-4 text-center border rounded bg-white">
          <p className="mb-1">Nenhum grupo ainda.</p>
          <small className="text-muted">
            Crie um grupo para organizar seus álbuns (ex.: “UAI Minas Bahia”,
            “Batizado e Troca de Cordas”...).
          </small>
        </div>
      ) : (
        <div className="d-flex flex-wrap gap-4">
          {groups.map((g) => (
            <AlbumCard
              key={g.slug || g.id}
              group={g}
              onOpen={handleOpenGroup}
              onEdit={handleOpenEdit}
              onDelete={handleAskDelete}
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
