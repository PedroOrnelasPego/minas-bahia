import { useState, useMemo } from "react";
import { Modal, Button, Row, Col, Alert } from "react-bootstrap";
import nomesCordas, {
  gruposCordas,
  listarCordasPorGrupo,
} from "../../constants/nomesCordas";
import { LOCAIS } from "../../constants/localHorariosTreinos";
import {
  getDiasDoLocal,
  getHorariosDoLocal,
  getProfessorLabel,
} from "../../helpers/agendaTreino";
import { maskPhoneBR } from "../../utils/phone";
import { buscarCep } from "../../services/cep";
import { buildFullAddress } from "../../utils/address";
import { validateRequiredFields } from "../../utils/validate";

const CadastroInicial = ({ show, onSave }) => {
  const [form, setForm] = useState({
    nome: "",
    apelido: "",
    corda: "",
    genero: "",
    racaCor: "",
    dataNascimento: "",
    whatsapp: "",
    contatoEmergencia: "",
    localTreino: "",
    horarioTreino: "",
    professorReferencia: "",
    endereco: "",
    numero: "",
    permissaoEventos: "leitor",
  });

  const [cep, setCep] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [logradouro, setLogradouro] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);

  // validação + feedback visual
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // feedback (substitui window.alert)
  const [feedback, setFeedback] = useState({
    show: false,
    variant: "danger",
    message: "",
  });
  const showError = (message) =>
    setFeedback({ show: true, variant: "danger", message });
  const hideFeedback = () =>
    setFeedback((prev) => ({ ...prev, show: false, message: "" }));

  const obrigatorios = [
    "nome",
    "corda",
    "genero",
    "racaCor",
    "dataNascimento",
    "whatsapp",
    "contatoEmergencia",
    "localTreino",
    "horarioTreino",
    "professorReferencia",
    "endereco",
    "numero",
  ];

  const horariosDisponiveis = useMemo(
    () => getHorariosDoLocal(form.localTreino),
    [form.localTreino]
  );
  const diasDoLocalTxt = useMemo(
    () => getDiasDoLocal(form.localTreino),
    [form.localTreino]
  );

  const fc = (name) => `form-control mb-2 ${errors[name] ? "is-invalid" : ""}`;

  const handleChange = (e) => {
    const { name, value } = e.target;

    // qualquer interação esconde feedback anterior
    if (feedback.show) hideFeedback();

    if (errors[name] && String(value).trim() !== "") {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    if (name === "whatsapp" || name === "contatoEmergencia") {
      return setForm((prev) => ({ ...prev, [name]: maskPhoneBR(value) }));
    }

    if (name === "localTreino") {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.localTreino;
        delete next.horarioTreino;
        delete next.professorReferencia;
        return next;
      });
      return setForm((prev) => ({
        ...prev,
        localTreino: value,
        horarioTreino: "",
        professorReferencia: "",
      }));
    }

    if (name === "horarioTreino") {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.horarioTreino;
        delete next.professorReferencia;
        return next;
      });
      return setForm((prev) => ({
        ...prev,
        horarioTreino: value,
        professorReferencia: getProfessorLabel(prev.localTreino, value),
      }));
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const buscarEnderecoPorCep = async () => {
    if (!cep) return;
    setBuscandoCep(true);
    hideFeedback();
    try {
      const data = await buscarCep(cep);
      setLogradouro(data.logradouro);
      setBairro(data.bairro);
      setCidade(data.cidade);
      setUf(data.uf);

      if (form.numero) {
        const endereco = buildFullAddress({ ...data, numero: form.numero });
        setForm((prev) => ({ ...prev, endereco }));
        if (errors.endereco && endereco.trim() !== "") {
          setErrors((prev) => {
            const next = { ...prev };
            delete next.endereco;
            return next;
          });
        }
      }
    } catch (e) {
      showError(e.message || "Erro ao buscar o CEP.");
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleNumeroChange = (e) => {
    const numero = e.target.value;
    const endereco = logradouro
      ? buildFullAddress({ logradouro, numero, bairro, cidade, uf })
      : "";

    setForm((prev) => ({ ...prev, numero, endereco }));

    if (errors.numero && String(numero).trim() !== "") {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.numero;
        return next;
      });
    }
    if (errors.endereco && endereco.trim() !== "") {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.endereco;
        return next;
      });
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    hideFeedback();

    const newErrors = validateRequiredFields(form, obrigatorios);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      showError("Preencha todos os campos obrigatórios corretamente.");
      return;
    }

    if (!aceitouTermos) {
      showError(
        "Você precisa aceitar os termos de uso e política de privacidade para continuar."
      );
      return;
    }

    onSave({
      ...form,
      nome: form.nome.trim(),
      apelido: form.apelido.trim(),
      genero: form.genero.trim(),
      racaCor: form.racaCor?.trim(),
      endereco: form.endereco.trim(),
      numero: form.numero.trim(),
      corda: form.corda,
      aceitouTermos: true,
      nivelAcesso: "visitante",
    });
  };

  return (
    <Modal show={show} centered size="xl" backdrop="static">
      <Modal.Header>
        <Modal.Title>Complete seu Cadastro</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Alert global de feedback */}
        {feedback.show && (
          <Alert
            variant={feedback.variant}
            onClose={hideFeedback}
            dismissible
            className="mb-3"
          >
            {feedback.message}
          </Alert>
        )}

        <Row className="g-3">
          {/* Coluna Esquerda */}
          <Col md={6}>
            <small className="text-muted">Digite seu nome completo</small>
            <input
              name="nome"
              className={fc("nome")}
              placeholder="Nome"
              value={form.nome}
              onChange={handleChange}
            />

            <small className="text-muted">Apelido</small>
            <input
              name="apelido"
              className="form-control mb-2"
              placeholder="Apelido (opcional)"
              value={form.apelido}
              onChange={handleChange}
            />

            {/* Graduação */}
            <small className="text-muted">Escolha sua graduação (corda)</small>
            <select
              name="corda"
              className={fc("corda")}
              value={form.corda}
              onChange={handleChange}
              required
            >
              <option value="">Selecione</option>
              {gruposCordas.map((g) => (
                <optgroup key={g.key} label={g.label}>
                  {listarCordasPorGrupo(g.key).map((slug) => (
                    <option key={slug} value={slug}>
                      {nomesCordas[slug]}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            <small className="text-muted">Gênero</small>
            <select
              name="genero"
              className={fc("genero")}
              value={form.genero}
              onChange={handleChange}
            >
              <option value="">Selecione</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
              <option value="Outro">Outro</option>
              <option value="Prefere não informar">Prefere não informar</option>
            </select>

            <small className="text-muted">Raça/Cor</small>
            <select
              name="racaCor"
              className={fc("racaCor")}
              value={form.racaCor}
              onChange={handleChange}
            >
              <option value="">Selecione</option>
              <option value="Branca">Branca</option>
              <option value="Preta">Preta</option>
              <option value="Parda">Parda</option>
              <option value="Amarela">Amarela</option>
              <option value="Indígena">Indígena</option>
              <option value="Prefere não informar">Prefere não informar</option>
            </select>

            <small className="text-muted">Sua data de nascimento</small>
            <input
              name="dataNascimento"
              className={fc("dataNascimento")}
              placeholder="Data de Nascimento"
              type="date"
              value={form.dataNascimento}
              onChange={handleChange}
            />

            {/* Telefones lado a lado (responsivo) */}
            <Row className="g-2">
              <Col md={6}>
                <small className="text-muted">WhatsApp (pessoal)</small>
                <input
                  name="whatsapp"
                  className={fc("whatsapp")}
                  placeholder="(31) 9XXXX-XXXX"
                  inputMode="numeric"
                  value={form.whatsapp}
                  onChange={handleChange}
                />
              </Col>
              <Col md={6}>
                <small className="text-muted">Contato de emergência</small>
                <input
                  name="contatoEmergencia"
                  className={fc("contatoEmergencia")}
                  placeholder="(31) 9XXX-XXXX"
                  inputMode="numeric"
                  value={form.contatoEmergencia}
                  onChange={handleChange}
                />
              </Col>
            </Row>
          </Col>

          {/* Coluna Direita */}
          <Col md={6}>
            {/* Local */}
            <small className="text-muted">Local de treino</small>
            <select
              name="localTreino"
              className={fc("localTreino")}
              value={form.localTreino}
              onChange={handleChange}
            >
              <option value="">Selecione o local</option>
              {Object.keys(LOCAIS).map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            {/* Dias do local (somente visual) */}
            {diasDoLocalTxt && (
              <div className="mb-2">
                <small className="text-muted">Dias</small>
                <div className="form-control-plaintext">{diasDoLocalTxt}</div>
              </div>
            )}

            {/* Horário dependente do local */}
            <small className="text-muted">Horário de treino</small>
            <select
              name="horarioTreino"
              className={fc("horarioTreino")}
              value={form.horarioTreino}
              onChange={handleChange}
              disabled={!form.localTreino}
            >
              <option value="">
                {form.localTreino
                  ? "Selecione o horário"
                  : "Selecione um local primeiro"}
              </option>
              {horariosDisponiveis.map((h) => (
                <option key={h.value} value={h.value}>
                  {h.label}
                </option>
              ))}
            </select>

            {/* Professor referência (pré-setado e imutável) */}
            <div className="mb-2">
              <small className="text-muted">Professor referência</small>
              <div
                className={`form-control-plaintext ${
                  submitted && !form.professorReferencia ? "text-danger" : ""
                }`}
              >
                {form.professorReferencia || (submitted ? "Obrigatório" : "-")}
              </div>
            </div>

            {/* CEP */}
            <small className="text-muted">
              Digite seu CEP e clique em Buscar
            </small>
            <div className="d-flex gap-2 mb-2">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por CEP"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                inputMode="numeric"
              />
              <Button onClick={buscarEnderecoPorCep} disabled={buscandoCep}>
                {buscandoCep ? "Buscando..." : "Buscar"}
              </Button>
            </div>

            {/* Campos de endereço exibidos/derivados do CEP */}
            <input
              type="text"
              className={`form-control mb-2 ${
                errors.endereco ? "is-invalid" : ""
              }`}
              placeholder="Rua (preenchida pelo CEP)"
              value={logradouro}
              disabled
            />
            <input
              type="text"
              className={`form-control mb-2 ${
                errors.endereco ? "is-invalid" : ""
              }`}
              placeholder="Bairro (preenchido pelo CEP)"
              value={bairro}
              disabled
            />
            <input
              type="text"
              className={`form-control mb-2 ${
                errors.endereco ? "is-invalid" : ""
              }`}
              placeholder="Cidade (preenchida pelo CEP)"
              value={cidade}
              disabled
            />
            <input
              type="text"
              className={`form-control mb-2 ${
                errors.endereco ? "is-invalid" : ""
              }`}
              placeholder="UF (preenchida pelo CEP)"
              value={uf}
              disabled
            />

            <small className="text-muted">Número do seu endereço</small>
            <input
              type="text"
              className={fc("numero")}
              placeholder="Número"
              name="numero"
              value={form.numero}
              onChange={handleNumeroChange}
            />

            <div className="form-check mt-3">
              <input
                className={`form-check-input ${
                  submitted && !aceitouTermos ? "is-invalid" : ""
                }`}
                type="checkbox"
                id="termos"
                checked={aceitouTermos}
                onChange={(e) => setAceitouTermos(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="termos">
                Declaro que li e estou de acordo com os termos de uso e a
                política de privacidade. Autorizo o uso e armazenamento dos meus
                dados para fins administrativos da plataforma.
              </label>
              {submitted && !aceitouTermos && (
                <div className="invalid-feedback" style={{ display: "block" }}>
                  Você precisa aceitar os termos.
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={handleSubmit} variant="primary">
          Salvar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CadastroInicial;
