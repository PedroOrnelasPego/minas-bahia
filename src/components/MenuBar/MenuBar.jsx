import { Container, Nav, Navbar } from "react-bootstrap";
import "./MenuBar.scss";
import logo from "../../assets/logo/logo-icmbc.png"; // Substitua pelo caminho correto da logo

const MenuBar = () => {
  return (
    <Navbar expand="lg" className="bg-light py-3">
      <Container className="d-flex align-items-center">
        {/* Logo fixa na esquerda */}
        <Navbar.Brand href="#home" className="me-3">
          <img
            src={logo}
            alt="Logo"
            height="150" // Ajuste conforme necessário
            className="d-inline-block align-top"
          />
        </Navbar.Brand>

        {/* Div central para o título e os links */}
        <div className="flex-grow-1 text-center">
          {/* Título e subtítulo centralizados */}
          <h2 className="mb-0 fw-bold">Minas Bahia</h2>
          <p className="mb-2 text-muted">Mestre Costela</p>

          {/* Links da navbar centralizados abaixo do texto */}
          <Nav className="d-flex flex-wrap justify-content-center">
            <Nav.Link href="#inicio" className="fw-bold mx-2">Início</Nav.Link>
            <Nav.Link href="#graduacao" className="fw-bold mx-2">Graduação</Nav.Link>
            <Nav.Link href="#mestre-costela" className="fw-bold mx-2">Mestre Costela</Nav.Link>
            <Nav.Link href="#onde-estamos" className="fw-bold mx-2">Onde Estamos</Nav.Link>
            <Nav.Link href="#evento-uai" className="fw-bold mx-2">Evento UAI Minas Bahia</Nav.Link>
            <Nav.Link href="#contato" className="fw-bold mx-2">Contato</Nav.Link>
          </Nav>
        </div>
      </Container>
    </Navbar>
  );
};

export default MenuBar;
