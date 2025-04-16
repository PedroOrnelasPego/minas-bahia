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
        {eventsData.map((event, index) => (
          <div key={index} onClick={() => handleClick(event)}>
            <Card className="menu-evento-card mb-3">
              <Card.Img variant="top" src={event.img} alt={event.title} />
              <Card.Body className="p-2">
                <Card.Title className="text-sm font-bold">Proximo Evento: {event.title}</Card.Title>
                <Card.Text className="text-xs">{event.date}</Card.Text>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>

      {selectedEvent && (
        <Modal
          show={true}
          onHide={handleClose}
          centered
          className="custom-modal"
        >
          <Modal.Header closeButton>
            <Modal.Title>{selectedEvent.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <img
              src={selectedEvent.img}
              alt={selectedEvent.title}
              className="w-full rounded"
            />
            <p className="text-center mt-2">{selectedEvent.date}</p>
          </Modal.Body>
          <Modal.Footer>
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
