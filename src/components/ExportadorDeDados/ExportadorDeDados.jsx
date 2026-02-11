/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import { Modal } from "react-bootstrap";

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export default function ExportadorDeDados({
  usuarios,
  dadosUsuarios,
  ordenarUsuarios,
  getNomeUser,
  getLocalTreinoUser,
  getCordaUser,
  getCordaNome,
  normalizarLocal,
  normalSalgado,
  normalEfigenia,
  LOCAL_SALGADO,
  LOCAL_EFIGENIA,
  fetchPerfilByEmail,
  onMergeDadosUsuarios,
}) {
  const [open, setOpen] = useState(false);
  const [exportLocal, setExportLocal] = useState("ambos"); // ambos | salgado | efigenia
  const [exportCols, setExportCols] = useState({
    nome: true,
    telefone: true,
    endereco: true,
    corda: true,
  });
  const [exportando, setExportando] = useState(false);

  const getWhatsappUser = (user) =>
    dadosUsuarios?.[user.email]?.whatsapp || user.whatsapp || "";

  const getEnderecoUser = (user) => {
    const endereco =
      dadosUsuarios?.[user.email]?.endereco || user.endereco || "";
    const compl =
      dadosUsuarios?.[user.email]?.complemento || user.complemento || "";
    const endTrim = (endereco || "").trim();
    const complTrim = (compl || "").trim();
    if (!endTrim && !complTrim) return "";
    if (!complTrim) return endTrim;
    if (!endTrim) return complTrim;
    return `${endTrim} / ${complTrim}`;
  };

  const colunasSelecionadas = useMemo(() => {
    const cols = [];
    if (exportCols.nome) cols.push({ key: "nome", label: "Nome" });
    if (exportCols.telefone) cols.push({ key: "telefone", label: "Telefone" });
    if (exportCols.endereco) cols.push({ key: "endereco", label: "Endereço" });
    if (exportCols.corda) cols.push({ key: "corda", label: "Corda" });
    return cols;
  }, [exportCols]);

  const usuariosParaExportar = useMemo(() => {
    const base = (usuarios || []).filter((user) => {
      const local = normalizarLocal(getLocalTreinoUser(user));
      if (exportLocal === "salgado") return local === normalSalgado;
      if (exportLocal === "efigenia") return local === normalEfigenia;
      return local === normalSalgado || local === normalEfigenia;
    });
    return ordenarUsuarios ? ordenarUsuarios(base) : base;
  }, [
    usuarios,
    exportLocal,
    ordenarUsuarios,
    getLocalTreinoUser,
    normalizarLocal,
    normalSalgado,
    normalEfigenia,
  ]);

  const garantirDetalhesParaExport = async (listaUsuarios) => {
    const precisaDetalhe = exportCols.telefone || exportCols.endereco;
    if (!precisaDetalhe) return;

    const emailsFaltando = (listaUsuarios || [])
      .map((u) => u.email)
      .filter(Boolean)
      .filter((email) => {
        const d = dadosUsuarios?.[email];
        if (!d) return true;
        if (exportCols.telefone && !d.whatsapp) return true;
        if (exportCols.endereco && !d.endereco && !d.complemento) return true;
        return false;
      });

    if (emailsFaltando.length === 0) return;
    if (!fetchPerfilByEmail || !onMergeDadosUsuarios) return;

    const merged = {};
    const groups = chunk(emailsFaltando, 10);

    for (const g of groups) {
      const results = await Promise.allSettled(
        g.map(async (email) => {
          const data = await fetchPerfilByEmail(email);
          return { email, data };
        }),
      );

      for (const r of results) {
        if (r.status === "fulfilled" && r.value?.email) {
          merged[r.value.email] = r.value.data;
        }
      }
    }

    if (Object.keys(merged).length > 0) {
      onMergeDadosUsuarios(merged);
    }
  };

  const montarLinhasExport = (listaUsuarios) => {
    const linhas = (listaUsuarios || []).map((user) => {
      const row = {};
      for (const c of colunasSelecionadas) {
        if (c.key === "nome") row[c.label] = getNomeUser(user) || "-";
        if (c.key === "telefone") row[c.label] = getWhatsappUser(user) || "-";
        if (c.key === "endereco") row[c.label] = getEnderecoUser(user) || "-";
        if (c.key === "corda") {
          const slug = getCordaUser(user);
          row[c.label] = slug ? getCordaNome(slug) : "-";
        }
      }
      return row;
    });
    return linhas;
  };

  const getSuffix = () =>
    exportLocal === "salgado"
      ? "salgado"
      : exportLocal === "efigenia"
        ? "efigenia"
        : "ambos";

  const baixarExcel = async () => {
    if (colunasSelecionadas.length === 0) {
      alert("Selecione pelo menos 1 coluna para exportar.");
      return;
    }

    if (usuariosParaExportar.length === 0) {
      alert("Nenhum aluno encontrado para os locais selecionados.");
      return;
    }

    try {
      setExportando(true);
      await garantirDetalhesParaExport(usuariosParaExportar);
      const linhas = montarLinhasExport(usuariosParaExportar);

      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(linhas);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Alunos");

      XLSX.writeFile(wb, `alunos_${getSuffix()}.xlsx`);
    } catch {
      alert("Erro ao exportar Excel.");
    } finally {
      setExportando(false);
    }
  };

  const baixarPDF = async () => {
    if (colunasSelecionadas.length === 0) {
      alert("Selecione pelo menos 1 coluna para exportar.");
      return;
    }

    if (usuariosParaExportar.length === 0) {
      alert("Nenhum aluno encontrado para os locais selecionados.");
      return;
    }

    try {
      setExportando(true);
      await garantirDetalhesParaExport(usuariosParaExportar);
      const linhas = montarLinhasExport(usuariosParaExportar);

      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      const head = [colunasSelecionadas.map((x) => x.label)];
      const body = linhas.map((row) =>
        colunasSelecionadas.map((x) => row[x.label] ?? "-"),
      );

      autoTable(doc, {
        head,
        body,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [33, 37, 41] },
        margin: { left: 24, right: 24, top: 24, bottom: 24 },
      });

      doc.save(`alunos_${getSuffix()}.pdf`);
    } catch {
      alert("Erro ao exportar PDF.");
    } finally {
      setExportando(false);
    }
  };

  const baixarJSON = async () => {
    if (colunasSelecionadas.length === 0) {
      alert("Selecione pelo menos 1 coluna para exportar.");
      return;
    }

    if (usuariosParaExportar.length === 0) {
      alert("Nenhum aluno encontrado para os locais selecionados.");
      return;
    }

    try {
      setExportando(true);
      await garantirDetalhesParaExport(usuariosParaExportar);
      const linhas = montarLinhasExport(usuariosParaExportar);
      const blob = new Blob([JSON.stringify(linhas, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      downloadBlob(blob, `alunos_${getSuffix()}.json`);
    } catch {
      alert("Erro ao exportar JSON.");
    } finally {
      setExportando(false);
    }
  };

  const baixarTexto = async () => {
    if (colunasSelecionadas.length === 0) {
      alert("Selecione pelo menos 1 coluna para exportar.");
      return;
    }

    if (usuariosParaExportar.length === 0) {
      alert("Nenhum aluno encontrado para os locais selecionados.");
      return;
    }

    try {
      setExportando(true);
      await garantirDetalhesParaExport(usuariosParaExportar);
      const linhas = montarLinhasExport(usuariosParaExportar);

      // TSV simples (abre fácil no Excel)
      const header = colunasSelecionadas.map((c) => c.label).join("\t");
      const body = linhas
        .map((row) =>
          colunasSelecionadas
            .map((c) => String(row[c.label] ?? "-").replace(/\s+/g, " "))
            .join("\t"),
        )
        .join("\n");
      const content = `${header}\n${body}\n`;
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      downloadBlob(blob, `alunos_${getSuffix()}.txt`);
    } catch {
      alert("Erro ao exportar texto.");
    } finally {
      setExportando(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary"
        onClick={() => setOpen(true)}
        disabled={exportando}
        title="Abrir opções de exportação"
      >
        {exportando ? "Exportando..." : "Exportar"}
      </button>

      <Modal show={open} onHide={() => setOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Exportar dados</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="fw-semibold mb-2">Colunas</div>
          <div className="d-flex flex-wrap gap-3 mb-3">
            <label className="d-flex align-items-center gap-2">
              <input
                type="checkbox"
                checked={!!exportCols.nome}
                onChange={(e) =>
                  setExportCols((prev) => ({ ...prev, nome: e.target.checked }))
                }
              />
              <span>Nome</span>
            </label>
            <label className="d-flex align-items-center gap-2">
              <input
                type="checkbox"
                checked={!!exportCols.telefone}
                onChange={(e) =>
                  setExportCols((prev) => ({
                    ...prev,
                    telefone: e.target.checked,
                  }))
                }
              />
              <span>Telefone</span>
            </label>
            <label className="d-flex align-items-center gap-2">
              <input
                type="checkbox"
                checked={!!exportCols.endereco}
                onChange={(e) =>
                  setExportCols((prev) => ({
                    ...prev,
                    endereco: e.target.checked,
                  }))
                }
              />
              <span>Endereço</span>
            </label>
            <label className="d-flex align-items-center gap-2">
              <input
                type="checkbox"
                checked={!!exportCols.corda}
                onChange={(e) =>
                  setExportCols((prev) => ({
                    ...prev,
                    corda: e.target.checked,
                  }))
                }
              />
              <span>Corda</span>
            </label>
          </div>

          <label className="fw-semibold mb-2 d-block">Local de treino</label>
          <div
            className="d-flex flex-column gap-2 mb-3"
            role="radiogroup"
            aria-label="Local de treino para exportação"
          >
            <label className="d-flex align-items-center gap-2">
              <input
                type="radio"
                name="export-local"
                value="ambos"
                checked={exportLocal === "ambos"}
                onChange={(e) => setExportLocal(e.target.value)}
                disabled={exportando}
              />
              <span>Ambos os locais</span>
            </label>
            <label className="d-flex align-items-center gap-2">
              <input
                type="radio"
                name="export-local"
                value="salgado"
                checked={exportLocal === "salgado"}
                onChange={(e) => setExportLocal(e.target.value)}
                disabled={exportando}
              />
              <span>Somente: {LOCAL_SALGADO}</span>
            </label>
            <label className="d-flex align-items-center gap-2">
              <input
                type="radio"
                name="export-local"
                value="efigenia"
                checked={exportLocal === "efigenia"}
                onChange={(e) => setExportLocal(e.target.value)}
                disabled={exportando}
              />
              <span>Somente: {LOCAL_EFIGENIA}</span>
            </label>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-success"
              onClick={baixarExcel}
              disabled={exportando}
            >
              Baixar Excel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={baixarPDF}
              disabled={exportando}
            >
              Baixar PDF
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={baixarJSON}
              disabled={exportando}
            >
              Baixar JSON
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={baixarTexto}
              disabled={exportando}
            >
              Baixar Texto
            </button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}
