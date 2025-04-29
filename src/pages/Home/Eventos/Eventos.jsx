import { Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import "./Eventos.scss";
import trajetoria from "../../../assets/projetos/trajetorias.png";
import uai from "../../../assets/projetos/uai.jpg";
import logo from "../../../assets/projetos/logoMbc.png";

const Eventos = () => {
  return (
    <div
      className="text-center"
      style={{ maxWidth: "90%", margin: "auto", padding: "20px" }}
    >
      <h1>Eventos e Projetos</h1>
      <div style={{ textAlign: "justify", marginBottom: "48px" }}>
        Os eventos e projetos promovidos pelo ICMBC são parte fundamental do
        nosso compromisso com a valorização da Capoeira e das expressões
        afro-brasileiras. Através de vivências, apresentações, oficinas, rodas e
        cursos, buscamos ampliar o acesso à cultura, à educação e ao
        conhecimento.
      </div>
      <div className="container-cards">
        <Link to="/projetos" className="card-link">
          <Card className="card-projeto">
            <Card.Body className="card-body">
              <img
                className="img-projeto"
                src={trajetoria}
                alt="Trajetórias Ancestrais"
              />
            </Card.Body>
            <Card.Title>Trajetórias Ancestrais</Card.Title>
          </Card>
        </Link>
        <Link to="/uai-minas-bahia" className="card-link">
          <Card className="card-projeto">
            <Card.Body className="card-body">
              <img className="img-projeto" src={uai} alt="UAI Minas Bahia" />
            </Card.Body>
            <Card.Title>UAI Minas Bahia</Card.Title>
          </Card>
        </Link>
        <Link to="/minas-bahia-capoeira" className="card-link">
          <Card className="card-projeto">
            <Card.Body className="card-body">
              <img
                style={{ maxWidth: "160px" }}
                src={logo}
                alt="Capoeira Minas Bahia"
              />
            </Card.Body>
            <Card.Title>Capoeira Minas Bahia</Card.Title>
          </Card>
        </Link>
        {/* <Link to="#troca-de-cordas" className="card-link">
          <Card className="card-projeto">
            <Card.Body className="card-body">
              <img className="img-projeto" src={uai} alt="Troca de Cordas" />
            </Card.Body>
            <Card.Title>Troca de Cordas</Card.Title>
          </Card>
        </Link>
        <Link to="#exemplo" className="card-link">
          <Card className="card-projeto">
            <Card.Body className="card-body">
              <img className="img-projeto" src={trajetoria} alt="Exemplo" />
            </Card.Body>
            <Card.Title>Exemplo</Card.Title>
          </Card>
        </Link> */}
      </div>
    </div>
  );
};

export default Eventos;
