// src/pages/AreaGraduado/AreaGraduado.jsx
import { useEffect, useRef, useState } from "react";
import { Container, Row, Col, Alert, Modal } from "react-bootstrap";
import { useMsal } from "@azure/msal-react";
import {
  criarPerfil,
  buscarPerfil,
  atualizarPerfilSelf,
} from "../../services/backend";
import { listarTimelineCertificados } from "../../services/certificados";
import CadastroInicial from "../../components/CadastroInicial/CadastroInicial";
import { getCordaNome } from "../../constants/nomesCordas";
import calcularIdade from "../../utils/calcularIdade";
import ModalEditarPerfil from "../../components/Modals/ModalEditarPerfil";
import http from "../../services/http";
import fotoPadrao from "../../assets/foto-perfil/foto-perfil-padrao.jpg";
import CropImageModal from "../../components/CropImageModal";
import { nivelMap } from "../../utils/roles";
import FileSection from "../../components/FileSection/FileSection";
import { getHorarioLabel } from "../../helpers/agendaTreino";
import { buscarCep } from "../../services/cep";
import { buildFullAddress } from "../../utils/address";
import { formatarData } from "../../utils/formatarData";
import { makeAvatarVariants } from "../../utils/imagePerfil";
import { setPerfilCache } from "../../utils/profileCache";
import QuestionarioAluno from "../../components/QuestionarioAluno/QuestionarioAluno";
import RequireAccess from "../../components/RequireAccess/RequireAccess";
import {
  getAuthEmail,
  getAuthProvider,
  signOutUnified,
} from "../../auth/session";
import Loading from "../../components/Loading/Loading";
import ModalArquivosPessoais from "../../components/Modals/ModalArquivosPessoais";
import "./AreaGraduado.scss";
import CalendarioAniversarios from "../../components/CalendarioAniversarios";

const API_URL = import.meta.env.VITE_API_URL;
const DEV_STRICT_DEBOUNCE_MS = 30;
const BLOB_BASE =
  "https://certificadoscapoeira.blob.core.windows.net/certificados";

const NIVEL_LABELS = {
  visitante: "Visitante",
  aluno: "Aluno(a)",
  graduado: "Graduado(a)",
  monitor: "Monitor(a)",
  instrutor: "Instrutor(a)",
  professor: "Professor(a)",
  contramestre: "Contramestre(a)",
  mestre: "Mestre(a)",
};

function getNivelLabel(nivel) {
  if (!nivel) return "";
  const key = String(nivel).trim().toLowerCase();
  return NIVEL_LABELS[key] || "";
}

/** Componente de Hierarquia de Integrantes */
function HierarquiaIntegrantes() {
  const [integrantes, setIntegrantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function fetchDiretorio() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/perfil/diretorio`);
        if (res.ok) setIntegrantes(await res.json());
      } catch (err) {
        console.error("Erro ao carregar diretório:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDiretorio();
  }, []);

  if (loading) return <div className="text-center p-4"><Loading /></div>;
  if (!integrantes.length) return null;

  // Agrupamento por corda
  const grupos = integrantes.reduce((acc, current) => {
    const corda = current.corda || "Sem Corda";
    if (!acc[corda]) acc[corda] = [];
    acc[corda] = [...acc[corda], current];
    return acc;
  }, {});

  // Ordem sugerida (Mestre -> Aluno)
  const cordaOrder = [
    "vermelha-mestre", "marrom-adulto", "roxa-adulto", "verde-adulto", "azul-adulto",
    "laranja-azul-adulto", "laranja-adulto", "amarela-laranja-adulto", "amarela-adulto",
    "cru-amarela-adulto", "cru-adulto"
  ];

  const sortedGroups = Object.keys(grupos)
    .sort((a, b) => {
      const ia = cordaOrder.indexOf(a);
      const ib = cordaOrder.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

  const thresholdIndex = cordaOrder.indexOf("azul-adulto");
  const topGroups = sortedGroups.filter(c => {
    const idx = cordaOrder.indexOf(c);
    return idx >= 0 && idx <= thresholdIndex;
  });
  const restGroups = sortedGroups.filter(c => {
    const idx = cordaOrder.indexOf(c);
    return idx > thresholdIndex || idx === -1;
  });

  const renderGroup = (cordaSvg) => (
    <div key={cordaSvg} className="mb-5">
      <div className="text-center mb-4">
        <h5
          className="fw-bold text-uppercase border-bottom d-inline-block pb-1 px-4"
          style={{ color: '#000000ff', letterSpacing: '1px', fontSize: '1rem' }}
        >
          {getCordaNome(cordaSvg)}
        </h5>
      </div>

      <div className="d-flex flex-wrap justify-content-center gap-3">
        {grupos[cordaSvg].map((u, i) => (
          <div
            key={i}
            className="integrante-card text-center p-3 border rounded shadow-sm bg-white"
            style={{ width: '150px', transition: 'transform 0.2s', cursor: 'pointer' }}
            onClick={() => setSelected(u)}
            title={`Ver detalhes de ${u.nome}`}
          >
            <div className="position-relative d-inline-block mb-2">
              <img
                src={u.foto || fotoPadrao}
                alt={u.nome}
                className="rounded-circle border border-2 shadow-sm"
                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                onError={(e) => { e.target.src = fotoPadrao; }}
              />
            </div>
            <div className="small fw-bold text-dark text-truncate px-1 mb-0" style={{ lineHeight: '1.2' }}>{u.nome}</div>
            {u.apelido && <div className="small text-muted fst-italic text-truncate mb-0" style={{ fontSize: '0.75rem' }}>{u.apelido}</div>}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="hierarquia-container mt-2">
      <h4 className="text-center mb-5 fw-bold text-dark">Hierarquia do Grupo</h4>

      {topGroups.map(renderGroup)}

      {restGroups.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            className="btn btn-outline-dark btn-sm rounded-pill px-4 mb-4 d-inline-flex align-items-center gap-2"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Ver menos' : 'Ver mais integrantes'}
            <i className={`bi bi-chevron-${showAll ? 'up' : 'down'}`}></i>
          </button>

          <div className={`overflow-hidden transition-all ${showAll ? 'opacity-100' : 'opacity-0'}`} style={{ maxHeight: showAll ? '5000px' : '0', transition: 'all 0.5s ease-in-out' }}>
            {restGroups.map(renderGroup)}
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Integrante */}
      <Modal show={!!selected} onHide={() => setSelected(null)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold w-100 text-center">{selected?.nome}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center pt-2 pb-4 px-4">
          <div className="d-flex justify-content-center mb-3">
            <img
              src={selected?.foto || fotoPadrao}
              alt={selected?.nome}
              className="rounded-circle border border-4 shadow"
              style={{ width: '150px', height: '150px', objectFit: 'cover' }}
              onError={(e) => { e.target.src = fotoPadrao; }}
            />
          </div>

          {selected?.apelido && (
            <h5 className="text-dark fw-bold mb-4">{selected.apelido}</h5>
          )}

          <div className="text-start mx-auto" style={{ maxWidth: '350px' }}>
            <p className="mb-2"><strong>Corda:</strong> {getCordaNome(selected?.corda)}</p>
            <p className="mb-2"><strong>Local:</strong> {selected?.localTreino || "-"}</p>
            <p className="mb-2">
              <strong>Horário:</strong> {(() => {
                if (!selected?.localTreino || !selected?.horarioTreino) return "-";
                const label = getHorarioLabel(selected.localTreino, selected.horarioTreino);
                // Transforma "20h às 21:30h - Adolescentes e adultos." em "20h às 21:30h | Adultos"
                return label
                  .replace(" - ", " | ")
                  .replace("Adolescentes e adultos.", "Adultos")
                  .replace("Crianças de 6 a 12 anos.", "Crianças")
                  .replace(/\.$/, "");
              })()}
            </p>
            <p className="mb-2">
              <strong>Tempo de Grupo:</strong> {formatarTempoDeGrupo(selected?.inicioNoGrupo)}
            </p>

            {selected?.whatsapp && (
              <div className="mt-4 text-center">
                <a
                  href={`https://wa.me/55${selected.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-success rounded-pill px-5 fw-bold"
                >
                  <i className="bi bi-whatsapp me-2"></i> WhatsApp
                </a>
              </div>
            )}
          </div>
        </Modal.Body>
      </Modal>

      <style>
        {`
          .integrante-card:hover {
            transform: translateY(-5px);
            border-color: #8b0000 !important;
            box-shadow: 0 4px 12px rgba(139,0,0,0.1) !important;
          }
        `}
      </style>
    </div>
  );
}

