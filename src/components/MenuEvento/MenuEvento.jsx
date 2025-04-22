import { useState } from "react";
import { Card, Modal, Button } from "react-bootstrap";
import eventsData from "./data";
import "./MenuEvento.scss";

const MenuEvento = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleClick = (eventData) => {
    setSelectedEvent(eventData);
  };

  const handleClose = () => {
    setSelectedEvent(null);
  };

  return (
    <>
      <div className="floating-menu">
        {/* Card visível por padrão, ocultado via CSS em tela pequena */}
        {eventsData.map((event, index) => (
          <div key={index} className="menu-evento-card" onClick={() => handleClick(event)}>
            <Card className="mb-3 w-100">
              <Card.Img variant="top" src={event.img} alt={event.title} />
              <Card.Body className="p-2">
                <Card.Title className="text-sm font-bold">Próximo Evento: {event.title}</Card.Title>
                <Card.Text className="text-xs">{event.date}</Card.Text>
              </Card.Body>
            </Card>
          </div>
        ))}

        {/* Botão flutuante visível apenas em telas menores */}
        <button
          className="floating-button"
          onClick={() => handleClick(eventsData[0])}
          aria-label="Abrir evento"
        >
          📅
        </button>
      </div>

      {selectedEvent && (
        <Modal
          show
          onHide={handleClose}
          centered
          dialogClassName="modal-evento-custom"
        >
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
