// src/components/Parceiros/Parceiros.jsx
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import "./Parceiros.scss";

import { Card } from "react-bootstrap";

import teste1 from "../../../assets/parceiros/alanson.png";
import teste2 from "../../../assets/parceiros/implantar.png";
import teste3 from "../../../assets/parceiros/rede.png";
import teste4 from "../../../assets/parceiros/mineires.png";

const responsive = {
  superLargeDesktop: { breakpoint: { max: 4000, min: 1200 }, items: 4 },
  desktop: { breakpoint: { max: 1200, min: 992 }, items: 3 },
  tablet: { breakpoint: { max: 992, min: 576 }, items: 2 },
  mobile: { breakpoint: { max: 576, min: 0 }, items: 1 },
};

// defina o slot que você quer reservar para todas as logos (consistente = sem reflow)
const SLOT_W = 200;
const SLOT_H = 120;

const images = [teste1, teste2, teste3, teste4, teste1, teste2, teste3, teste4];

const Parceiros = () => {
  return (
    <div
      className="text-center parceiros-wrap"
      style={{ maxWidth: "90%", margin: "auto", padding: "20px" }}
    >
      <h1 className="mb-3">Parceiros</h1>

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
                    fetchpriority={isLikelyAboveTheFold ? "high" : undefined}
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
    </div>
  );
};

export default Parceiros;
