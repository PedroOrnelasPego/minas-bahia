import { useState } from "react";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import { Card, Modal } from "react-bootstrap"; // Modal importado aqui
import "./Trajetorias.scss";
import trajetoriasAncestraisCards from "./data";

const responsive = {
  superLargeDesktop: { breakpoint: { max: 4000, min: 1200 }, items: 3, partialVisibilityGutter: 8 },
  desktop: { breakpoint: { max: 1200, min: 992 }, items: 3, partialVisibilityGutter: 8 },
  tablet: { breakpoint: { max: 992, min: 768 }, items: 2, partialVisibilityGutter: 6 },
  mobile: { breakpoint: { max: 768, min: 0 }, items: 1, partialVisibilityGutter: 0 },
};

const Trajetorias = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalImage, setModalImage] = useState("");

  const handleOpenModal = (imageUrl) => {
    setModalImage(imageUrl);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalImage("");
  };

  return (
    <div className="trajetorias-wrapper">
      <h1 className="text-center mb-4">Trajetórias Ancestrais</h1>

      <Carousel
        responsive={responsive}
        infinite={true}
        autoPlay={true}
        autoPlaySpeed={3000}
        keyBoardControl={true}
        customTransition="all 0.5s"
        transitionDuration={500}
        removeArrowOnDeviceType={["tablet", "mobile"]}
      >
        {trajetoriasAncestraisCards.map((event, index) => (
          <div
            key={index}
            className="carousel-item-wrapper"
            onClick={() => handleOpenModal(event.background)}
          >
            <Card
              className="cards-trajetorias flex justify-end items-center"
              style={{ backgroundImage: `url(${event.background})` }}
            >
              <h4 className="card-trajetorias-title">{event.event}</h4>
            </Card>
          </div>
        ))}
      </Carousel>

      {/* Modal da Imagem */}
      <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
        <Modal.Body className="p-0">
          <img src={modalImage} alt="Imagem grande" className="w-100" />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Trajetorias;
