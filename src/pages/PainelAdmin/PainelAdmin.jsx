import { useEffect, useState } from "react";
import { Container, Row, Col, Modal } from "react-bootstrap";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
import calcularIdade from "../../utils/calcularIdade";
import axios from "axios";
import fotoPadrao from "../../assets/foto-perfil/foto-perfil-padrao.avif";
import { getCordaNome } from "../../constants/nomesCordas";
import { getHorarioLabel } from "../../helpers/agendaTreino";
import { formatarData } from "../../utils/formatarData";
import Loading from "../../components/Loading/Loading";

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

// helpers para URLs de avatar
const avatarUrl1x = (email) =>
  `https://certificadoscapoeira.blob.core.windows.net/certificados/${email}/foto-perfil@1x.jpg?${Date.now()}`;
const avatarUrl2x = (email) =>
  `https://certificadoscapoeira.blob.core.windows.net/certificados/${email}/foto-perfil@2x.jpg?${Date.now()}`;
const avatarUrlLegacy = (email) =>
  `https://certificadoscapoeira.blob.core.windows.net/certificados/${email}/foto-perfil.jpg?${Date.now()}`;

const PainelAdmin = () => {
  const { accounts } = useMsal();
  const navigate = useNavigate();
  const mestreEmail = "contato@capoeiraminasbahia.com.br";

  const [usuarios, setUsuarios] = useState([]);
  const [usuarioExpandido, setUsuarioExpandido] = useState(null);
  const [dadosUsuarios, setDadosUsuarios] = useState({});
  const [carregando, setCarregando] = useState(false);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);

  const [certificadosUsuarios, setCertificadosUsuarios] = useState({});
  const [certsLoading, setCertsLoading] = useState(null); // email em carregamento

  const [previewUrl, setPreviewUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewIsPdf, setPreviewIsPdf] = useState(false);

  // Modal dedicado ao avatar
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarModalUrl, setAvatarModalUrl] = useState("");

  // 👉 cache de quem NÃO tem avatar (evita re-buscas infinitas)
  const [semAvatar, setSemAvatar] = useState({}); // { [email]: true }

  // 👉 estado do acordeon do questionário por usuário
  const [questionarioOpen, setQuestionarioOpen] = useState({});

  // ----------------- atualizações -----------------

  const atualizarNivel = async (email, novoNivel) => {
    try {
      await axios.put(`${API_URL}/perfil/${email}`, { nivelAcesso: novoNivel });

      // atualiza local
      setDadosUsuarios((prev) => ({
        ...prev,
        [email]: { ...prev[email], nivelAcesso: novoNivel },
      }));

      const now = (novoNivel || "").toLowerCase();

      // 1) Abaixo de Graduado -> força "Leitor"
      const ficouAbaixoGraduado = rankNivel(now) < rankNivel("graduado");
      const permissaoAtual = (
        dadosUsuarios[email]?.permissaoEventos || "leitor"
      ).toLowerCase();

      if (ficouAbaixoGraduado && permissaoAtual !== "leitor") {
        await atualizarPermissaoEventos(email, "leitor", { silent: true });
      }

      // 2) Abaixo de Aluno -> desativa edição do Questionário
      const ficouAbaixoAluno = rankNivel(now) < rankNivel("aluno");
      const podeEditarAtual = !!dadosUsuarios[email]?.podeEditarQuestionario;

      if (ficouAbaixoAluno && podeEditarAtual) {
        await atualizarPermissaoQuestionario(email, false, { silent: true });
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

  const atualizarPermissaoQuestionario = async (
    email,
    habilitado,
    opts = {}
  ) => {
    const { silent = false } = opts;
    try {
      await axios.put(`${API_URL}/perfil/${email}`, {
        podeEditarQuestionario: !!habilitado,
      });
      setDadosUsuarios((prev) => ({
        ...prev,
        [email]: { ...prev[email], podeEditarQuestionario: !!habilitado },
      }));
      if (!silent) alert("Permissão para editar questionário atualizada.");
    } catch {
      if (!silent) alert("Erro ao atualizar a permissão do questionário.");
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
        setLoadingUsuarios(true);
        const res = await axios.get(`${API_URL}/perfil`);
        setUsuarios(res.data || []);
      } catch {
        alert("Erro ao buscar usuários.");
      } finally {
        setLoadingUsuarios(false);
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
      setCertsLoading(email);
      const res = await axios.get(`${API_URL}/upload?email=${email}`);
      setCertificadosUsuarios((prev) => ({
        ...prev,
        [email]: res.data.arquivos,
      }));
    } catch {
      alert(`Erro ao listar arquivos de ${email}`);
    } finally {
      setCertsLoading(null);
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

  if (loadingUsuarios) {
    return (
      <Container className="py-5">
        <Loading variant="block" size="md" message="Carregando usuários..." />
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4 text-center">Painel Administrativo</h2>

      {usuarios.map((user) => {
        const perfilSel = dadosUsuarios[user.email] || {};
        const nivel = (perfilSel.nivelAcesso || "aluno").toLowerCase();
        const permissaoEventos = perfilSel.permissaoEventos || "leitor";
        const podeEditarQuest = rankNivel(nivel) >= rankNivel("aluno");
        const podeEditarPerm = rankNivel(nivel) >= rankNivel("graduado");

        // se já sabemos que não tem avatar, usa direto o placeholder
        const jaSemAvatar = !!semAvatar[user.email];

        // URLs de avatar (mantive como estavam)
        const url1x = jaSemAvatar ? fotoPadrao : avatarUrl1x(user.email);
        const url2x = jaSemAvatar ? "" : avatarUrl2x(user.email);

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
                  <Loading
                    variant="block"
                    size="sm"
                    message="Carregando dados do usuário..."
                  />
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
                            src={url1x}
                            srcSet={
                              jaSemAvatar
                                ? undefined
                                : `${url1x} 1x, ${url2x} 2x`
                            }
                            alt="Foto de perfil"
                            className="rounded"
                            style={{
                              display: "block",
                              width: "100%",
                              height: 200,
                              objectFit: "cover",
                              border: "2px solid #ccc",
                              cursor: "zoom-in",
                            }}
                            onClick={() => {
                              setAvatarModalUrl(
                                jaSemAvatar ? fotoPadrao : url2x
                              );
                              setShowAvatarModal(true);
                            }}
                            onError={(e) => {
                              // 👉 primeira falha: marca e usa placeholder (sem novas tentativas)
                              setSemAvatar((prev) => ({
                                ...prev,
                                [user.email]: true,
                              }));
                              const img = e.currentTarget;
                              img.onerror = null;
                              img.removeAttribute("srcset");
                              img.src = fotoPadrao;
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

                      <Col xs={12}>
                        {certsLoading === user.email ? (
                          <Loading
                            variant="block"
                            size="sm"
                            message="Carregando certificados..."
                          />
                        ) : Array.isArray(certificadosUsuarios[user.email]) &&
                          certificadosUsuarios[user.email].length > 0 ? (
                          <>
                            <h5 className="mt-3">Certificados</h5>
                            <div className="grid-list-3">
                              <ul className="list-unstyled">
                                {certificadosUsuarios[user.email].map(
                                  ({ nome }) => {
                                    const nomeArquivo =
                                      typeof nome === "string"
                                        ? nome.split("/").pop()
                                        : "arquivo";
                                    const ext = nomeArquivo
                                      ?.split(".")
                                      .pop()
                                      ?.toLowerCase();
                                    const isPdf = ext === "pdf";
                                    const fullUrl = `https://certificadoscapoeira.blob.core.windows.net/certificados/${user.email}/certificados/${nomeArquivo}`;

                                    // label legível (remove timestamp do começo, se houver)
                                    let label = nomeArquivo.replace(
                                      /^\d+-/,
                                      ""
                                    );
                                    try {
                                      label = decodeURIComponent(label);
                                    } catch (_) {
                                      /* ignora */
                                    }

                                    return (
                                      <li
                                        key={nome}
                                        className="d-flex justify-content-between align-items-center border rounded px-3 py-2 mb-2"
                                      >
                                        <span
                                          className="text-truncate"
                                          style={{ maxWidth: "60%" }}
                                        >
                                          {label}
                                        </span>
                                        <div className="d-flex gap-2">
                                          <button
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => {
                                              setPreviewIsPdf(isPdf);
                                              setPreviewUrl(fullUrl);
                                              setShowPreview(true);
                                            }}
                                          >
                                            {isPdf
                                              ? "📄 Visualizar"
                                              : "🔍 Visualizar"}
                                          </button>
                                          <button
                                            className="btn btn-sm btn-outline-success"
                                            onClick={() =>
                                              handleDownload(fullUrl)
                                            }
                                          >
                                            ⬇️ Download
                                          </button>
                                        </div>
                                      </li>
                                    );
                                  }
                                )}
                              </ul>
                            </div>
                          </>
                        ) : (
                          <p className="text-muted mt-3 mb-0">
                            Nenhum certificado enviado.
                          </p>
                        )}
                      </Col>

                      {/* ACORDEON INTERNO: Questionário médico */}
                      <Col xs={12} className="mt-3">
                        <div className="border rounded">
                          <button
                            className="w-100 text-start bg-white border-0 px-3 py-2 d-flex justify-content-between align-items-center"
                            onClick={() =>
                              setQuestionarioOpen((prev) => ({
                                ...prev,
                                [user.email]: !prev[user.email],
                              }))
                            }
                            aria-expanded={!!questionarioOpen[user.email]}
                            aria-controls={`qmed-${user.email}`}
                            style={{ cursor: "pointer" }}
                            title="Ver respostas do questionário"
                          >
                            <span className="fw-semibold">Questionário</span>
                            <span>
                              {questionarioOpen[user.email] ? "▲" : "▼"}
                            </span>
                          </button>

                          {questionarioOpen[user.email] && (
                            <div
                              id={`qmed-${user.email}`}
                              className="px-3 pb-3"
                            >
                              <div className="row g-3 pt-2">
                                {(() => {
                                  const qAluno =
                                    (
                                      dadosUsuarios[user.email]
                                        ?.questionarios || {}
                                    ).aluno || {};

                                  const b = (v) =>
                                    v === true
                                      ? "Sim"
                                      : v === false
                                      ? "Não"
                                      : "-";

                                  return (
                                    <>
                                      <div className="col-12">
                                        <p className="mb-2">
                                          <strong>Problema de saúde: </strong>
                                          {b(qAluno.problemaSaude)}
                                        </p>
                                      </div>
                                      <div className="col-12">
                                        <p className="mb-2">
                                          <strong>Detalhe do problema: </strong>
                                          {qAluno.problemaSaudeDetalhe || "-"}
                                        </p>
                                      </div>

                                      <div className="col-12">
                                        <p className="mb-2">
                                          <strong>
                                            Já praticou capoeira antes:{" "}
                                          </strong>
                                          {b(qAluno.praticouCapoeira)}
                                        </p>
                                      </div>
                                      <div className="col-12">
                                        <p className="mb-2">
                                          <strong>
                                            Histórico na capoeira:{" "}
                                          </strong>
                                          {qAluno.historicoCapoeira || "-"}
                                        </p>
                                      </div>

                                      <div className="col-12">
                                        <p className="mb-2">
                                          <strong>
                                            Outro esporte/atividade:{" "}
                                          </strong>
                                          {b(qAluno.outroEsporte)}
                                        </p>
                                      </div>
                                      <div className="col-12">
                                        <p className="mb-2">
                                          <strong>
                                            Detalhe de outro esporte:{" "}
                                          </strong>
                                          {qAluno.outroEsporteDetalhe || "-"}
                                        </p>
                                      </div>

                                      <div className="col-12">
                                        <p className="mb-2">
                                          <strong>
                                            Já ficou algum tempo sem treinar
                                            capoeira?{" "}
                                          </strong>
                                          {qAluno.hiatoSemTreinar || "-"}
                                        </p>
                                      </div>

                                      <div className="col-12">
                                        <p className="mb-2">
                                          <strong>
                                            Objetivos com a capoeira:{" "}
                                          </strong>
                                          {qAluno.objetivosCapoeira || "-"}
                                        </p>
                                      </div>

                                      <div className="col-12">
                                        <p className="mb-2">
                                          <strong>
                                            Sugestões para o ICMBc:{" "}
                                          </strong>
                                          {qAluno.sugestoesPontoDeCultura ||
                                            "-"}
                                        </p>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      </Col>
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

                        <div>
                          <strong>Permitir edição do Questionário: </strong>
                          <select
                            className="form-select d-inline w-auto ms-2"
                            value={
                              dadosUsuarios[user.email]?.podeEditarQuestionario
                                ? "true"
                                : "false"
                            }
                            onChange={(e) =>
                              atualizarPermissaoQuestionario(
                                user.email,
                                e.target.value === "true"
                              )
                            }
                            disabled={!podeEditarQuest}
                            title={
                              podeEditarQuest
                                ? "Controla se o aluno pode reabrir e editar o próprio questionário"
                                : "Disponível apenas para nível 'Aluno' ou acima"
                            }
                          >
                            <option value="false">Desativado</option>
                            <option value="true">Ativado</option>
                          </select>
                          {!podeEditarQuest && (
                            <small className="text-muted ms-2">
                              (bloqueado: requer nível &ge; Aluno)
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

      {/* Preview de arquivo */}
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
          {previewIsPdf ? (
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

      {/* Modal do Avatar (2x) */}
      <Modal
        show={showAvatarModal}
        onHide={() => setShowAvatarModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Foto de perfil</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <img
            src={avatarModalUrl}
            alt="Foto de perfil @2x"
            className="img-fluid"
            style={{ maxHeight: "80vh" }}
            onError={(e) => {
              // se 2x/1x/legado falharam, cai para o placeholder
              e.currentTarget.onerror = null;
              e.currentTarget.src = fotoPadrao;
            }}
          />
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default PainelAdmin;
