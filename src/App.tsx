import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MapaEleitoral from './pages/MapaEleitoral';
import Eleitores from './pages/Eleitores';
import CadastroPorLink from './pages/CadastroPorLink';
import Coordenadores from './pages/Coordenadores';
import Lideranca from './pages/Lideranca';
import Nucleos from './pages/Nucleos';
import Projetos from './pages/Projetos';
import Turmas from './pages/Turmas';
import Eventos from './pages/Eventos';
import Agenda from './pages/Agenda';
import Visitas from './pages/Visitas';
import Metas from './pages/Metas';
import Ranking from './pages/Ranking';
import BI from './pages/BI';
import TSE from './pages/TSE';
import Comunicacao from './pages/Comunicacao';
import Documentos from './pages/Documentos';
import LandingConvite from './pages/LandingConvite';
import ConviteEleitor from './pages/landing/ConviteEleitor';
import ConviteLideranca from './pages/landing/ConviteLideranca';
import ConviteCoordenador from './pages/landing/ConviteCoordenador';
import Configuracoes from './pages/Configuracoes';
import Auditoria from './pages/Auditoria';
import { NotificationProvider } from './contexts/NotificationContext';
import { useSync } from './hooks/useSync';

const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { dbUser, isLoading } = useAuth();
  
  if (isLoading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando...</div>;
  }
  
  if (!dbUser) {
    window.location.href = '/login';
    return null;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { isOnline } = useSync();
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/convite/:token" element={<LandingConvite />} />
        <Route path="/convite/eleitor/:indicadoId" element={<ConviteEleitor />} />
        <Route path="/convite/lideranca/:indicadoId" element={<ConviteLideranca />} />
        <Route path="/convite/coordenador/:indicadoId" element={<ConviteCoordenador />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/mapa" element={<MapaEleitoral />} />
              <Route path="/bi" element={<BI />} />
              <Route path="/coordenadores" element={<Coordenadores />} />
              <Route path="/liderancas" element={<Lideranca />} />
              <Route path="/eleitores" element={<Eleitores />} />
              <Route path="/cadastro-link" element={<CadastroPorLink />} />
              <Route path="/nucleos" element={<Nucleos />} />
              <Route path="/projetos" element={<Projetos />} />
              <Route path="/turmas" element={<Turmas />} />
              <Route path="/eventos" element={<Eventos />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/visitas" element={<Visitas />} />
              <Route path="/metas" element={<Metas />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/tse" element={<TSE />} />
              <Route path="/comunicacao" element={<Comunicacao />} />
              <Route path="/documentos" element={<Documentos />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/auditoria" element={<Auditoria />} />
            </Routes>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
