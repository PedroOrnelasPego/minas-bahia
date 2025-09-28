// src/components/MenuBar/MenuBar.jsx
import { useState } from "react";
import { Container, Nav, Navbar } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { useMsal } from "@azure/msal-react";

import teste from "../../assets/logo/teste-black.png"; // logo esquerda / mobile (selo)
import teste2 from "../../assets/logo/logoMbc.png";    // logo direita (desktop)

const MenuBar = () => {
  const [expanded, setExpanded] = useState(false);
  const handleClose = () => setExpanded(false);

  const { accounts } = useMsal();
  const mestreEmail = "contato@capoeiraminasbahia.com.br";
  const isMestre = accounts[0]?.username === mestreEmail;

  // estilo base dos links como "botões"
  const linkStyle = ({ isActive }) => ({
    color: "#8b0000",
    border: "2px solid #8b0000",
    borderRadius: "12px",
    padding: "6px 12px",
    margin: "4px",
    textDecoration: "none",
    fontWeight: 600,
    backgroundColor: "#f9f9f9",
    transition: "all 0.2s ease-in-out",
    ...(isActive && {
      backgroundColor: "#8b0000",
      color: "#ffffff",
    }),
  });

  return (
    <Navbar
      expand="lg"
      className="py-3"
      style={{
        backgroundColor: "#f9f9f9",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      }}
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      aria-label="Barra de navegação principal"
    >
      <Container className="align-items-stretch">
        {/* ====== MOBILE (<= lg) ====== */}
        <div className="d-lg-none w-100">
          {/* selo centralizado com slot fixo (~300px) */}
          <div className="w-100 d-flex justify-content-center">
            <div
              className="logo-slot"
              style={{ width: 300, height: 110 }} // ~300px mantendo proporção
            >
              <img
                src={teste}
                width={300}
                height={110}
                alt="ICMBC - logotipo"
                fetchpriority="high"
                decoding="async"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>
          </div>

          {/* botão hamburguer à direita */}
          <div className="d-flex justify-content-end mt-2">
            <Navbar.Toggle aria-controls="menu-principal" />
          </div>

          {/* menu colapsável abaixo da logo */}
          <Navbar.Collapse id="menu-principal" className="mt-2">
            <Nav className="d-flex flex-wrap justify-content-center">
              {[
                { to: "/", label: "Início" },
                { to: "/minas-bahia-capoeira", label: "Capoeira" },
                { to: "/mestre-costela", label: "Mestre Costela" },
                { to: "/eventos", label: "Eventos" },
                { to: "/uai-minas-bahia", label: "UAI! Minas Bahia" },
                { to: "/projetos", label: "Projetos" },
                { to: "/area-graduado", label: "Área do Graduado" },
                ...(isMestre
                  ? [{ to: "/painel-admin", label: "Painel Administrativo" }]
                  : []),
              ].map((item) => (
                <Nav.Link
                  key={item.to}
                  as={NavLink}
                  to={item.to}
                  onClick={handleClose}
                  style={linkStyle}
                  className="custom-link"
                >
                  {item.label}
                </Nav.Link>
              ))}
            </Nav>
          </Navbar.Collapse>
        </div>

        {/* ====== DESKTOP (>= lg) ====== */}
        <div className="d-none d-lg-flex w-100 align-items-center">
          {/* logo esquerda (mantida como estava) */}
          <img
            src={teste}
            width={150}
            height={55}
            alt="ICMBC - logotipo esquerdo"
            fetchpriority="high"
            decoding="async"
            style={{ display: "block" }}
          />

          {/* centro com título/subtítulo e menu */}
          <div className="flex-grow-1 text-center">
            <h2 className="mb-0 fw-bold text-dark">
              Instituto Cultural Minas Bahia de Capoeira
            </h2>
            <p className="mb-2 text-dark">Mestre Costela</p>

            <Nav className="d-flex flex-wrap justify-content-center">
              {[
                { to: "/", label: "Início" },
                { to: "/minas-bahia-capoeira", label: "Capoeira" },
                { to: "/mestre-costela", label: "Mestre Costela" },
                { to: "/eventos", label: "Eventos" },
                { to: "/uai-minas-bahia", label: "UAI! Minas Bahia" },
                { to: "/projetos", label: "Projetos" },
                { to: "/area-graduado", label: "Área do Graduado" },
                ...(isMestre
                  ? [{ to: "/painel-admin", label: "Painel Administrativo" }]
                  : []),
              ].map((item) => (
                <Nav.Link
                  key={item.to}
                  as={NavLink}
                  to={item.to}
                  onClick={handleClose}
                  style={linkStyle}
                  className="custom-link"
                >
                  {item.label}
                </Nav.Link>
              ))}
            </Nav>
          </div>

          {/* logo direita (mantida como estava) */}
          <img
            src={teste2}
            width={130}
            height={60}
            alt="Logotipo direito"
            decoding="async"
            style={{ display: "block" }}
          />
        </div>
      </Container>

      {/* estilos locais para hover e micro-ajustes mobile */}
      <style>
        {`
          .custom-link:hover {
            background-color: #a00000 !important;
            color: #ffffff !important;
          }

          /* baseline fix: evita salto por baseline de inline elements */
          img { display: block; }

          @media (max-width: 991.98px) {
            .custom-link {
              padding: 8px 14px !important;
              margin: 6px !important;
            }
          }
        `}
      </style>
    </Navbar>
  );
};

export default MenuBar;
