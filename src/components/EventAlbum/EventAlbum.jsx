import { Container } from "react-bootstrap";
import { useParams } from "react-router-dom";

const EventAlbum = () => {
  const { eventLink } = useParams();

  return (
    <Container className="p-4">
      <h1 className="text-center mb-4">Álbum para {eventLink.toUpperCase()}</h1>
      {/* Aqui você pode inserir o conteúdo ou o componente de álbum dinâmico */}
      <p className="text-center">
        Este é o álbum dinâmico para o evento <strong>{eventLink}</strong>.
      </p>
    </Container>
  );
};

export default EventAlbum;
