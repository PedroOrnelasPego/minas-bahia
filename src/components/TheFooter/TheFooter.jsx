import { Col, Container, Row } from "react-bootstrap";

const TheFooter = () => {
  return (
    <footer className="bg-secondary text-light py-4">
      <Container>
        <Row className="text-center text-md-start">
          {/* Coluna 1 - Endereço e horários */}
          <Col md={6}>
            <h5>Centro Cultural Salgado Filho</h5>
            <p>
              R. Nova Ponte, 22 – Salgado Filho, Belo Horizonte – MG, 30550-720
            </p>
            <h6>Horários de Treinos</h6>
            <p>
              <strong>Terça e Quinta-feira</strong> <br />
              19h às 20h - Crianças de 6 à 12 anos. <br />
              20h às 21:30h - Adolescentes e adultos.
            </p>
          </Col>

          {/* Coluna 2 - Redes sociais */}
          <Col
            md={6}
            className="d-flex flex-column align-items-center justify-content-center"
          >
            <h6>Nos siga nas redes sociais!</h6>
            <div className="d-flex gap-3">
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-light fs-4"
              >
                <i className="fab fa-instagram"></i>
              </a>
              <a
                href="https://wa.me/seunumerodetelefone"
                target="_blank"
                rel="noopener noreferrer"
                className="text-light fs-4"
              >
                <i className="fab fa-whatsapp"></i>
              </a>
            </div>
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
