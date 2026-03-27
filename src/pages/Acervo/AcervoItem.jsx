import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Spinner, Badge, Button } from "react-bootstrap";
import { 
  ChevronLeft, ChevronRight, Disc, Book, Music, Play, Pause, FileAudio, FileText, Info 
} from "lucide-react";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800";

export default function AcervoItem() {
  const { id, type } = useParams();
  const navigate = useNavigate();
  
  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Player e Imagens
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchRecord() {
      try {
        const baseUrl = import.meta.env.VITE_ACERVO_API_URL || "http://localhost:3334";
        const response = await fetch(`${baseUrl}/api/acervo`);
        if (response.ok) {
          const data = await response.json();
          // Verifica array mistão retornado pelo backend
          const found = data.find((d) => d.id === id);
          setItem(found);
        }
      } catch (error) {
        console.error("Erro ao buscar registro:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRecord();
  }, [id]);

  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "70vh" }}>
        <Spinner animation="border" style={{ color: "#8b0000", width: "4rem", height: "4rem" }} />
      </Container>
    );
  }

  if (!item) {
    return (
      <Container className="text-center py-5" style={{ minHeight: "70vh" }}>
        <h2 className="fw-bold mb-3">Registro não encontrado</h2>
        <p className="text-muted mb-4">O item solicitado pode ter sido apagado do acervo.</p>
        <Button variant="outline-dark" onClick={() => navigate("/acervo")} className="rounded-pill px-4">
          Voltar para Acervo
        </Button>
      </Container>
    );
  }

  const tracksA = item.tracksA || [];
  const tracksB = item.tracksB || [];
  const allTracks = [...tracksA, ...tracksB];

  const images = [
    item.image, 
    item.backImage, 
    item.insertImage, 
    item.recordImage, 
    ...(item.exemplarImages || [])
  ].filter(Boolean);

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <Container className="py-5" style={{ minHeight: "80vh" }}>
      <style>
        {`
          .item-hero-card {
            background: white;
            border-radius: 2rem;
            padding: 1.5rem;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05);
            border: 1px solid #f1f5f9;
            margin-bottom: 2.5rem;
          }
          .item-image-wrapper {
            width: 100%;
            aspect-ratio: 1/1;
            border-radius: 1.5rem;
            overflow: hidden;
            position: relative;
            background-color: #f8fafc;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08); cursor: zoom-in;
          }
          .item-image {
            width: 100%; height: 100%; object-fit: cover;
            transition: transform 0.7s ease-out;
          }
          .item-image-wrapper:hover .item-image {
            transform: scale(1.05);
          }
          .item-badge-type {
            position: absolute; top: 1rem; right: 1rem;
            padding: 0.35rem 1.25rem; font-size: 0.7rem; font-weight: 900;
            background: rgba(0,0,0,0.6); backdrop-filter: blur(12px); border-radius: 999px;
            color: white; text-transform: uppercase; letter-spacing: 0.2em; z-index: 20;
          }
          
          .item-carousel-btn {
            position: absolute; top: 50%; transform: translateY(-50%); z-index: 10;
            width: 3rem; height: 3rem; background: rgba(0,0,0,0.4); border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.2); color: white; display: flex;
            align-items: center; justify-content: center; backdrop-filter: blur(10px);
            opacity: 0; transition: all 0.3s; cursor: pointer;
          }
          .item-image-wrapper:hover .item-carousel-btn { opacity: 1; }
          .item-carousel-btn:hover { background: rgba(0,0,0,0.7); }
          .btn-left { left: 0.75rem; } .btn-right { right: 0.75rem; }

          .info-block {
            background: #f8fafc; padding: 1.25rem;
            border-radius: 1rem; border: 1px solid #f1f5f9;
            flex: 1; min-width: 120px;
          }
          .info-title { font-size: 0.65rem; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 0.25rem; }
          .info-val { font-size: 1.1rem; color: #1e293b; font-weight: 900; word-break: break-word; }

          .track-row {
            display: flex; gap: 1rem; align-items: center;
            padding: 0.75rem; border-radius: 1rem;
            background: rgba(248, 250, 252, 0.8); border: 1px solid transparent;
            transition: all 0.3s;
          }
          .track-row:hover { background: #f1f5f9; border-color: #e2e8f0; }
          
          .track-btn {
            width: 3rem; height: 3rem; border-radius: 0.75rem;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0; border: none; transition: all 0.3s; background: white; color: #8b0000;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          }
          .track-btn.active {
            background: #8b0000; color: white; transform: scale(1.05);
            box-shadow: 0 10px 15px -3px rgba(139,0,0,0.25);
          }
          .track-btn.disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; box-shadow: none; }
          .track-btn:not(.disabled):hover { background: #8b0000; color: white; }

          .zoom-overlay {
            position: fixed; inset: 0; z-index: 9999;
            background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(20px);
            display: flex; align-items: center; justify-content: center;
          }
          .zoom-image {
            max-width: 90%; max-height: 90%; border-radius: 1rem; object-fit: contain; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
          }
        `}
      </style>

      {/* Breadcrumb Voltar */}
      <div className="mb-4">
        <Link to="/acervo" className="text-decoration-none text-muted fw-bold d-inline-flex align-items-center px-3 py-2 rounded-pill bg-white shadow-sm border" style={{ fontSize: "0.85rem", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color="#8b0000"} onMouseLeave={(e) => e.currentTarget.style.color=""}>
          <ChevronLeft className="me-1" size={18} />
          Voltar para Acervo
        </Link>
      </div>

      {/* Hero Banner Principal */}
      <div className="item-hero-card">
        <Row className="g-5 align-items-center">
          <Col md={5} lg={4}>
            <div className="item-image-wrapper group">
              <img 
                src={images[currentImageIndex] || item.image || FALLBACK_IMAGE} 
                alt={item.title} 
                className="item-image"
                onClick={() => setIsModalOpen(true)}
              />
              <div className="item-badge-type">{item.type}</div>
              
              {images.length > 1 && (
                <>
                  <button className="item-carousel-btn btn-left" onClick={prevImage}><ChevronLeft size={24} /></button>
                  <button className="item-carousel-btn btn-right" onClick={nextImage}><ChevronRight size={24} /></button>
                  
                  {/* Indicators */}
                  <div className="position-absolute bottom-0 start-50 translate-middle-x mb-3 d-flex gap-2 p-2 bg-dark bg-opacity-50 rounded-pill backdrop-blur">
                    {images.map((_, i) => (
                      <div key={i} className={`rounded-circle bg-white transition-all`} onClick={() => setCurrentImageIndex(i)} style={{ width: currentImageIndex === i ? '1.5rem' : '0.5rem', height: '0.5rem', opacity: currentImageIndex === i ? 1 : 0.4, cursor: 'pointer' }} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </Col>
          <Col md={7} lg={8}>
            <div className="d-flex flex-column h-100 justify-content-center py-2">
              <div className="d-flex align-items-center gap-3 mb-3">
                <Badge bg="" style={{ backgroundColor: "rgba(139,0,0,0.1)", color: "#8b0000", fontSize: '0.7rem' }} className="px-3 py-2 rounded-3 text-uppercase">
                  ID #{item.shortId || "10293"}
                </Badge>
                <span className="text-muted fw-bold" style={{ fontSize: "0.9rem" }}>{item.country || "Brasil"}</span>
              </div>
              
              <h1 className="fw-bold mb-2" style={{ color: "#0f172a", fontSize: "2.5rem", letterSpacing: "-0.03em" }}>
                {item.title}
              </h1>
              <h3 className="fw-bold mb-4" style={{ color: "#8b0000", fontSize: "1.5rem" }}>
                {item.author}
              </h3>
              
              <div className="d-flex flex-wrap gap-3 mt-auto">
                {item.year && (
                  <div className="info-block">
                    <span className="info-title">Ano de Lançamento</span>
                    <span className="info-val">{item.year}</span>
                  </div>
                )}
                {item.recordLabel && (
                  <div className="info-block" style={{ flex: 2 }}>
                    <span className="info-title">Editora / Gravadora</span>
                    <span className="info-val">{item.recordLabel}</span>
                  </div>
                )}
                {item.quantity > 1 && (
                  <div className="info-block" style={{ backgroundColor: "rgba(234, 179, 8, 0.1)", borderColor: "rgba(234, 179, 8, 0.2)"}}>
                    <span className="info-title" style={{ color: "#854d0e" }}>Exemplares Físicos</span>
                    <span className="info-val" style={{ color: "#713f12" }}>{item.quantity} un.</span>
                  </div>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {item.description && (
        <div className="bg-white rounded-5 p-4 p-md-5 mb-5 shadow-sm border border-light">
          <h4 className="fw-bold d-flex align-items-center gap-2 mb-4" style={{ color: "#0f172a" }}>
            <Info color="#8b0000" size={24} /> Descrição Histórica
          </h4>
          <p className="text-muted fw-medium" style={{ lineHeight: "1.8", fontSize: "1.05rem" }}>
            {item.description}
          </p>
        </div>
      )}

      {/* Áudios / Faixas */}
      {allTracks.length > 0 && (
        <div className="bg-white rounded-5 p-4 p-md-5 shadow-sm border border-light position-relative overflow-hidden mb-5">
           <h4 className="fw-bold d-flex align-items-center gap-3 mb-5" style={{ color: "#0f172a" }}>
            <div className="rounded-3 d-flex align-items-center justify-content-center shadow-sm" style={{ backgroundColor: "#8b0000", width: "3rem", height: "3rem" }}>
              <FileAudio color="white" />
            </div>
            Faixas de Áudio Preservadas
          </h4>

          <Row className="g-5">
            {tracksA.length > 0 && (
              <Col md={tracksB.length > 0 ? 6 : 12}>
                <h6 className="text-muted fw-bold text-uppercase tracking-widest mb-3 ms-3" style={{ fontSize: "0.75rem", letterSpacing: "2px" }}>Lado A</h6>
                <div className="d-flex flex-column gap-2">
                  {tracksA.map((track, idx) => (
                    <div key={track.id} className="track-row pointer-event">
                      <button 
                        disabled={!track.audioUrl}
                        className={`track-btn ${!track.audioUrl ? "disabled" : playingTrackId === track.id ? "active" : ""}`}
                        onClick={() => setPlayingTrackId(playingTrackId === track.id ? null : track.id)}
                      >
                         {playingTrackId === track.id ? <Pause size={20} /> : <Play size={20} className={!track.audioUrl ? "" : "ms-1"} />}
                      </button>
                      <div className="flex-grow-1 text-truncate pe-2">
                        <div className={`fw-bold text-truncate ${playingTrackId === track.id ? "text-danger" : "text-dark"}`} style={{ fontSize: "0.95rem" }}>
                          {track.name || `Faixa ${idx + 1}`}
                        </div>
                        <div className="text-muted fw-semibold text-truncate" style={{ fontSize: "0.75rem" }}>{track.artists || item.author}</div>
                      </div>
                      <div className="text-muted fw-bold" style={{ fontSize: "0.8rem", fontFamily: "monospace" }}>{track.duration || "--:--"}</div>
                    </div>
                  ))}
                </div>
              </Col>
            )}
            
            {tracksB.length > 0 && (
              <Col md={tracksA.length > 0 ? 6 : 12}>
                <h6 className="text-muted fw-bold text-uppercase tracking-widest mb-3 ms-3" style={{ fontSize: "0.75rem", letterSpacing: "2px" }}>Lado B</h6>
                <div className="d-flex flex-column gap-2">
                  {tracksB.map((track, idx) => (
                    <div key={track.id} className="track-row">
                      <button 
                        disabled={!track.audioUrl}
                        className={`track-btn ${!track.audioUrl ? "disabled" : playingTrackId === track.id ? "active" : ""}`}
                        onClick={() => setPlayingTrackId(playingTrackId === track.id ? null : track.id)}
                      >
                         {playingTrackId === track.id ? <Pause size={20} /> : <Play size={20} className={!track.audioUrl ? "" : "ms-1"} />}
                      </button>
                      <div className="flex-grow-1 text-truncate pe-2">
                        <div className={`fw-bold text-truncate ${playingTrackId === track.id ? "text-danger" : "text-dark"}`} style={{ fontSize: "0.95rem" }}>{track.name || `Faixa ${idx + 1}`}</div>
                        <div className="text-muted fw-semibold text-truncate" style={{ fontSize: "0.75rem" }}>{track.artists || item.author}</div>
                      </div>
                      <div className="text-muted fw-bold" style={{ fontSize: "0.8rem", fontFamily: "monospace" }}>{track.duration || "--:--"}</div>
                    </div>
                  ))}
                </div>
              </Col>
            )}
          </Row>
        </div>
      )}

      {/* Modal de Zoom da Imagem */}
      {isModalOpen && (
        <div className="zoom-overlay" onClick={() => setIsModalOpen(false)}>
          <button className="position-absolute top-0 end-0 m-4 btn btn-outline-light rounded-circle" style={{ width: "3.5rem", height: "3.5rem", borderWidth: "2px" }} onClick={() => setIsModalOpen(false)}>
             X
          </button>
          
          <img src={images[currentImageIndex] || item.image || FALLBACK_IMAGE} alt={item.title} className="zoom-image" onClick={(e) => e.stopPropagation()} />

          {images.length > 1 && (
            <div className="position-absolute bottom-0 start-50 translate-middle-x mb-5 d-flex align-items-center gap-4 z-3">
              <button className="btn btn-dark rounded-circle d-flex align-items-center justify-content-center opacity-75" style={{ width: "4rem", height: "4rem" }} onClick={(e) => { e.stopPropagation(); prevImage(); }}>
                <ChevronLeft size={32} />
              </button>
              <div className="px-4 py-2 bg-dark rounded-pill fw-bold text-white opacity-75 border">
                {currentImageIndex + 1} / {images.length}
              </div>
              <button className="btn btn-dark rounded-circle d-flex align-items-center justify-content-center opacity-75" style={{ width: "4rem", height: "4rem" }} onClick={(e) => { e.stopPropagation(); nextImage(); }}>
                <ChevronRight size={32} />
              </button>
            </div>
          )}
        </div>
      )}

    </Container>
  );
}
