// src/router/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import MinasBahia from "../pages/MinasBahia";
import Mestre from "../pages/Mestre";
import UAI from "../pages/UAI";
import Eventos from "../pages/Eventos/Eventos";
import AlbumGroupPage from "../pages/Eventos/AlbumGroup";   // <- página do grupo
import EventAlbum from "../components/EventAlbum";          // opcional: página do álbum
import Trajetorias from "../pages/Trajetorias";
import NotFound from "../pages/NotFound";

import AreaGraduado from "../pages/AreaGraduado/AreaGraduado";
import Login from "../pages/AreaGraduado/Login/Login";
import ProtectedRoute from "../components/ProtectedRoute";
import PainelAdmin from "../pages/PainelAdmin/PainelAdmin";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/minas-bahia-capoeira" element={<MinasBahia />} />
      <Route path="/mestre-costela" element={<Mestre />} />
      <Route path="/eventos" element={<Eventos />} />
      <Route path="/eventos/:groupSlug" element={<AlbumGroupPage />} />
      {/* opcional: álbum específico */}
      <Route path="/eventos/:groupSlug/:albumSlug" element={<EventAlbum />} />
      <Route path="/uai-minas-bahia" element={<UAI />} />
      <Route path="/projetos" element={<Trajetorias />} />

      <Route path="/area-graduado/login" element={<Login />} />
      <Route
        path="/area-graduado"
        element={
          <ProtectedRoute>
            <AreaGraduado />
          </ProtectedRoute>
        }
      />
      <Route
        path="/area-graduado/painel-admin"
        element={
          <ProtectedRoute>
            <PainelAdmin />
          </ProtectedRoute>
        }
      />

      <Route path="/notfound" element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
