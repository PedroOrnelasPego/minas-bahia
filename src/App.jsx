import { Container } from "react-bootstrap";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import MenuBar from "./components/MenuBar";
import TheFooter from "./components/TheFooter";

import Home from "./pages/Home";
import MinasBahia from "./pages/MinasBahia/MinasBahia";
import Mestre from "./pages/Mestre";

function App() {
  return (
    <>
      <MenuBar />
      <Container className="border shadow-lg p-4 bg-white my-5">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/minas-bahia-capoeira" element={<MinasBahia />} />
          <Route path="/mestre-costela" element={<Mestre />} />
        </Routes>
      </Container>
      <TheFooter />
    </>
  );
}

export default App;
