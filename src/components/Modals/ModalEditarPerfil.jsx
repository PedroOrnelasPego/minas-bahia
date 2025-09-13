import { Modal, Button, Row, Col } from "react-bootstrap";
import PropTypes from "prop-types";
import nomesCordas, {
  gruposCordas,
  listarCordasPorGrupo,
} from "../../constants/nomesCordas";

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
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "whatsapp" || name === "contatoEmergencia") {
      return setFormEdit({ ...formEdit, [name]: formatPhoneBR(value) });
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

            <small className="text-muted">Data de nascimento</small>
            <input
              name="dataNascimento"
              className="form-control mb-2"
              type="date"
              value={formEdit?.dataNascimento || ""}
              onChange={handleChange}
            />

            <small className="text-muted">Sexo</small>
            <select
              name="sexo"
              className="form-control mb-2"
              value={formEdit?.sexo || ""}
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

            <small className="text-muted">WhatsApp (pessoal)</small>
            <input
              name="whatsapp"
              className="form-control mb-2"
              placeholder="(31) 9XXXX-XXXX"
              inputMode="numeric"
              value={formEdit?.whatsapp || ""}
              onChange={handleChange}
            />

            <small className="text-muted">Contato de emergência / responsável</small>
            <input
              name="contatoEmergencia"
              className="form-control mb-2"
              placeholder="(31) 9XXX-XXXX"
              inputMode="numeric"
              value={formEdit?.contatoEmergencia || ""}
              onChange={handleChange}
            />
          </Col>

          {/* Coluna Direita: Graduação e Endereço */}
          <Col md={6}>
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
