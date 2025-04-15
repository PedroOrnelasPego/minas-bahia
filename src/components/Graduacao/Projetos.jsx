import { Card } from "react-bootstrap";
import "./Projetos.scss";
import trajetoria from "../../assets/projetos/trajetorias.png";
import uai from "../../assets/projetos/uai.jpg";
import logo from "../../assets/projetos/logo-icmbc.png";

const Projetos = () => {
  return (
    <div
      className="text-center"
      style={{ maxWidth: "90%", margin: "auto", padding: "20px" }}
    >
      <h1 className="">Projetos</h1>
      <div style={{ textAlign: "justify", marginBottom: "48px" }}>
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Officia autem
        quos animi esse saepe, nesciunt, illum assumenda, sequi quis excepturi
        necessitatibus iste repellat natus? Doloribus architecto est molestias
        veritatis illo.
      </div>
      <div className="container-cards">
        <Card className="card-projeto">
          <Card.Body>
            <img className="img-projeto" src={trajetoria} alt="" />
          </Card.Body>
          <Card.Title>Trajetórias Ancestrais</Card.Title>
        </Card>
        <Card className="card-projeto">
          <Card.Body>
            <img className="img-projeto" src={uai} alt="" />
          </Card.Body>
          <Card.Title>UAI Minas Bahia</Card.Title>
        </Card>
        <Card className="card-projeto">
          <Card.Body>
            <img className="img-projeto" src={logo} alt="" />
          </Card.Body>
          <Card.Title>Capoeira Minas Bahia</Card.Title>
        </Card>
        <Card className="card-projeto">
          <Card.Body>
            <img className="img-projeto" src={logo} alt="" />
          </Card.Body>
          <Card.Title>Troca de Cordas</Card.Title>
        </Card>
        <Card className="card-projeto">
          <Card.Body>
            
          </Card.Body>
          <Card.Title>Exemplo</Card.Title>
        </Card>
      </div>
    </div>
  );
};

export default Projetos;
