import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { useSync } from './hooks/useSync';
import { Layout } from './components/layout/Layout';
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

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { dbUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', gap: 16,
        background: 'var(--bg-base)', color: 'var(--text-primary)'
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid rgba(99,102,241,0.2)',
          borderTop: '3px solid #6366F1',
          animation: 'spin 0.8s linear infinite'
        }} />
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Carregando...</span>
      </div>
    );
  }

  if (!dbUser) {
    window.location.replace('/login');
    return null;
  }

  return <Layout>{children}</Layout>;
};

const AppContent: React.FC = () => {
  useSync(); // Registra listeners de online/offline e sincroniza fila pendente

  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/convite/:token" element={<LandingConvite />} />
        <Route path="/convite/eleitor/:indicadoId" element={<ConviteEleitor />} />
        <Route path="/convite/lideranca/:indicadoId" element={<ConviteLideranca />} />
        <Route path="/convite/coordenador/:indicadoId" element={<ConviteCoordenador />} />

        {/* Rotas Protegidas — com Layout (Sidebar + Header) */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/mapa" element={<ProtectedRoute><MapaEleitoral /></ProtectedRoute>} />
        <Route path="/bi" element={<ProtectedRoute><BI /></ProtectedRoute>} />
        <Route path="/coordenadores" element={<ProtectedRoute><Coordenadores /></ProtectedRoute>} />
        <Route path="/liderancas" element={<ProtectedRoute><Lideranca /></ProtectedRoute>} />
        <Route path="/eleitores" element={<ProtectedRoute><Eleitores /></ProtectedRoute>} />
        <Route path="/cadastro-link" element={<ProtectedRoute><CadastroPorLink /></ProtectedRoute>} />
        <Route path="/nucleos" element={<ProtectedRoute><Nucleos /></ProtectedRoute>} />
        <Route path="/projetos" element={<ProtectedRoute><Projetos /></ProtectedRoute>} />
        <Route path="/turmas" element={<ProtectedRoute><Turmas /></ProtectedRoute>} />
        <Route path="/eventos" element={<ProtectedRoute><Eventos /></ProtectedRoute>} />
        <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
        <Route path="/visitas" element={<ProtectedRoute><Visitas /></ProtectedRoute>} />
        <Route path="/metas" element={<ProtectedRoute><Metas /></ProtectedRoute>} />
        <Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />
        <Route path="/tse" element={<ProtectedRoute><TSE /></ProtectedRoute>} />
        <Route path="/comunicacao" element={<ProtectedRoute><Comunicacao /></ProtectedRoute>} />
        <Route path="/documentos" element={<ProtectedRoute><Documentos /></ProtectedRoute>} />
        <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
        <Route path="/auditoria" element={<ProtectedRoute><Auditoria /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
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
