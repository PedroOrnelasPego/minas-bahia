// src/components/QuestionarioAluno/QuestionarioAluno.jsx
import { useEffect, useState } from "react";
import { Modal, Button, Row, Col, Alert } from "react-bootstrap";

const SIM = "sim";
const NAO = "nao";

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
              10. Você possui algum problema de saúde?
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
                  11. Se a resposta anterior foi sim, qual problema de saúde
                  você possui?
                </small>
                <textarea
                  name="problemaSaudeDetalhe"
                  className={fc("problemaSaudeDetalhe")}
                  rows={2}
                  placeholder="Descreva seu(s) problema(s) de saúde"
                  value={form.problemaSaudeDetalhe}
                  onChange={handleChange}
                />
              </>
            )}

            <small className="text-muted">
              12. Já praticou capoeira antes?
            </small>
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
                  13. Se sim, em qual grupo? Com quem (mestre/professor)? Por
                  quanto tempo?
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
              14. Pratica ou já praticou outro esporte/atividade cultural?
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
                  15. Se sim, qual atividade e durante quanto tempo?
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
              17. Já ficou algum tempo sem treinar capoeira? Por quanto tempo?
              Qual o motivo?
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
              23. Quais os seus objetivos com a capoeira?
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
              24. Sugestões para o ICMBC (Ponto de Cultura) crescer de forma
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
    </Modal>
  );
}
