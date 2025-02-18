import { Container } from "react-bootstrap";
import "./App.css";
import About from "./components/About";
import ImgCarousel from "./components/ImgCarousel/ImgCarousel";
import MenuBar from "./components/MenuBar";
import Graduacao from "./components/Graduacao";
import TheFooter from "./components/TheFooter";

function App() {
  return (
    <>
      <MenuBar />
      <Container className="border shadow-lg p-4 bg-white my-5">
        <div>
          <About />
        </div>
        <div className="my-5">
          <ImgCarousel />
        </div>
        <div className="graduacao">
          <Graduacao></Graduacao>
        </div>
      </Container>
      <TheFooter />
    </>
  );
}

export default App;
