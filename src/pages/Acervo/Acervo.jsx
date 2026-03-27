import { useEffect, useState } from "react";
import { Container, Row, Col, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, List, Disc, Book, Music, FileText, Search, ArrowUpDown } from "lucide-react";

// Imagem padrão caso o item não possua capa
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800";

const CATEGORIES = [
  { id: "all", name: "Todos", icon: LayoutGrid },
  { id: "vinil", name: "Discos de Vinil", icon: Disc },
  { id: "livro", name: "Livros", icon: Book },
  { id: "cd", name: "Áudios / CDs", icon: Music },
  { id: "documento", name: "Documentos", icon: FileText },
];

export default function Acervo() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("az");
  const [viewMode, setViewMode] = useState("grid");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchAcervo() {
      try {
        const baseUrl = import.meta.env.VITE_ACERVO_API_URL || "http://localhost:3334";
        const res = await fetch(`${baseUrl}/api/acervo`);
        if (!res.ok) throw new Error("Erro ao carregar o Acervo a partir do backend.");
        const data = await res.json();
        setItems(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAcervo();
  }, []);

  const handleExplore = (id, tipo) => {
    navigate(`/acervo/${tipo.toLowerCase()}/${id}`);
  };

  const filteredItems = items.filter(item => {
    const categoryMatch = selectedCategory === "all" || item.type === selectedCategory;
    if (!searchTerm) return categoryMatch;
    
    const term = searchTerm.toLowerCase();
    const titleMatch = (item.title || "").toLowerCase().includes(term);
    const authorMatch = (item.author || "").toLowerCase().includes(term);
    return categoryMatch && (titleMatch || authorMatch);
  }).sort((a, b) => {
    if (sortOrder === "az") return (a.title || "").localeCompare(b.title || "");
    if (sortOrder === "za") return (b.title || "").localeCompare(a.title || "");
    if (sortOrder === "ano-asc") return (a.year || 0) - (b.year || 0);
    if (sortOrder === "ano-desc") return (b.year || 0) - (a.year || 0);
    // Padrão: Recentes (por data de criação se houver, ou id)
    return new Date(b.createdAt || b.id).getTime() - new Date(a.createdAt || a.id).getTime();
  });

  return (
    <Container className="py-5" style={{ minHeight: "80vh" }}>
      <style>
        {`
          .acervo-filter-btn {
            background-color: #f1f5f9;
            color: #64748b;
            border: none;
            border-radius: 999px;
            padding: 0.6rem 1.4rem;
            font-size: 0.85rem;
            font-weight: 800;
            transition: all 0.3s ease;
            margin-right: 0.5rem;
            margin-bottom: 0.5rem;
          }
          .acervo-filter-btn:hover {
            background-color: #e2e8f0;
          }
          .acervo-filter-btn.active {
             background-color: #8b0000;
             color: white;
             box-shadow: 0 4px 14px 0 rgba(139, 0, 0, 0.35);
          }
          
          .acervo-search-input {
            border-radius: 999px;
            border: 1px solid #e2e8f0;
            padding: 0.75rem 1.5rem;
            width: 100%;
            outline: none;
            font-weight: 500;
            font-size: 0.9rem;
            transition: all 0.3s;
            background-color: #f8fafc;
          }
          .acervo-search-input:focus {
            border-color: #8b0000;
            box-shadow: 0 0 0 3px rgba(139, 0, 0, 0.1);
            background-color: white;
          }

          .acervo-card {
            border-radius: 2rem;
            overflow: hidden;
            border: 1px solid #f1f5f9;
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05);
            transition: all 0.7s cubic-bezier(0.165, 0.84, 0.44, 1);
            cursor: pointer;
            background: white;
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          .acervo-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 32px 64px -16px rgba(139, 0, 0, 0.18);
            border-color: rgba(139, 0, 0, 0.05);
          }
          
          .acervo-image-container {
            position: relative;
            width: 100%;
            aspect-ratio: 1 / 1;
            overflow: hidden;
            background-color: #f8fafc;
          }
          .acervo-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 1.5s cubic-bezier(0.165, 0.84, 0.44, 1);
          }
          .acervo-card:hover .acervo-image {
            transform: scale(1.1);
          }
          
          .acervo-badge-type {
            position: absolute;
            top: 1.5rem;
            right: 1.5rem;
            padding: 0.35rem 1rem;
            background: rgba(0, 0, 0, 0.45);
            backdrop-filter: blur(12px);
            border-radius: 9999px;
            font-size: 0.65rem;
            font-weight: 900;
            color: white;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            border: 1px solid rgba(255, 255, 255, 0.15);
            z-index: 20;
          }
          
          .acervo-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.3), transparent);
            opacity: 0;
            transition: opacity 0.7s ease;
          }
          .acervo-card:hover .acervo-overlay {
            opacity: 1;
          }
          
          .acervo-body {
            padding: 2rem;
            display: flex;
            flex-direction: column;
            flex: 1;
          }
          
          .acervo-meta {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            margin-bottom: 1rem;
          }
          .acervo-year-badge {
            padding: 0.25rem 0.6rem;
            background: rgba(34, 139, 34, 0.12); /* Verde inspirador do minas bahia */
            color: #228b22; 
            font-size: 0.65rem;
            font-weight: 900;
            border-radius: 0.4rem;
            letter-spacing: 0.05em;
          }
          .acervo-dot {
            width: 0.3rem;
            height: 0.3rem;
            background-color: #cbd5e1;
            border-radius: 50%;
          }
          .acervo-author {
            font-size: 0.75rem;
            font-weight: 800;
            color: #94a3b8;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 65%;
          }
          
          .acervo-title {
            font-size: 1.45rem;
            font-weight: 900;
            color: #0f172a;
            line-height: 1.15;
            margin-bottom: 1.5rem;
            transition: color 0.3s ease;
          }
          .acervo-card:hover .acervo-title {
            color: #8b0000;
          }
          
          .acervo-btn {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem 1rem 1rem 1.75rem;
            background: #f8fafc;
            border-radius: 1rem;
            border: none;
            transition: background 0.5s ease;
            position: relative;
            overflow: hidden;
            margin-top: auto;
          }
          .acervo-btn-text {
            font-size: 0.85rem;
            font-weight: 900;
            color: #334155;
            letter-spacing: -0.01em;
            z-index: 10;
            transition: color 0.5s ease;
          }
          .acervo-btn-icon-wrapper {
            width: 2.2rem;
            height: 2.2rem;
            border-radius: 0.6rem;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            transition: background 0.5s ease;
          }
          .acervo-btn-icon {
            color: #8b0000;
            font-weight: 900;
            font-size: 1.3rem;
            line-height: 1;
            transition: all 0.5s ease;
          }
          
          .acervo-btn::before {
             content: '';
             position: absolute;
             top: 100%;
             left: 0;
             right: 0;
             bottom: 0;
             background-color: #8b0000;
             transition: top 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
             z-index: 0;
          }
          .acervo-btn:hover::before {
             top: 0;
          }
          .acervo-btn:hover .acervo-btn-text {
            color: white;
          }
          .acervo-btn:hover .acervo-btn-icon-wrapper {
            background: rgba(255,255,255,0.25);
          }
          .acervo-btn:hover .acervo-btn-icon {
            color: white;
            transform: translateX(3px);
          }
        `}
      </style>

      {/* Barra superior: Busca, Ordenação e Visualização */}
      <div className="mb-5">
        <Row className="g-3 align-items-center mb-4">
          <Col lg={6}>
            <div className="position-relative">
              <Search className="position-absolute translate-middle-y text-muted" size={18} style={{ left: '1.2rem', top: '50%' }} />
              <input 
                type="text" 
                className="acervo-search-input" 
                placeholder="Pesquisar por mestre, título ou palavra-chave..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '3rem' }}
              />
            </div>
          </Col>
          <Col md={6} lg={3}>
            <div className="d-flex align-items-center gap-2 bg-light rounded-pill px-3 py-1 border" style={{ transition: 'all 0.3s' }}>
              <ArrowUpDown size={14} className="text-muted ms-1" />
              <select 
                className="form-select border-0 bg-transparent shadow-none fw-bold text-muted py-1" 
                style={{ fontSize: '0.8rem', cursor: 'pointer' }}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="az">Título (A-Z)</option>
                <option value="za">Título (Z-A)</option>
                <option value="recentes">Mais Recentes</option>
                <option value="ano-desc">Ano (Mais Novo)</option>
                <option value="ano-asc">Ano (Mais Antigo)</option>
              </select>
            </div>
          </Col>
          <Col md={6} lg={3} className="text-end">
            <div className="d-inline-flex bg-light p-1 rounded-pill border">
              <button 
                type="button"
                className={`btn btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center ${viewMode === 'grid' ? 'bg-white shadow-sm text-dark' : 'text-muted border-0 bg-transparent'}`} 
                onClick={() => setViewMode('grid')}
                style={{ width: '38px', height: '38px' }}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                type="button"
                className={`btn btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center ${viewMode === 'list' ? 'bg-white shadow-sm text-dark' : 'text-muted border-0 bg-transparent'}`} 
                onClick={() => setViewMode('list')}
                style={{ width: '38px', height: '38px' }}
              >
                <List size={18} />
              </button>
            </div>
          </Col>
        </Row>

        {/* Filtros de Categoria */}
        <div className="d-flex flex-wrap gap-2 pt-2 border-top">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button 
                key={cat.id} 
                className={`acervo-filter-btn d-flex align-items-center gap-2 m-0 ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
                style={{ padding: '0.5rem 1.2rem', fontSize: '0.8rem' }}
              >
                <Icon size={14} />
                {cat.name}
              </button>
            )
          })}
        </div>
      </div>

      {loading && (
        <div className="text-center mt-5 py-5">
          <Spinner animation="border" style={{ color: "#8b0000", width: '3.5rem', height: '3.5rem' }} />
          <p className="mt-3 text-muted fw-bold">Sincronizando prateleiras...</p>
        </div>
      )}

      {error && (
        <Alert variant="danger" className="text-center mt-4 rounded-4 shadow-sm border-0 fw-bold">
          Poxa! {error}
        </Alert>
      )}

      {!loading && !error && filteredItems.length === 0 && (
        <div className="text-center py-5">
          <h4 className="fw-bold text-dark">Nenhum item encontrado</h4>
          <p className="text-muted">Tente ajustar a sua busca ou trocar os filtros acima.</p>
        </div>
      )}

      {/* Visualização de Conteúdo */}
      {viewMode === 'grid' ? (
        <Row xs={1} md={2} lg={3} className="g-5">
          {filteredItems.map((item) => (
            <Col key={item.id}>
              <div className="acervo-card" onClick={() => handleExplore(item.id, item.type || "vinil")}>
                <div className="acervo-image-container">
                  <img src={item.image || FALLBACK_IMAGE} alt={item.title} className="acervo-image" />
                  <div className="acervo-badge-type">{item.type || "ACERVO"}</div>
                  <div className="acervo-overlay"></div>
                </div>
                <div className="acervo-body">
                  <div className="acervo-meta">
                    <span className="acervo-year-badge">{item.year || 'N/A'}</span>
                    <span className="acervo-dot"></span>
                    <span className="acervo-author">{item.author || "Não informado"}</span>
                  </div>
                  <h3 className="acervo-title">{item.title || "Sem Título"}</h3>
                  
                  <button className="acervo-btn">
                    <span className="acervo-btn-text">Explorar Registro</span>
                    <div className="acervo-btn-icon-wrapper">
                      <span className="acervo-btn-icon">›</span>
                    </div>
                  </button>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      ) : (
        <div className="bg-white rounded-5 shadow-sm border overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 custom-list-table">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4 py-3 border-0 text-muted small fw-bold text-uppercase" style={{ letterSpacing: '1px' }}>Item</th>
                  <th className="py-3 border-0 text-muted small fw-bold text-uppercase" style={{ letterSpacing: '1px' }}>Autor / Artista</th>
                  <th className="py-3 border-0 text-muted small fw-bold text-uppercase text-center" style={{ letterSpacing: '1px' }}>Ano</th>
                  <th className="py-3 border-0 text-muted small fw-bold text-uppercase" style={{ letterSpacing: '1px' }}>Categoria</th>
                  <th className="py-3 border-0 text-end pe-4"></th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => (
                  <tr key={item.id} className="cursor-pointer" onClick={() => handleExplore(item.id, item.type || "vinil")} style={{ transition: 'background 0.2s' }}>
                    <td className="ps-4 py-3">
                      <div className="d-flex align-items-center gap-3">
                        <img src={item.image || FALLBACK_IMAGE} className="rounded-3 shadow-sm" style={{ width: '50px', height: '50px', objectFit: 'cover' }} alt="" />
                        <span className="fw-bold text-dark">{item.title}</span>
                      </div>
                    </td>
                    <td className="py-3 text-muted fw-semibold">{item.author || '-'}</td>
                    <td className="py-3 text-center fw-bold text-success">{item.year || '-'}</td>
                    <td className="py-3">
                      <span className="badge rounded-pill px-3 py-2" style={{ backgroundColor: 'rgba(139,0,0,0.08)', color: '#8b0000', fontSize: '0.7rem' }}>
                        {CATEGORIES.find(c => c.id === item.type)?.name || item.type}
                      </span>
                    </td>
                    <td className="pe-4 text-end">
                      <button className="btn btn-sm btn-light rounded-pill px-3 fw-bold text-dark border shadow-sm">Ver Detalhes</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Container>
  );
}
