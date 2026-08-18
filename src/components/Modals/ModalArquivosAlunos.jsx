// src/components/Modals/ModalArquivosAlunos.jsx
import { useState, useEffect, useMemo } from "react";
import { Modal, Button, Form, Row, Col, Table, Badge, Spinner } from "react-bootstrap";
import PropTypes from "prop-types";
import {
  getCordaNomeComSubclasse,
  getProximaCordaNomeComSubclasse,
} from "../../constants/nomesCordas";

const API_URL = import.meta.env.VITE_API_URL;

export const HORARIOS_TREINO_OPCOES = [
  { value: "todos", label: "Todos os Horários de Treino", local: "todos" },
  {
    value: "19-20-criancas",
    label: "19h às 20h - Crianças (Centro Cultural)",
    local: "Centro Cultural Salgado Filho",
  },
  {
    value: "20-21h30-adultos",
    label: "20h às 21:30h - Adultos (Centro Cultural)",
    local: "Centro Cultural Salgado Filho",
  },
  {
    value: "18h30-19h30",
    label: "18:30 às 19:30 (E. M. Efigênia Vidigal)",
    local: "E. M. Professora Efigênia Vidigal",
  },
];

export function formatarHorario(h) {
  if (!h) return "-";
  if (h === "19-20-criancas") return "19h às 20h (Crianças)";
  if (h === "20-21h30-adultos") return "20h às 21:30h (Adultos)";
  if (h === "18h30-19h30") return "18:30 às 19:30";
  return h;
}

