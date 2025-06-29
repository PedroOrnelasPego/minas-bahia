/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const PainelAdmin = () => {
  const { accounts } = useMsal();
  const navigate = useNavigate();
  const mestreEmail = "contato@capoeiraminasbahia.com.br";

  const [usuarios, setUsuarios] = useState([]);
  const [usuarioExpandido, setUsuarioExpandido] = useState(null);
  const [dadosUsuarios, setDadosUsuarios] = useState({});
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const user = accounts[0];
    if (!user || user.username !== mestreEmail) {
      navigate("/notfound");
      return;
    }

    const fetchUsuarios = async () => {
      try {
        const res = await axios.get("https://portal-capoeira-backend-b4hucqbpbfd3aubd.brazilsouth-01.azurewebsites.net/perfil");
        setUsuarios(res.data);
      } catch (error) {
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
        const res = await axios.get(`https://portal-capoeira-backend-b4hucqbpbfd3aubd.brazilsouth-01.azurewebsites.net/perfil/${email}`);
        setDadosUsuarios((prev) => ({ ...prev, [email]: res.data }));
      } catch (error) {
        alert("Erro ao buscar dados do usuário.");
      } finally {
        setCarregando(false);
      }
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
            <span><strong>{user.nome}</strong> ({user.email})</span>
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
                    <Col md={3} className="text-center">
                      <img
                        src={`https://certificadoscapoeira.blob.core.windows.net/certificados/${user.email}/foto-perfil.jpg`}
                        alt="Foto de perfil"
                        className="rounded-circle"
                        style={{ width: 100, height: 100, objectFit: "cover" }}
                        onError={(e) => {
                          e.target.src = "/default-avatar.png";
                        }}
                      />
                    </Col>
                    <Col md={9}>
                      <p><strong>Nome:</strong> {dadosUsuarios[user.email]?.nome || "-"}</p>
                      <p><strong>Apelido:</strong> {dadosUsuarios[user.email]?.apelido || "-"}</p>
                      <p><strong>Sexo:</strong> {dadosUsuarios[user.email]?.sexo || "-"}</p>
                      <p><strong>Corda:</strong> {dadosUsuarios[user.email]?.corda || "-"}</p>
                      <p><strong>Data de Nascimento:</strong> {dadosUsuarios[user.email]?.dataNascimento || "-"}</p>
                      <p><strong>Endereço:</strong> {dadosUsuarios[user.email]?.endereco || "-"}</p>
                      <p><strong>Número:</strong> {dadosUsuarios[user.email]?.numero || "-"}</p>
                    </Col>
                  </Row>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </Container>
  );
};

export default PainelAdmin;
