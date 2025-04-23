// src/router/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import MinasBahia from "../pages/MinasBahia";
import Mestre from "../pages/Mestre";
import UAI from "../pages/UAI";
import Eventos from "../pages/Eventos";
import EventAlbum from "../components/EventAlbum";
import Trajetorias from "../pages/Trajetorias";
import NotFound from "../pages/NotFound";
import AreaGraduado from "../pages/AreaGraduado";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/minas-bahia-capoeira" element={<MinasBahia />} />
      <Route path="/mestre-costela" element={<Mestre />} />
      <Route path="/eventos" element={<Eventos />} />
      <Route path="/eventos/:eventLink" element={<EventAlbum />} />
      <Route path="/uai-minas-bahia" element={<UAI />} />
      <Route path="/projetos" element={<Trajetorias />} />

      <Route path="/area-graduado" element={<AreaGraduado />} />

      {/* Crie uma rota específica para NotFound */}
      <Route path="/notfound" element={<NotFound />} />

      {/* Rota coringa: todas as URLs que não batem com nenhuma rota definida */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
