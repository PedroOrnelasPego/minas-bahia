import { useMemo } from "react";
import { Modal, Button, Row, Col } from "react-bootstrap";
import PropTypes from "prop-types";
import nomesCordas, {
  gruposCordas,
  listarCordasPorGrupo,
} from "../../constants/nomesCordas";
import { LOCAIS } from "../../constants/localHorariosTreinos";

// mesma máscara do cadastro
const formatPhoneBR = (value) => {
  const digits = (value || "").replace(/\D/g, "");
  if (digits.length <= 10) {
    return digits.replace(/^(\d{0,2})(\d{0,4})(\d{0,4}).*/, (_, d1, d2, d3) =>
      [
        d1 ? `(${d1}` : "",
        d1 && d1.length === 2 ? ") " : "",
        d2,
        d3 ? `-${d3}` : "",
      ].join("")
    );
  }
  return digits
    .slice(0, 11)
    .replace(/^(\d{2})(\d{1})(\d{4})(\d{4}).*/, "($1) $2$3-$4");
};

const ModalEditarPerfil = ({
  show,
  onHide,
  formEdit,
  setFormEdit,
  salvarPerfil,
  cep,
  setCep,
  buscarEnderecoPorCep,
  handleNumeroChange, // mantém sua lógica de número/endereço
  logradouro,
  bairro,
  cidade,
  uf,
  buscandoCep,
}) => {
  // calcula listas dependentes (igual ao cadastro)
  const horariosDisponiveis = useMemo(() => {
    if (!formEdit?.localTreino || !LOCAIS[formEdit.localTreino]) return [];
    return LOCAIS[formEdit.localTreino].horarios;
  }, [formEdit?.localTreino]);

  const diasDoLocal = useMemo(() => {
    if (!formEdit?.localTreino || !LOCAIS[formEdit.localTreino]) return "";
    return LOCAIS[formEdit.localTreino].dias;
  }, [formEdit?.localTreino]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // máscara de telefone
    if (name === "whatsapp" || name === "contatoEmergencia") {
      return setFormEdit({ ...formEdit, [name]: formatPhoneBR(value) });
    }

    // reset encadeado local -> horário -> professor
    if (name === "localTreino") {
      return setFormEdit({
        ...formEdit,
        localTreino: value,
        horarioTreino: "",
        professorReferencia: "",
      });
    }

    // ao escolher horário, professor referência é pré-setado e não editável
    if (name === "horarioTreino") {
      const h = horariosDisponiveis.find((x) => x.value === value);
      const professorLabel = h?.professorLabel || "";
      return setFormEdit({
        ...formEdit,
        horarioTreino: value,
        professorReferencia: professorLabel,
      });
    }

    setFormEdit({ ...formEdit, [name]: value });
  };

  return (
    <Modal show={show} onHide={onHide} centered size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Editar Perfil</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="g-3">
          {/* Coluna Esquerda: Dados pessoais */}
          <Col md={6}>
            <small className="text-muted">Nome completo</small>
            <input
              name="nome"
              className="form-control mb-2"
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

            <small className="text-muted">Gênero</small>
            <select
              name="genero"
              className="form-control mb-2"
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
              className="form-control mb-2"
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
              className="form-control mb-2"
              type="date"
              value={formEdit?.dataNascimento || ""}
              onChange={handleChange}
            />

            {/* Telefones lado a lado (responsivo) */}
            <Row className="g-2">
              <Col md={6}>
                <small className="text-muted">WhatsApp (pessoal)</small>
                <input
                  name="whatsapp"
                  className="form-control mb-2"
                  placeholder="(31) 9XXXX-XXXX"
                  inputMode="numeric"
                  value={formEdit?.whatsapp || ""}
                  onChange={handleChange}
                />
              </Col>
              <Col md={6}>
                <small className="text-muted">Contato de emergência</small>
                <input
                  name="contatoEmergencia"
                  className="form-control mb-2"
                  placeholder="(31) 9XXX-XXXX"
                  inputMode="numeric"
                  value={formEdit?.contatoEmergencia || ""}
                  onChange={handleChange}
                />
              </Col>
            </Row>

            {/* CEP (igual ao cadastro: na coluna esquerda, logo abaixo dos telefones) */}
            <small className="text-muted">Digite seu CEP e clique em Buscar</small>
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
          </Col>

          {/* Coluna Direita: Local/horário/prof/corda e endereço derivado */}
          <Col md={6}>
            <small className="text-muted">Local de treino</small>
            <select
              name="localTreino"
              className="form-control mb-1"
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

            {/* Dias do local (somente visual) */}
            {formEdit?.localTreino && (
              <div className="mb-2">
                <small className="text-muted">Dias</small>
                <div className="form-control-plaintext">{diasDoLocal}</div>
              </div>
            )}

            <small className="text-muted">Horário de treino</small>
            <select
              name="horarioTreino"
              className="form-control mb-2"
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

            {/* Professor referência (pré-setado e imutável) */}
            {formEdit?.horarioTreino && (
              <div className="mb-2">
                <small className="text-muted">Professor referência</small>
                <div className="form-control-plaintext">
                  {formEdit?.professorReferencia || "-"}
                </div>
              </div>
            )}

            <small className="text-muted">Corda (graduação)</small>
            <select
              name="corda"
              className="form-control mb-2"
              value={formEdit?.corda || ""}
              onChange={handleChange}
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

            {/* Endereço (derivado do CEP) */}
            <input
              type="text"
              className="form-control mb-2"
              value={logradouro}
              placeholder="Rua"
              disabled
            />
            <input
              type="text"
              className="form-control mb-2"
              value={bairro}
              placeholder="Bairro"
              disabled
            />
            <input
              type="text"
              className="form-control mb-2"
              value={cidade}
              placeholder="Cidade"
              disabled
            />
            <input
              type="text"
              className="form-control mb-2"
              placeholder="UF"
              value={uf}
              disabled
            />

            <small className="text-muted">Número do seu endereço</small>
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Número"
              name="numero"
              value={formEdit?.numero || ""}
              onChange={handleNumeroChange}
            />
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={salvarPerfil}>
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
