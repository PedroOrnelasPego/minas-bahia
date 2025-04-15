import { Container } from "react-bootstrap";
import logo from "../../assets/logo/logo-icmbc.png";
import selo from "../../assets/logo/minas.png";
import alunoAdulto from "../../assets/graduacao/aluno-adulto.png";
import alunoInfantil from "../../assets/graduacao/aluno-infantil.png";
import alunoMirin from "../../assets/graduacao/aluno-mirin.png";

const MinasBahia = () => {
  return (
    <Container>
      <h1 className="text-center mb-4">Capoeira Minas Bahia</h1>{" "}
      <div>
        <p>
          O grupo/coletivo Capoeira Minas Bahia foi criado no ano de 2002, sendo
          considerado o alicerce e a força motriz do Instituto Cultural Minas
          Bahia de Capoeira – ICMBC, ou seja, é o pilar de sustentação do ICMBC.
        </p>
        <p>
          Tendo como objetivo fomentar a capoeira e promover o desenvolvimento e
          fortalecimento das manifestações da cultura afro-brasileira e do
          Patrimônio Cultural.
        </p>
        <p>
          Idealizado pelo Mestre Costela (Alanson M. T. Gonçalves) como uma
          Escola de Educação Não Formal, o grupo/coletivo Minas Bahia de
          Capoeira, desde o seu início, realiza pesquisas e estudos para uma
          compreensão crítica e reflexiva do legado cultural e ancestral que
          foram codificados e transmitidos pelos antigos mestres(as).
          Conhecimentos científicos tradicionais que iluminam e norteiam as
          aulas de capoeira.
        </p>
        <p className="mb-3">
          O grupo/coletivo Capoeira Minas Bahia a partir de seus integrantes,
          ministram aulas de capoeira, oficinas e palestras para crianças,
          adolescentes, adultos e pessoas com necessidades especiais. Trabalho
          este, realizado com instituições parceiras que reconhecem e valorizam
          a cultura afro-brasileira e o Patrimônio Cultural para o
          fortalecimento da nossa cultura e o desenvolvimento de uma sociedade
          com mais equidade.
        </p>
      </div>
      <div className="flex justify-around">
        <img className="max-h-64" src={selo} alt="" />
        <img className="max-h-64" src={logo} alt="" />
      </div>
      <div>
        <p className="mt-3">
          O nome Minas Bahia é devido ao Mestre Costela, idealizador do projeto,
          ser natural de Belo Horizonte capital de Minas Gerais e local de
          origem do projeto, e compreender historicamente que a base, os
          fundamentos e rituais do que compreendemos como capoeira foram
          consolidados e sistematizados na Bahia, com os primeiros Mestres de
          Capoeira nas primeiras décadas do século XX.
        </p>
        <p>
          Uma observação a respeito do grupo/coletivo Capoeira Minas Bahia é,
          que o mesmo, teve uma interrupção em suas atividades de 2008 até 2015,
          momento em que o Mestre Costela, na época ainda professor de capoeira,
          voltou a fazer parte da Fundação Internacional Capoeira Artes das
          Gerais – FICAG, presidida pelo Mestre Museu, onde foi iniciado na
          capoeira em 1992. Porém, o trabalho de pesquisas e estudos continuaram
          vinculados a ideia do Instituto Cultural Minas Bahia de Capoeira –
          ICMBC. E logo em 2015 com a saída da FICAG o Mestre Costela retoma os
          trabalhos e as atividades do grupo/coletivo Capoeira Minas Bahia.
        </p>
      </div>
      <div className="mt-20">
        <div className="mb-6">
          <h1 className="text-center">Sistema de Graduação</h1>
        </div>
        <div className="flex gap-5 flex-wrap justify-center">
          <img
            className="w-lg"
            style={{ boxShadow: " #0000004f -4px 1px 10px 0px" }}
            src={alunoAdulto}
            alt=""
          />
          <img
            className="w-lg"
            style={{ boxShadow: " #0000004f -4px 1px 10px 0px" }}
            src={alunoInfantil}
            alt=""
          />
          <img
            className="w-lg"
            style={{ boxShadow: " #0000004f -4px 1px 10px 0px" }}
            src={alunoMirin}
            alt=""
          />
        </div>
      </div>
    </Container>
  );
};

export default MinasBahia;
