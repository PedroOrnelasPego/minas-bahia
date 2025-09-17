import { Container } from "react-bootstrap";
import minas from "../../../assets/projetos/icmbc.png"; // Substitua pelo caminho correto da imagem
import "./About.scss"; // Importe a folha de estilo customizada

const About = () => {
  return (
    <Container className="mt-3">
      <div className="p-2">
        <h1 className="text-center mb-4">Bem-vindos ao ICMBC</h1>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-24">
          {/* Área do texto */}
          <div className="flex-grow-1">
            <p className="mb-3" style={{ textAlign: "justify" }}>
              O Instituto de Patrimônio Cultural, Esporte, Lazer e Educação
              Minas Bahia de Capoeira ou Instituto Cultural Minas Bahia de
              Capoeira – ICMBC, sendo este último, o nome fantasia pelo qual é
              mais conhecido, é uma associação civil sem fins lucrativos e
              econômicos, de direito privado e de caráter sociocultural, fundada
              no ano de 2002 tendo seu registro oficial realizado em 2022. O
              ICMBC vem desde sua fundação, realizando eventos de capoeira,
              oficinas, cursos, palestras e pesquisas que tem a Capoeira, a
              Cultura Afro-brasileira e o Patrimônio Cultural como foco
              principal de suas atividades.
            </p>
            <p style={{ textAlign: "justify" }}>
              Reconhecido como Ponto de Cultura pelo Ministério da Cultura, o
              ICMBC através do seu presidente e integrantes fazem parte: como
              Instituição Fundadora da Rede Integrada dos Bens Imateriais
              Registrados – RIBIR; Membros do Fórum da Capoeira de BH –
              FOMCAP-BH; Membros do Comitê Gestor de Salvaguarda da Capoeira de
              Minas Gerais – IPHAN; Membros do Fórum de Entidades em Defesa do
              Patrimônio Cultural Brasileiro / MG.
            </p>
          </div>
          {/* Área da imagem */}
          <div className="mt-4 mt-md-0">
            <img
              src={minas}
              alt="Logo do ICMBC"
              className="img-fluid about-image"
            />
          </div>
        </div>
      </div>
    </Container>
  );
};

export default About;
