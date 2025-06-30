/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { Container, Row, Col, Spinner, Modal } from "react-bootstrap";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
import calcularIdade from "../../utils/calcularIdade";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

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

  const formatarData = (dataISO) => {
    if (!dataISO) return "-";
    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}/${ano}`;
  };

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

  return (
    <Container className="py-4">
      <h2 className="mb-4 text-center">Painel Administrativo</h2>

      {usuarios.map((user) => (
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
                  <Row>
                    <Col md={2} className="text-center">
                      <img
                        src={`https://certificadoscapoeira.blob.core.windows.net/certificados/${
                          user.email
                        }/foto-perfil.jpg?${new Date().getTime()}`}
                        alt="Foto de perfil"
                        className="rounded"
                        style={{
                          width: 150,
                          height: 200,
                          objectFit: "cover",
                          border: "2px solid #ccc",
                        }}
                        onError={(e) => {
                          e.target.src = "/default-avatar.png";
                        }}
                      />
                    </Col>
                    <Col md={9}>
                      <p>
                        <strong>Nome: </strong>
                        {dadosUsuarios[user.email]?.nome || "-"}
                      </p>
                      <p>
                        <strong>Apelido: </strong>
                        {dadosUsuarios[user.email]?.apelido || "-"}
                      </p>
                      <p>
                        <strong>Sexo: </strong>
                        {dadosUsuarios[user.email]?.sexo || "-"}
                      </p>
                      <p>
                        <strong>Corda: </strong>
                        {dadosUsuarios[user.email]?.corda || "-"}
                      </p>
                      <p>
                        <strong>Data de Nascimento: </strong>
                        {formatarData(
                          dadosUsuarios[user.email]?.dataNascimento
                        )}{" "}
                        {(() => {
                          const idade = calcularIdade(
                            dadosUsuarios[user.email]?.dataNascimento
                          );
                          return idade >= 0 ? `| ${idade} anos` : "";
                        })()}
                      </p>

                      <p>
                        <strong>Endereço: </strong>
                        {dadosUsuarios[user.email]?.endereco || "-"}
                      </p>
                      <p>
                        <strong>Número: </strong>
                        {dadosUsuarios[user.email]?.numero || "-"}
                      </p>
                    </Col>
                    <Col md={12}>
                      {certificadosUsuarios[user.email]?.length > 0 && (
                        <>
                          <h5 className="mt-3">Certificados</h5>
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

                                return (
                                  <li
                                    key={nome}
                                    className="d-flex justify-content-between align-items-center border rounded px-3 py-2 mb-2"
                                  >
                                    <span
                                      className="text-truncate"
                                      style={{ maxWidth: "60%" }}
                                    >
                                      {decodeURIComponent(
                                        escape(nomeArquivo.replace(/^\d+-/, ""))
                                      )}
                                    </span>
                                    <div className="d-flex gap-2">
                                      <button
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => {
                                          if (isPdf) {
                                            window.open(fullUrl, "_blank");
                                          } else {
                                            setPreviewUrl(fullUrl);
                                            setShowPreview(true);
                                          }
                                        }}
                                      >
                                        {isPdf
                                          ? "📄 Visualizar"
                                          : "🔍 Visualizar"}
                                      </button>
                                      <button
                                        className="btn btn-sm btn-outline-success"
                                        onClick={() => handleDownload(fullUrl)}
                                      >
                                        ⬇️ Download
                                      </button>
                                    </div>
                                  </li>
                                );
                              }
                            )}
                          </ul>
                        </>
                      )}
                    </Col>
                  </Row>
                </>
              )}
            </div>
          )}
        </div>
      ))}

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
