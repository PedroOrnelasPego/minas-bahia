import { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import eventsData from "./data";
import "./MenuEvento.scss";

const MenuEvento = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showBalloon, setShowBalloon] = useState(false);

  const handleClick = (eventData) => setSelectedEvent(eventData);
  const handleClose = () => setSelectedEvent(null);

  // Balão “Veja nossos próximos eventos”
  useEffect(() => {
    const showTimer = setTimeout(() => setShowBalloon(true), 4000);   // aparece após 4s
    const hideTimer = setTimeout(() => setShowBalloon(false), 12000); // some aos 12s
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  // escolhe 1 evento (o primeiro da lista) para abrir ao clicar no ícone
  const defaultEvent = eventsData?.[0] ?? null;

  return (
    <>
      <div className="floating-menu">
        {/* Removido o card grande: fica sempre só o ícone */}
        {showBalloon && (
          <div className="event-balloon" role="status">
            Veja nossos próximos eventos
          </div>
        )}

        <button
          className="floating-button"
          onClick={() => defaultEvent && handleClick(defaultEvent)}
          aria-label="Abrir próximos eventos"
          title="Próximos eventos"
        >
          📅
        </button>
      </div>

      {selectedEvent && (
        <Modal show onHide={handleClose} centered dialogClassName="modal-evento-custom">
          <Modal.Header closeButton>
            <Modal.Title>{selectedEvent.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <img
              src={selectedEvent.img}
              alt={selectedEvent.title}
              className="img-fluid rounded"
            />
            <p className="text-center mt-2">{selectedEvent.date}</p>
          </Modal.Body>
          <Modal.Footer className="modal-footer-custom">
            <Button variant="secondary" onClick={handleClose}>
              Fechar
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
};

export default MenuEvento;
