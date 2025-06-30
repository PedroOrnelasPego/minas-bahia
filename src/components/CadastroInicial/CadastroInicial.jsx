import { useState } from "react";
import { Modal, Button } from "react-bootstrap";

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
  const [aceitouTermos, setAceitouTermos] = useState(false); // NOVO

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
    });
  };

  return (
    <Modal show={show} centered backdrop="static">
      <Modal.Header>
        <Modal.Title>Complete seu Cadastro</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <input
          name="nome"
          className="form-control mb-2"
          placeholder="Nome"
          value={form.nome}
          onChange={handleChange}
        />
        <input
          name="apelido"
          className="form-control mb-2"
          placeholder="Apelido (opcional)"
          value={form.apelido}
          onChange={handleChange}
        />
        <input
          name="dataNascimento"
          className="form-control mb-2"
          placeholder="Data de Nascimento"
          type="date"
          value={form.dataNascimento}
          onChange={handleChange}
        />
        <select
          name="sexo"
          className="form-control mb-2"
          value={form.sexo}
          onChange={handleChange}
          required
        >
          <option value="">Selecione o sexo</option>
          <option value="Masculino">Masculino</option>
          <option value="Feminino">Feminino</option>
          <option value="Não informar">Não informar</option>
        </select>

        <select
          name="corda"
          className="form-control mb-2"
          value={form.corda}
          onChange={handleChange}
          required
        >
          <option value="">Selecione sua corda</option>
          <optgroup label="Mirim (2 a 5 anos)">
            <option value="branca-amarela-mirim">Branca com amarela</option>
            <option value="branca-azul-mirim">Branca com azul</option>
            <option value="branca-verde-mirim">Branca com verde</option>
          </optgroup>
          <optgroup label="Infantil (6 a 14 anos)">
            <option value="branca-infantil">Branca</option>
            <option value="branca-amarela-infantil">Branca com amarela</option>
            <option value="branca-laranja-infantil">Branca com laranja</option>
            <option value="branca-azul-infantil">Branca com azul</option>
            <option value="branca-verde-infantil">Branca com verde</option>
            <option value="branca-roxa-infantil">Branca com roxa</option>
            <option value="branca-marrom-infantil">Branca com marrom</option>
            <option value="branca-vermelha-infantil">
              Branca com vermelha
            </option>
          </optgroup>
          <optgroup label="Adulto">
            <option value="branca-adulto">Branca</option>
            <option value="branca-amarela-adulto">Branca com amarela</option>
            <option value="amarela-adulto">Amarela</option>
            <option value="amarela-laranja-adulto">Amarela com laranja</option>
            <option value="laranja-adulto">Laranja</option>
            <option value="laranja-azul-adulto">Laranja com azul</option>
            <option value="Azul-adulto">Azul</option>
            <option value="verde-adulto">Verde</option>
            <option value="roxa-adulto">Roxa</option>
            <option value="marrom-adulto">Marrom</option>
            <option value="branca-e-preta-adulto">
              Branca e Preta (Estagiário)
            </option>
            <option value="vermelha-mestre">Vermelha (Mestre)</option>
          </optgroup>
        </select>

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
        <input
          type="text"
          className="form-control mb-2"
          placeholder="Número"
          name="numero"
          value={form.numero}
          onChange={handleNumeroChange}
        />

        {/* CAMPO NOVO: Aceite de Termos */}
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
