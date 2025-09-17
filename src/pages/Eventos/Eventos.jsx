import { useEffect, useState, useMemo, useRef } from "react";
import { Container, Button, Modal, Form, Placeholder } from "react-bootstrap";
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
  deleteGroupCover,
} from "../../services/eventos";
import { makeCoverVariants } from "../../utils/covers";
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

// helper
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// cache
const GROUPS_CACHE_KEY = "eventos_groups_cache_v1";

// debounce só em DEV p/ evitar 1ª request cancelada do StrictMode
const DEV_STRICT_DEBOUNCE_MS = 30;

const Eventos = () => {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const [editingGroup, setEditingGroup] = useState(null);
  const [showEditGroup, setShowEditGroup] = useState(false);

  const [deletingGroup, setDeletingGroup] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // cancelamento/concorrência
  const abortRef = useRef(null);
  const reqSeq = useRef(0);

  // usa cache (se houver) para render instantânea
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(GROUPS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setGroups(parsed);
          setLoading(false);
        }
      }
    } catch {}
  }, []);

  const refresh = async () => {
    setError(null);
    if (!groups?.length) setLoading(true);

    // cancela anterior
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const mySeq = ++reqSeq.current;

    let lastErr = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const list = await listGroups({ signal: controller.signal });
        if (mySeq !== reqSeq.current) return; // resposta antiga
        setGroups(list || []);
        setError(null);
        try {
          sessionStorage.setItem(GROUPS_CACHE_KEY, JSON.stringify(list || []));
        } catch {}
        setLoading(false);
        return;
      } catch (e) {
        if (controller.signal.aborted || e?.code === "ERR_CANCELED") return;
        lastErr = e;
        await sleep(400 * (attempt + 1));
      }
    }

    if (mySeq !== reqSeq.current) return;
    setLoading(false);
    setError(lastErr || new Error("Falha ao carregar"));
  };

  // monta com debounce em DEV
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
  }, []);

  // ações
  const handleCreateGroup = async () => {
    const title = newTitle.trim();
    if (!title) return;
    const slug = slugify(title);

    await apiCreateGroup({ slug, title });
    setShowNewGroup(false);
    setNewTitle("");

    await refresh();

    const created = (groups || []).find((g) => g.slug === slug) || {
      slug,
      title,
      coverUrl: "",
    };
    setEditingGroup(created);
    setShowEditGroup(true);
  };

  // 👉 agora passamos meta via state para evitar refetch de /groups na página de álbuns
  const handleOpenGroup = (group) =>
    navigate(`/eventos/${group.slug}`, { state: { groupMeta: group } });

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
        setGroups((gs) =>
          gs.map((g) =>
            g.slug === current.slug ? { ...g, title: nextTitle } : g
          )
        );
      }

      if (updated.removeCover) {
        await deleteGroupCover(current.slug);
        setGroups((gs) =>
          gs.map((g) => (g.slug === current.slug ? { ...g, coverUrl: "" } : g))
        );
      } else if (updated.newCoverFile) {
        const { oneXFile, twoXFile } = await makeCoverVariants(
          updated.newCoverFile
        );
        const [{ url: u1 }] = await Promise.all([
          uploadGroupCover(current.slug, oneXFile, "_cover@1x.jpg"),
          uploadGroupCover(current.slug, twoXFile, "_cover@2x.jpg"),
        ]);
        const coverUrl = `${u1}?v=${Date.now()}`;
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

  // skeleton
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
        {Array.from({ length: 6 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }, []);

  return (
    <Container className="py-4">
      {/* HEADER */}
      <div className="eventos-head mb-10">
        <h1 className="eventos-title">Eventos</h1>

        <RequireAccess nivelMinimo="graduado" requireEditor>
          <Button
            className="btn-new-group"
            onClick={() => setShowNewGroup(true)}
          >
            + Novo grupo
          </Button>
        </RequireAccess>
      </div>

      {/* estados */}
      {loading ? (
        <div className="p-2">{SkeletonGrid}</div>
      ) : error ? (
        <div className="p-4 text-center border rounded bg-white">
          <p className="mb-2">Não foi possível carregar os grupos agora.</p>
          <small className="text-muted d-block mb-3">
            {String(error?.message || "Erro de rede")}
          </small>
          <Button variant="primary" onClick={refresh}>
            Tentar novamente
          </Button>
        </div>
      ) : groups.length === 0 ? (
        <div className="p-4 text-center border rounded bg-white">
          <p className="mb-1">Nenhum grupo ainda.</p>
          <RequireAccess nivelMinimo="graduado" requireEditor>
            <small className="text-muted">
              Crie um grupo para organizar seus álbuns (ex.: “UAI Minas
              Bahia”…).
            </small>
          </RequireAccess>
        </div>
      ) : (
        <div className="d-flex flex-wrap gap-3 justify-content-center">
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
          Tem certeza que deseja excluir <strong>{deletingGroup?.title}</strong>?
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
