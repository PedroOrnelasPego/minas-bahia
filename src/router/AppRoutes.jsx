import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";

// Code-splitting (cada página vira um chunk separado)
const Home = lazy(() => import("../pages/Home"));
const MinasBahia = lazy(() => import("../pages/MinasBahia"));
const Mestre = lazy(() => import("../pages/Mestre"));
const UAI = lazy(() => import("../pages/UAI"));
const Eventos = lazy(() => import("../pages/Eventos/Eventos"));
const AlbumGroup = lazy(() => import("../pages/Eventos/AlbumGroup"));
const AlbumPage = lazy(() => import("../pages/Eventos/AlbumPage"));
const Trajetorias = lazy(() => import("../pages/Trajetorias"));
const NotFound = lazy(() => import("../pages/NotFound"));

const AreaGraduado = lazy(() => import("../pages/AreaGraduado/AreaGraduado"));
const Login = lazy(() => import("../pages/AreaGraduado/Login/Login"));
const PainelAdmin = lazy(() => import("../pages/PainelAdmin/PainelAdmin"));

import ProtectedRoute from "../components/ProtectedRoute";

// Fallback simples para carregamento dos chunks
function RouteFallback() {
  return (
    <div className="d-flex justify-content-center align-items-center p-4">
      <span className="text-muted">Carregando…</span>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/minas-bahia-capoeira" element={<MinasBahia />} />
        <Route path="/mestre-costela" element={<Mestre />} />

        {/* Eventos */}
        <Route path="/eventos" element={<Eventos />} />
        <Route path="/eventos/:groupSlug" element={<AlbumGroup />} />
        <Route path="/eventos/:groupSlug/:albumSlug" element={<AlbumPage />} />

        <Route path="/uai-minas-bahia" element={<UAI />} />
        <Route path="/projetos" element={<Trajetorias />} />

        {/* Portal do Graduado */}
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
          path="/painel-admin"
          element={
            <ProtectedRoute>
              <PainelAdmin />
            </ProtectedRoute>
          }
        />

        {/* NotFound */}
        <Route path="/notfound" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
