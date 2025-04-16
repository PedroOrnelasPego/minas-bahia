import { Container, Nav, Navbar } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import "./MenuBar.scss";

const MenuBar = () => {
  return (
    <Navbar expand="lg" className="bg-light py-3">
      <Container className="d-flex align-items-center">
        {/* Logo fixa à esquerda; altere ou adicione imagem se necessário */}
        <Navbar.Brand as={NavLink} to="/" className="me-3">
          {/* Exemplo: <img src="logo.png" alt="Logo" height="40" /> */}
        </Navbar.Brand>

        <div className="flex-grow-1 text-center">
          {/* Título e subtítulo centralizados */}
          <h2 className="mb-0 fw-bold">
            Instituto Cultutal Minas Bahia de Capoeira
          </h2>
          <p className="mb-2 text-muted">Mestre Costela</p>

          {/* Links da navbar */}
          <Nav className="d-flex flex-wrap justify-content-center">
            <Nav.Link as={NavLink} to="/" className="fw-bold mx-2">
              Início
            </Nav.Link>
            <Nav.Link
              as={NavLink}
              to="/minas-bahia-capoeira"
              className="fw-bold mx-2"
            >
              Capoeira
            </Nav.Link>
            <Nav.Link
              as={NavLink}
              to="/mestre-costela"
              className="fw-bold mx-2"
            >
              Mestre Costela
            </Nav.Link>
            <Nav.Link as={NavLink} to="/eventos" className="fw-bold mx-2">
              Eventos
            </Nav.Link>
            <Nav.Link
              as={NavLink}
              to="/uai-minas-bahia"
              className="fw-bold mx-2"
            >
              UAI! Minas Bahia
            </Nav.Link>
            <Nav.Link
              as={NavLink}
              to="/trajetorias-ancestrais"
              className="fw-bold mx-2"
            >
              Trajetórias Ancestrais
            </Nav.Link>
          </Nav>
        </div>
      </Container>
    </Navbar>
  );
};

export default MenuBar;
