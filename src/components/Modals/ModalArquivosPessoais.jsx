// src/components/Modals/ModalArquivosPessoais.jsx
import { useMemo, useState } from "react";
import {
  Modal,
  Button,
  Alert,
  Form,
  Row,
  Col,
  InputGroup,
  Card,
  CloseButton,
} from "react-bootstrap";
import {
  gruposCordas,
  listarCordasPorGrupo,
  getCordaNome,
} from "../../constants/nomesCordas";

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Modal para anexar 1..N certificados.
 * Cada linha: (select corda) + (data/ano da conquista) + (arquivo)
 *
 * Props:
 * - show: boolean
 * - onClose: () => void
 * - onSave: (rows) => void   // rows: [{ corda, data, url, nome }]
 * - email: string            // obrigatório
 */
export default function ModalArquivosPessoais({
  show,
  onClose,
  onSave,
  email,
}) {
  const [rows, setRows] = useState([
    {
      id: crypto.randomUUID(),
      corda: "",
      data: "",
      file: null,
      fileName: "",
      touched: false,
    },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null); // {variant, text}

  const cordasOptions = useMemo(() => {
    return gruposCordas.map((g) => ({
      key: g.key,
      label: g.label,
      slugs: listarCordasPorGrupo(g.key),
    }));
  }, []);

  const addRow = () =>
    setRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        corda: "",
        data: "",
        file: null,
        fileName: "",
        touched: false,
      },
    ]);

  const removeRow = (id) =>
    setRows((prev) =>
      prev.length > 1 ? prev.filter((r) => r.id !== id) : prev
    );

  const updateRow = (id, patch) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const handleFile = (id, fileObj) =>
    updateRow(id, { file: fileObj || null, fileName: fileObj?.name || "" });

  const isInvalid = (r) => !r.corda || !r.data || !r.file;
  const canSubmit =
    !!email && rows.length > 0 && rows.every((r) => !isInvalid(r));

  const resetState = () => {
    setRows([
      {
        id: crypto.randomUUID(),
        corda: "",
        data: "",
        file: null,
        fileName: "",
        touched: false,
      },
    ]);
    setMsg(null);
  };

  const handleSave = async () => {
    // marca tudo como "tocado" para mostrar validação se tiver vazio
    setRows((prev) => prev.map((r) => ({ ...r, touched: true })));
    if (!canSubmit || submitting) return;

    setMsg(null);

    if (!email) {
      setMsg({
        variant: "warning",
        text: "Não foi possível identificar seu e-mail. Recarregue a página.",
      });
      return;
    }

    try {
      setSubmitting(true);

      // envia cada linha ao backend com form-data contendo: arquivo + data + corda
      const uploads = await Promise.all(
        rows.map(async ({ corda, data, file }) => {
          const fd = new FormData();
          fd.append("arquivo", file); // <input type="file">
          fd.append("data", data); // yyyy-MM-dd
          fd.append("corda", corda); // útil para meta

          const url = `${API_URL}/upload?email=${encodeURIComponent(email)}`;
          const res = await fetch(url, {
            method: "POST",
            body: fd,
          });

          if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(
              `Falha ao enviar "${file.name}". Servidor respondeu ${
                res.status
              }. ${txt || ""}`
            );
          }

          const json = await res.json();
          return {
            corda,
            data,
            url: json?.url,
            nome: (json?.caminho || "").split("/certificados/")[1] || file.name,
          };
        })
      );

      onSave?.(uploads);

      setMsg({
        variant: "success",
        text:
          uploads.length === 1
            ? "Arquivo enviado e salvo por data."
            : `${uploads.length} arquivos enviados e salvos por data.`,
      });

      onClose?.();
      resetState();
    } catch (e) {
      console.error(e);
      setMsg({
        variant: "danger",
        text: e?.message || "Erro ao enviar seus certificados.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose?.();
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      size="lg"
      backdrop="static"
    >
      <Modal.Header closeButton>
        <Modal.Title>Enviar certificados por corda</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p className="text-muted mb-3">
          Selecione a <strong>corda</strong>, informe a{" "}
          <strong>data (ou ano)</strong> que recebeu e anexe o{" "}
          <strong>certificado</strong>. Cada envio será salvo na pasta da data (
          <code>YYYY-MM-DD</code>) e o arquivo manterá o <em>nome original</em>.
        </p>

        {!email && (
          <Alert variant="warning" className="py-2">
            Não foi possível identificar seu e-mail. Recarregue a página.
          </Alert>
        )}
        {msg && (
          <Alert
            variant={msg.variant}
            className="py-2"
            onClose={() => setMsg(null)}
            dismissible
          >
            {msg.text}
          </Alert>
        )}

        <div className="d-flex flex-column gap-3">
          {rows.map((row, idx) => {
            const showInvalid = row.touched && isInvalid(row);
            return (
              <Card
                key={row.id}
                className={showInvalid ? "border-danger" : ""}
                body
              >
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <small className="text-muted">Linha #{idx + 1}</small>
                  <CloseButton
                    aria-label="Remover linha"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length === 1}
                    title={
                      rows.length === 1
                        ? "Mantenha ao menos uma linha"
                        : "Remover linha"
                    }
                  />
                </div>

                <Row className="g-3">
                  {/* Select corda */}
                  <Col md={6} lg={5}>
                    <Form.Group controlId={`corda-${row.id}`}>
                      <Form.Label>Corda</Form.Label>
                      <Form.Select
                        value={row.corda}
                        onChange={(e) =>
                          updateRow(row.id, {
                            corda: e.target.value,
                            touched: true,
                          })
                        }
                        isInvalid={row.touched && !row.corda}
                      >
                        <option value="">Selecione a corda</option>
                        {cordasOptions.map((g) => (
                          <optgroup key={g.key} label={g.label}>
                            {g.slugs.map((slug) => (
                              <option key={slug} value={slug}>
                                {getCordaNome(slug)}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        Selecione a corda do certificado.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  {/* Data/Ano */}
                  <Col md={6} lg={3}>
                    <Form.Group controlId={`data-${row.id}`}>
                      <Form.Label>Data (ou ano)</Form.Label>
                      <Form.Control
                        type="date"
                        value={row.data}
                        onChange={(e) =>
                          updateRow(row.id, {
                            data: e.target.value,
                            touched: true,
                          })
                        }
                        isInvalid={row.touched && !row.data}
                      />
                      <Form.Control.Feedback type="invalid">
                        Informe a data (ou o ano) da conquista.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  {/* Arquivo */}
                  <Col md={12} lg={4}>
                    <Form.Group controlId={`arquivo-${row.id}`}>
                      <Form.Label>Certificado</Form.Label>
                      <InputGroup hasValidation>
                        <Form.Control
                          type="file"
                          accept=".pdf,image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0] || null;
                            handleFile(row.id, f);
                            updateRow(row.id, { touched: true });
                          }}
                          isInvalid={row.touched && !row.file}
                        />
                        <Form.Control.Feedback type="invalid">
                          Anexe o arquivo.
                        </Form.Control.Feedback>
                      </InputGroup>
                      {row.fileName && (
                        <small className="text-muted d-block mt-1 text-truncate">
                          {row.fileName}
                        </small>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
              </Card>
            );
          })}
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <Button variant="outline-primary" onClick={addRow}>
            + Adicionar outra
          </Button>
          <small className="text-muted">Você pode enviar PDF ou imagem.</small>
        </div>
      </Modal.Body>

      <Modal.Footer className="justify-content-between">
        <Button variant="secondary" onClick={handleClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={submitting}>
          {submitting ? "Salvando..." : "Salvar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
