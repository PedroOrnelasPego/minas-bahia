import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import "./Parceiros.scss";

import teste1 from "../../../assets/parceiros/alanson.png";
import teste2 from "../../../assets/parceiros/implantar.png";
import teste3 from "../../../assets/parceiros/rede.png";
import { Card } from "react-bootstrap";

const responsive = {
  superLargeDesktop: { breakpoint: { max: 4000, min: 1024 }, items: 4 },
  desktop: { breakpoint: { max: 1024, min: 768 }, items: 3 },
  tablet: { breakpoint: { max: 768, min: 464 }, items: 2 },
  mobile: { breakpoint: { max: 464, min: 0 }, items: 1 },
};

const images = [teste1, teste2, teste3, teste1, teste2, teste3];

const Parceiros = () => {
  return (
    <div
      className="text-center"
      style={{ maxWidth: "90%", margin: "auto", padding: "20px" }}
    >
      <h1 className="">Parceiros</h1>
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
        {images.map((src, index) => (
          <div key={index} className="carousel-item-wrapper">
            <Card className="card-carousel">
              <img
                src={src}
                alt={`Slide ${index}`}
                className="carousel-image"
              />
            </Card>
          </div>
        ))}
      </Carousel>
    </div>
  );
};

export default Parceiros;
