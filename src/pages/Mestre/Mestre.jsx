import { Container } from "react-bootstrap";

import carteirinha from "../../assets/mestre/carteirinha.jpg";
import mestre from "../../assets/mestre/mestre.png";

const Mestre = () => {
  return (
    <Container>
      <h1 className="text-center mb-4">Mestre Costela</h1>
      <div>
        <p>
          Alanson Moreira Teixeira Gonçalves mais conhecido como Mestre Costela,
          é natural de Belo Horizonte - MG, nascido no dia 11/11/1978. Iniciou
          na capoeira em novembro de 1992 no salão da Igreja do Bairro Pompeia,
          localizado na região Leste de Belo Horizonte, bairro no qual moravam
          seus avos paternos.
        </p>
        <p>
          Iniciou na Fundação Internacional de Capoeira Artes das Gerais
          presidida pelo Mestre Museu, no qual ficou de 1992 até 1996,
          retornando posteriormente de 2008 até 2015. No ano de 1996 para 1997
          passou a treinar com o Mestre Mandruvá, na época integrante do Grupo
          Cais da Bahia e presidido pelo Mestre Chocolate, período este, que
          ministrou suas primeiras aulas de capoeira. Com a saída do Mestre
          Mandruvá do Cais da Bahia e sua transição para o grupo Senzala do Rio
          de Janeiro, na época presidido pelo Mestre Peixinho, Costela acompanha
          seu professor na época. No final de 2000 para 2001, por motivos
          pessoais, deixa de treinar com o Mestre Mandruvá e já em 2001 chega a
          passar um breve período na academia do Mestre Mão Branca (cerca de 1
          ano, mais ou menos).
        </p>
      </div>
      <div className="flex justify-center items-center gap-2.5">
        <p >
          No final de 2001, o Mestre Costela resolve abdicar de tudo e
          dedicar-se, de forma mais efetiva, à capoeira. Fundando no início de
          2002 o Instituto Cultural Minas Bahia de Capoeira – ICMBC, que no
          primeiro momento, não tinha como proposta ser um Grupo de Capoeira,
          mas um projeto que objetivava realizar ações sociais a partir da
          capoeira, além de divulgar e fomentar a arte da Capoeira, da Cultura
          Afro-brasileira e do Patrimônio Cultural. Hoje o Mestre Costela ainda
          treina e tem como sua referência o Mestre Jaiminho (BH), que o conhece
          e o acompanha em suas ações com a Capoeira, desde de a década de 1990.
        </p>
        <img src={carteirinha} alt="" />
      </div>
      <div className="flex justify-center items-center gap-2.5">
        <img src={mestre} alt="" />
        <p>
          Mestre Alanson Costela é Mestre em Educação pela PUC-Minas,
          Especialista em Maçonologia: História e Filosofia pela UNINTER,
          Bacharel e Licenciado em História pelo UNI – BH, Especialista em
          Inteligência Artificial na Pratica e Administração de Pequenas e
          Médias Empresas pela Universidade Metropolitana de São Paulo.
          Acupunturista formado pela Escola Sistêmica de Terapias Humanas ESATH.
          Ex-conselheiro de Política Cultural do Estado de Minas Gerias -
          CONSEC-MG como representante da cadeira de Culturas Afro-brasileiras,
          presidente-fundador do Instituto Cultural Minas Bahia de Capoeira -
          ICMBC, no qual desenvolve o projeto &quot;Educação ao Som do
          Berimbau&quot;, no Centro Cultural do bairro Salgado Filho em Belo
          Horizonte desde 2009. Ex-conselheiro Municipal de Políticas Culturais
          de Belo Horizonte representante das Culturas Populares e Tradicionais.
          Tendo experiência na área da Educação, com ênfase em Métodos e
          Técnicas de Ensino, Educação Patrimonial, Jogos e Brincadeiras,
          Cultura africana e afro-brasileira, religiões de matrizes africanas,
          História da China e Medicina Tradicional Chinesa – MTC. Além de
          realizar atendimentos de Acupuntura e técnicas afins em duas Clínicas
          Médicas em BH.
        </p>
      </div>
    </Container>
  );
};

export default Mestre;
