// src/pages/PainelAdmin/PainelAdmin.jsx
import { useEffect, useState } from "react";
import { Container, Row, Col, Spinner, Modal } from "react-bootstrap";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
import calcularIdade from "../../utils/calcularIdade";
import axios from "axios";
import fotoPadrao from "../../assets/foto-perfil/foto-perfil-padrao.jpg";
import { getCordaNome } from "../../constants/nomesCordas";
import { getHorarioLabel } from "../../helpers/agendaTreino";
import { formatarData } from "../../utils/formatarData";

const API_URL = import.meta.env.VITE_API_URL;

// ordem/ranqueamento para comparar níveis
const NIVEIS = [
  "visitante",
  "aluno",
  "graduado",
  "monitor",
  "instrutor",
  "professor",
  "contramestre",
];
const rankNivel = (n) => {
  const i = NIVEIS.indexOf((n || "").toLowerCase());
  return i < 0 ? -1 : i;
};

const PainelAdmin = () => {
  const { accounts } = useMsal();
  const navigate = useNavigate();
  const mestreEmail = "contato@capoeiraminasbahia.com.br";

  const [usuarios, setUsuarios] = useState([]);
  const [usuarioExpandido, setUsuarioExpandido] = useState(null);
  const [dadosUsuarios, setDadosUsuarios] = useState({});
  const [carregando, setCarregando] = useState(false);

  const [certificadosUsuarios, setCertificadosUsuarios] = useState({});
  const [previewUrl, setPreviewUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // ----------------- atualizações -----------------

  const atualizarNivel = async (email, novoNivel) => {
    try {
      await axios.put(`${API_URL}/perfil/${email}`, { nivelAcesso: novoNivel });

      // atualiza local
      setDadosUsuarios((prev) => ({
        ...prev,
        [email]: { ...prev[email], nivelAcesso: novoNivel },
      }));

      // auto-downgrade: se ficou abaixo de Graduado -> força Leitor
      const now = (novoNivel || "").toLowerCase();
      const ficouAbaixoGraduado =
        rankNivel(now) < rankNivel("graduado");

      const permissaoAtual =
        dadosUsuarios[email]?.permissaoEventos || "leitor";

      if (ficouAbaixoGraduado && permissaoAtual !== "leitor") {
        await atualizarPermissaoEventos(email, "leitor", { silent: true });
      }

      alert("Nível atualizado com sucesso.");
    } catch {
      alert("Erro ao atualizar nível de acesso.");
    }
  };

  // permite silencioso para uso interno (auto-downgrade)
  const atualizarPermissaoEventos = async (email, permissao, opts = {}) => {
    const { silent = false } = opts;
    try {
      await axios.put(`${API_URL}/perfil/${email}`, {
        permissaoEventos: permissao,
      });
      setDadosUsuarios((prev) => ({
        ...prev,
        [email]: { ...prev[email], permissaoEventos: permissao },
      }));
      if (!silent) alert("Permissão nos eventos atualizada.");
    } catch {
      if (!silent) alert("Erro ao atualizar permissão nos eventos.");
    }
  };

  // ----------------- bootstrap -----------------

  useEffect(() => {
    const user = accounts[0];
    if (!user || user.username !== mestreEmail) {
      navigate("/notfound");
      return;
    }
    const fetchUsuarios = async () => {
      try {
        const res = await axios.get(`${API_URL}/perfil`);
        setUsuarios(res.data);
      } catch {
        alert("Erro ao buscar usuários.");
      }
    };
    fetchUsuarios();
  }, [accounts, navigate]);

  const toggleAccordion = async (email) => {
    if (usuarioExpandido === email) {
      setUsuarioExpandido(null);
      return;
    }
    setUsuarioExpandido(email);

    if (!dadosUsuarios[email]) {
      try {
        setCarregando(true);
        const res = await axios.get(`${API_URL}/perfil/${email}`);
        setDadosUsuarios((prev) => ({ ...prev, [email]: res.data }));
      } catch {
        alert("Erro ao buscar dados do usuário.");
      } finally {
        setCarregando(false);
      }
    }

    await listarCertificados(email);
  };

  const listarCertificados = async (email) => {
    try {
      const res = await axios.get(`${API_URL}/upload?email=${email}`);
      setCertificadosUsuarios((prev) => ({
        ...prev,
        [email]: res.data.arquivos,
      }));
    } catch {
      alert(`Erro ao listar arquivos de ${email}`);
    }
  };

  const handleDownload = async (url) => {
    try {
      const response = await fetch(url, { mode: "cors" });
      const blob = await response.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlBlob;
      a.download = url.split("/").pop()?.replace(/^\d+-/, "") || "arquivo";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(urlBlob);
    } catch (err) {
      console.error(err);
      alert("Erro ao baixar o arquivo.");
    }
  };

  // ----------------- render -----------------

  return (
    <Container className="py-4">
      <h2 className="mb-4 text-center">Painel Administrativo</h2>

      {usuarios.map((user) => {
        const perfilSel = dadosUsuarios[user.email] || {};
        const nivel = (perfilSel.nivelAcesso || "aluno").toLowerCase();
        const permissaoEventos = perfilSel.permissaoEventos || "leitor";
        const podeEditarPerm =
          rankNivel(nivel) >= rankNivel("graduado");

        return (
          <div
            key={user.email}
            className="border rounded mb-3 p-3 bg-light shadow-sm"
          >
            <div
              className="d-flex justify-content-between align-items-center"
              onClick={() => toggleAccordion(user.email)}
              style={{ cursor: "pointer" }}
            >
              <span>
                <strong>{user.nome}</strong> ({user.email})
              </span>
              <span>{usuarioExpandido === user.email ? "▲" : "▼"}</span>
            </div>

            {usuarioExpandido === user.email && (
              <div className="mt-3">
                {carregando && !dadosUsuarios[user.email] ? (
                  <div className="text-center my-3">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Carregando dados...</p>
                  </div>
                ) : (
                  <>
                    <Row className="g-3 align-items-start">
                      {/* FOTO */}
                      <Col
                        xs={12}
                        md="auto"
                        className="text-center text-md-start flex-shrink-0"
                      >
                        <div style={{ width: 150, marginInline: "auto" }}>
                          <img
                            src={`https://certificadoscapoeira.blob.core.windows.net/certificados/${user.email}/foto-perfil.jpg?${Date.now()}`}
                            alt="Foto de perfil"
                            className="rounded"
                            style={{
                              display: "block",
                              width: "100%",
                              height: 200,
                              objectFit: "cover",
                              border: "2px solid #ccc",
                            }}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = fotoPadrao;
                            }}
                          />
                        </div>
                      </Col>

                      {/* DADOS */}
                      <Col xs={12} md={9}>
                        <p>
                          <strong>Nome: </strong>
                          {perfilSel?.nome || "-"}
                        </p>
                        <p>
                          <strong>Apelido: </strong>
                          {perfilSel?.apelido || "-"}
                        </p>
                        <p>
                          <strong>Corda: </strong>
                          {getCordaNome(perfilSel?.corda) || "-"}
                        </p>
                        <p>
                          <strong>Gênero: </strong>
                          {perfilSel?.genero || "-"}
                        </p>
                        <p>
                          <strong>Raça/Cor:</strong> {perfilSel?.racaCor || "-"}
                        </p>
                        <p>
                          <strong>Data de Nascimento e Idade: </strong>
                          {formatarData(perfilSel?.dataNascimento)}{" "}
                          {(() => {
                            const idade = calcularIdade(
                              perfilSel?.dataNascimento
                            );
                            return idade >= 0 ? `| ${idade} anos` : "";
                          })()}
                        </p>

                        <p>
                          <strong>WhatsApp (pessoal):</strong>{" "}
                          {perfilSel?.whatsapp || "-"}
                        </p>
                        <p>
                          <strong>Contato de emergência / responsável:</strong>{" "}
                          {perfilSel?.contatoEmergencia || "-"}
                        </p>

                        <p>
                          <strong>Endereço: </strong>
                          {perfilSel?.endereco || "-"}
                        </p>
                        <p>
                          <strong>Local e horário de treino: </strong>
                          {perfilSel?.localTreino || "-"} |{" "}
                          {getHorarioLabel(
                            perfilSel?.localTreino,
                            perfilSel?.horarioTreino
                          ) || "-"}
                        </p>
                        <p>
                          <strong>Professor referência: </strong>
                          {perfilSel?.professorReferencia || "-"}
                        </p>
                      </Col>

                      {/* CERTIFICADOS (seu bloco atual pode permanecer aqui, omitido por brevidade) */}
                    </Row>

                    {/* RODAPÉ: nível + permissão (sempre embaixo) */}
                    <div className="pt-3 mt-2 border-top">
                      <div className="d-flex flex-wrap align-items-center gap-3">
                        <div>
                          <strong>Nível de Acesso: </strong>
                          {user.email === mestreEmail ? (
                            <span className="badge bg-dark ms-2">Mestre</span>
                          ) : (
                            <select
                              className="form-select d-inline w-auto ms-2"
                              value={nivel}
                              onChange={(e) =>
                                atualizarNivel(user.email, e.target.value)
                              }
                            >
                              <option value="visitante">Visitante</option>
                              <option value="aluno">Aluno</option>
                              <option value="graduado">Graduado</option>
                              <option value="monitor">Monitor</option>
                              <option value="instrutor">Instrutor</option>
                              <option value="professor">Professor</option>
                              <option value="contramestre">Contramestre</option>
                            </select>
                          )}
                        </div>

                        <div>
                          <strong>Permissão nos eventos: </strong>
                          <select
                            className="form-select d-inline w-auto ms-2"
                            value={permissaoEventos}
                            onChange={(e) =>
                              atualizarPermissaoEventos(
                                user.email,
                                e.target.value
                              )
                            }
                            disabled={!podeEditarPerm}
                            title={
                              podeEditarPerm
                                ? "Defina se é leitor ou editor dos álbuns"
                                : "Disponível apenas para nível 'Graduado' ou acima"
                            }
                          >
                            <option value="leitor">Leitor</option>
                            <option value="editor">Editor</option>
                          </select>
                          {!podeEditarPerm && (
                            <small className="text-muted ms-2">
                              (bloqueado: requer nível &ge; Graduado)
                            </small>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Preview de arquivo (inalterado) */}
      <Modal
        show={showPreview}
        onHide={() => setShowPreview(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Visualizar Arquivo</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {previewUrl.endsWith(".pdf") ? (
            <iframe
              src={previewUrl}
              style={{ width: "100%", height: "70vh" }}
              title="PDF Preview"
            />
          ) : (
            <img
              src={previewUrl}
              alt="Preview"
              className="img-fluid"
              style={{ maxHeight: "70vh" }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/erro-preview.png";
              }}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-success"
            onClick={() => handleDownload(previewUrl)}
          >
            ⬇️ Baixar
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowPreview(false)}
          >
            Fechar
          </button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PainelAdmin;
