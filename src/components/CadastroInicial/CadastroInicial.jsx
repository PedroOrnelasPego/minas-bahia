import { useState, useMemo, useCallback, useRef, useEffect } from "react";
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
import http from "../../services/http";
import { maskCPF, isValidCPF, onlyDigits } from "../../utils/cpf";

const API_URL = import.meta.env.VITE_API_URL;

/* ================== Constantes fora do componente (evita recriação) ================== */
const OBRIGATORIOS = [
  "nome",
  "corda",
  "cpf",
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
  "inicioNoGrupo",
];

const cepCache = new Map();
const fcClass = (errors, name) =>
  `form-control mb-2 ${errors[name] ? "is-invalid" : ""}`;

/* ===================================================================================== */

const CadastroInicial = ({ show, onSave }) => {
  const [form, setForm] = useState({
    nome: "",
    apelido: "",
    corda: "",
    cpf: "", // <-- corrigido
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
    complemento: "", // <-- NOVO (opcional)
    inicioNoGrupo: "",
    permissaoEventos: "leitor",
  });

  const [cep, setCep] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [logradouro, setLogradouro] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const [cpfExists, setCpfExists] = useState(null); // null desconhecido | true/false
  const pendingCpfCheck = useRef(null);

  const [feedback, setFeedback] = useState({
    show: false,
    variant: "danger",
    message: "",
  });
  const showError = useCallback(
    (message) => setFeedback({ show: true, variant: "danger", message }),
    []
  );
  const hideFeedback = useCallback(
    () => setFeedback((prev) => ({ ...prev, show: false, message: "" })),
    []
  );

  const horariosDisponiveis = useMemo(
    () => getHorariosDoLocal(form.localTreino),
    [form.localTreino]
  );
  const diasDoLocalTxt = useMemo(
    () => getDiasDoLocal(form.localTreino),
    [form.localTreino]
  );

  const fc = useCallback((name) => fcClass(errors, name), [errors]);

  // Evita deixar preview de CEP desatualizado quando fechar modal
  useEffect(() => {
    if (!show) {
      setCep("");
      setBuscandoCep(false);
      setLogradouro("");
      setBairro("");
      setCidade("");
      setUf("");
      setErrors({});
      setSubmitted(false);
      hideFeedback();
    }
  }, [show, hideFeedback]);

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      if (feedback.show) hideFeedback();

      // limpa erro daquele campo numa passada só
      if (errors[name] && String(value).trim() !== "") {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }

      if (name === "whatsapp" || name === "contatoEmergencia") {
        setForm((prev) => ({ ...prev, [name]: maskPhoneBR(value) }));
        return;
      }

      if (name === "cpf") {
        setForm((prev) => ({ ...prev, cpf: maskCPF(value) }));
        setCpfExists(null);
        // limpa erro se usuário está digitando algo
        if (errors.cpf && onlyDigits(value).length <= 11) {
          setErrors((prev) => {
            const n = { ...prev };
            delete n.cpf;
            return n;
          });
        }
        return;
      }

      if (name === "localTreino") {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.localTreino;
          delete next.horarioTreino;
          delete next.professorReferencia;
          return next;
        });
        setForm((prev) => ({
          ...prev,
          localTreino: value,
          horarioTreino: "",
          professorReferencia: "",
        }));
        return;
      }

      if (name === "horarioTreino") {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.horarioTreino;
          delete next.professorReferencia;
          return next;
        });
        setForm((prev) => ({
          ...prev,
          horarioTreino: value,
          professorReferencia: getProfessorLabel(prev.localTreino, value),
        }));
        return;
      }

      setForm((prev) => ({ ...prev, [name]: value }));
    },
    [errors, feedback.show, hideFeedback]
  );

  const checkCpfExists = useCallback(async () => {
    const raw = onlyDigits(form.cpf);
    if (raw.length !== 11 || !isValidCPF(raw)) return; // só checa se válido

    // cancela chamada anterior
    if (pendingCpfCheck.current) pendingCpfCheck.current.abort();

    const controller = new AbortController();
    pendingCpfCheck.current = controller;

    try {
      const { data } = await http.get(`${API_URL}/perfil/__check/exists-cpf`, {
        params: { cpf: raw },
        signal: controller.signal,
      });
      setCpfExists(Boolean(data?.exists));
    } catch {
      // falha de rede não deve bloquear o fluxo de digitação
      setCpfExists(null);
    }
  }, [form.cpf]);

  const preencherEndereco = useCallback(
    (data) => {
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
    },
    [errors.endereco, form.numero]
  );

  const buscarEnderecoPorCep = useCallback(async () => {
    const c = (cep || "").replace(/\D/g, "");
    if (c.length < 8) return;

    hideFeedback();

    // cache simples para evitar requisições repetidas
    if (cepCache.has(c)) {
      preencherEndereco(cepCache.get(c));
      return;
    }

    setBuscandoCep(true);
    try {
      const data = await buscarCep(c);
      cepCache.set(c, data);
      preencherEndereco(data);
    } catch (e) {
      showError(e?.message || "Erro ao buscar o CEP.");
    } finally {
      setBuscandoCep(false);
    }
  }, [cep, preencherEndereco, hideFeedback, showError]);

  const handleNumeroChange = useCallback(
    (e) => {
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
    },
    [logradouro, bairro, cidade, uf, errors.numero, errors.endereco]
  );

  // ------------------ INCREMENTO: ref do corpo do modal para rolar ao topo no mobile
  const modalBodyRef = useRef(null);
  const scrollBodyToTop = () => {
    const el = modalBodyRef.current || document.querySelector(".modal-body");
    if (el) {
      try {
        el.scrollTo({ top: 0, behavior: "smooth" });
      } catch {
        el.scrollTop = 0;
      }
    }
  };
  // -------------------------------------------------------------------------------

  const handleSubmit = useCallback(
    (e) => {
      // ------------------ INCREMENTO: tratar como submit real (mobile-friendly)
      if (e && typeof e.preventDefault === "function") e.preventDefault();
      // -------------------------------------------------------------------------

      setSubmitted(true);
      hideFeedback();

      const newErrors = validateRequiredFields(form, OBRIGATORIOS);

      // validação específica do CPF
      const rawCpf = onlyDigits(form.cpf);
      if (!isValidCPF(rawCpf)) {
        newErrors.cpf = "CPF inválido";
      }

      setErrors(newErrors);

      if (Object.keys(newErrors).length > 0) {
        showError("Preencha todos os campos obrigatórios corretamente.");
        scrollBodyToTop(); // mostrar alerta no topo do modal no mobile
        return;
      }

      if (!aceitouTermos) {
        showError(
          "Você precisa aceitar os termos de uso e política de privacidade para continuar."
        );
        scrollBodyToTop();
        return;
      }

      if (cpfExists === true) {
        showError("Este CPF já está cadastrado. Verifique seus dados.");
        scrollBodyToTop();
        return;
      }

      onSave({
        ...form,
        nome: form.nome.trim(),
        apelido: form.apelido.trim(),
        cpf: rawCpf, // <-- envia normalizado
        genero: form.genero.trim(),
        racaCor: form.racaCor?.trim(),
        endereco: form.endereco.trim(),
        numero: form.numero.trim(),
        complemento: form.complemento?.trim() || "", // <-- envia complemento (opcional)
        corda: form.corda,
        aceitouTermos: true,
        nivelAcesso: "visitante",
      });
    },
    [form, hideFeedback, aceitouTermos, cpfExists, onSave, showError]
  );

  return (
    <Modal show={show} centered size="xl" backdrop="static">
      <Modal.Header>
        <Modal.Title>Complete seu Cadastro</Modal.Title>
      </Modal.Header>

      {/* INCREMENTO: envolver tudo em <form onSubmit={handleSubmit}> para funcionar melhor no mobile */}
      <form onSubmit={handleSubmit}>
        <Modal.Body ref={modalBodyRef}>
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
                autoComplete="name"
                enterKeyHint="next"
              />

              <small className="text-muted">Apelido</small>
              <input
                name="apelido"
                className="form-control mb-2"
                placeholder="Apelido (opcional)"
                value={form.apelido}
                onChange={handleChange}
                autoComplete="nickname"
                enterKeyHint="next"
              />

              {/* Graduação */}
              <small className="text-muted">
                Escolha sua graduação (corda)
              </small>
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

              {/* CPF */}
              <small className="text-muted">CPF</small>
              <div className="d-flex align-items-center gap-2">
                <input
                  name="cpf"
                  className={fc("cpf")}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  value={form.cpf}
                  onChange={handleChange}
                  onBlur={checkCpfExists}
                  autoComplete="off"
                />
                {cpfExists === true && (
                  <span className="text-danger small">Já cadastrado</span>
                )}
                {cpfExists === false && (
                  <span className="text-success small">Disponível</span>
                )}
              </div>

              {/* Quando Iniciou */}
              <small className="text-muted">
                Quando iniciou seus treinos no Grupo de Capoeira Minas Bahia
              </small>
              <input
                type="date"
                name="inicioNoGrupo"
                className={fc("inicioNoGrupo")}
                placeholder="Insira a data (dd/MM/yyyy)"
                value={form.inicioNoGrupo}
                onChange={handleChange}
                autoComplete="bday"
                enterKeyHint="next"
              />

              {/* Gênero */}
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
                <option value="Prefere não informar">
                  Prefere não informar
                </option>
              </select>

              {/* Raça/Cor */}
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
                <option value="Prefere não informar">
                  Prefere não informar
                </option>
              </select>

              {/* Nascimento */}
              <small className="text-muted">Sua data de nascimento</small>
              <input
                name="dataNascimento"
                className={fc("dataNascimento")}
                placeholder="Data de Nascimento"
                type="date"
                value={form.dataNascimento}
                onChange={handleChange}
                autoComplete="bday"
                enterKeyHint="next"
              />

              {/* Telefones */}
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
                    autoComplete="tel"
                  />
                </Col>
                <Col md={6}>
                  <small className="text-muted">
                    Contato de emergência / responsável
                  </small>
                  <input
                    name="contatoEmergencia"
                    className={fc("contatoEmergencia")}
                    placeholder="(31) 9XXX-XXXX"
                    inputMode="numeric"
                    value={form.contatoEmergencia}
                    onChange={handleChange}
                    autoComplete="tel-national"
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

              {diasDoLocalTxt && (
                <div className="mb-2">
                  <small className="text-muted">Dias</small>
                  <div className="form-control-plaintext">{diasDoLocalTxt}</div>
                </div>
              )}

              {/* Horário */}
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

              {/* Professor referência */}
              <div className="mb-2">
                <small className="text-muted">Professor referência</small>
                <div
                  className={`form-control-plaintext ${
                    submitted && !form.professorReferencia ? "text-danger" : ""
                  }`}
                >
                  {form.professorReferencia ||
                    (submitted ? "Obrigatório" : "-")}
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
                  autoComplete="postal-code"
                  enterKeyHint="search"
                />
                <Button onClick={buscarEnderecoPorCep} disabled={buscandoCep}>
                  {buscandoCep ? "Buscando..." : "Buscar"}
                </Button>
              </div>

              {/* Endereço derivados do CEP */}
              <input
                type="text"
                className={`form-control mb-2 ${
                  errors.endereco ? "is-invalid" : ""
                }`}
                placeholder="Rua (preenchida pelo CEP)"
                value={logradouro}
                disabled
                readOnly
              />
              <input
                type="text"
                className={`form-control mb-2 ${
                  errors.endereco ? "is-invalid" : ""
                }`}
                placeholder="Bairro (preenchido pelo CEP)"
                value={bairro}
                disabled
                readOnly
              />
              <input
                type="text"
                className={`form-control mb-2 ${
                  errors.endereco ? "is-invalid" : ""
                }`}
                placeholder="Cidade (preenchida pelo CEP)"
                value={cidade}
                disabled
                readOnly
              />
              <input
                type="text"
                className={`form-control mb-2 ${
                  errors.endereco ? "is-invalid" : ""
                }`}
                placeholder="UF (preenchida pelo CEP)"
                value={uf}
                disabled
                readOnly
              />

              {/* Complemento (opcional) */}
              <small className="text-muted">Complemento (opcional)</small>
              <input
                type="text"
                name="complemento"
                className="form-control mb-2"
                placeholder="Apartamento, bloco, casa, etc."
                value={form.complemento}
                onChange={handleChange}
                autoComplete="address-line2"
                enterKeyHint="next"
              />

              <small className="text-muted">Número do seu endereço</small>
              <input
                type="text"
                className={fc("numero")}
                placeholder="Número"
                name="numero"
                value={form.numero}
                onChange={handleNumeroChange}
                inputMode="numeric"
                enterKeyHint="done"
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
                  política de privacidade. Autorizo o uso e armazenamento dos
                  meus dados para fins administrativos da plataforma.
                </label>
                {submitted && !aceitouTermos && (
                  <div
                    className="invalid-feedback"
                    style={{ display: "block" }}
                  >
                    Você precisa aceitar os termos.
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          {/* INCREMENTO: botão de submit (não usa onClick) */}
          <Button type="submit" variant="primary">
            Salvar +
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default CadastroInicial;