/** Campos obrigatórios do seu cadastro inicial */
const REQUIRED_FIELDS = [
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
  "inicioNoGrupo",
];

/** Retorna true se o perfil estiver faltando algo (ou não aceitou termos) */
function isPerfilIncompleto(p) {
  if (!p) return true;
  if (!p.aceitouTermos) return true;
  for (const k of REQUIRED_FIELDS) {
    const v = p?.[k];
    if (v === undefined || v === null) return true;
    if (typeof v === "string" && v.trim() === "") return true;
  }
  return false;
}

function formatarTempoDeGrupo(data) {
  if (!data) return "-";
  const start = new Date(data);
  const now = new Date();
  if (isNaN(start.getTime())) return "-";

  let diffMonths =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) {
    diffMonths--;
  }

  if (diffMonths <= 0) return "menos de 1 mês";

  const anos = Math.floor(diffMonths / 12);
  const meses = diffMonths % 12;

  if (anos >= 1) {
    const anosStr = anos === 1 ? "1 ano" : `${anos} anos`;
    const mesesStr =
      meses === 0 ? "" : meses === 1 ? " e 1 mês" : ` e ${meses} meses`;
    return `${anosStr}${mesesStr}`;
  }

  return meses === 1 ? "1 mês" : `${meses} meses`;
}

