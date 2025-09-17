import { useEffect, useRef, useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import PropTypes from "prop-types";

const EditGroupModal = ({ show, initial, onClose, onSave }) => {
  const [title, setTitle] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [removeCover, setRemoveCover] = useState(false);
  const fileRef = useRef(null);
  const urlRef = useRef(null);

  useEffect(() => {
    if (show) {
      setTitle(initial?.title || "");
      setCoverFile(null);
      setRemoveCover(false);
      setCoverPreview(initial?.coverUrl || "");
    }
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    };
  }, [show, initial]);

  const handleChooseFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(f);
    urlRef.current = url;

    setCoverFile(f);
    setCoverPreview(url);
    setRemoveCover(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleRemoveCover = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setCoverFile(null);
    setCoverPreview("");
    setRemoveCover(true);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSave = () => {
    onSave?.({
      ...initial,
      title: title.trim(),
      newCoverFile: removeCover ? null : coverFile || null,
      removeCover,
      coverUrl: removeCover ? "" : (coverFile ? coverPreview : initial?.coverUrl || ""),
    });
  };

  const dirty =
    title.trim() !== (initial?.title || "") ||
    !!coverFile ||
    removeCover;

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton><Modal.Title>Editar grupo</Modal.Title></Modal.Header>
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
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <label className="btn btn-outline-secondary btn-sm mb-0">
                Escolher imagem
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleChooseFile}
                />
              </label>
              {coverPreview ? (
                <>
                  <img
                    src={coverPreview}
                    alt="Prévia da capa"
                    style={{
                      width: 180, height: 120, objectFit: "cover",
                      borderRadius: 6, border: "1px solid #ddd"
                    }}
                  />
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={handleRemoveCover}
                  >
                    Remover capa
                  </Button>
                </>
              ) : (
                <span className="text-muted">Sem capa</span>
              )}
            </div>
            <small className="text-muted">
              Recomendo ~1200×800px (proporção 3:2). O back otimiza.
            </small>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={handleSave} disabled={!dirty}>
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
