// src/components/Parceiros/Parceiros.jsx
import { useState } from "react";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import "./Parceiros.scss";

import { Card, Modal } from "react-bootstrap";

import teste1 from "../../../assets/parceiros/alanson.png";
import teste2 from "../../../assets/parceiros/implantar.png";
import teste3 from "../../../assets/parceiros/rede.png";
import teste4 from "../../../assets/parceiros/mineires.png";
import teste5 from "../../../assets/parceiros/sabor-e-saude.png";

import ponto from "../../../assets/certificado/certificado-ponto.png";

const responsive = {
  superLargeDesktop: { breakpoint: { max: 4000, min: 1200 }, items: 5 },
  desktop: { breakpoint: { max: 1200, min: 992 }, items: 3 },
  tablet: { breakpoint: { max: 992, min: 576 }, items: 2 },
  mobile: { breakpoint: { max: 576, min: 0 }, items: 1 },
};

// defina o slot que você quer reservar para todas as logos (consistente = sem reflow)
const SLOT_W = 200;
const SLOT_H = 120;

const images = [
  teste1,
  teste2,
  teste3,
  teste4,
  teste5,
  teste1,
  teste2,
  teste3,
  teste4,
  teste5,
];

const Parceiros = () => {
  const [showCertificadoModal, setShowCertificadoModal] = useState(false);

  return (
    <div
      className="text-center parceiros-wrap"
      style={{ maxWidth: "90%", margin: "auto", padding: "20px" }}
    >
      <div className="mb-4">
        <h1 className="fw-bold">Parceiros</h1>
      </div>

      <Carousel
        responsive={responsive}
        infinite
        autoPlay
        autoPlaySpeed={3000}
        keyBoardControl
        customTransition="transform 0.5s ease" // só transforma (não afeta layout)
        transitionDuration={500}
        removeArrowOnDeviceType={["tablet", "mobile"]}
        itemClass="partner-item"
        containerClass="carousel-container"
        aria-label="Carrossel de parceiros do ICMBC"
        pauseOnHover
        shouldResetAutoplay
        renderDotsOutside={false}
        focusOnSelect={false}
      >
        {images.map((src, i) => {
          // itens imediatamente visíveis: carregamento eager para evitar atraso de pintura
          const isLikelyAboveTheFold = i < 4; // cobre desktop (4) e sobra para tablets
          return (
            <div key={i} className="carousel-item-wrapper">
              <Card
                className="card-carousel"
                role="group"
                aria-roledescription="slide"
              >
                {/* SLOT FIXO: reserva espaço antes da imagem chegar */}
                <div
                  className="logo-slot"
                  style={{
                    width: SLOT_W,
                    height: SLOT_H,
                    aspectRatio: `${SLOT_W} / ${SLOT_H}`,
                  }}
                >
                  <img
                    src={src}
                    alt={`Parceiro ${i + 1}`}
                    className="carousel-image"
                    width={SLOT_W}
                    height={SLOT_H}
                    decoding="async"
                    loading={isLikelyAboveTheFold ? "eager" : "lazy"}
                    fetchPriority={isLikelyAboveTheFold ? "high" : undefined}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </div>
              </Card>
            </div>
          );
        })}
      </Carousel>

      <div className="mt-5 d-flex flex-column align-items-center">
        <div className="mb-3">
          <h2 className="fw-bold">Certificados</h2>
        </div>

        {/* Container do Certificado com hover zoom e clique */}
        <div
          className="certificado-preview-container position-relative d-inline-block rounded shadow-sm overflow-hidden"
          style={{ cursor: "zoom-in", maxWidth: "520px", width: "100%" }}
          onClick={() => setShowCertificadoModal(true)}
          title="Clique para ampliar e ler o certificado"
        >
          <img
            src={ponto}
            className="img-fluid rounded certificado-img"
            alt="Certificado Ponto de Cultura"
            style={{ width: "100%", height: "auto", transition: "transform 0.3s ease" }}
          />
        </div>

        {/* Mensagem discreta avisando que a imagem pode ser ampliada */}
        <small className="text-muted mt-2 d-flex align-items-center gap-1" style={{ fontSize: "0.82rem" }}>
          <span>🔍</span>
          <span>Clique na imagem para ampliar e ler o certificado</span>
        </small>
      </div>

      {/* Modal de Zoom do Certificado */}
      <Modal
        show={showCertificadoModal}
        onHide={() => setShowCertificadoModal(false)}
        size="xl"
        centered
        scrollable
      >
        <Modal.Header closeButton variant="white" className="bg-dark text-white border-0 py-2 px-3">
          <Modal.Title className="fs-6 fw-semibold text-white">
            Certificado Ponto de Cultura - ICMBC
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-2 p-sm-4 bg-dark d-flex align-items-center justify-content-center">
          <img
            src={ponto}
            alt="Certificado Ponto de Cultura Ampliado"
            className="img-fluid rounded shadow"
            style={{ maxHeight: "85vh", width: "auto", objectFit: "contain" }}
          />
        </Modal.Body>
      </Modal>

      {/* CSS local para o hover do certificado */}
      <style>
        {`
          .certificado-preview-container:hover .certificado-img {
            transform: scale(1.02);
          }
          .certificado-preview-container:hover {
            box-shadow: 0 8px 25px rgba(0,0,0,0.18) !important;
          }
        `}
      </style>
    </div>
  );
};

export default Parceiros;
