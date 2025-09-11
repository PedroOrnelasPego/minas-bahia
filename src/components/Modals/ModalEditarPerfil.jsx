import { Modal, Button } from "react-bootstrap";
import PropTypes from "prop-types";
import nomesCordas, {
  gruposCordas,
  listarCordasPorGrupo,
} from "../../constants/nomesCordas";

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
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Editar Perfil</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <small className="text-muted">Nome completo</small>
        <input
          className="form-control mb-2"
          placeholder="Nome"
          value={formEdit?.nome || ""}
          onChange={(e) => setFormEdit({ ...formEdit, nome: e.target.value })}
        />

        <small className="text-muted">Apelido</small>
        <input
          className="form-control mb-2"
          placeholder="Apelido (opcional)"
          value={formEdit?.apelido || ""}
          onChange={(e) =>
            setFormEdit({ ...formEdit, apelido: e.target.value })
          }
        />

        <small className="text-muted">Data de nascimento</small>
        <input
          className="form-control mb-2"
          type="date"
          value={formEdit?.dataNascimento || ""}
          onChange={(e) =>
            setFormEdit({ ...formEdit, dataNascimento: e.target.value })
          }
        />

        <small className="text-muted">Sexo</small>
        <select
          className="form-control mb-2"
          value={formEdit?.sexo || ""}
          onChange={(e) => setFormEdit({ ...formEdit, sexo: e.target.value })}
        >
          <option value="">Selecione</option>
          <option value="Masculino">Masculino</option>
          <option value="Feminino">Feminino</option>
          <option value="Não informar">Não informar</option>
        </select>

        <small className="text-muted">Corda (graduação)</small>
        <select
          className="form-control mb-2"
          value={formEdit?.corda || ""}
          onChange={(e) => setFormEdit({ ...formEdit, corda: e.target.value })}
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
          value={formEdit?.numero || ""}
          onChange={handleNumeroChange}
        />
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