const AreaGraduado = () => {
  const { instance } = useMsal();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({ nome: "", email: "" });
  const [perfil, setPerfil] = useState({
    nome: "",
    apelido: "",
    corda: "",
    inicioNoGrupo: "",
    genero: "",
    racaCor: "",
    numero: "",
    endereco: "",
    complemento: "",
    dataNascimento: "",
    nivelAcesso: "",
  });

  const [formEdit, setFormEdit] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCadastroInicial, setShowCadastroInicial] = useState(false);
  const [showCalendario, setShowCalendario] = useState(false);
  const [aniversarios, setAniversarios] = useState([]);

  // ===== Chamada (Monitor+) =====
  const [showChamada, setShowChamada] = useState(false);
  const [chamadaLoading, setChamadaLoading] = useState(false);
  const [chamadaMonthISO, setChamadaMonthISO] = useState(() =>
    new Date().toISOString().slice(0, 7),
  ); // YYYY-MM
  const [chamadaView, setChamadaView] = useState("chamada"); // 'chamada' | 'frequencia'
  const [chamadaLista, setChamadaLista] = useState([]); // [{ id, nome }]
  const [chamadaDias, setChamadaDias] = useState([]); // [{ dateISO, label, weekday }]
  const [chamadaPresencas, setChamadaPresencas] = useState({}); // { [dateISO]: { [id]: true } }

  const [cep, setCep] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [logradouro, setLogradouro] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");

  const [fotoPreview, setFotoPreview] = useState(null);
  const [temFotoRemota, setTemFotoRemota] = useState(false);
  const [cropModal, setCropModal] = useState(false);
  const [rawImage, setRawImage] = useState(null);
  const [fotoCarregando, setFotoCarregando] = useState(true);
  const [avatar1x, setAvatar1x] = useState(null);
  const [avatar2x, setAvatar2x] = useState(null);

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarModalUrl, setAvatarModalUrl] = useState(null);

  const [showQuestionarioAluno, setShowQuestionarioAluno] = useState(false);

  // Modal de envio (corda + data + arquivo)
  const [showEnvioCerts, setShowEnvioCerts] = useState(false);

  // Timeline persistida (vinda do back)
  const [certTimeline, setCertTimeline] = useState([]);

  // ===== Laudos (apenas visualização) =====
  const [laudos, setLaudos] = useState([]);
  const [laudoPreviewOpen, setLaudoPreviewOpen] = useState(false);
  const [laudoPreviewUrl, setLaudoPreviewUrl] = useState("");
  const [laudoPreviewIsPdf, setLaudoPreviewIsPdf] = useState(false);

  const openLaudoPreview = (item) => {
    if (!item?.nome || !userData?.email) return;
    const isPdf = item.nome.toLowerCase().endsWith(".pdf");
    const url = `${BLOB_BASE}/${encodeURIComponent(
      userData.email,
    )}/laudos/${encodeURIComponent(item.nome)}`;
    setLaudoPreviewIsPdf(isPdf);
    setLaudoPreviewUrl(url);
    setLaudoPreviewOpen(true);
  };

  const [feedback, setFeedback] = useState({
    show: false,
    variant: "danger",
    message: "",
  });
  const showError = (message) =>
    setFeedback({ show: true, variant: "danger", message });
  const showSuccess = (message) =>
    setFeedback({ show: true, variant: "success", message });
  const hideFeedback = () =>
    setFeedback((p) => ({ ...p, show: false, message: "" }));

  // acordeon do questionário na Área Graduado
  const [questionarioOpen, setQuestionarioOpen] = useState(false);

  const abortRef = useRef(null);
  const reqSeq = useRef(0);

  const testImage = (url, mySeq) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () =>
        mySeq === reqSeq.current ? resolve(true) : resolve(false);
      img.onerror = () =>
        mySeq === reqSeq.current ? resolve(false) : resolve(false);
      img.src = url;
    });

  // ====== Preview/Excluir da timeline ======
  const [tlPreviewOpen, setTlPreviewOpen] = useState(false);
  const [tlPreviewUrl, setTlPreviewUrl] = useState("");
  const [tlPreviewIsPdf, setTlPreviewIsPdf] = useState(false);

  // monta caminho relativo esperado pelo backend: certificados/YYYY-MM-DD/arquivo.ext
  const buildBlobPath = (item) => `certificados/${item.data}/${item.fileName}`;

  // PREVIEW: usa URL pública direta do Blob
  const openTimelinePreview = (item) => {
    const isPdf = (item.fileName || "").toLowerCase().endsWith(".pdf");
    const url = `${BLOB_BASE}/${encodeURIComponent(
      userData.email,
    )}/certificados/${encodeURIComponent(item.data)}/${encodeURIComponent(
      item.fileName,
    )}`;
    setTlPreviewIsPdf(isPdf);
    setTlPreviewUrl(url);
    setTlPreviewOpen(true);
  };

  // DELETE
  const deleteTimelineItem = async (item) => {
    // trava: não excluir certificados já verificados pelo Mestre
    if (item?.status === "approved") {
      showError(
        "Este certificado já foi confirmado pelo Mestre e não pode ser excluído.",
      );
      return;
    }

    try {
      const blobPath = buildBlobPath(item);
      await http.delete(
        `${API_URL}/upload?email=${encodeURIComponent(
          userData.email,
        )}&arquivo=${encodeURIComponent(blobPath)}`,
      );

      setCertTimeline((prev) => prev.filter((x) => x.id !== item.id));
      showSuccess("Arquivo removido.");
    } catch (e) {
      console.error(e);
      showError("Não foi possível remover este arquivo.");
    }
  };

  // ===== util: carregar laudos =====
  const carregarLaudos = async (email) => {
    try {
      const { data } = await http.get(`${API_URL}/upload/laudos`, {
        params: { email },
      });
      setLaudos(Array.isArray(data?.arquivos) ? data.arquivos : []);
    } catch (e) {
      console.error("Erro ao listar laudos:", e?.message || e);
      setLaudos([]);
    }
  };

  // ===== Boot / carregamento principal =====
  useEffect(() => {
    const email = getAuthEmail();
    if (!email) return; // ProtectedRoute já barra

    const provider = getAuthProvider();
    const msalAcc = instance.getActiveAccount?.();
    setUserData({
      nome: provider === "microsoft" ? msalAcc?.name || "" : "",
      email,
    });

    let cancelled = false;
    let timer = null;

    const run = async () => {
      if (cancelled) return;

      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const mySeq = ++reqSeq.current;

      try {
        const perfilPromise = (async () => {
          try {
            const p = await buscarPerfil(email, { signal: controller.signal });
            if (mySeq !== reqSeq.current) return;
            if (p) {
              setPerfil(p);
              setPerfilCache(email, p);
              setShowCadastroInicial(isPerfilIncompleto(p));
            } else {
              setShowCadastroInicial(true);
            }
          } catch {
            if (mySeq !== reqSeq.current) return;
            setShowCadastroInicial(true);
          }
        })();

        const fotoPromise = (async () => {
          const base = `${BLOB_BASE}/${email}`;
          const url1x = `${base}/foto-perfil@1x.jpg?${Date.now()}`;
          const urlLegacy = `${base}/foto-perfil.jpg?${Date.now()}`;

          let url = fotoPadrao;
          let hasRemote = false;

          if (await testImage(url1x, mySeq)) {
            url = url1x;
            hasRemote = true;
          } else if (await testImage(urlLegacy, mySeq)) {
            url = urlLegacy;
            hasRemote = true;
          }

          if (mySeq !== reqSeq.current) return;
          setFotoPreview(url);
          setTemFotoRemota(hasRemote);
          setFotoCarregando(false);
        })();

        const timelinePromise = (async () => {
          try {
            const items = await listarTimelineCertificados(email, {
              signal: controller.signal,
            });
            if (mySeq !== reqSeq.current) return;
            setCertTimeline(items || []);
          } catch (e) {
            if (mySeq !== reqSeq.current) return;
            console.error("Falha ao carregar timeline:", e?.message || e);
            setCertTimeline([]);
          }
        })();

        const laudosPromise = (async () => {
          try {
            await carregarLaudos(email);
          } catch {
            /* já tratado na função */
          }
        })();

        await Promise.allSettled([
          perfilPromise,
          fotoPromise,
          timelinePromise,
          laudosPromise,
        ]);
      } finally {
        if (mySeq === reqSeq.current) setLoading(false);
      }
    };

    if (import.meta.env?.DEV) {
      timer = setTimeout(run, DEV_STRICT_DEBOUNCE_MS);
    } else {
      run();
    }

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [instance]);

  useEffect(() => {
    if (!showCalendario) return;
    // mês atual (1-12)
    const month = new Date().getMonth() + 1;
    http
      .get(`${API_URL}/perfil/__public/aniversarios`, {
        params: { month, limit: 2000 },
      })
      .then(({ data }) => setAniversarios(Array.isArray(data) ? data : []))
      .catch(() => setAniversarios([]));
  }, [showCalendario]);

  // ===== Chamada (Monitor+) =====
  const getChamadaKey = (monthISO) => `mbc_chamada_v2:${monthISO}`;

  const getDiasDeAulaNoMes = (monthISO) => {
    const [yy, mm] = String(monthISO)
      .split("-")
      .map((x) => Number(x));
    if (!yy || !mm) return [];

    const pad2 = (n) => String(n).padStart(2, "0");
    const dias = [];
    const lastDay = new Date(yy, mm, 0).getDate();

    for (let day = 1; day <= lastDay; day++) {
      const d = new Date(yy, mm - 1, day);
      const dow = d.getDay();
      // aulas: terça (2) e quinta (4)
      if (dow !== 2 && dow !== 4) continue;

      const dateISO = `${yy}-${pad2(mm)}-${pad2(day)}`;
      dias.push({
        dateISO,
        label: d.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
        weekday: d.toLocaleDateString("pt-BR", { weekday: "short" }),
      });
    }

    return dias;
  };

  const carregarChamada = async (monthISO = chamadaMonthISO) => {
    setChamadaLoading(true);
    try {
      // busca lista mínima (nome + id pseudônimo) no backend
      const { data } = await http.get(`${API_URL}/chamada/pessoas`);
      const list = Array.isArray(data?.items) ? data.items : [];
      const normalized = (Array.isArray(list) ? list : [])
        .map((u) => ({
          id: u.id || "",
          nome: (u.nome || "").trim(),
        }))
        .filter((u) => !!u.id)
        .sort((a, b) => (a.nome || a.id).localeCompare(b.nome || b.id));

      setChamadaLista(normalized);

      const dias = getDiasDeAulaNoMes(monthISO);
      setChamadaDias(dias);

      // tenta carregar do backend (Azure Blob). Se não existir/der erro, cai no localStorage.
      let entries = {};
      try {
        const res = await http.get(`${API_URL}/chamada`, {
          params: { month: monthISO },
        });
        const serverData = res?.data?.data;
        if (serverData?.entries && typeof serverData.entries === "object") {
          entries = serverData.entries;
        }
      } catch {
        // fallback local (compatibilidade)
        try {
          const raw = localStorage.getItem(getChamadaKey(monthISO));
          const saved = raw ? JSON.parse(raw) : null;
          if (saved?.entries && typeof saved.entries === "object") {
            entries = saved.entries;
          }
        } catch {
          entries = {};
        }
      }

      const base = {};
      for (const d of dias) {
        const presentesNoDia = new Set(
          Array.isArray(entries?.[d.dateISO]) ? entries[d.dateISO] : [],
        );
        base[d.dateISO] = {};
        for (const u of normalized) {
          base[d.dateISO][u.id] = presentesNoDia.has(u.id);
        }
      }

      setChamadaPresencas(base);
    } catch (e) {
      console.error(e);
      showError("Não foi possível carregar a lista para chamada.");
      setChamadaLista([]);
      setChamadaDias([]);
      setChamadaPresencas({});
    } finally {
      setChamadaLoading(false);
    }
  };

  const abrirChamada = async () => {
    const monthISO = new Date().toISOString().slice(0, 7);
    setChamadaMonthISO(monthISO);
    setChamadaView("chamada");
    setShowChamada(true);
    await carregarChamada(monthISO);
  };

  const salvarChamada = () => {
    const preenchidoPorNome = (perfil?.nome || userData.nome || "").trim();
    const payload = {
      monthISO: chamadaMonthISO,
      preenchidoPorNome,
      entries: {},
      totalPessoas: chamadaLista.length,
      updatedAt: new Date().toISOString(),
    };

    for (const d of chamadaDias) {
      const presentes = Object.entries(chamadaPresencas?.[d.dateISO] || {})
        .filter(([, v]) => v === true)
        .map(([id]) => id);
      payload.entries[d.dateISO] = presentes;
    }

    try {
      // 1) salva local (backup / compatibilidade)
      localStorage.setItem(
        getChamadaKey(chamadaMonthISO),
        JSON.stringify(payload),
      );
    } catch {
      // não bloqueia: ainda tentaremos salvar no servidor
    }

    // 2) salva no servidor (Azure Blob)
    http
      .put(`${API_URL}/chamada`, payload, {
        params: { month: chamadaMonthISO },
      })
      .then(() => {
        showSuccess("Chamada salva.");
        setShowChamada(false);
      })
      .catch((e) => {
        console.error(e);
        showError(
          "Não foi possível salvar a chamada no servidor. Ela pode ter ficado salva apenas neste dispositivo.",
        );
      });
  };

  // ===== Foto: seleção / corte / upload =====
  const handleFotoChange = (e) => {
    hideFeedback();
    const file = e.target.files?.[0];
    const allowedTypes = ["image/png", "image/jpeg"];
    if (file && allowedTypes.includes(file.type)) {
      const reader = new FileReader();
      reader.onload = () => {
        setRawImage(reader.result);
        setCropModal(true);
      };
      reader.readAsDataURL(file);
    } else {
      showError("Envie uma imagem JPG ou PNG.");
    }
  };

  const handleCroppedSave = async (croppedFile) => {
    hideFeedback();
    try {
      const { oneXFile, twoXFile } = await makeAvatarVariants(croppedFile);
      setAvatar1x(oneXFile);
      setAvatar2x(twoXFile);
      setFotoPreview(URL.createObjectURL(oneXFile));
    } catch (err) {
      console.error(err);
      showError("Não foi possível processar a imagem.");
    } finally {
      setCropModal(false);
    }
  };

  const salvarFoto = async () => {
    hideFeedback();
    if (!avatar1x || !avatar2x) return;

    const urlBase = `${API_URL}/upload/foto-perfil?email=${userData.email}`;
    const f1 = new FormData();
    f1.append("arquivo", avatar1x);
    const f2 = new FormData();
    f2.append("arquivo", avatar2x);

    try {
      await Promise.all([
        http.post(`${urlBase}&name=foto-perfil@1x.jpg`, f1),
        http.post(`${urlBase}&name=foto-perfil@2x.jpg`, f2),
      ]);
      showSuccess("Foto atualizada com sucesso!");
      setAvatar1x(null);
      setAvatar2x(null);
      setTemFotoRemota(true);
      setFotoPreview(
        `${BLOB_BASE}/${userData.email}/foto-perfil@1x.jpg?${Date.now()}`,
      );
    } catch (e) {
      console.error(e);
      showError("Erro ao enviar a foto.");
    }
  };

  const handleRemoverFoto = async () => {
    hideFeedback();
    try {
      await http.delete(
        `${API_URL}/upload/foto-perfil?email=${userData.email}`,
      );
      setFotoPreview(fotoPadrao);
      setAvatar1x(null);
      setAvatar2x(null);
      setTemFotoRemota(false);
      showSuccess("Foto removida com sucesso!");
    } catch {
      showError("Erro ao remover a foto.");
    }
  };

  // ===== Endereço / CEP =====
  const buscarEnderecoPorCep = async () => {
    hideFeedback();
    if (!cep) return;
    setBuscandoCep(true);
    try {
      const data = await buscarCep(cep);
      setLogradouro(data.logradouro);
      setBairro(data.bairro);
      setCidade(data.cidade);
      setUf(data.uf);

      // monta endereço já considerando número + complemento (se houver)
      if (formEdit?.numero || formEdit?.complemento) {
        const endereco = buildFullAddress({
          ...data,
          numero: formEdit?.numero || "",
          complemento: formEdit?.complemento || "",
        });
        setFormEdit((prev) => ({
          ...prev,
          endereco,
        }));
      }
    } catch (e) {
      showError(e?.message || "Erro ao buscar o CEP.");
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleNumeroChange = (e) => {
    hideFeedback();
    const numero = e.target.value;
    const complementoAtual = (formEdit?.complemento || "").trim();

    const endereco = logradouro
      ? buildFullAddress({
        logradouro,
        numero,
        bairro,
        cidade,
        uf,
        complemento: complementoAtual,
      })
      : "";

    setFormEdit((prev) => ({
      ...prev,
      numero,
      endereco,
    }));
  };

  // ===== Sair (unificado) =====
  const handleSignOut = async () => {
    await signOutUnified();
  };

  // ===== Permissões =====
  const nivelUsuario = nivelMap[perfil.nivelAcesso] ?? 0;
  const canAccess = (minLevel) => nivelUsuario >= minLevel;
  const isMestre = userData.email === "contato@capoeiraminasbahia.com.br";

  useEffect(() => {
    const ehAlunoOuMais = (nivelMap[perfil.nivelAcesso] ?? 0) >= 1;
    const jaRespondeu = Boolean(perfil?.questionarios?.aluno);
    if (ehAlunoOuMais && !jaRespondeu) setShowQuestionarioAluno(true);
  }, [perfil.nivelAcesso, perfil?.questionarios]);

  // ===== Salvar Perfil (editar perfil modal) =====
  const salvarPerfil = async () => {
    hideFeedback();

    const obrigatorios = [
      "nome",
      "genero",
      "numero",
      "endereco",
      "racaCor",
      "whatsapp",
      "contatoEmergencia",
      "dataNascimento",
      "corda",
    ];
    const vazios = obrigatorios.filter(
      (campo) => !formEdit[campo] || formEdit[campo].trim() === "",
    );
    if (vazios?.length > 0) {
      showError("Preencha todos os campos obrigatórios.");
      return;
    }

    const atualizado = {
      ...formEdit,
      apelido: formEdit.apelido?.trim() || "",
      complemento: formEdit.complemento?.trim() || "",
      id: userData.email,
      email: userData.email,
    };

    try {
      // chama rota pública PUT /perfil/self
      const salvoNoBack = await atualizarPerfilSelf(atualizado);

      // mantém estado alinhado com o que o back realmente salvou
      setPerfil(salvoNoBack || atualizado);

      setShowEditModal(false);
      showSuccess("Perfil atualizado com sucesso!");
    } catch (e) {
      console.error("Falha ao salvar perfil:", e);
      const status = e?.status;
      const detalhe =
        e?.body?.erro ||
        e?.body?.error ||
        e?.message ||
        "Não foi possível atualizar seu perfil.";

      if (status === 401) {
        showError(
          "Não foi possível salvar (401). Isso pode acontecer no celular se o navegador bloqueou a sessão. Tente novamente.",
        );
      } else if (status === 409) {
        showError(
          "Não foi possível salvar: CPF já cadastrado em outra conta. Verifique.",
        );
      } else {
        showError(detalhe);
      }
    }
  };

  // ===== Salvar Questionário do Aluno =====
  const salvarQuestionarioAluno = async (respostas) => {
    const payload = {
      questionarios: {
        ...(perfil.questionarios || {}),
        aluno: { ...respostas },
      },
    };

    try {
      const salvoNoBack = await atualizarPerfilSelf({
        ...payload,
        id: userData.email,
        email: userData.email,
      });

      setPerfil((prev) => ({
        ...prev,
        questionarios:
          salvoNoBack?.questionarios || payload.questionarios || {},
      }));

      setShowQuestionarioAluno(false);
      showSuccess("Questionário do aluno salvo com sucesso!");
    } catch (e) {
      console.error(e);
      showError("Não foi possível salvar o questionário do aluno.");
    }
  };

  if (loading)
    return <Loading variant="block" size="md" message="Carregando dados..." />;

  const isRemotePreview =
    typeof fotoPreview === "string" && fotoPreview.startsWith("http");

  const openAvatarModal = () => {
    let url = fotoPreview;
    if (isRemotePreview && fotoPreview.includes("@1x")) {
      url = fotoPreview.replace("@1x", "@2x");
    } else if (!isRemotePreview && avatar2x) {
      url = URL.createObjectURL(avatar2x);
    }
    setAvatarModalUrl(url);
    setShowAvatarModal(true);
  };

  const nivelDisplay = getNivelLabel(perfil.nivelAcesso) || "-";
  const podeEditarQuestionario = !!perfil?.podeEditarQuestionario;

  const b = (v) => (v === true ? "Sim" : v === false ? "Não" : "-");

  const sortedTimeline = [...certTimeline].sort((a, b) =>
    (b.data || "").localeCompare(a.data || ""),
  );

  // 🔒 trava de envio/exclusão após verificação da corda
  const envioBloqueado = perfil?.cordaVerificada === true;

  return (
    <Container fluid className="min-h-screen p-4">
      {feedback.show && (
        <Alert
          variant={feedback.variant}
          dismissible
          onClose={hideFeedback}
          className="mb-3"
        >
          {feedback.message}
        </Alert>
      )}

      <Row className="mb-4">
        <Col className="bg-light p-3">
          <h4>
            {nivelDisplay}: {perfil.nome || userData.nome}
            {perfil.apelido ? ` - ${perfil.apelido}` : ""}
          </h4>
        </Col>
      </Row>

      <Row>
        <Col md={2} className="border p-3 d-flex flex-column gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              hideFeedback();
              setFormEdit({ ...perfil });
              setShowEditModal(true);
            }}
          >
            Editar Perfil
          </button>
          <RequireAccess nivelMinimo="aluno">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={!canAccess(1) || !podeEditarQuestionario}
              title={
                !canAccess(1)
                  ? "Disponível apenas para nível 'Aluno' ou superior"
                  : !podeEditarQuestionario
                    ? "Edição desativada pelo Mestre no Painel Admin"
                    : ""
              }
              onClick={() => setShowQuestionarioAluno(true)}
            >
              Editar Questionário
            </button>
          </RequireAccess>
          <button
            type="button"
            onClick={handleSignOut}
            className="btn btn-danger"
          >
            Sair
          </button>
        </Col>

        <Col md={10} className="border p-3">
          <h5 className="text-center">Perfil</h5>

          <Row className="align-items-start gy-3 gx-0">
            <Col
              xs={12}
              md={4}
              className="order-1 order-md-2 d-flex flex-column align-items-center"
            >
              {fotoCarregando ? (
                <div
                  className="spinner-border text-secondary mb-3"
                  role="status"
                >
                  <Loading
                    variant="block"
                    size="md"
                    message="Carregando dados..."
                  />
                </div>
              ) : (
                <img
                  src={fotoPreview}
                  srcSet={
                    isRemotePreview && fotoPreview.includes("@1x")
                      ? `${fotoPreview} 1x, ${fotoPreview.replace(
                        "@1x",
                        "@2x",
                      )} 2x`
                      : undefined
                  }
                  alt="Foto de perfil"
                  className="rounded mb-2"
                  width={150}
                  height={200}
                  style={{
                    objectFit: "cover",
                    border: "2px solid #ccc",
                    imageRendering: "auto",
                    cursor: "zoom-in",
                  }}
                  onClick={() =>
                    temFotoRemota || avatar1x ? openAvatarModal() : null
                  }
                />
              )}

              <label className="btn btn-outline-secondary btn-sm mb-2">
                Trocar Foto
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleFotoChange}
                  hidden
                />
              </label>

              {avatar1x && (
                <button
                  type="button"
                  className="btn btn-success btn-sm mb-2"
                  onClick={salvarFoto}
                >
                  Salvar Foto
                </button>
              )}

              {temFotoRemota && !avatar1x && (
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={handleRemoverFoto}
                >
                  Remover Foto
                </button>
              )}
            </Col>

            <Col xs={12} md={8} className="order-2 order-md-1">
              <div className="pe-md-3">
                <p>
                  <strong>Nome: </strong> {perfil.nome || "-"}
                </p>
                <p>
                  <strong>Apelido: </strong> {perfil.apelido || "-"}
                </p>
                <p>
                  <strong>Corda: </strong>
                  {getCordaNome(perfil.corda) || "-"}{" "}
                  {perfil.cordaVerificada ? (
                    <span className="badge bg-success ms-2">Confirmada</span>
                  ) : (
                    <span className="badge bg-warning text-dark ms-2">
                      Não verificada
                    </span>
                  )}
                </p>
                <p>
                  <strong>Quando iniciou no grupo: </strong>
                  {perfil.inicioNoGrupo
                    ? `${formatarData(
                      perfil.inicioNoGrupo,
                    )} | ${formatarTempoDeGrupo(perfil.inicioNoGrupo)}`
                    : "-"}
                </p>

                <p>
                  <strong>Gênero:</strong> {perfil.genero || "-"}
                </p>
                <p>
                  <strong>Raça/Cor:</strong> {perfil.racaCor || "-"}
                </p>
                <p>
                  <strong>Data de Nascimento e Idade: </strong>
                  {perfil.dataNascimento
                    ? `${formatarData(perfil.dataNascimento)} | ${calcularIdade(
                      perfil.dataNascimento,
                    )} anos`
                    : "-"}
                </p>
                <p>
                  <strong>WhatsApp (pessoal):</strong> {perfil.whatsapp || "-"}
                </p>
                <p>
                  <strong>Contato de emergência / responsável:</strong>{" "}
                  {perfil.contatoEmergencia || "-"}
                </p>
                <p>
                  <strong>Endereço: </strong>
                  {perfil.endereco || "-"} / {perfil.complemento}
                </p>
                <p>
                  <strong>Local e horário de treino: </strong>
                  {perfil.localTreino || "-"} |{" "}
                  {getHorarioLabel(perfil.localTreino, perfil.horarioTreino) ||
                    "-"}
                </p>
                <p>
                  <strong>Professor referência: </strong>
                  {perfil.professorReferencia || "-"}
                </p>

                {/* ===== Acordeon do Questionário ===== */}
                <RequireAccess nivelMinimo="aluno">
                  <div className="border rounded mt-3">
                    <button
                      type="button"
                      className="w-100 text-start bg-white border-0 px-3 py-2 d-flex justify-content-between align-items-center"
                      onClick={() => setQuestionarioOpen((v) => !v)}
                      aria-expanded={questionarioOpen}
                      aria-controls="q-aluno-area"
                      style={{ cursor: "pointer" }}
                      title="Ver respostas do questionário"
                    >
                      <span className="fw-semibold">Questionário</span>
                      <span>{questionarioOpen ? "▲" : "▼"}</span>
                    </button>

                    {questionarioOpen && (
                      <div id="q-aluno-area" className="px-3 pb-3">
                        {(() => {
                          const q = (perfil.questionarios || {}).aluno || {};
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
                                  <strong>
                                    Se sim, qual problema de saúde você
                                    possui?:{" "}
                                  </strong>
                                  {q.problemaSaudeDetalhe || "-"}
                                </p>
                              </div>

                              <div className="col-12">
                                <p className="mb-2">
                                  <strong>Já praticou capoeira antes?: </strong>
                                  {b(q.praticouCapoeira)}
                                </p>
                              </div>
                              <div className="col-12">
                                <p className="mb-2">
                                  <strong>
                                    Se sim, em qual grupo? Com quem
                                    (mestre/professor)? Por quanto tempo?:{" "}
                                  </strong>
                                  {q.historicoCapoeira || "-"}
                                </p>
                              </div>

                              <div className="col-12">
                                <p className="mb-2">
                                  <strong>
                                    Pratica ou já praticou outro
                                    esporte/atividade cultural?:{" "}
                                  </strong>
                                  {b(q.outroEsporte)}
                                </p>
                              </div>
                              <div className="col-12">
                                <p className="mb-2">
                                  <strong>
                                    Se sim, qual atividade e durante quanto
                                    tempo?:{" "}
                                  </strong>
                                  {q.outroEsporteDetalhe || "-"}
                                </p>
                              </div>

                              <div className="col-12">
                                <p className="mb-2">
                                  <strong>
                                    Já ficou algum tempo sem treinar capoeira?
                                    Por quanto tempo? Qual o motivo?:{" "}
                                  </strong>
                                  {q.hiatoSemTreinar || "-"}
                                </p>
                              </div>

                              <div className="col-12">
                                <p className="mb-2">
                                  <strong>
                                    Quais os seus objetivos com a
                                    capoeira?:{" "}
                                  </strong>
                                  {q.objetivosCapoeira || "-"}
                                </p>
                              </div>

                              <div className="col-12">
                                <p className="mb-0">
                                  <strong>
                                    Sugestões para o ICMBC (Ponto de Cultura)
                                    crescer de forma positiva?:{" "}
                                  </strong>
                                  {q.sugestoesPontoDeCultura || "-"}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </RequireAccess>
                {/* ===== fim acordeon ===== */}

                {/* ===== Visualização de Laudo (apenas se marcou "Sim" e houver laudo) ===== */}
                {(() => {
                  const q = (perfil.questionarios || {}).aluno || {};
                  const temProblemaSaude = q.problemaSaude === true;
                  const temLaudos = laudos.length > 0;
                  if (!temProblemaSaude || !temLaudos) return null;

                  const primeiro = laudos[0];
                  const extras =
                    laudos.length > 1
                      ? ` (+${laudos.length - 1} outro${laudos.length - 1 > 1 ? "s" : ""
                      })`
                      : "";

                  return (
                    <div className="border rounded p-2 mt-3 d-flex align-items-center justify-content-between">
                      <div>
                        <strong>Laudo médico</strong>
                        <small className="text-muted ms-2">{extras}</small>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => openLaudoPreview(primeiro)}
                        title="Visualizar laudo"
                      >
                        Visualizar laudo
                      </button>
                    </div>
                  );
                })()}
                {/* ===== fim visualização de laudo ===== */}
              </div>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* ===== Arquivos Pessoais + Timeline ===== */}
      {canAccess(1) && (
        <Row className="mt-4">
          <Col md={12} className="border p-4">
            <div className="text-center">
              <h5 className="mb-2">Arquivos Pessoais (Certificados)</h5>
              <p className="text-muted mb-3">
                Para <strong>verificar sua corda</strong>, envie os{" "}
                <strong>certificados</strong> correspondentes e informe a{" "}
                <strong>data</strong> que recebeu.
              </p>
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => setShowEnvioCerts(true)}
                title="Enviar certificados por corda"
                disabled={envioBloqueado}
              >
                📎 Enviar Arquivo
              </button>
              {envioBloqueado && (
                <p className="small text-muted mt-2">
                  Envio desativado: sua corda foi confirmada pelo Mestre.
                </p>
              )}
            </div>

            {/* Timeline */}
            <div className="mt-4">
              <h6 className="mb-3">Histórico de graduações (timeline)</h6>
              {sortedTimeline.length === 0 ? (
                <p className="text-muted mb-0">
                  Nenhum envio ainda. Após enviar, suas graduações aparecerão
                  aqui para análise e confirmação.
                </p>
              ) : (
                <ul className="list-unstyled">
                  {sortedTimeline.map((item) => {
                    const label = getCordaNome(item.corda) || "(sem corda)";
                    const dataFmt = item.data ? formatarData(item.data) : "-";
                    const isPdf = (item.fileName || "")
                      .toLowerCase()
                      .endsWith(".pdf");

                    const aprovado = item.status === "approved";
                    const rejeitado = item.status === "rejected";
                    const bloqueadoPorAprovacao = aprovado;

                    return (
                      <li
                        key={item.id}
                        className="tl-item d-flex align-items-center justify-content-between border rounded px-3 py-2 mb-2"
                      >
                        <div className="tl-left d-flex align-items-center gap-3">
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
                            <div className="fw-semibold">{label}</div>
                            <small className="text-muted">
                              Data: {dataFmt} •{" "}
                              <span
                                className={`tl-badge badge ${aprovado
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

                        <div className="tl-actions d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openTimelinePreview(item)}
                            title="Visualizar certificado"
                          >
                            {isPdf ? "📄 Abrir PDF" : "🔍 Visualizar"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => deleteTimelineItem(item)}
                            disabled={envioBloqueado || bloqueadoPorAprovacao}
                            title={
                              envioBloqueado
                                ? "Envio/exclusão desativados: sua corda já foi confirmada."
                                : bloqueadoPorAprovacao
                                  ? "Este certificado foi confirmado pelo Mestre e não pode ser excluído."
                                  : "Excluir este arquivo"
                            }
                          >
                            🗑 Excluir
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Col>
        </Row>
      )}

      {/* áreas de arquivos públicas por nível */}
      {canAccess(1) && (
        <Row className="mt-4">
          <Col md={12} className="border p-3 text-center">
            <h5>Arquivos para Alunos(as)</h5>
            <p>Área para documentos de download público</p>
            <div className="grid-list-3">
              <FileSection pasta="aluno" canUpload={isMestre} />
            </div>
          </Col>
          {/* <Col md={12} className="border p-3 text-center">
            <HierarquiaIntegrantes />
          </Col> */}
        </Row>

      )}

      {canAccess(2) && (
        <Row className="mt-4">
          <Col md={12} className="border p-3 text-center">
            <h5>Arquivos para Graduados(as)</h5>
            <p>Área para documentos de download público</p>
            <FileSection pasta="graduado" canUpload={isMestre} />
          </Col>
        </Row>
      )}

      {canAccess(3) && (
        <Row className="mt-4">
          <Col md={12} className="border p-4">
            <div className="d-flex flex-column align-items-center gap-2">
              <div className="d-flex justify-content-center gap-2 flex-wrap w-100">
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm d-inline-flex flex-row align-items-center gap-1 text-nowrap"
                  onClick={() => setShowCalendario(true)}
                  title="Abrir calendário de aniversários"
                >
                  <span aria-hidden="true">🎂</span>
                  <span>Aniversários</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm d-inline-flex flex-row align-items-center gap-1 text-nowrap"
                  onClick={abrirChamada}
                  title="Abrir lista de chamada"
                >
                  <span aria-hidden="true">📋</span>
                  <span>Chamada (em teste)</span>
                </button>
              </div>

              <div className="text-center">
                <h5 className="mb-1">Arquivos para Monitores(as)</h5>
                <p className="mb-0 text-muted">
                  Área para documentos de download público
                </p>
              </div>
            </div>

            <div className="mt-3 text-center">
              <FileSection pasta="monitor" canUpload={isMestre} />
            </div>
          </Col>
        </Row>
      )}

      {canAccess(4) && (
        <Row className="mt-4">
          <Col md={12} className="border p-3 text-center">
            <h5>Arquivos para Instrutores(as)</h5>
            <p>Área para documentos de download público</p>
            <FileSection pasta="instrutor" canUpload={isMestre} />
          </Col>
        </Row>
      )}

      {canAccess(5) && (
        <Row className="mt-4">
          <Col md={12} className="border p-3 text-center">
            <h5>Arquivos para Professores(as)</h5>
            <p>Área para documentos de download público</p>
            <FileSection pasta="professor" canUpload={isMestre} />
          </Col>
        </Row>
      )}

      {canAccess(6) && (
        <Row className="mt-4">
          <Col md={12} className="border p-3 text-center">
            <h5>Arquivos para Contramestre</h5>
            <p>Área para documentos de download público</p>
            <FileSection pasta="contramestre" canUpload={isMestre} />
          </Col>
        </Row>
      )}

      <ModalEditarPerfil
        show={showEditModal}
        onHide={() => {
          hideFeedback();
          setShowEditModal(false);
        }}
        formEdit={formEdit}
        setFormEdit={setFormEdit}
        salvarPerfil={salvarPerfil}
        cep={cep}
        setCep={setCep}
        buscarEnderecoPorCep={buscarEnderecoPorCep}
        handleNumeroChange={handleNumeroChange}
        logradouro={logradouro}
        bairro={bairro}
        cidade={cidade}
        uf={uf}
        buscandoCep={buscandoCep}
      />

      {showCadastroInicial && (
        <CadastroInicial
          show={showCadastroInicial}
          onSave={async (dados) => {
            const perfilFinal = {
              ...dados,
              id: userData.email,
              email: userData.email,
              createdAt: new Date().toISOString(),
              aceitouTermos: true,
            };
            await criarPerfil(perfilFinal);
            setPerfil(perfilFinal);
            setPerfilCache(userData.email, perfilFinal);
            setUserData((prev) => ({ ...prev, nome: dados.nome }));
            setShowCadastroInicial(false);
            showSuccess("Cadastro criado com sucesso!");
          }}
        />
      )}

      {cropModal && (
        <CropImageModal
          imageSrc={rawImage}
          onSave={handleCroppedSave}
          onClose={() => setCropModal(false)}
        />
      )}

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
            src={avatarModalUrl || fotoPreview}
            alt="Foto de perfil ampliada"
            className="img-fluid"
            style={{ maxHeight: "80vh" }}
            onError={(e) => {
              const img = e.currentTarget;
              const url = img.src || "";
              if (url.includes("@2x")) img.src = url.replace("@2x", "@1x");
              else if (url.includes("@1x")) img.src = url.replace("@1x", "");
              else {
                img.onerror = null;
                img.src = fotoPadrao;
              }
            }}
          />
        </Modal.Body>
      </Modal>

      {showQuestionarioAluno && (
        <QuestionarioAluno
          show={showQuestionarioAluno}
          initialData={perfil?.questionarios?.aluno || null}
          onSave={salvarQuestionarioAluno}
          onCancel={
            perfil?.questionarios?.aluno
              ? () => setShowQuestionarioAluno(false)
              : undefined
          }
        />
      )}

      {/* Modal: Envio de certificados por corda + data */}
      <ModalArquivosPessoais
        show={showEnvioCerts}
        onClose={() => setShowEnvioCerts(false)}
        onSave={() => {
          listarTimelineCertificados(userData.email)
            .then((items) => setCertTimeline(items || []))
            .catch(() => { });
        }}
        email={userData.email}
      />

      <Modal
        show={showCalendario}
        onHide={() => setShowCalendario(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Calendário de Aniversários</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <CalendarioAniversarios aniversarios={aniversarios} />
        </Modal.Body>
      </Modal>

      {/* Modal: Chamada (Monitor+) */}
      <Modal
        show={showChamada}
        onHide={() => setShowChamada(false)}
        size="xl"
        fullscreen="sm-down"
        centered
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>Chamada</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex align-items-end justify-content-between gap-2 flex-wrap mb-2">
            <div className="text-muted">
              Hoje: {new Date().toLocaleDateString("pt-BR")}
            </div>
            <label className="d-flex flex-column" style={{ minWidth: 180 }}>
              <span className="small text-muted">Mês</span>
              <input
                type="month"
                className="form-control form-control-sm"
                value={chamadaMonthISO}
                onChange={async (e) => {
                  const next = e.target.value;
                  setChamadaMonthISO(next);
                  await carregarChamada(next);
                }}
              />
            </label>
          </div>

          <div className="d-flex justify-content-end mb-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() =>
                setChamadaView((v) =>
                  v === "frequencia" ? "chamada" : "frequencia",
                )
              }
              disabled={chamadaLoading}
              title={
                chamadaView === "frequencia"
                  ? "Voltar para edição da chamada"
                  : "Ver frequência do mês selecionado"
              }
            >
              {chamadaView === "frequencia" ? "Voltar" : "Ver frequência"}
            </button>
          </div>

          <div className="small text-muted mb-2">
            Observação: quem ainda não concluiu o cadastro não aparece aqui.
          </div>

          <div className="small text-muted d-sm-none mb-2">
            Arraste a tabela para o lado (ou gire o celular na horizontal).
          </div>

          {chamadaLoading ? (
            <Loading variant="block" size="sm" message="Carregando lista..." />
          ) : chamadaLista.length === 0 ? (
            <p className="text-muted mb-0">Nenhuma pessoa encontrada.</p>
          ) : chamadaDias.length === 0 ? (
            <p className="text-muted mb-0">
              Não há dias de aula (terça/quinta) neste mês.
            </p>
          ) : chamadaView === "frequencia" ? (
            (() => {
              const totalAulas = chamadaDias.length;

              const year = String(chamadaMonthISO || "").slice(0, 4);
              const pad2 = (n) => String(n).padStart(2, "0");

              const annualPresencasById = {};
              let annualTotalAulas = 0;
              let annualMesesRegistrados = 0;

              for (let m = 1; m <= 12; m++) {
                const monthISO = `${year}-${pad2(m)}`;
                const raw = localStorage.getItem(getChamadaKey(monthISO));
                if (!raw) continue;

                let saved = null;
                try {
                  saved = JSON.parse(raw);
                } catch {
                  saved = null;
                }

                const entries =
                  saved?.entries && typeof saved.entries === "object"
                    ? saved.entries
                    : {};

                const diasMes = getDiasDeAulaNoMes(monthISO);
                annualTotalAulas += diasMes.length;
                annualMesesRegistrados += 1;

                for (const d of diasMes) {
                  const presentes = Array.isArray(entries?.[d.dateISO])
                    ? entries[d.dateISO]
                    : [];
                  for (const id of presentes) {
                    annualPresencasById[id] =
                      (annualPresencasById[id] || 0) + 1;
                  }
                }
              }

              const rows = chamadaLista
                .map((u) => {
                  const presencas = chamadaDias.reduce(
                    (acc, d) =>
                      acc + (chamadaPresencas?.[d.dateISO]?.[u.id] ? 1 : 0),
                    0,
                  );

                  const presencasAno = annualPresencasById[u.id] || 0;
                  return {
                    ...u,
                    presencas,
                    faltas: Math.max(0, totalAulas - presencas),
                    percentual: totalAulas
                      ? Math.round((presencas / totalAulas) * 100)
                      : 0,
                    presencasAno,
                    percentualAno: annualTotalAulas
                      ? Math.round((presencasAno / annualTotalAulas) * 100)
                      : 0,
                  };
                })
                .sort(
                  (a, b) =>
                    b.presencas - a.presencas ||
                    (a.nome || a.email).localeCompare(b.nome || b.email),
                );

              return (
                <>
                  <div className="small text-muted mb-2">
                    Total de aulas no mês: <strong>{totalAulas}</strong>
                  </div>
                  <div className="small text-muted mb-2">
                    Ano {year}: <strong>{annualTotalAulas}</strong> aulas
                    {annualMesesRegistrados > 0
                      ? ` (meses registrados: ${annualMesesRegistrados})`
                      : ""}
                  </div>
                  <div
                    className="border rounded table-responsive"
                    style={{
                      overflowX: "auto",
                      WebkitOverflowScrolling: "touch",
                    }}
                  >
                    <table className="table table-sm mb-0 align-middle">
                      <thead>
                        <tr>
                          <th style={{ minWidth: 220 }}>Nome</th>
                          <th className="text-center" style={{ minWidth: 90 }}>
                            Presenças (mês)
                          </th>
                          <th className="text-center" style={{ minWidth: 90 }}>
                            Faltas (mês)
                          </th>
                          <th className="text-center" style={{ minWidth: 70 }}>
                            % (mês)
                          </th>
                          <th className="text-center" style={{ minWidth: 110 }}>
                            Presenças (ano)
                          </th>
                          <th className="text-center" style={{ minWidth: 90 }}>
                            % (ano)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((u) => (
                          <tr key={u.id}>
                            <td style={{ maxWidth: 260 }}>
                              <div
                                className="text-truncate"
                                title={u.nome || u.id}
                              >
                                {u.nome ? u.nome : "-"}
                              </div>
                            </td>
                            <td className="text-center">{u.presencas}</td>
                            <td className="text-center">{u.faltas}</td>
                            <td className="text-center">{u.percentual}%</td>
                            <td className="text-center">{u.presencasAno}</td>
                            <td className="text-center">{u.percentualAno}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()
          ) : (
            <div
              className="border rounded table-responsive"
              style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}
            >
              <table className="table table-sm mb-0 align-middle">
                <thead>
                  <tr>
                    <th style={{ minWidth: 220 }}>Nome</th>
                    {chamadaDias.map((d) => (
                      <th
                        key={d.dateISO}
                        className="text-center"
                        style={{ minWidth: 90 }}
                      >
                        <div className="small">{d.weekday}</div>
                        <div>{d.label}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chamadaLista.map((u) => (
                    <tr key={u.id}>
                      <td style={{ maxWidth: 260 }}>
                        <div className="text-truncate" title={u.nome || u.id}>
                          {u.nome ? u.nome : "-"}
                        </div>
                      </td>
                      {chamadaDias.map((d) => (
                        <td key={d.dateISO} className="text-center">
                          <input
                            type="checkbox"
                            checked={!!chamadaPresencas?.[d.dateISO]?.[u.id]}
                            onChange={(e) =>
                              setChamadaPresencas((prev) => ({
                                ...(prev || {}),
                                [d.dateISO]: {
                                  ...((prev || {})[d.dateISO] || {}),
                                  [u.id]: e.target.checked,
                                },
                              }))
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setShowChamada(false)}
            disabled={chamadaLoading}
          >
            Fechar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={salvarChamada}
            disabled={
              chamadaLoading ||
              chamadaLista.length === 0 ||
              chamadaView === "frequencia"
            }
            title={
              chamadaView === "frequencia"
                ? "Volte para a chamada para salvar"
                : "Salvar chamada"
            }
          >
            Salvar
          </button>
        </Modal.Footer>
      </Modal>

      {/* Modal de preview da timeline */}
      <Modal
        show={tlPreviewOpen}
        onHide={() => setTlPreviewOpen(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Visualizar arquivo</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {tlPreviewIsPdf ? (
            <iframe
              src={tlPreviewUrl}
              style={{ width: "100%", height: "70vh", border: "none" }}
              title="PDF Preview"
            />
          ) : (
            <img
              src={tlPreviewUrl}
              alt="Preview"
              className="img-fluid"
              style={{ maxHeight: "70vh" }}
              loading="lazy"
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Modal de preview do laudo */}
      <Modal
        show={laudoPreviewOpen}
        onHide={() => setLaudoPreviewOpen(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Visualizar laudo</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {laudoPreviewIsPdf ? (
            <iframe
              src={laudoPreviewUrl}
              style={{ width: "100%", height: "70vh", border: "none" }}
              title="PDF Preview"
            />
          ) : (
            <img
              src={laudoPreviewUrl}
              alt="Preview do laudo"
              className="img-fluid"
              style={{ maxHeight: "70vh" }}
              loading="lazy"
            />
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default AreaGraduado;
