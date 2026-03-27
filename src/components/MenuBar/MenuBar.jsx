// src/components/MenuBar/MenuBar.jsx
import { useState, useEffect } from "react";
import { Container, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { isAuthenticated, getAuthEmail } from "../../auth/session";
import { getPerfilCache } from "../../utils/profileCache";
import { nivelMap } from "../../utils/roles";

import teste from "../../assets/logo/teste-black.png"; // logo esquerda / mobile (selo)
import teste2 from "../../assets/logo/logoMbc.png"; // logo direita (desktop)

const MenuBar = () => {
  const [expanded, setExpanded] = useState(false);
  const handleClose = () => setExpanded(false);

  // Gatilho para recarregar perfil de forma inteligente ao montar/trocar a conta sem peso (reage via DOM event)
  const [cacheVersion, setCacheVersion] = useState(0);

  useEffect(() => {
    const handleProfileUpdate = () => setCacheVersion((v) => v + 1);
    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => window.removeEventListener("profileUpdated", handleProfileUpdate);
  }, []);

  const { accounts } = useMsal();
  const mestreEmail = "contato@capoeiraminasbahia.com.br";
  const email = getAuthEmail();
  const isMestre = accounts[0]?.username === mestreEmail || email === mestreEmail;

  // Verifica o nível de acesso baseado no cache local do perfil salvo usando cacheVersion de dependência reativa
  const cachedProfile = getPerfilCache(email);
  const nivelUsuario = cachedProfile ? (nivelMap[cachedProfile.nivelAcesso] ?? 0) : 0;
  const isAlunoOrHigher = nivelUsuario >= 1 || isMestre;

  // Permissões do Acervo integradas com o Painel Admin (leitor, curador, editor)
  const permissaoAcervo = cachedProfile?.permissaoAcervo || "leitor";
  const podeGerirAcervo = isMestre || permissaoAcervo === "editor" || permissaoAcervo === "curador";

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

  const renderNavLinks = () => {
    const defaultItems = [
      { to: "/", label: "Início" },
      { to: "/minas-bahia-capoeira", label: "Capoeira" },
      { to: "/mestre-costela", label: "Mestre Costela" },
      { to: "/eventos", label: "Eventos" },
      { to: "/uai-minas-bahia", label: "UAI! Minas Bahia" },
      { to: "/projetos", label: "Projetos" },
    ];

    return (
      <>
        {defaultItems.map((item) => (
          <Nav.Link key={item.to} as={NavLink} to={item.to} onClick={handleClose} style={linkStyle} className="custom-link">
            {item.label}
          </Nav.Link>
        ))}

        {isAuthenticated() && isAlunoOrHigher && (
          podeGerirAcervo ? (
            <NavDropdown title="Acervo" id="nav-dropdown-acervo" className="custom-dropdown">
              <NavDropdown.Item as={NavLink} to="/acervo" onClick={handleClose} className="fw-bold text-dark">Explorar Acervo</NavDropdown.Item>
              <NavDropdown.Item as={NavLink} to="/gestao-acervo" onClick={handleClose} className="fw-bold text-dark">Gestão do Acervo</NavDropdown.Item>
            </NavDropdown>
          ) : (
            <Nav.Link as={NavLink} to="/acervo" onClick={handleClose} style={linkStyle} className="custom-link">
              Acervo
            </Nav.Link>
          )
        )}

        {isMestre ? (
          <NavDropdown title="Acessos" id="nav-dropdown-admin" className="custom-dropdown">
            <NavDropdown.Item as={NavLink} to="/acesso-interno" onClick={handleClose} className="fw-bold text-dark">Acesso Interno</NavDropdown.Item>
            <NavDropdown.Item as={NavLink} to="/painel-admin" onClick={handleClose} className="fw-bold text-dark">Painel Admin</NavDropdown.Item>
          </NavDropdown>
        ) : (
          <Nav.Link as={NavLink} to={isAuthenticated() ? "/acesso-interno" : "/acesso-interno/login"} onClick={handleClose} style={linkStyle} className="custom-link">
            Acesso Interno
          </Nav.Link>
        )}
      </>
    );
  };

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
                fetchPriority="high"
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
              {renderNavLinks()}
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
            fetchPriority="high"
            decoding="async"
            style={{ display: "block" }}
          />

          {/* centro com título/subtítulo e menu */}
          <div className="flex-grow-1 text-center">
            <h2 className="mb-0 fw-bold text-dark">
              Instituto Cultural Minas Bahia de Capoeira
            </h2>
            <p className="mb-2 text-dark">Mestre Costela</p>

            <Nav className="d-flex flex-wrap justify-content-center mt-2">
              {renderNavLinks()}
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

          .custom-dropdown > .nav-link {
            color: #8b0000 !important;
            border: 2px solid #8b0000 !important;
            border-radius: 12px !important;
            padding: 6px 12px !important;
            margin: 4px !important;
            text-decoration: none !important;
            font-weight: 600 !important;
            background-color: #f9f9f9 !important;
            transition: all 0.2s ease-in-out !important;
            display: inline-flex;
            align-items: center;
          }

          .custom-dropdown > .nav-link:hover, .custom-dropdown > .nav-link:focus, .custom-dropdown.show > .nav-link {
            background-color: #8b0000 !important;
            color: #ffffff !important;
          }

          .custom-dropdown .dropdown-menu {
            border-radius: 12px;
            border: 2px solid #8b0000;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            padding: 0.5rem;
          }
          
          .custom-dropdown .dropdown-item {
            border-radius: 8px;
            padding: 8px 16px;
            transition: all 0.2s ease-in-out;
          }
          .custom-dropdown .dropdown-item:hover {
            background-color: rgba(139,0,0,0.05);
            color: #8b0000 !important;
          }
          .custom-dropdown .dropdown-item.active,
          .custom-dropdown .dropdown-item:active {
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
