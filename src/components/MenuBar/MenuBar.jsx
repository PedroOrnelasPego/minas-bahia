import { useState } from "react";
import { Container, Nav, Navbar } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import "./MenuBar.scss";

const MenuBar = () => {
  const [expanded, setExpanded] = useState(false);

  const handleClose = () => setExpanded(false);

  return (
    <Navbar
      expand="lg"
      className="bg-light py-3"
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
    >
      <Container>
        {/* Logo desktop */}
        <Navbar.Brand
          as={NavLink}
          to="/"
          className="me-3 d-none d-lg-block"
          onClick={handleClose}
        >
          {/* <img src="logo.png" alt="Logo" height="40" /> */}
        </Navbar.Brand>

        {/* Sigla ICMBC visível apenas em mobile */}
        <Navbar.Brand
          as={NavLink}
          to="/"
          className="fw-bold d-block d-lg-none"
          onClick={handleClose}
        >
          ICMBC
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="menu-principal" />

        <Navbar.Collapse id="menu-principal">
          <div className="w-100 text-center">
            <h2 className="mb-0 fw-bold">
              Instituto Cultutal Minas Bahia de Capoeira
            </h2>
            <p className="mb-2 text-muted">Mestre Costela</p>

            <Nav className="d-flex flex-wrap justify-content-center">
              <Nav.Link
                as={NavLink}
                to="/"
                className="fw-bold mx-2"
                onClick={handleClose}
              >
                Início
              </Nav.Link>
              <Nav.Link
                as={NavLink}
                to="/minas-bahia-capoeira"
                className="fw-bold mx-2"
                onClick={handleClose}
              >
                Capoeira
              </Nav.Link>
              <Nav.Link
                as={NavLink}
                to="/mestre-costela"
                className="fw-bold mx-2"
                onClick={handleClose}
              >
                Mestre Costela
              </Nav.Link>
              <Nav.Link
                as={NavLink}
                to="/eventos"
                className="fw-bold mx-2"
                onClick={handleClose}
              >
                Eventos
              </Nav.Link>
              <Nav.Link
                as={NavLink}
                to="/uai-minas-bahia"
                className="fw-bold mx-2"
                onClick={handleClose}
              >
                UAI! Minas Bahia
              </Nav.Link>
              <Nav.Link
                as={NavLink}
                to="/projetos"
                className="fw-bold mx-2"
                onClick={handleClose}
              >
                Projetos
              </Nav.Link>
              <Nav.Link
                as={NavLink}
                to="/area-graduado"
                className="fw-bold mx-2"
                onClick={handleClose}
              >
                Área do Graduado
              </Nav.Link>
            </Nav>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default MenuBar;
