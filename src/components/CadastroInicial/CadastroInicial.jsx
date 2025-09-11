import { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import nomesCordas, {
  gruposCordas,
  listarCordasPorGrupo,
} from "../../constants/nomesCordas";

const CadastroInicial = ({ show, onSave }) => {
  const [form, setForm] = useState({
    nome: "",
    apelido: "",
    dataNascimento: "",
    sexo: "",
    endereco: "",
    numero: "",
    corda: "",
  });

  const [cep, setCep] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [logradouro, setLogradouro] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const buscarEnderecoPorCep = async () => {
    if (!cep) return;
    setBuscandoCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        alert("CEP não encontrado.");
        return;
      }

      setLogradouro(data.logradouro);
      setBairro(data.bairro);
      setCidade(data.localidade);
      setUf(data.uf);

      if (form.numero) {
        const enderecoFinal = `${data.logradouro}, ${form.numero} - ${data.bairro}, ${data.localidade} - ${data.uf}`;
        setForm((prev) => ({ ...prev, endereco: enderecoFinal }));
      }
    } catch (error) {
      alert("Erro ao buscar o CEP.");
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleNumeroChange = (e) => {
    const numero = e.target.value;
    setForm((prev) => ({
      ...prev,
      endereco: logradouro
        ? `${logradouro}, ${numero} - ${bairro}, ${cidade} - ${uf}`
        : "",
      numero,
    }));
  };

  const handleSubmit = () => {
    const obrigatorios = [
      "nome",
      "dataNascimento",
      "sexo",
      "endereco",
      "numero",
      "corda",
    ];
    const vazios = obrigatorios.filter(
      (campo) => !form[campo] || form[campo].trim() === ""
    );

    if (vazios?.length > 0) {
      alert("Preencha todos os campos obrigatórios corretamente.");
      return;
    }

    if (!aceitouTermos) {
      alert(
        "Você precisa aceitar os termos de uso e política de privacidade para continuar."
      );
      return;
    }

    onSave({
      ...form,
      nome: form.nome.trim(),
      apelido: form.apelido.trim(),
      sexo: form.sexo.trim(),
      endereco: form.endereco.trim(),
      numero: form.numero.trim(),
      corda: form.corda,
      aceitouTermos: true,
      nivelAcesso: "visitante",
    });
  };

  return (
    <Modal show={show} centered backdrop="static">
      <Modal.Header>
        <Modal.Title>Complete seu Cadastro</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <small className="text-muted">Digite seu nome completo</small>
        <input
          name="nome"
          className="form-control mb-2"
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

        <small className="text-muted">Sua data de nascimento</small>
        <input
          name="dataNascimento"
          className="form-control mb-2"
          placeholder="Data de Nascimento"
          type="date"
          value={form.dataNascimento}
          onChange={handleChange}
        />

        <small className="text-muted">Selecione seu sexo</small>
        <select
          name="sexo"
          className="form-control mb-2"
          value={form.sexo}
          onChange={handleChange}
          required
        >
          <option value="">Selecione</option>
          <option value="Masculino">Masculino</option>
          <option value="Feminino">Feminino</option>
          <option value="Não informar">Não informar</option>
        </select>

        <small className="text-muted">Escolha sua graduação (corda)</small>
        <select
          name="corda"
          className="form-control mb-2"
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
          placeholder="Rua"
          value={logradouro}
          disabled
        />
        <input
          type="text"
          className="form-control mb-2"
          placeholder="Bairro"
          value={bairro}
          disabled
        />
        <input
          type="text"
          className="form-control mb-2"
          placeholder="Cidade"
          value={cidade}
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
          value={form.numero}
          onChange={handleNumeroChange}
        />

        <div className="form-check mt-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="termos"
            checked={aceitouTermos}
            onChange={(e) => setAceitouTermos(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="termos">
            Declaro que li e estou de acordo com os termos de uso e a política
            de privacidade. Autorizo o uso e armazenamento dos meus dados para
            fins administrativos da plataforma.
          </label>
        </div>
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
