import { useEffect, useState } from "react";
import { Container, Row, Col, Modal, Button } from "react-bootstrap";
import { supabase } from "../../lib/supabaseClient";
import Registro from "./Registro";
import Login from "./Login";

const AreaGraduado = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modoRegistro, setModoRegistro] = useState(false);
  const [userData, setUserData] = useState({ nome: "", email: "" });
  const [perfil, setPerfil] = useState({
    nome: "",
    apelido: "",
    idade: "",
    sexo: "",
    endereco: "",
  });
  const [arquivos, setArquivos] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data?.session ?? null);
      setLoading(false);
    };
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const nome = data.user.user_metadata?.nome || "Sem nome";
        const email = data.user.email;
        setUserData({ nome, email });
      }
    };

    const fetchPerfil = async () => {
      const { data } = await supabase
        .from("perfis")
        .select("*")
        .eq("id", session.user.id)
        .single();
      if (data) {
        setPerfil(data);
      }
    };

    if (session) {
      fetchUser();
      listarArquivos();
      fetchPerfil();
    }
  }, [session]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserData({ nome: "", email: "" });
    setArquivos([]);
    setPreviewUrl("");
    setShowPreview(false);
    setPerfil({ nome: "", apelido: "", idade: "", sexo: "", endereco: "" });
  };

  const listarArquivos = async () => {
    if (!session) return;
    const { data, error } = await supabase.storage
      .from("certificados")
      .list(session.user.id);
    if (!error) setArquivos(data || []);
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !session) return;

    const filePath = `${session.user.id}/${file.name}`;
    setUploading(true);

    const { error } = await supabase.storage
      .from("certificados")
      .upload(filePath, file);

    setUploading(false);
    setShowUploadModal(false);

    if (!error) await listarArquivos();
  };

  const handleDelete = async (filename) => {
    const path = `${session.user.id}/${filename}`;
    const { error } = await supabase.storage
      .from("certificados")
      .remove([path]);
    if (!error) await listarArquivos();
  };

  const handlePreview = async (filename) => {
    const { data, error } = await supabase.storage
      .from("certificados")
      .createSignedUrl(`${session.user.id}/${filename}`, 60);
    if (!error && data?.signedUrl) {
      setPreviewUrl(data.signedUrl);
      setShowPreview(true);
    }
  };

  const salvarPerfil = async () => {
    const { error } = await supabase
      .from("perfis")
      .upsert({ id: session.user.id, ...perfil });

    if (!error) {
      await supabase.auth.updateUser({ data: { nome: perfil.nome } });
      setUserData((prev) => ({ ...prev, nome: perfil.nome }));
      setShowEditModal(false);
    }
  };

  if (loading) return <p>Carregando...</p>;

  if (!session)
    return modoRegistro ? (
      <Registro onVoltarParaLogin={() => setModoRegistro(false)} />
    ) : (
      <Login onIrParaRegistro={() => setModoRegistro(true)} />
    );

  return (
    <Container fluid className="min-h-screen p-4">
      <Row className="mb-4">
        <Col className="bg-light p-3">
          <h4>
            Graduado(a): {userData.nome} - {perfil.apelido}
          </h4>
        </Col>
      </Row>

      <Row>
        <Col md={2} className="border p-3 d-flex flex-column gap-2">
          <button
            className="btn btn-primary"
            onClick={() => setShowEditModal(true)}
          >
            Editar Perfil
          </button>
          <button onClick={handleSignOut} className="btn btn-danger">
            Sair
          </button>
        </Col>

        <Col md={10} className="border p-3">
          <h5 className="text-center">Meu Currículo</h5>
          <div className="ps-3 pt-2">
            <p>Nome: {perfil.nome || "-"}</p>
            <p>Apelido: {perfil.apelido || "-"}</p>
            <p>Idade: {perfil.idade || "-"}</p>
            <p>Sexo: {perfil.sexo || "-"}</p>
            <p>Endereço: {perfil.endereco || "-"}</p>
          </div>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={6} className="border p-3 text-center">
          <h5>Arquivos Públicos</h5>
          <p>Área para documentos de download público</p>
        </Col>

        <Col md={6} className="border p-3">
          <h5 className="text-center mb-3">Arquivos Pessoais</h5>
          <div className="d-flex justify-content-center mb-3">
            <Button
              variant="secondary"
              onClick={() => setShowUploadModal(true)}
            >
              📎 Enviar Arquivo
            </Button>
          </div>

          {arquivos.length === 0 ? (
            <p className="text-center">Nenhum arquivo enviado</p>
          ) : (
            <ul className="list-unstyled">
              {arquivos.map((arq) => (
                <li
                  key={arq.name}
                  className="d-flex justify-content-between align-items-center border rounded px-3 py-2 mb-2"
                >
                  <span className="text-truncate" style={{ maxWidth: "60%" }}>
                    {arq.name}
                  </span>
                  <div className="d-flex gap-2">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => handlePreview(arq.name)}
                    >
                      🔍
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(arq.name)}
                    >
                      🗑
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Col>
      </Row>

      {/* Modal Upload */}
      <Modal
        show={showUploadModal}
        onHide={() => setShowUploadModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Enviar Arquivo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="form-control"
          />
          {uploading && <p className="mt-2">Enviando...</p>}
        </Modal.Body>
      </Modal>

      {/* Modal Preview */}
      <Modal
        show={showPreview}
        onHide={() => setShowPreview(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Pré-visualização do Arquivo</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <img
            src={previewUrl}
            alt="Preview"
            style={{
              maxWidth: "100%",
              maxHeight: "70vh",
              objectFit: "contain",
            }}
          />
        </Modal.Body>
      </Modal>

      {/* Modal Editar Perfil */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Editar Perfil</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <input
            className="form-control mb-2"
            placeholder="Nome"
            value={perfil.nome}
            onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
          />
          <input
            className="form-control mb-2"
            placeholder="Apelido"
            value={perfil.apelido}
            onChange={(e) => setPerfil({ ...perfil, apelido: e.target.value })}
          />
          <input
            className="form-control mb-2"
            placeholder="Idade"
            type="number"
            value={perfil.idade}
            onChange={(e) =>
              setPerfil({ ...perfil, idade: parseInt(e.target.value) })
            }
          />
          <input
            className="form-control mb-2"
            placeholder="Sexo"
            value={perfil.sexo}
            onChange={(e) => setPerfil({ ...perfil, sexo: e.target.value })}
          />
          <input
            className="form-control mb-2"
            placeholder="Endereço"
            value={perfil.endereco}
            onChange={(e) => setPerfil({ ...perfil, endereco: e.target.value })}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={salvarPerfil}>
            Salvar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AreaGraduado;
