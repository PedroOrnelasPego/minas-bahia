// src/components/TheFooter/TheFooter.jsx
import { Col, Container, Row } from "react-bootstrap";
import "./TheFooter.scss";

const TheFooter = () => {
  return (
    <footer className="footer-background text-light pt-4" role="contentinfo">
      <Container>
        {/* 3 colunas no md+: Unidade principal | Redes sociais | Unidade E.M. */}
        <Row className="text-center text-md-start g-4">
          {/* Coluna 1 - Endereço e horários (Salgado Filho) */}
          <Col as="section" md={4} aria-labelledby="footer-salgado">
            <h2 id="footer-salgado" className="h5">
              Centro Cultural Salgado Filho
            </h2>
            <p className="mb-2">
              R. Nova Ponte, 22 – Salgado Filho, Belo Horizonte – MG, 30550-720
            </p>
            <h3 className="h6 mb-1">Horários de Treinos</h3>
            <p className="mb-0">
              <strong>Terça e Quinta-feira</strong> <br />
              19h às 20h — Crianças (6 a 12 anos) <br />
              20h às 21h30 — Adolescentes e adultos
            </p>
          </Col>

          {/* Coluna 2 - Redes sociais */}
          <Col
            as="section"
            md={4}
            className="d-flex flex-column align-items-center justify-content-center"
            aria-labelledby="footer-redes"
          >
            <h2 id="footer-redes" className="h6 mb-2">
              Nos siga nas redes sociais!
            </h2>
            <div className="d-flex gap-3 align-items-center justify-content-center">
              <a
                href="https://www.instagram.com/capoeira_minas_bahia/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-light fs-4"
                aria-label="Instagram do ICMBC (abre em nova aba)"
              >
                <i className="fab fa-instagram" aria-hidden="true" />
              </a>
              <a
                href="https://wa.me/5531999371235"
                target="_blank"
                rel="noopener noreferrer"
                className="text-light fs-4"
                aria-label="WhatsApp do ICMBC (abre em nova aba)"
              >
                <i className="fab fa-whatsapp" aria-hidden="true" />
              </a>
              <a
                href="https://www.youtube.com/@icmbc_mg"
                target="_blank"
                rel="noopener noreferrer"
                className="text-light fs-4"
                aria-label="Canal do YouTube do ICMBC (abre em nova aba)"
              >
                <i className="fab fa-youtube" aria-hidden="true" />
              </a>
            </div>
          </Col>

          {/* Coluna 3 - Nova unidade */}
          <Col as="section" md={4} aria-labelledby="footer-efigenia">
            <h2 id="footer-efigenia" className="h5">
              E.M. Professora Efigênia Vidigal
            </h2>
            <p className="mb-2">
              R. José Gualberto, 295 - Palmeiras, Belo Horizonte - MG, 30575-780
            </p>
            <h3 className="h6 mb-1">Horários de Treinos</h3>
            <p className="mb-0">
              <strong>Segunda e Quarta-feira</strong> <br />
              18h30 às 19h30 — Adolescentes e adultos
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default TheFooter;
