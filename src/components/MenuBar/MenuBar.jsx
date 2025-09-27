import { useState } from "react";
import { Container, Nav, Navbar } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { useMsal } from "@azure/msal-react";

import teste from '../../assets/logo/teste-black.png';
import teste2 from '../../assets/logo/logoMbc.png';

const MenuBar = () => {
  const [expanded, setExpanded] = useState(false);
  const handleClose = () => setExpanded(false);

  const { accounts } = useMsal();
  const mestreEmail = "contato@capoeiraminasbahia.com.br"; // Substitua
  const isMestre = accounts[0]?.username === mestreEmail;

  // 🔎 função de estilo para links
  const linkStyle = ({ isActive }) => ({
    color: "#fff",
    textDecoration: isActive ? "underline" : "none",
    textUnderlineOffset: "6px",
    fontWeight: 600,
  });

  return (
    <Navbar
      expand="lg"
      className="py-3"
      style={{ backgroundColor: "#8b0000" }} // fundo vermelho
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
    >
      <Container>
        {/* Logo desktop */}
        <img src={teste} width={150} alt="" />
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
          style={{ color: "#fff" }}
        >
          ICMBC
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="menu-principal" />

        <Navbar.Collapse id="menu-principal">
          <div className="w-100 text-center">
            <h2 className="mb-0 fw-bold text-white">
              Instituto Cultural Minas Bahia de Capoeira
            </h2>
            <p className="mb-2" style={{ color: "#f5f5f5" }}>
              Mestre Costela
            </p>

            <Nav className="d-flex flex-wrap justify-content-center">
              <Nav.Link
                as={NavLink}
                to="/"
                onClick={handleClose}
                style={linkStyle}
              >
                Início
              </Nav.Link>
              <Nav.Link
                as={NavLink}
                to="/minas-bahia-capoeira"
                onClick={handleClose}
                style={linkStyle}
              >
                Capoeira
              </Nav.Link>
              <Nav.Link
                as={NavLink}
                to="/mestre-costela"
                onClick={handleClose}
                style={linkStyle}
              >
                Mestre Costela
              </Nav.Link>
              <Nav.Link
                as={NavLink}
                to="/eventos"
                onClick={handleClose}
                style={linkStyle}
              >
                Eventos
              </Nav.Link>
              <Nav.Link
                as={NavLink}
                to="/uai-minas-bahia"
                onClick={handleClose}
                style={linkStyle}
              >
                UAI! Minas Bahia
              </Nav.Link>
              <Nav.Link
                as={NavLink}
                to="/projetos"
                onClick={handleClose}
                style={linkStyle}
              >
                Projetos
              </Nav.Link>
              <Nav.Link
                as={NavLink}
                to="/area-graduado"
                onClick={handleClose}
                style={linkStyle}
              >
                Área do Graduado
              </Nav.Link>
              {isMestre && (
                <Nav.Link
                  as={NavLink}
                  to="/painel-admin"
                  onClick={handleClose}
                  style={linkStyle}
                >
                  Painel Administrativo
                </Nav.Link>
              )}
            </Nav>
          </div>
        </Navbar.Collapse>
        <img src={teste2} width={130} alt="" />
      </Container>
    </Navbar>
  );
};

export default MenuBar;
