// src/pages/PainelAdmin/PainelAdmin.jsx
import { useEffect, useState } from "react";
import { Container, Row, Col, Modal } from "react-bootstrap";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
import http from "../../services/http";

import fotoPadrao from "../../assets/foto-perfil/foto-perfil-padrao.jpg";
import Loading from "../../components/Loading/Loading";
import { formatarData } from "../../utils/formatarData";
import calcularIdade from "../../utils/calcularIdade";
import { getHorarioLabel } from "../../helpers/agendaTreino";

// === cordas ===
import {
  getCordaNome,
  gruposCordas,
  listarCordasPorGrupo,
} from "../../constants/nomesCordas";

// Modal de envio (mesmo usado no Acesso Interno)
import ModalArquivosPessoais from "../../components/Modals/ModalArquivosPessoais";

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

  // dados detalhados por usuário (carregados ao expandir)
  const [dadosUsuarios, setDadosUsuarios] = useState({});
  const [carregando, setCarregando] = useState(false);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);

  // timeline (certificados) por usuário
  const [timelineUsuarios, setTimelineUsuarios] = useState({});
  const [tlLoading, setTlLoading] = useState(null); // email em carregamento

  // preview de arquivos
  const [previewUrl, setPreviewUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewIsPdf, setPreviewIsPdf] = useState(false);

  // modal avatar
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarModalUrl, setAvatarModalUrl] = useState("");

  // cache de quem NÃO tem avatar (evita re-buscas)
  const [semAvatar, setSemAvatar] = useState({}); // { [email]: true }

  // acordeon do questionário por usuário
  const [questionarioOpen, setQuestionarioOpen] = useState({});

  // modal "Enviar certificados" (reaproveita o mesmo da Acesso Interno)
  const [envioModalOpenForEmail, setEnvioModalOpenForEmail] = useState(null);

  // ================== Atualizações de Perfil ==================

  const atualizarNivel = async (email, novoNivel) => {
    try {
      await http.put(`${API_URL}/perfil/${email}`, { nivelAcesso: novoNivel });

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
      await http.put(`${API_URL}/perfil/${email}`, {
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
      await http.put(`${API_URL}/perfil/${email}`, {
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

  // alterar a corda pelo select
  const atualizarCordaPerfil = async (email, novaCorda) => {
    try {
      await http.put(`${API_URL}/perfil/${email}`, {
        corda: novaCorda,
        // ao alterar manualmente, mantém o estado de verificação atual
      });
      setDadosUsuarios((prev) => ({
        ...prev,
        [email]: { ...prev[email], corda: novaCorda },
      }));
      alert("Corda atualizada.");
    } catch {
      alert("Erro ao atualizar a corda.");
    }
  };

  // confirmar OU revogar confirmação da corda (toggle)
  const toggleVerificacaoCorda = async (email, novoValor) => {
    try {
      await http.put(`${API_URL}/perfil/${email}`, {
        cordaVerificada: !!novoValor,
      });
      setDadosUsuarios((prev) => ({
        ...prev,
        [email]: { ...prev[email], cordaVerificada: !!novoValor },
      }));
      alert(
        !!novoValor ? "Corda confirmada." : "Confirmação de corda revogada."
      );
    } catch {
      alert("Erro ao atualizar verificação da corda.");
    }
  };

  // ================== Bootstrap ==================

  useEffect(() => {
    const user = accounts[0];
    if (!user || user.username !== mestreEmail) {
      navigate("/notfound");
      return;
    }
    const fetchUsuarios = async () => {
      try {
        setLoadingUsuarios(true);
        const res = await http.get(`${API_URL}/perfil`);
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
        const res = await http.get(`${API_URL}/perfil/${email}`);
        setDadosUsuarios((prev) => ({ ...prev, [email]: res.data }));
      } catch {
        alert("Erro ao buscar dados do usuário.");
      } finally {
        setCarregando(false);
      }
    }

    await listarTimeline(email);
  };

  const listarTimeline = async (email) => {
    try {
      setTlLoading(email);
      const res = await http.get(`${API_URL}/upload/timeline`, {
        params: { email },
      });
      setTimelineUsuarios((prev) => ({
        ...prev,
        [email]: res.data.items || [],
      }));
    } catch {
      alert(`Erro ao listar timeline de ${email}`);
    } finally {
      setTlLoading(null);
    }
  };

  // ================== Certificados (aprovar/reprovar) ==================

  const aprovarOuReprovar = async (email, item, status) => {
    try {
      await http.put(`${API_URL}/upload/timeline`, {
        email,
        arquivo: `certificados/${item.data}/${item.fileName}`,
        status, // "approved" | "rejected"
      });
      await listarTimeline(email);
      alert(
        status === "approved"
          ? "Certificado aprovado."
          : "Certificado reprovado."
      );
    } catch {
      alert("Falha ao atualizar o status do certificado.");
    }
  };

  const handleDownload = async (url) => {
    try {
      const response = await fetch(url, { mode: "cors" });
      const blob = await response.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlBlob;
      a.download = url.split("/").pop() || "arquivo";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(urlBlob);
    } catch {
      alert("Erro ao baixar o arquivo.");
    }
  };

  // ================== Render ==================

  if (loadingUsuarios) {
    return (
      <Container className="py-5">
        <Loading variant="block" size="md" message="Carregando usuários..." />
      </Container>
    );
  }

  const cordasOptions = gruposCordas.map((g) => ({
    key: g.key,
    label: g.label,
    slugs: listarCordasPorGrupo(g.key),
  }));

  function formatarTempoDeGrupo(data) {
    const anos = calcularIdade(data); // inteiro
    if (anos < 1) return "menos de 1 ano";
    if (anos === 1) return "1 ano";
    return `${anos} anos`;
  }

  // helper do questionário (booleans)
  const b = (v) => (v === true ? "Sim" : v === false ? "Não" : "-");

  return (
    <Container className="py-4">
      <h2 className="mb-4 text-center">Painel Administrativo</h2>

      {usuarios.map((user) => {
        const perfilSel = dadosUsuarios[user.email] || {};
        const nivel = (perfilSel.nivelAcesso || "aluno").toLowerCase();
        const permissaoEventos = perfilSel.permissaoEventos || "leitor";
        const podeEditarQuest = rankNivel(nivel) >= rankNivel("aluno");
        const podeEditarPerm = rankNivel(nivel) >= rankNivel("graduado");

        const jaSemAvatar = !!semAvatar[user.email];
        const url1x = jaSemAvatar ? fotoPadrao : avatarUrl1x(user.email);
        const url2x = jaSemAvatar ? "" : avatarUrl2x(user.email);

        const timeline = timelineUsuarios[user.email] || [];
        const aprovadoBadge = (
          <span className="badge bg-success ms-2">Confirmada</span>
        );

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

                        {/* envio pelo admin */}
                        <div className="mt-3 text-center">
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={() =>
                              setEnvioModalOpenForEmail(user.email)
                            }
                            title="Enviar certificado para este aluno"
                          >
                            📎 Enviar certificado
                          </button>
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

                        {/* Corda + verificação */}
                        <div className="mb-2">
                          <strong>Corda: </strong>
                          <select
                            className="form-select d-inline w-auto ms-2"
                            value={perfilSel?.corda || ""}
                            onChange={(e) =>
                              atualizarCordaPerfil(user.email, e.target.value)
                            }
                          >
                            <option value="">Selecione…</option>
                            {cordasOptions.map((g) => (
                              <optgroup key={g.key} label={g.label}>
                                {g.slugs.map((slug) => (
                                  <option key={slug} value={slug}>
                                    {getCordaNome(slug)}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                          {perfilSel?.cordaVerificada ? (
                            <>
                              {aprovadoBadge}
                              <button
                                className="btn btn-sm btn-outline-danger ms-2"
                                onClick={() =>
                                  toggleVerificacaoCorda(user.email, false)
                                }
                                title="Revogar confirmação da corda"
                              >
                                ↺ Revogar
                              </button>
                            </>
                          ) : (
                            <button
                              className="btn btn-sm btn-outline-success ms-2"
                              onClick={() =>
                                toggleVerificacaoCorda(user.email, true)
                              }
                              title="Marcar corda como verificada"
                            >
                              ✓ Confirmar corda
                            </button>
                          )}
                        </div>

                        <p className="mt-2">
                          <strong>Quando iniciou no grupo: </strong>
                          {perfilSel.inicioNoGrupo
                            ? `${formatarData(
                                perfilSel.inicioNoGrupo
                              )} | ${formatarTempoDeGrupo(
                                perfilSel.inicioNoGrupo
                              )}`
                            : "-"}
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

                      {/* CERTIFICADOS / TIMELINE */}
                      <Col xs={12}>
                        {tlLoading === user.email ? (
                          <Loading
                            variant="block"
                            size="sm"
                            message="Carregando certificados..."
                          />
                        ) : timeline.length > 0 ? (
                          <>
                            <h5 className="mt-3">Certificados</h5>
                            <ul className="list-unstyled">
                              {timeline
                                .slice()
                                .sort((a, b) =>
                                  (b.data || "").localeCompare(a.data || "")
                                )
                                .map((item) => {
                                  const isPdf = (item.fileName || "")
                                    .toLowerCase()
                                    .endsWith(".pdf");
                                  const fullUrl = `https://certificadoscapoeira.blob.core.windows.net/certificados/${
                                    user.email
                                  }/certificados/${encodeURIComponent(
                                    item.data
                                  )}/${encodeURIComponent(item.fileName)}`;

                                  const aprovado = item.status === "approved";
                                  const rejeitado = item.status === "rejected";

                                  return (
                                    <li
                                      key={item.id}
                                      className="d-flex justify-content-between align-items-center border rounded px-3 py-2 mb-2"
                                    >
                                      <div className="d-flex align-items-center gap-3">
                                        <div
                                          style={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: "50%",
                                            background: aprovado
                                              ? "#198754"
                                              : rejeitado
                                              ? "#dc3545"
                                              : "#6c757d",
                                          }}
                                        />
                                        <div>
                                          <div className="fw-semibold">
                                            {getCordaNome(item.corda) ||
                                              "(sem corda)"}
                                          </div>
                                          <small className="text-muted">
                                            Data: {formatarData(item.data)} •{" "}
                                            <span
                                              className={`badge ${
                                                aprovado
                                                  ? "bg-success"
                                                  : rejeitado
                                                  ? "bg-danger"
                                                  : "bg-warning text-dark"
                                              }`}
                                            >
                                              {aprovado
                                                ? "Confirmada"
                                                : rejeitado
                                                ? "Reprovada"
                                                : "Pendente de confirmação"}
                                            </span>
                                          </small>
                                        </div>
                                      </div>

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
                                        <button
                                          className="btn btn-sm btn-outline-success"
                                          onClick={() =>
                                            aprovarOuReprovar(
                                              user.email,
                                              item,
                                              "approved"
                                            )
                                          }
                                          disabled={aprovado}
                                          title="Confirmar certificado"
                                        >
                                          ✅ Confirmar
                                        </button>
                                        <button
                                          className="btn btn-sm btn-outline-danger"
                                          onClick={() =>
                                            aprovarOuReprovar(
                                              user.email,
                                              item,
                                              "rejected"
                                            )
                                          }
                                          disabled={rejeitado}
                                          title="Reprovar certificado"
                                        >
                                          ✖ Reprovar
                                        </button>
                                      </div>
                                    </li>
                                  );
                                })}
                            </ul>
                          </>
                        ) : (
                          <p className="text-muted mt-3 mb-0">
                            Nenhum certificado enviado.
                          </p>
                        )}
                      </Col>

                      {/* ACORDEON: Questionário do aluno */}
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
                            aria-controls={`q-aluno-${user.email}`}
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
                              id={`q-aluno-${user.email}`}
                              className="px-3 pb-3"
                            >
                              {(() => {
                                const q =
                                  (
                                    dadosUsuarios[user.email]?.questionarios ||
                                    {}
                                  ).aluno || {};
                                return (
                                  <div className="row g-2 pt-2">
                                    <div className="col-12">
                                      <p className="mb-2">
                                        <strong>Problema de saúde: </strong>
                                        {b(q.problemaSaude)}
                                      </p>
                                    </div>
                                    <div className="col-12">
                                      <p className="mb-2">
                                        <strong>Detalhe:</strong>{" "}
                                        {q.problemaSaudeDetalhe || "-"}
                                      </p>
                                    </div>

                                    <div className="col-12">
                                      <p className="mb-2">
                                        <strong>Já praticou capoeira?: </strong>
                                        {b(q.praticouCapoeira)}
                                      </p>
                                    </div>
                                    <div className="col-12">
                                      <p className="mb-2">
                                        <strong>Histórico na capoeira: </strong>
                                        {q.historicoCapoeira || "-"}
                                      </p>
                                    </div>

                                    <div className="col-12">
                                      <p className="mb-2">
                                        <strong>
                                          Outro esporte/atividade cultural?{" "}
                                        </strong>
                                        {b(q.outroEsporte)}
                                      </p>
                                    </div>
                                    <div className="col-12">
                                      <p className="mb-2">
                                        <strong>
                                          Detalhe do outro esporte:{" "}
                                        </strong>
                                        {q.outroEsporteDetalhe || "-"}
                                      </p>
                                    </div>

                                    <div className="col-12">
                                      <p className="mb-2">
                                        <strong>
                                          Já ficou algum tempo sem treinar
                                          capoeira? Por quanto tempo? Motivo?:{" "}
                                        </strong>
                                        {q.hiatoSemTreinar || "-"}
                                      </p>
                                    </div>

                                    <div className="col-12">
                                      <p className="mb-2">
                                        <strong>
                                          Objetivos com a capoeira:{" "}
                                        </strong>
                                        {q.objetivosCapoeira || "-"}
                                      </p>
                                    </div>

                                    <div className="col-12">
                                      <p className="mb-0">
                                        <strong>
                                          Sugestões para o ICMBC crescer
                                          positivamente:
                                        </strong>{" "}
                                        {q.sugestoesPontoDeCultura || "-"}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </Col>

                      {/* Controles de Nível e Permissões */}
                      <Col xs={12}>
                        <div className="pt-3 mt-2 border-top d-flex flex-wrap align-items-center gap-3">
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
                                {NIVEIS.map((n) => (
                                  <option key={n} value={n}>
                                    {n[0].toUpperCase() + n.slice(1)}
                                  </option>
                                ))}
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
                                (bloqueado: requer nível ≥ Graduado)
                              </small>
                            )}
                          </div>

                          <div>
                            <strong>Permitir edição do Questionário: </strong>
                            <select
                              className="form-select d-inline w-auto ms-2"
                              value={
                                dadosUsuarios[user.email]
                                  ?.podeEditarQuestionario
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
                                (bloqueado: requer nível ≥ Aluno)
                              </small>
                            )}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Modal de preview de arquivo */}
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
                e.currentTarget.onerror = null;
                e.currentTarget.src = fotoPadrao;
              }}
            />
          )}
        </Modal.Body>
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
              e.currentTarget.onerror = null;
              e.currentTarget.src = fotoPadrao;
            }}
          />
        </Modal.Body>
      </Modal>

      {/* Modal: Enviar certificados para o aluno selecionado */}
      {envioModalOpenForEmail && (
        <ModalArquivosPessoais
          show={!!envioModalOpenForEmail}
          onClose={() => setEnvioModalOpenForEmail(null)}
          onSave={async () => {
            await listarTimeline(envioModalOpenForEmail);
            setEnvioModalOpenForEmail(null);
          }}
          email={envioModalOpenForEmail}
        />
      )}
    </Container>
  );
};

export default PainelAdmin;
