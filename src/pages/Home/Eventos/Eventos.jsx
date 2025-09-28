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
        {/* Card 1 */}
        <Link to="/projetos" className="card-link">
          <Card className="card-projeto">
            <Card.Body className="card-body">
              <img
                className="img-projeto"
                src={trajetoria}
                alt="Trajetórias Ancestrais"
                width={180}
                height={170}
                loading="lazy"
                decoding="async"
              />
            </Card.Body>
            <Card.Title>Trajetórias Ancestrais</Card.Title>
          </Card>
        </Link>

        {/* Card 2 */}
        <Link to="/uai-minas-bahia" className="card-link">
          <Card className="card-projeto">
            <Card.Body className="card-body">
              <img
                className="img-projeto"
                src={uai}
                alt="UAI Minas Bahia"
                width={180}
                height={96}
                loading="lazy"
                decoding="async"
              />
            </Card.Body>
            <Card.Title>UAI Minas Bahia</Card.Title>
          </Card>
        </Link>

        {/* Card 3 */}
        <Link to="/minas-bahia-capoeira" className="card-link">
          <Card className="card-projeto">
            <Card.Body className="card-body">
              <img
                className="img-projeto"
                src={logo}
                alt="Capoeira Minas Bahia"
                width={160}
                height={150}
                loading="lazy"
                decoding="async"
              />
            </Card.Body>
            <Card.Title>Capoeira Minas Bahia</Card.Title>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default Eventos;
