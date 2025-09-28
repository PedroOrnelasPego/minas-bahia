// src/components/Eventos/Eventos.jsx
import { Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import "./Eventos.scss";

import trajetoria from "../../../assets/projetos/trajetorias.png";
import uai from "../../../assets/projetos/uai.jpg";
import logo from "../../../assets/projetos/logoMbc.png";

const cards = [
  {
    to: "/projetos",
    src: trajetoria,
    alt: "Trajetórias Ancestrais",
    // reservamos um slot 180x170 (5:4,94)
    w: 180,
    h: 170,
    title: "Trajetórias Ancestrais",
  },
  {
    to: "/uai-minas-bahia",
    src: uai,
    alt: "UAI Minas Bahia",
    // reservamos um slot 180x96 (15:8)
    w: 180,
    h: 96,
    title: "UAI Minas Bahia",
  },
  {
    to: "/minas-bahia-capoeira",
    src: logo,
    alt: "Capoeira Minas Bahia",
    // reservamos um slot 160x150
    w: 160,
    h: 150,
    title: "Capoeira Minas Bahia",
  },
];

const Eventos = () => {
  return (
    <div
      className="text-center eventos-wrap"
      style={{ maxWidth: "90%", margin: "auto", padding: "20px" }}
    >
      <h1>Eventos e Projetos</h1>

      <div style={{ textAlign: "justify", marginBottom: "48px", lineHeight: 1.5 }}>
        Os eventos e projetos promovidos pelo ICMBC são parte fundamental do nosso
        compromisso com a valorização da Capoeira e das expressões afro-brasileiras.
        Através de vivências, apresentações, oficinas, rodas e cursos, buscamos ampliar
        o acesso à cultura, à educação e ao conhecimento.
      </div>

      <div className="container-cards">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="card-link">
            <Card className="card-projeto">
              <Card.Body className="card-body">
                {/* slot fixo evita reflow enquanto a imagem carrega */}
                <div
                  className="img-slot"
                  style={{
                    width: c.w,
                    height: c.h,
                    aspectRatio: `${c.w} / ${c.h}`,
                  }}
                >
                  <img
                    className="img-projeto"
                    src={c.src}
                    alt={c.alt}
                    width={c.w}
                    height={c.h}
                    decoding="async"
                    fetchpriority="high"
                    // sem loading="lazy" porque esses cards tendem a ficar acima da dobra
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </div>
              </Card.Body>

              {/* reserva altura do título para não “pular” com a webfont */}
              <Card.Title className="card-title-fixed">{c.title}</Card.Title>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Eventos;