export default function ModalArquivosAlunos({ show, onHide, integrantes: propIntegrantes }) {
  const [integrantes, setIntegrantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportando, setExportando] = useState(false);

  // Filtros
  const [localFilter, setLocalFilter] = useState("todos");
  const [horarioFilter, setHorarioFilter] = useState("todos");
  const [pesquisa, setPesquisa] = useState("");

  // State de ordenação (padrão: matrícula de menor para maior)
  const [sortConfig, setSortConfig] = useState({ key: "matricula", direction: "asc" });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <span className="text-muted opacity-50 ms-1 small">↕</span>;
    }
    return sortConfig.direction === "asc" ? (
      <span className="text-primary ms-1 fw-bold">▲</span>
    ) : (
      <span className="text-primary ms-1 fw-bold">▼</span>
    );
  };

  // Carrega lista completa de alunos/perfis diretamente do endpoint /perfil
  useEffect(() => {
    if (!show) return;

    if (propIntegrantes && propIntegrantes.length > 0) {
      // Filtra para remover visitantes e administrador
      const apenasAlunos = propIntegrantes.filter((u) => {
        const isVisitanteOuAdmin =
          u.horarioTreino === "visitante" ||
          (u.localTreino || "").toLowerCase().includes("visitante") ||
          (u.nivelAcesso || "").toLowerCase() === "visitante" ||
          u.eVisitante === true ||
          (u.email || "").toLowerCase().startsWith("contatominasbahia") ||
          (u.email || "").toLowerCase() === "contato@capoeiraminasbahia.com.br" ||
          (u.nome || "").toLowerCase().includes("administrador minas bahia");
        return !isVisitanteOuAdmin;
      });
      setIntegrantes(apenasAlunos);
      return;
    }

    async function fetchAlunos() {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/perfil`);
        if (res.ok) {
          const data = await res.json();

          // Exclui visitantes e administrador (apenas alunos)
          const apenasAlunos = (data || []).filter((u) => {
            const isVisitanteOuAdmin =
              u.horarioTreino === "visitante" ||
              (u.localTreino || "").toLowerCase().includes("visitante") ||
              (u.nivelAcesso || "").toLowerCase() === "visitante" ||
              u.eVisitante === true ||
              (u.email || "").toLowerCase().startsWith("contatominasbahia") ||
              (u.email || "").toLowerCase() === "contato@capoeiraminasbahia.com.br" ||
              (u.nome || "").toLowerCase().includes("administrador minas bahia");
            return !isVisitanteOuAdmin;
          });
          setIntegrantes(apenasAlunos);
        }
      } catch (err) {
        console.error("Erro ao buscar alunos para o relatório:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAlunos();
  }, [show, propIntegrantes]);

  // Lista de locais de treino únicos disponíveis
  const locaisDisponiveis = useMemo(() => {
    const setLocais = new Set();
    integrantes.forEach((u) => {
      if (u.localTreino && u.localTreino.trim() && !u.localTreino.toLowerCase().includes("visitante")) {
        setLocais.add(u.localTreino.trim());
      }
    });
    return Array.from(setLocais).sort();
  }, [integrantes]);

  // Sincronização do Select de Local
  const handleLocalChange = (novoLocal) => {
    setLocalFilter(novoLocal);
    if (novoLocal === "todos") {
      setHorarioFilter("todos");
    } else {
      const opcaoAtual = HORARIOS_TREINO_OPCOES.find((h) => h.value === horarioFilter);
      if (opcaoAtual && opcaoAtual.local !== "todos" && !opcaoAtual.local.toLowerCase().includes(novoLocal.toLowerCase())) {
        setHorarioFilter("todos");
      }
    }
  };

  // Sincronização do Select de Horário
  const handleHorarioChange = (novoHorario) => {
    setHorarioFilter(novoHorario);
    if (novoHorario === "todos") {
      setLocalFilter("todos");
    } else {
      const opcao = HORARIOS_TREINO_OPCOES.find((h) => h.value === novoHorario);
      if (opcao && opcao.local && opcao.local !== "todos") {
        setLocalFilter(opcao.local);
      }
    }
  };

  // Opções de horários filtradas pelo local selecionado
  const opcoesHorarioDisponiveis = useMemo(() => {
    if (localFilter === "todos") return HORARIOS_TREINO_OPCOES;
    return HORARIOS_TREINO_OPCOES.filter(
      (h) => h.value === "todos" || h.local.toLowerCase().includes(localFilter.toLowerCase())
    );
  }, [localFilter]);

  // Filtragem e Ordenação dinâmica dos alunos
  const alunosFiltrados = useMemo(() => {
    const filtrados = integrantes.filter((u) => {
      // Filtro de Local de Treino
      if (localFilter !== "todos") {
        const loc = (u.localTreino || "").toLowerCase();
        if (!loc.includes(localFilter.toLowerCase())) {
          return false;
        }
      }

      // Filtro de Horário de Treino
      if (horarioFilter !== "todos") {
        const hor = (u.horarioTreino || "").toLowerCase();
        if (hor !== horarioFilter.toLowerCase()) {
          return false;
        }
      }

      // Filtro de Pesquisa (Nome / Apelido / Matrícula)
      if (pesquisa.trim()) {
        const q = pesquisa.toLowerCase();
        const nome = (u.nome || "").toLowerCase();
        const apelido = (u.apelido || "").toLowerCase();
        const matricula = String(u.matricula || "").toLowerCase();
        if (!nome.includes(q) && !apelido.includes(q) && !matricula.includes(q)) {
          return false;
        }
      }

      return true;
    });

    const { key, direction } = sortConfig;
    const factor = direction === "asc" ? 1 : -1;

    return [...filtrados].sort((a, b) => {
      if (key === "matricula") {
        if (a.matricula && b.matricula) {
          return String(a.matricula).localeCompare(String(b.matricula), undefined, { numeric: true }) * factor;
        }
        if (a.matricula) return -1;
        if (b.matricula) return 1;
        return (a.nome || "").localeCompare(b.nome || "") * factor;
      }

      if (key === "nome") {
        return (a.nome || "").localeCompare(b.nome || "") * factor;
      }

      if (key === "apelido") {
        return (a.apelido || "").localeCompare(b.apelido || "") * factor;
      }

      if (key === "localTreino") {
        return (a.localTreino || "").localeCompare(b.localTreino || "") * factor;
      }

      if (key === "horarioTreino") {
        return formatarHorario(a.horarioTreino).localeCompare(formatarHorario(b.horarioTreino)) * factor;
      }

      if (key === "corda") {
        return (getCordaNomeComSubclasse(a.corda) || "").localeCompare(getCordaNomeComSubclasse(b.corda) || "") * factor;
      }

      return 0;
    });
  }, [integrantes, localFilter, horarioFilter, pesquisa, sortConfig]);

  // Exportar para PDF (Layout limpo e sem coluna de conferência)
  const baixarPDF = async () => {
    if (alunosFiltrados.length === 0) {
      alert("Nenhum aluno encontrado para os filtros selecionados.");
      return;
    }

    try {
      setExportando(true);
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      const agora = new Date();
      const dataFormatada = agora.toLocaleDateString("pt-BR");
      const horaFormatada = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

      // Cabeçalho
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(139, 0, 0);
      doc.text("Relatório de Alunos e Graduações", 30, 36);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text("Instituto Cultural Minas Bahia (ICMBC)", 30, 50);

      // Metadados
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      const labelLocal = localFilter === "todos" ? "Todos os Locais" : localFilter;
      const horarioItem = HORARIOS_TREINO_OPCOES.find((h) => h.value === horarioFilter);
      const labelHorario = horarioItem ? horarioItem.label : horarioFilter;

      const subInfo = `Local: ${labelLocal}   |   Horário: ${labelHorario}   |   Total: ${alunosFiltrados.length} aluno(s)   |   Emitido em: ${dataFormatada} às ${horaFormatada}`;
      doc.text(subInfo, 30, 64);

      const head = [
        [
          "#",
          "Matrícula",
          "Nome do Aluno",
          "Apelido",
          "Local de Treino",
          "Horário de Treino",
          "Corda Atual",
          "Próxima Corda",
        ],
      ];

      const body = alunosFiltrados.map((u, i) => [
        i + 1,
        u.matricula || "-",
        u.nome || "-",
        u.apelido || "-",
        u.localTreino || "-",
        formatarHorario(u.horarioTreino),
        getCordaNomeComSubclasse(u.corda),
        getProximaCordaNomeComSubclasse(u.corda),
      ]);

      autoTable(doc, {
        head,
        body,
        startY: 75,
        styles: {
          fontSize: 8.5,
          cellPadding: 5,
          valign: "middle",
        },
        headStyles: {
          fillColor: [139, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250],
        },
        columnStyles: {
          0: { cellWidth: 25, halign: "center" },
          1: { cellWidth: 60, halign: "center", fontStyle: "bold" },
          2: { cellWidth: 150 },
          3: { cellWidth: 85, fontStyle: "italic" },
          4: { cellWidth: 135 },
          5: { cellWidth: 105 },
          6: { cellWidth: 110 },
          7: { cellWidth: 110 },
        },
        margin: { left: 30, right: 30, top: 75, bottom: 30 },
        didDrawPage: (data) => {
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
          const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();

          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Página ${data.pageNumber} de ${doc.internal.getNumberOfPages()} - Grupo Minas Bahia`,
            pageWidth / 2,
            pageHeight - 12,
            { align: "center" }
          );
        },
      });

      const dataHoje = agora.toISOString().slice(0, 10);
      doc.save(`relatorio_alunos_${dataHoje}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Erro ao exportar PDF.");
    } finally {
      setExportando(false);
    }
  };

  // Exportar para Planilha Excel (.xlsx via ExcelJS)
  const baixarPlanilhaExcel = async () => {
    if (alunosFiltrados.length === 0) {
      alert("Nenhum aluno encontrado para os filtros selecionados.");
      return;
    }

    try {
      setExportando(true);
      const ExcelJS = await import("exceljs");

      const wb = new ExcelJS.Workbook();
      wb.creator = "ICMBC - Instituto Cultural Minas Bahia";
      wb.created = new Date();

      const ws = wb.addWorksheet("Conferência de Alunos", {
        views: [{ showGridLines: true }],
      });

      // Cabeçalhos (Linhas 1 e 2 mescladas)
      ws.getCell("A1").value = "Matrícula";
      ws.getCell("B1").value = "Nome do Aluno";
      ws.getCell("C1").value = "Apelido";
      ws.getCell("D1").value = "Local de Treino";
      ws.getCell("E1").value = "Horário de Treino";
      ws.getCell("F1").value = "Corda Atual";
      ws.getCell("G1").value = "Próxima Corda";
      ws.getCell("H1").value = "Seus dados estão corretos?";

      ws.mergeCells("A1:A2");
      ws.mergeCells("B1:B2");
      ws.mergeCells("C1:C2");
      ws.mergeCells("D1:D2");
      ws.mergeCells("E1:E2");
      ws.mergeCells("F1:F2");
      ws.mergeCells("G1:G2");
      ws.mergeCells("H1:H2");

      const headerCols = ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1"];
      headerCols.forEach((cellRef) => {
        const cell = ws.getCell(cellRef);
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11, name: "Calibri" };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF8B0000" },
        };
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        cell.border = {
          top: { style: "thin", color: { argb: "FF500000" } },
          bottom: { style: "medium", color: { argb: "FF500000" } },
          left: { style: "thin", color: { argb: "FF500000" } },
          right: { style: "thin", color: { argb: "FF500000" } },
        };
      });

      // Adiciona linhas de alunos (a partir da linha 3)
      alunosFiltrados.forEach((u, i) => {
        const rowNum = i + 3;
        const row = ws.getRow(rowNum);

        row.getCell(1).value = u.matricula || "-";
        row.getCell(2).value = u.nome || "-";
        row.getCell(3).value = u.apelido || "-";
        row.getCell(4).value = u.localTreino || "-";
        row.getCell(5).value = formatarHorario(u.horarioTreino);
        row.getCell(6).value = getCordaNomeComSubclasse(u.corda);
        row.getCell(7).value = getProximaCordaNomeComSubclasse(u.corda);

        // Coluna H: Lista suspensa com validação de dados ("Sim,Não")
        const cellH = row.getCell(8);
        cellH.value = "";
        cellH.dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: ['"Sim,Não"'],
          showErrorMessage: true,
          errorTitle: "Opção inválida",
          error: "Por favor, selecione 'Sim' ou 'Não' na lista suspensa.",
        };

        row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
        row.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
        row.getCell(3).alignment = { horizontal: "left", vertical: "middle" };
        row.getCell(4).alignment = { horizontal: "left", vertical: "middle" };
        row.getCell(5).alignment = { horizontal: "left", vertical: "middle" };
        row.getCell(6).alignment = { horizontal: "left", vertical: "middle" };
        row.getCell(7).alignment = { horizontal: "left", vertical: "middle" };
        row.getCell(8).alignment = { horizontal: "center", vertical: "middle" };

        for (let c = 1; c <= 8; c++) {
          row.getCell(c).border = {
            top: { style: "thin", color: { argb: "FFE0E0E0" } },
            bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
            left: { style: "thin", color: { argb: "FFE0E0E0" } },
            right: { style: "thin", color: { argb: "FFE0E0E0" } },
          };
          row.getCell(c).font = { name: "Calibri", size: 10 };
        }

        row.commit();
      });

      const lastRow = alunosFiltrados.length + 2;

      ws.getColumn(1).width = 14;
      ws.getColumn(2).width = 34;
      ws.getColumn(3).width = 20;
      ws.getColumn(4).width = 28;
      ws.getColumn(5).width = 24;
      ws.getColumn(6).width = 28;
      ws.getColumn(7).width = 28;
      ws.getColumn(8).width = 24;

      // Regras de Formatação Condicional para a LINHA COMPLETA (A3:H{lastRow})
      ws.addConditionalFormatting({
        ref: `A3:H${lastRow}`,
        rules: [
          {
            type: "expression",
            formulae: ['EXACT($H3,"Sim")'],
            style: {
              fill: {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFD4EDDA" },
                bgColor: { argb: "FFD4EDDA" },
              },
              font: {
                color: { argb: "FF155724" },
                bold: true,
              },
            },
          },
          {
            type: "expression",
            formulae: ['EXACT($H3,"Não")'],
            style: {
              fill: {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF8D7DA" },
                bgColor: { argb: "FFF8D7DA" },
              },
              font: {
                color: { argb: "FF721C24" },
                bold: true,
              },
            },
          },
        ],
      });

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const dataHoje = new Date().toISOString().slice(0, 10);
      const filename = `planilha_alunos_${dataHoje}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao gerar planilha Excel:", err);
      alert("Erro ao exportar planilha.");
    } finally {
      setExportando(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton className="border-bottom bg-white px-4 py-3">
        <Modal.Title className="fw-bold fs-5 text-dark d-flex align-items-center gap-2">
          <span>📁</span>
          <span>Arquivo dos Alunos</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4 bg-white">
        {/* Painel de Filtros */}
        <div className="bg-light p-3 rounded border mb-4">
          <Row className="g-3 align-items-end">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold small text-muted mb-1">
                  Local de Treino
                </Form.Label>
                <Form.Select
                  value={localFilter}
                  onChange={(e) => handleLocalChange(e.target.value)}
                  className="form-select-sm"
                >
                  <option value="todos">Todos os Locais de Treino</option>
                  {locaisDisponiveis.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold small text-muted mb-1">
                  Horário de Treino
                </Form.Label>
                <Form.Select
                  value={horarioFilter}
                  onChange={(e) => handleHorarioChange(e.target.value)}
                  className="form-select-sm"
                >
                  {opcoesHorarioDisponiveis.map((h) => (
                    <option key={h.value} value={h.value}>
                      {h.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold small text-muted mb-1">
                  Buscar por Nome / Apelido / Matrícula
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Buscar..."
                  value={pesquisa}
                  onChange={(e) => setPesquisa(e.target.value)}
                  className="form-control-sm"
                />
              </Form.Group>
            </Col>
          </Row>
        </div>

        {/* Barra Superior de Ações & Resumo */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
          <div className="d-flex align-items-center gap-2">
            <Badge bg="dark" className="px-3 py-2 fw-normal">
              Total: {alunosFiltrados.length} aluno(s)
            </Badge>
            {(localFilter !== "todos" || horarioFilter !== "todos" || pesquisa) && (
              <Button
                variant="link"
                size="sm"
                className="text-decoration-none p-0 text-muted small"
                onClick={() => {
                  setLocalFilter("todos");
                  setHorarioFilter("todos");
                  setPesquisa("");
                }}
              >
                Limpar Filtros
              </Button>
            )}
          </div>

          <div className="d-flex align-items-center gap-2">
            <Button
              variant="outline-danger"
              size="sm"
              className="d-inline-flex align-items-center gap-1 rounded-pill px-3"
              onClick={baixarPDF}
              disabled={exportando || loading || alunosFiltrados.length === 0}
            >
              <i className="bi bi-file-earmark-pdf-fill"></i>
              {exportando ? "Gerando..." : "Baixar PDF"}
            </Button>

            <Button
              variant="outline-success"
              size="sm"
              className="d-inline-flex align-items-center gap-1 rounded-pill px-3"
              onClick={baixarPlanilhaExcel}
              disabled={exportando || loading || alunosFiltrados.length === 0}
            >
              <i className="bi bi-file-earmark-excel-fill"></i>
              {exportando ? "Gerando..." : "Baixar Planilha (.xlsx)"}
            </Button>
          </div>
        </div>

        {/* Visualização dos Alunos na Tabela */}
        {loading ? (
          <div className="text-center p-5">
            <Spinner animation="border" variant="secondary" size="sm" />
            <p className="mt-2 text-muted small">Carregando alunos...</p>
          </div>
        ) : alunosFiltrados.length === 0 ? (
          <div className="text-center p-4 bg-light rounded border">
            <p className="text-muted small mb-0">Nenhum aluno encontrado para os filtros selecionados.</p>
          </div>
        ) : (
          <div className="table-responsive rounded border">
            <Table hover align="middle" className="mb-0 text-nowrap" size="sm">
              <thead className="table-light border-bottom">
                <tr>
                  <th style={{ width: "35px" }} className="text-center text-muted">#</th>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("matricula")}
                    title="Clique para ordenar por Matrícula"
                    className="user-select-none"
                  >
                    Matrícula {getSortIcon("matricula")}
                  </th>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("nome")}
                    title="Clique para ordenar por Nome"
                    className="user-select-none"
                  >
                    Nome do Aluno {getSortIcon("nome")}
                  </th>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("apelido")}
                    title="Clique para ordenar por Apelido"
                    className="user-select-none"
                  >
                    Apelido {getSortIcon("apelido")}
                  </th>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("localTreino")}
                    title="Clique para ordenar por Local de Treino"
                    className="user-select-none"
                  >
                    Local de Treino {getSortIcon("localTreino")}
                  </th>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("horarioTreino")}
                    title="Clique para ordenar por Horário de Treino"
                    className="user-select-none"
                  >
                    Horário de Treino {getSortIcon("horarioTreino")}
                  </th>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("corda")}
                    title="Clique para ordenar por Corda Atual"
                    className="user-select-none"
                  >
                    Corda Atual {getSortIcon("corda")}
                  </th>
                  <th>Próxima Corda</th>
                </tr>
              </thead>
              <tbody>
                {alunosFiltrados.map((u, i) => {
                  const id = u.email || `${u.nome}-${i}`;

                  return (
                    <tr key={id}>
                      <td className="text-center text-muted small">{i + 1}</td>
                      <td>
                        <span className="font-monospace fw-bold text-dark small">
                          {u.matricula || "-"}
                        </span>
                      </td>
                      <td className="fw-medium text-dark">{u.nome || "-"}</td>
                      <td className="text-muted fst-italic">{u.apelido || "-"}</td>
                      <td className="text-muted small">{u.localTreino || "-"}</td>
                      <td className="text-secondary small">
                        {formatarHorario(u.horarioTreino)}
                      </td>
                      <td className="small text-dark">
                        {getCordaNomeComSubclasse(u.corda)}
                      </td>
                      <td className="small text-secondary">
                        {getProximaCordaNomeComSubclasse(u.corda)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="bg-light border-top d-flex justify-content-between py-2 px-3">
        <span className="small text-muted" style={{ fontSize: "0.78rem" }}>
          * A planilha Excel gerada possui lista suspensa ("Sim" / "Não") na coluna "Seus dados estão corretos?".
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={onHide}
          className="rounded-pill px-4"
        >
          Fechar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

ModalArquivosAlunos.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  integrantes: PropTypes.array,
};
