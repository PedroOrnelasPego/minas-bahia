import { Card, Container } from "react-bootstrap";

const About = () => {
  return (
    <Container className="mt-3">
      <Card className="p-5 text-center">
        <div>
          <h1>Bem-vindos ao Minas Bahia de Capoeira</h1>
          <p>
            O Instituto de Patrimônio Cultural, Esporte, Lazer e Educação Minas
            Bahia de Capoeira ou Instituto Cultural Minas Bahia de Capoeira –
            ICMBC, sendo este último, o nome fantasia pelo qual é mais
            conhecido, é uma associação civil sem fins lucrativos e econômicos,
            de direito privado e de caráter sociocultural, fundada no ano de
            2002 tendo seu registro oficial realizado em 2022. O ICMBC vem desde
            sua fundação, realizando eventos de capoeira, oficinas, cursos,
            palestras e pesquisas que tem a Capoeira, a Cultura Afro-brasileira
            e o Patrimônio Cultural como foco principal de suas atividades.
          </p>
          <p>
            Reconhecido como Ponto de Cultura pelo Ministério da Cultura, o
            ICMBC através do seu presidente e integrantes fazem parte: como
            Instituição Fundadora da Rede Integrada dos Bens Imateriais
            Registrados – RIBIR; Membros do Fórum da Capoeira de BH – FOMCAP-BH;
            Membros do Comitê Gestor de Salvaguarda da Capoeira de Minas Gerais
            – IPHAN; Membros do Fórum de Entidades em Defesa do Patrimônio
            Cultural Brasileiro / MG.
          </p>
        </div>
      </Card>
    </Container>
  );
};

export default About;
