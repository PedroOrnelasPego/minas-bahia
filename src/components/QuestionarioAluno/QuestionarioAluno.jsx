// src/components/QuestionarioAluno/QuestionarioAluno.jsx
import { useEffect, useState } from "react";
import { Modal, Button, Row, Col, Alert } from "react-bootstrap";
import http from "../../services/http";
import { getAuthEmail } from "../../auth/session";

const SIM = "sim";
const NAO = "nao";

const API_URL = import.meta.env.VITE_API_URL;
// mesmo padrão usado em AreaGraduado.jsx
const BLOB_BASE =
  "https://certificadoscapoeira.blob.core.windows.net/certificados";

const toRadio = (b) => (b === true ? SIM : b === false ? NAO : "");
const toBool = (v) => (v === SIM ? true : v === NAO ? false : undefined);

export default function QuestionarioAluno({
  show,
  initialData,
  onSave,
  onCancel,
}) {
  const [form, setForm] = useState({
    problemaSaude: "", // sim/nao
    problemaSaudeDetalhe: "",
    praticouCapoeira: "",
    historicoCapoeira: "",
    outroEsporte: "",
    outroEsporteDetalhe: "",
    hiatoSemTreinar: "",
    objetivosCapoeira: "",
    sugestoesPontoDeCultura: "",
  });

  // Laudos (upload/list/delete)
  const [laudos, setLaudos] = useState([]);
  const [enviandoLaudo, setEnviandoLaudo] = useState(false);
  const [laudoSelecionado, setLaudoSelecionado] = useState(null);

  // Preview de laudo (igual ao preview da timeline)
  const [laudoPreviewOpen, setLaudoPreviewOpen] = useState(false);
  const [laudoPreviewUrl, setLaudoPreviewUrl] = useState("");
  const [laudoPreviewIsPdf, setLaudoPreviewIsPdf] = useState(false);

  // Quando initialData mudar (abrir para editar), pré-carrega o form
  useEffect(() => {
    if (!initialData) return;
    setForm({
      problemaSaude: toRadio(initialData.problemaSaude),
      problemaSaudeDetalhe: initialData.problemaSaudeDetalhe || "",
      praticouCapoeira: toRadio(initialData.praticouCapoeira),
      historicoCapoeira: initialData.historicoCapoeira || "",
      outroEsporte: toRadio(initialData.outroEsporte),
      outroEsporteDetalhe: initialData.outroEsporteDetalhe || "",
      hiatoSemTreinar: initialData.hiatoSemTreinar || "",
      objetivosCapoeira: initialData.objetivosCapoeira || "",
      sugestoesPontoDeCultura: initialData.sugestoesPontoDeCultura || "",
    });
  }, [initialData]);

  // Carrega laudos ao abrir o modal, e sempre que alternar para SIM no problema de saúde
  useEffect(() => {
    if (!show) return;
    if (form.problemaSaude === SIM) {
      carregarLaudos().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, form.problemaSaude]);

  const carregarLaudos = async () => {
    const email = getAuthEmail();
    if (!email) return;
    try {
      const { data } = await http.get(`${API_URL}/upload/laudos`, {
        params: { email },
      });
      setLaudos(Array.isArray(data?.arquivos) ? data.arquivos : []);
    } catch (e) {
      console.error("Erro ao listar laudos:", e?.message || e);
      setLaudos([]);
    }
  };

  const handleUploadLaudo = async () => {
    if (!laudoSelecionado) return;
    const email = getAuthEmail();
    if (!email) return;

    setEnviandoLaudo(true);
    try {
      const fd = new FormData();
      fd.append("arquivo", laudoSelecionado);

      await http.post(
        `${API_URL}/upload/laudos?email=${encodeURIComponent(email)}`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setLaudoSelecionado(null);
      await carregarLaudos();
    } catch (e) {
      console.error("Erro ao enviar laudo:", e?.message || e);
      setFeedback({
        show: true,
        variant: "danger",
        message: "Não foi possível enviar o laudo. Tente novamente.",
      });
    } finally {
      setEnviandoLaudo(false);
    }
  };

  const handleExcluirLaudo = async (item) => {
    const email = getAuthEmail();
    if (!email || !item?.nome) return;

    try {
      await http.delete(`${API_URL}/upload/laudos`, {
        params: { email, arquivo: item.nome }, // aceita "xxx.ext" no backend
      });
      await carregarLaudos();
    } catch (e) {
      console.error("Erro ao excluir laudo:", e?.message || e);
      setFeedback({
        show: true,
        variant: "danger",
        message: "Não foi possível excluir este laudo.",
      });
    }
  };

  // monta e abre o preview (sem navegar)
  const openLaudoPreview = (item) => {
    const email = getAuthEmail();
    if (!email || !item?.nome) return;

    const isPdf = String(item.nome).toLowerCase().endsWith(".pdf");
    const url = `${BLOB_BASE}/${encodeURIComponent(
      email
    )}/laudos/${encodeURIComponent(item.nome)}`;

    setLaudoPreviewIsPdf(isPdf);
    setLaudoPreviewUrl(url);
    setLaudoPreviewOpen(true);
  };

  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState({
    show: false,
    variant: "danger",
    message: "",
  });
  const hideFeedback = () =>
    setFeedback((p) => ({ ...p, show: false, message: "" }));
  const showError = (m) =>
    setFeedback({ show: true, variant: "danger", message: m });

  const fc = (name, extra = "") =>
    `form-control mb-2 ${
      submitted && isInvalid(name) ? "is-invalid" : ""
    } ${extra}`;

  const isInvalid = (name) => {
    if (name === "problemaSaudeDetalhe" && form.problemaSaude === SIM) {
      return !form.problemaSaudeDetalhe?.trim();
    }
    if (name === "historicoCapoeira" && form.praticouCapoeira === SIM) {
      return !form.historicoCapoeira?.trim();
    }
    if (name === "outroEsporteDetalhe" && form.outroEsporte === SIM) {
      return !form.outroEsporteDetalhe?.trim();
    }
    const required = [
      "problemaSaude",
      "praticouCapoeira",
      "outroEsporte",
      "hiatoSemTreinar",
      "objetivosCapoeira",
      "sugestoesPontoDeCultura",
    ];
    if (required.includes(name)) return !String(form[name] || "").trim();
    return false;
  };

  const anyInvalid = () => {
    const base = [
      "problemaSaude",
      "praticouCapoeira",
      "outroEsporte",
      "hiatoSemTreinar",
      "objetivosCapoeira",
      "sugestoesPontoDeCultura",
    ];
    const cond = [];
    if (form.problemaSaude === SIM) cond.push("problemaSaudeDetalhe");
    if (form.praticouCapoeira === SIM) cond.push("historicoCapoeira");
    if (form.outroEsporte === SIM) cond.push("outroEsporteDetalhe");
    return [...base, ...cond].some((f) => isInvalid(f));
  };

  const handleChange = (e) => {
    hideFeedback();
    const { name, value } = e.target;

    // Limpa dependentes automaticamente quando muda de SIM -> NÃO
    if (name === "problemaSaude") {
      return setForm((prev) => ({
        ...prev,
        problemaSaude: value,
        problemaSaudeDetalhe: value === NAO ? "" : prev.problemaSaudeDetalhe,
      }));
    }
    if (name === "praticouCapoeira") {
      return setForm((prev) => ({
        ...prev,
        praticouCapoeira: value,
        historicoCapoeira: value === NAO ? "" : prev.historicoCapoeira,
      }));
    }
    if (name === "outroEsporte") {
      return setForm((prev) => ({
        ...prev,
        outroEsporte: value,
        outroEsporteDetalhe: value === NAO ? "" : prev.outroEsporteDetalhe,
      }));
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    hideFeedback();
    setSubmitted(true);
    if (anyInvalid()) {
      showError("Preencha os campos obrigatórios.");
      return;
    }
    onSave({
      ...initialData, // preserva algo que você tenha salvo antes
      problemaSaude: toBool(form.problemaSaude),
      problemaSaudeDetalhe: form.problemaSaudeDetalhe?.trim() || "",
      praticouCapoeira: toBool(form.praticouCapoeira),
      historicoCapoeira: form.historicoCapoeira?.trim() || "",
      outroEsporte: toBool(form.outroEsporte),
      outroEsporteDetalhe: form.outroEsporteDetalhe?.trim() || "",
      hiatoSemTreinar: form.hiatoSemTreinar?.trim() || "",
      objetivosCapoeira: form.objetivosCapoeira?.trim() || "",
      sugestoesPontoDeCultura: form.sugestoesPontoDeCultura?.trim() || "",
    });
  };

  return (
    <Modal show={show} centered size="lg" backdrop="static" keyboard={false}>
      <Modal.Header>
        <Modal.Title>Questionário do Aluno</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {feedback.show && (
          <Alert
            variant={feedback.variant}
            dismissible
            onClose={hideFeedback}
            className="mb-3"
          >
            {feedback.message}
          </Alert>
        )}

        <Row className="g-3">
          <Col md={12}>
            <small className="text-muted">
              Você possui algum problema de saúde?
            </small>
            <div className="d-flex gap-3 mb-2">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  id="ps-sim"
                  name="problemaSaude"
                  value={SIM}
                  checked={form.problemaSaude === SIM}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="ps-sim">
                  Sim
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  id="ps-nao"
                  name="problemaSaude"
                  value={NAO}
                  checked={form.problemaSaude === NAO}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="ps-nao">
                  Não
                </label>
              </div>
            </div>

            {form.problemaSaude === SIM && (
              <>
                <small className="text-muted">
                  Se a resposta anterior foi sim, qual problema de saúde você
                  possui?
                </small>
                <textarea
                  name="problemaSaudeDetalhe"
                  className={fc("problemaSaudeDetalhe")}
                  rows={2}
                  placeholder="Descreva seu(s) problema(s) de saúde"
                  value={form.problemaSaudeDetalhe}
                  onChange={handleChange}
                />

                {/* ====== Bloco de Laudos ====== */}
                <div className="mt-3 p-2 border rounded">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong>Laudo / Documento médico</strong>
                    <small className="text-muted">
                      Envie PDF ou imagem (jpg/png).
                    </small>
                  </div>

                  <div className="d-flex gap-2 align-items-center mb-2">
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png"
                      className="form-control"
                      onChange={(e) =>
                        setLaudoSelecionado(e.target.files?.[0] || null)
                      }
                    />
                    <Button
                      variant="outline-primary"
                      disabled={!laudoSelecionado || enviandoLaudo}
                      onClick={handleUploadLaudo}
                      title="Enviar laudo"
                    >
                      {enviandoLaudo ? "Enviando..." : "Enviar"}
                    </Button>
                  </div>

                  {/* Lista de laudos */}
                  {laudos.length === 0 ? (
                    <p className="text-muted mb-0">Nenhum laudo enviado.</p>
                  ) : (
                    <ul className="list-unstyled mb-0">
                      {laudos.map((item) => {
                        const isPdf = (item?.nome || "")
                          .toLowerCase()
                          .endsWith(".pdf");
                        return (
                          <li
                            key={item.nome}
                            className="d-flex justify-content-between align-items-center border rounded px-2 py-1 mb-2"
                          >
                            <div className="d-flex flex-column">
                              <span className="fw-semibold">{item.nome}</span>
                              <small className="text-muted">
                                {isPdf ? "PDF" : "Imagem"}{" "}
                                {item.atualizadoEm
                                  ? `• ${new Date(
                                      item.atualizadoEm
                                    ).toLocaleString()}`
                                  : ""}
                              </small>
                            </div>
                            <div className="d-flex gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => openLaudoPreview(item)}
                                title="Visualizar laudo"
                              >
                                {isPdf ? "📄 Abrir PDF" : "🔍 Visualizar"}
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleExcluirLaudo(item)}
                                title="Excluir este laudo"
                              >
                                🗑 Excluir
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                {/* ====== fim bloco laudos ====== */}
              </>
            )}

            <small className="text-muted">Já praticou capoeira antes?</small>
            <div className="d-flex gap-3 mb-2">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  id="pc-sim"
                  name="praticouCapoeira"
                  value={SIM}
                  checked={form.praticouCapoeira === SIM}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="pc-sim">
                  Sim
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  id="pc-nao"
                  name="praticouCapoeira"
                  value={NAO}
                  checked={form.praticouCapoeira === NAO}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="pc-nao">
                  Não
                </label>
              </div>
            </div>

            {form.praticouCapoeira === SIM && (
              <>
                <small className="text-muted">
                  Se sim, em qual grupo? Com quem (mestre/professor)? Por quanto
                  tempo?
                </small>
                <textarea
                  name="historicoCapoeira"
                  className={fc("historicoCapoeira")}
                  rows={2}
                  placeholder="Grupo, mestre/professor e duração"
                  value={form.historicoCapoeira}
                  onChange={handleChange}
                />
              </>
            )}

            <small className="text-muted">
              Pratica ou já praticou outro esporte/atividade cultural?
            </small>
            <div className="d-flex gap-3 mb-2">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  id="oe-sim"
                  name="outroEsporte"
                  value={SIM}
                  checked={form.outroEsporte === SIM}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="oe-sim">
                  Sim
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  id="oe-nao"
                  name="outroEsporte"
                  value={NAO}
                  checked={form.outroEsporte === NAO}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="oe-nao">
                  Não
                </label>
              </div>
            </div>

            {form.outroEsporte === SIM && (
              <>
                <small className="text-muted">
                  Se sim, qual atividade e durante quanto tempo?
                </small>
                <textarea
                  name="outroEsporteDetalhe"
                  className={fc("outroEsporteDetalhe")}
                  rows={2}
                  placeholder="Ex.: Futebol por 3 anos; Dança por 1 ano"
                  value={form.outroEsporteDetalhe}
                  onChange={handleChange}
                />
              </>
            )}

            <small className="text-muted">
              Já ficou algum tempo sem treinar capoeira? Por quanto tempo? Qual
              o motivo?
            </small>
            <textarea
              name="hiatoSemTreinar"
              className={fc("hiatoSemTreinar")}
              rows={2}
              placeholder="Descreva se houve pausa, duração e motivo"
              value={form.hiatoSemTreinar}
              onChange={handleChange}
            />

            <small className="text-muted">
              Quais os seus objetivos com a capoeira?
            </small>
            <textarea
              name="objetivosCapoeira"
              className={fc("objetivosCapoeira")}
              rows={2}
              placeholder="Ex.: condicionamento físico, música, roda, formação etc."
              value={form.objetivosCapoeira}
              onChange={handleChange}
            />

            <small className="text-muted">
              Sugestões para o ICMBC (Ponto de Cultura) crescer de forma
              positiva?
            </small>
            <textarea
              name="sugestoesPontoDeCultura"
              className={fc("sugestoesPontoDeCultura")}
              rows={2}
              placeholder="Sua sugestão"
              value={form.sugestoesPontoDeCultura}
              onChange={handleChange}
            />
          </Col>
        </Row>
      </Modal.Body>

      <Modal.Footer>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button variant="primary" onClick={handleSubmit}>
          Salvar respostas
        </Button>
      </Modal.Footer>

      {/* Modal de preview de Laudo */}
      <Modal
        show={laudoPreviewOpen}
        onHide={() => setLaudoPreviewOpen(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Visualizar laudo</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {laudoPreviewIsPdf ? (
            <iframe
              src={laudoPreviewUrl}
              style={{ width: "100%", height: "70vh", border: "none" }}
              title="PDF Preview"
            />
          ) : (
            <img
              src={laudoPreviewUrl}
              alt="Preview do laudo"
              className="img-fluid"
              style={{ maxHeight: "70vh" }}
              loading="lazy"
            />
          )}
        </Modal.Body>
      </Modal>
    </Modal>
  );
}
