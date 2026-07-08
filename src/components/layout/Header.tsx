import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Sun, Moon, LogOut, User, Settings, ChevronRight, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { supabase } from '../../lib/supabase';

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/mapa': 'Mapa Eleitoral',
  '/bi': 'Business Intelligence',
  '/pessoas': 'Pessoas',
  '/eleitores': 'Eleitores',
  '/cadastro-link': 'Cadastro por Link',
  '/nucleos': 'Núcleos',
  '/projetos': 'Projetos',
  '/turmas': 'Turmas',
  '/eventos': 'Eventos',
  '/agenda': 'Agenda',
  '/visitas': 'Visitas',
  '/metas': 'Metas',
  '/ranking': 'Ranking',
  '/tse': 'Integração TSE / TRE-RJ',
  '/comunicacao': 'Comunicação',
  '/documentos': 'Documentos',
  '/configuracoes': 'Configurações',
  '/auditoria': 'Auditoria',
};

interface HeaderProps {
  sidebarCollapsed: boolean;
}

export const Header: React.FC<HeaderProps> = ({ sidebarCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { dbUser, signOut, theme, toggleTheme } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileFormData, setProfileFormData] = useState({ nome: dbUser?.nome || '', senha: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);

  const title = ROUTE_TITLES[location.pathname] || 'Coordena Rio CRM';
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const initials = dbUser?.nome
    ? dbUser.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'AD';

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  return (
    <header className={`header ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Breadcrumb */}
      <div className="header-breadcrumb">
        <h1 className="header-breadcrumb-title">{title}</h1>
        <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
          • {dateStr}
        </span>
      </div>

      {/* Search */}
      <div className="header-search">
        <Search size={14} color="var(--text-tertiary)" />
        <input placeholder="Buscar eleitores, coordenadores..." />
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', background: 'var(--bg-overlay)', padding: '2px 6px', borderRadius: 4 }}>⌘K</span>
      </div>

      {/* Actions */}
      <div className="header-actions">
        {/* Online Status Indicator */}
        <div
          title={isOnline ? 'Online — dados sincronizados com Supabase' : 'Offline — dados salvos localmente'}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 11, fontWeight: 600,
            color: isOnline ? '#10B981' : '#F59E0B',
            background: isOnline ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
            border: `1px solid ${isOnline ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
            borderRadius: 20, padding: '3px 10px',
          }}
        >
          {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
          {isOnline ? 'Online' : 'Offline'}
        </div>

        {/* Theme Toggle */}
        <button
          className="header-action-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          style={{ position: 'relative' }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button className="header-action-btn" onClick={() => { setShowNotifications(v => !v); setShowUserMenu(false); }}>
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="header-notif-dot" style={{ minWidth: 16, height: 16, borderRadius: 8, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ef4444', color: 'white', position: 'absolute', top: 4, right: 4, border: '2px solid var(--bg-surface)' }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute', top: 44, right: 0, width: 320,
              background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
              borderRadius: 14, boxShadow: 'var(--shadow-lg)', zIndex: 200,
              overflow: 'hidden'
            }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Notificações</span>
                <span onClick={markAllAsRead} style={{ fontSize: 11, color: 'var(--brand-primary)', cursor: 'pointer' }}>Marcar todas como lidas</span>
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>Nenhuma notificação.</div>
              ) : notifications.map(n => (
                <div key={n.id} onClick={() => markAsRead(n.id)} style={{
                  padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  background: n.unread ? 'var(--bg-elevated)' : 'transparent',
                  cursor: 'pointer', transition: 'background 0.15s'
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.unread ? '#3b82f6' : 'transparent', marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: n.unread ? 600 : 400 }}>{n.text}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{new Date(n.time).toLocaleString('pt-BR')}</div>
                  </div>
                </div>
              ))}
              <div style={{ padding: '12px 16px', textAlign: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--brand-primary)', cursor: 'pointer' }}>Ver todas as notificações</span>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar + Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowUserMenu(v => !v); setShowNotifications(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              borderRadius: 10, padding: '5px 10px 5px 5px',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <div className="header-avatar" style={{ margin: 0 }}>{initials}</div>
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {dbUser?.nome || 'Usuário'}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{dbUser?.role || 'Usuário'}</span>
            </div>
          </button>

          {showUserMenu && (
            <div style={{
              position: 'absolute', top: 48, right: 0, width: 220,
              background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
              borderRadius: 14, boxShadow: 'var(--shadow-lg)', zIndex: 200,
              overflow: 'hidden', animation: 'slideDown 0.15s ease'
            }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{dbUser?.nome}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>CPF: {dbUser?.cpf}</div>
              </div>
              {[
                { icon: <User size={14} />, label: 'Perfil', action: () => { setShowProfileModal(true); setShowUserMenu(false); } },
                { icon: <Settings size={14} />, label: 'Configurações', action: () => { navigate('/configuracoes'); setShowUserMenu(false); } },
              ].map((item, i) => (
                <button key={i} onClick={item.action} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 16px', background: 'transparent', border: 'none',
                  color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
                  transition: 'background 0.15s', textAlign: 'left'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ color: 'var(--text-tertiary)' }}>{item.icon}</span>
                  {item.label}
                  <ChevronRight size={12} style={{ marginLeft: 'auto', color: 'var(--text-disabled)' }} />
                </button>
              ))}
              <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <button onClick={handleSignOut} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 16px', background: 'transparent', border: 'none',
                  color: '#ef4444', fontSize: 13, cursor: 'pointer', transition: 'background 0.15s', textAlign: 'left'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={14} />
                  Sair do Sistema
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Close dropdowns when clicking outside */}
      {(showNotifications || showUserMenu) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => { setShowNotifications(false); setShowUserMenu(false); }} />
      )}

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="modal-backdrop" onClick={() => setShowProfileModal(false)} style={{ zIndex: 300 }}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Editar Perfil</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowProfileModal(false)}>✕</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsSavingProfile(true);
              const updates: any = { nome: profileFormData.nome };
              if (profileFormData.senha) {
                 updates.senha = profileFormData.senha;
              }
              const { error } = await supabase.from('usuarios').update(updates).eq('id', dbUser.id);
              if (!error) {
                 window.location.reload();
              } else {
                 alert('Erro ao atualizar perfil.');
              }
              setIsSavingProfile(false);
            }}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome</label>
                  <input required className="form-input" value={profileFormData.nome} onChange={e => setProfileFormData({...profileFormData, nome: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Nova Senha (opcional)</label>
                  <input type="password" minLength={6} className="form-input" placeholder="Deixe em branco para não alterar" value={profileFormData.senha} onChange={e => setProfileFormData({...profileFormData, senha: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowProfileModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSavingProfile}>Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
