import { Card, Container } from "react-bootstrap";
import "./Eventos.scss";
import eventsData from "./eventsData";
import { Link } from "react-router-dom";

const Eventos = () => {
  return (
    <Container>
      <h1 className="text-center mb-4">Eventos</h1>
      <div className="my-18">
        <div className="mb-4">
          <h1 className="mb-2 text-decoration-none">UAI! Minas Bahia</h1>
        </div>
        <div className="flex gap-4 flex-wrap justify-center">
          {eventsData.map((event, index) => (
            <Link to={`/eventos/${event.link}`} key={index}>
              <Card
                className="cards-eventos flex justify-end items-center"
                style={{ backgroundImage: `url(${event.background})` }}
              >
                <h4 className="card-eventos-title">{event.event}</h4>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-18">
        <div className="mb-4">
          <h1>Troca de Cordas</h1>
        </div>
        <div className="flex gap-4 flex-wrap justify-center">
          {eventsData.map((event, index) => (
            <Card
              key={index}
              className="cards-eventos flex justify-end items-center"
              style={{ backgroundImage: `url(${event.background})` }}
            >
              <h4 className="card-eventos-title">{event.event}</h4>
            </Card>
          ))}
        </div>
      </div>

      <div className="mb-18">
        <div className="mb-4">
          <h1>Arraiá Minas Bahias</h1>
        </div>
        <div className="flex gap-4 flex-wrap justify-center">
          {eventsData.map((event, index) => (
            <Card
              key={index}
              className="cards-eventos flex justify-end items-center"
              style={{ backgroundImage: `url(${event.background})` }}
            >
              <h4 className="card-eventos-title">{event.event}</h4>
            </Card>
          ))}
        </div>
      </div>
    </Container>
  );
};

export default Eventos;
