// src/pages/Eventos/EditGroupModal.jsx

import { useEffect, useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import PropTypes from "prop-types";

const EditGroupModal = ({ show, initial, onClose, onSave }) => {
  const [title, setTitle] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");

  useEffect(() => {
    if (show) {
      setTitle(initial?.title || "");
      setCoverFile(null);
      setCoverPreview(initial?.coverUrl || "");
    }
  }, [show, initial]);

  const handleChooseFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setCoverFile(f);
    setCoverPreview(URL.createObjectURL(f));
  };

  const handleSave = () => {
    onSave &&
      onSave({
        ...initial,
        title: title.trim(),
        // devolvemos o file (para você subir depois) e uma preview
        newCoverFile: coverFile || null,
        coverUrl: coverFile ? coverPreview : initial?.coverUrl || "",
      });
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Editar grupo</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Título</Form.Label>
            <Form.Control
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: UAI Minas Bahia"
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Capa do grupo</Form.Label>
            <div className="d-flex align-items-center gap-3">
              <label className="btn btn-outline-secondary btn-sm mb-0">
                Escolher imagem
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleChooseFile}
                />
              </label>
              {coverPreview && (
                <img
                  src={coverPreview}
                  alt="Prévia da capa"
                  style={{
                    width: 120,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 4,
                    border: "1px solid #ddd",
                  }}
                />
              )}
            </div>
            <small className="text-muted">
              Recomendo ~1200×800px (proporção 3:2). O back pode otimizar.
            </small>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Salvar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

EditGroupModal.propTypes = {
  show: PropTypes.bool.isRequired,
  initial: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default EditGroupModal;
