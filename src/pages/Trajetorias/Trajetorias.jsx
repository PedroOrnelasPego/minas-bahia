import { Card } from "react-bootstrap";
import "./Trajetorias.scss";
import trajetoriasAncestraisCards from "./data";

const Trajetorias = () => {
  return (
    <div>
      <h1 className="text-center mb-4">Trajetórias Ancestrais</h1>
      <div className="mb-18">
        <div className="mb-4"></div>
        <div className="flex gap-4 flex-wrap justify-center">
          {trajetoriasAncestraisCards.map((event, index) => (
            <Card
              key={index}
              className="cards-trajetorias flex justify-end items-center"
              style={{ backgroundImage: `url(${event.background})` }}
            >
              <h4 className="card-trajetorias-title">{event.event}</h4>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Trajetorias;
