import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import "./Parceiros.scss";

import { Card } from "react-bootstrap";

import teste1 from "../../../assets/parceiros/alanson.avif";
import teste2 from "../../../assets/parceiros/implantar.avif";
import teste3 from "../../../assets/parceiros/rede.avif";
import teste4 from "../../../assets/parceiros/mineires.avif";

const responsive = {
  superLargeDesktop: { breakpoint: { max: 4000, min: 1200 }, items: 4 },
  desktop: { breakpoint: { max: 1200, min: 992 }, items: 3 },
  tablet: { breakpoint: { max: 992, min: 576 }, items: 2 },
  mobile: { breakpoint: { max: 576, min: 0 }, items: 1 },
};

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
        customTransition="all 0.5s"
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
        {images.map((src, i) => (
          <div key={i} className="carousel-item-wrapper">
            <Card
              className="card-carousel"
              role="group"
              aria-roledescription="slide"
            >
              <img
                src={src}
                alt={`Parceiro ${i + 1}`}
                className="carousel-image"
                width={200} // reserva espaço p/ evitar CLS
                height={120}
                loading="lazy"
                decoding="async"
              />
            </Card>
          </div>
        ))}
      </Carousel>
    </div>
  );
};

export default Parceiros;
