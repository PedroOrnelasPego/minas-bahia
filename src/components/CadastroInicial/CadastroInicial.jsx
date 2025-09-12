import { useState } from "react";
import { Modal, Button, Row, Col } from "react-bootstrap";
import nomesCordas, {
  gruposCordas,
  listarCordasPorGrupo,
} from "../../constants/nomesCordas";

const formatPhoneBR = (value) => {
  // mantém apenas dígitos
  const digits = (value || "").replace(/\D/g, "");
  if (digits.length <= 10) {
    // (DD) XXXX-XXXX
    return digits.replace(/^(\d{0,2})(\d{0,4})(\d{0,4}).*/, (_, d1, d2, d3) =>
      [
        d1 ? `(${d1}` : "",
        d1 && d1.length === 2 ? ") " : "",
        d2,
        d3 ? `-${d3}` : "",
      ].join("")
    );
  }
  // (DD) 9XXXX-XXXX
  return digits
    .slice(0, 11)
    .replace(/^(\d{2})(\d{1})(\d{4})(\d{4}).*/, "($1) $2$3-$4");
};

const CadastroInicial = ({ show, onSave }) => {
  const [form, setForm] = useState({
    nome: "",
    apelido: "",
    dataNascimento: "",
    genero: "",
    sexo: "",
    racaCor: "",
    endereco: "",
    numero: "",
    corda: "",
    whatsapp: "",
    contatoEmergencia: "",
  });

  const [cep, setCep] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [logradouro, setLogradouro] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // formatação automática para telefones
    if (name === "whatsapp" || name === "contatoEmergencia") {
      return setForm((prev) => ({ ...prev, [name]: formatPhoneBR(value) }));
    }

    setForm((prev) => ({ ...prev, [name]: value }));
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

      setLogradouro(data.logradouro || "");
      setBairro(data.bairro || "");
      setCidade(data.localidade || "");
      setUf(data.uf || "");

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
      "whatsapp",
      "contatoEmergencia",
    ];

    const vazios = obrigatorios.filter(
      (campo) => !form[campo] || String(form[campo]).trim() === ""
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
        <Row className="g-3">
          {/* Coluna Esquerda: Dados pessoais */}
          <Col md={6}>
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

            <small className="text-muted">Sexo</small>
            <select
              name="sexo"
              className="form-control mb-2"
              value={form.sexo}
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

            <small className="text-muted">WhatsApp (pessoal)</small>
            <input
              name="whatsapp"
              className="form-control mb-2"
              placeholder="(31) 9XXXX-XXXX"
              inputMode="numeric"
              value={form.whatsapp}
              onChange={handleChange}
            />

            <small className="text-muted">
              Contato de emergência / responsável
            </small>
            <input
              name="contatoEmergencia"
              className="form-control mb-2"
              placeholder="(31) 9XXX-XXXX"
              inputMode="numeric"
              value={form.contatoEmergencia}
              onChange={handleChange}
            />
          </Col>

          {/* Coluna Direita: Graduação e Endereço */}
          <Col md={6}>
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
                Declaro que li e estou de acordo com os termos de uso e a
                política de privacidade. Autorizo o uso e armazenamento dos meus
                dados para fins administrativos da plataforma.
              </label>
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
