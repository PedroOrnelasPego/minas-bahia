import { Col, Container, Row } from "react-bootstrap";
import "./TheFooter.scss";

const TheFooter = () => {
  return (
    <footer className="footer-background text-light pt-4">
      <Container>
        {/* 3 colunas no md+: Unidade principal | Unidade E.M. | Redes sociais */}
        <Row className="text-center text-md-start g-4">
          {/* Coluna 1 - Endereço e horários (Salgado Filho) */}
          <Col md={4}>
            <h5>Centro Cultural Salgado Filho</h5>
            <p className="mb-2">
              R. Nova Ponte, 22 – Salgado Filho, Belo Horizonte – MG, 30550-720
            </p>
            <h6 className="mb-1">Horários de Treinos</h6>
            <p className="mb-0">
              <strong>Terça e Quinta-feira</strong> <br />
              19h às 20h — Crianças (6 a 12 anos) <br />
              20h às 21h30 — Adolescentes e adultos
            </p>
          </Col>

          {/* Coluna 3 - Redes sociais */}
          <Col
            md={4}
            className="d-flex flex-column align-items-center justify-content-center"
          >
            <h6 className="mb-2">Nos siga nas redes sociais!</h6>
            <div className="d-flex gap-3 items-center justify-center">
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-light fs-4"
                aria-label="Instagram"
              >
                <i className="fab fa-instagram" />
              </a>
              <a
                href="https://wa.me/seunumerodetelefone"
                target="_blank"
                rel="noopener noreferrer"
                className="text-light fs-4"
                aria-label="WhatsApp"
              >
                <i className="fab fa-whatsapp" />
              </a>
            </div>
          </Col>

          {/* Coluna 2 - Nova unidade (lado direito) */}
          <Col md={4}>
            <h5>E.M. Professora Efigênia Vidigal</h5>
            <p className="mb-2">
              {" "}
              R. José Gualberto, 295 - Palmeiras, Belo Horizonte - MG, 30575-780
            </p>
            <h6 className="mb-1">Horários de Treinos</h6>
            <p className="mb-0">
              <strong>Segunda e Quarta-feira</strong> <br />
              18h30 às 19h30 — Adolescentes e adultos
            </p>
          </Col>
        </Row>

        {/* Linha com versão bem apagada */}
        <Row className="mt-3">
          <Col className="text-center">
            <small className="text-muted">v{__APP_VERSION__}</small>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default TheFooter;
