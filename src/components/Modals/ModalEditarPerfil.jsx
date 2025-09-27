// src/components/Modals/ModalEditarPerfil.jsx
import { useMemo, useState } from "react";
import { Modal, Button, Row, Col, Alert } from "react-bootstrap";
import PropTypes from "prop-types";
import nomesCordas, {
  gruposCordas,
  listarCordasPorGrupo,
} from "../../constants/nomesCordas";
import { LOCAIS } from "../../constants/localHorariosTreinos";
import {
  getHorariosDoLocal,
  getDiasDoLocal,
  getProfessorLabel,
} from "../../helpers/agendaTreino";
import { maskPhoneBR } from "../../utils/phone";
import { buildFullAddress } from "../../utils/address";
import { validateRequiredFields } from "../../utils/validate";

const ModalEditarPerfil = ({
  show,
  onHide,
  formEdit,
  setFormEdit,
  salvarPerfil,
  cep,
  setCep,
  buscarEnderecoPorCep,
  handleNumeroChange,
  logradouro,
  bairro,
  cidade,
  uf,
  buscandoCep,
}) => {
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
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
    () => getHorariosDoLocal(formEdit?.localTreino),
    [formEdit?.localTreino]
  );
  const diasDoLocalTxt = useMemo(
    () => getDiasDoLocal(formEdit?.localTreino),
    [formEdit?.localTreino]
  );

  const fc = (name) => `form-control mb-2 ${errors[name] ? "is-invalid" : ""}`;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (feedback.show) hideFeedback();

    if (errors[name] && String(value).trim() !== "") {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    if (name === "whatsapp" || name === "contatoEmergencia") {
      return setFormEdit({ ...formEdit, [name]: maskPhoneBR(value) });
    }

    if (name === "localTreino") {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.localTreino;
        delete next.horarioTreino;
        delete next.professorReferencia;
        return next;
      });
      return setFormEdit({
        ...formEdit,
        localTreino: value,
        horarioTreino: "",
        professorReferencia: "",
      });
    }

    if (name === "horarioTreino") {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.horarioTreino;
        delete next.professorReferencia;
        return next;
      });
      return setFormEdit({
        ...formEdit,
        horarioTreino: value,
        professorReferencia: getProfessorLabel(formEdit?.localTreino, value),
      });
    }

    setFormEdit({ ...formEdit, [name]: value });
  };

  const handleNumeroLocal = (e) => {
    const numero = e.target.value;
    handleNumeroChange(e);

    if (errors.numero && String(numero).trim() !== "") {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.numero;
        return next;
      });
    }
    const endereco = logradouro
      ? buildFullAddress({ logradouro, numero, bairro, cidade, uf })
      : "";
    if (errors.endereco && endereco.trim() !== "") {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.endereco;
        return next;
      });
    }
  };

  const buscarCepLocal = async () => {
    if (!cep) return;
    hideFeedback();
    try {
      await buscarEnderecoPorCep();
      const enderecoAtual = formEdit?.endereco || "";
      if (errors.endereco && enderecoAtual.trim() !== "") {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.endereco;
          return next;
        });
      }
    } catch (e) {
      showError(e?.message || "Erro ao buscar o CEP.");
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    hideFeedback();

    const newErrors = validateRequiredFields(formEdit || {}, obrigatorios);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      showError("Preencha todos os campos obrigatórios corretamente.");
      return;
    }

    const atualizado = {
      ...formEdit,
      nome: (formEdit?.nome || "").trim(),
      apelido: (formEdit?.apelido || "").trim(),
      genero: (formEdit?.genero || "").trim(),
      racaCor: (formEdit?.racaCor || "").trim(),
      endereco: (formEdit?.endereco || "").trim(),
      numero: (formEdit?.numero || "").trim(),
      corda: formEdit?.corda,
    };

    salvarPerfil(atualizado);
  };

  return (
    <Modal show={show} onHide={onHide} centered size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Editar Perfil</Modal.Title>
      </Modal.Header>
      <Modal.Body>
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
            <small className="text-muted">Nome completo</small>
            <input
              name="nome"
              className={fc("nome")}
              placeholder="Nome"
              value={formEdit?.nome || ""}
              onChange={handleChange}
            />

            <small className="text-muted">Apelido</small>
            <input
              name="apelido"
              className="form-control mb-2"
              placeholder="Apelido (opcional)"
              value={formEdit?.apelido || ""}
              onChange={handleChange}
            />

            <small className="text-muted">Graduação (corda)</small>
            <select
              name="corda"
              className={fc("corda")}
              value={formEdit?.corda || ""}
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
              value={formEdit?.genero || ""}
              onChange={handleChange}
            >
              <option value="">Selecione</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
              <option value="Não-binário">Não-binário</option>
              <option value="Outro">Outro</option>
              <option value="Prefere não informar">Prefere não informar</option>
            </select>

            <small className="text-muted">Raça/Cor</small>
            <select
              name="racaCor"
              className={fc("racaCor")}
              value={formEdit?.racaCor || ""}
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

            <small className="text-muted">Data de nascimento</small>
            <input
              name="dataNascimento"
              className={fc("dataNascimento")}
              type="date"
              value={formEdit?.dataNascimento || ""}
              onChange={handleChange}
            />

            <Row className="g-2">
              <Col md={6}>
                <small className="text-muted">WhatsApp (pessoal)</small>
                <input
                  name="whatsapp"
                  className={fc("whatsapp")}
                  placeholder="(31) 9XXXX-XXXX"
                  inputMode="numeric"
                  value={formEdit?.whatsapp || ""}
                  onChange={handleChange}
                />
              </Col>
              <Col md={6}>
                <small className="text-muted">Contato de emergência / responsável</small>
                <input
                  name="contatoEmergencia"
                  className={fc("contatoEmergencia")}
                  placeholder="(31) 9XXX-XXXX"
                  inputMode="numeric"
                  value={formEdit?.contatoEmergencia || ""}
                  onChange={handleChange}
                />
              </Col>
            </Row>
          </Col>

          {/* Coluna Direita */}
          <Col md={6}>
            <small className="text-muted">Local de treino</small>
            <select
              name="localTreino"
              className={fc("localTreino")}
              value={formEdit?.localTreino || ""}
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

            <small className="text-muted">Horário de treino</small>
            <select
              name="horarioTreino"
              className={fc("horarioTreino")}
              value={formEdit?.horarioTreino || ""}
              onChange={handleChange}
              disabled={!formEdit?.localTreino}
            >
              <option value="">
                {formEdit?.localTreino
                  ? "Selecione o horário"
                  : "Selecione um local primeiro"}
              </option>
              {horariosDisponiveis.map((h) => (
                <option key={h.value} value={h.value}>
                  {h.label}
                </option>
              ))}
            </select>

            <div className="mb-2">
              <small className="text-muted">Professor referência</small>
              <div
                className={`form-control-plaintext ${
                  submitted && !formEdit?.professorReferencia
                    ? "text-danger"
                    : ""
                }`}
              >
                {formEdit?.professorReferencia ||
                  (submitted ? "Obrigatório" : "-")}
              </div>
            </div>

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
              <Button onClick={buscarCepLocal} disabled={buscandoCep}>
                {buscandoCep ? "Buscando..." : "Buscar"}
              </Button>
            </div>

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
              value={formEdit?.numero || ""}
              onChange={handleNumeroLocal}
            />
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Salvar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

ModalEditarPerfil.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  formEdit: PropTypes.object,
  setFormEdit: PropTypes.func.isRequired,
  salvarPerfil: PropTypes.func.isRequired,
  cep: PropTypes.string.isRequired,
  setCep: PropTypes.func.isRequired,
  buscarEnderecoPorCep: PropTypes.func.isRequired,
  handleNumeroChange: PropTypes.func.isRequired,
  logradouro: PropTypes.string.isRequired,
  bairro: PropTypes.string.isRequired,
  cidade: PropTypes.string.isRequired,
  uf: PropTypes.string.isRequired,
  buscandoCep: PropTypes.bool.isRequired,
};

export default ModalEditarPerfil;
