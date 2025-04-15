import { Container } from "react-bootstrap";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import MenuBar from "./components/MenuBar";
import TheFooter from "./components/TheFooter";

import Home from "./pages/Home";
import MinasBahia from "./pages/MinasBahia";
import Mestre from "./pages/Mestre";
import UAI from "./pages/UAI";
import Eventos from "./pages/Eventos";
import Trajetorias from "./pages/Trajetorias";

function App() {
  return (
    <>
      <MenuBar />
      <Container className="border shadow-lg p-4 bg-white my-5">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/minas-bahia-capoeira" element={<MinasBahia />} />
          <Route path="/mestre-costela" element={<Mestre />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="/uai-minas-bahia" element={<UAI />} />
          <Route path="/trajetorias-ancestrais" element={<Trajetorias />} />
        </Routes>
      </Container>
      <TheFooter />
    </>
  );
}

export default App;
