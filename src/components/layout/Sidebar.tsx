import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCheck, MapPin, Building2, BookOpen,
  GraduationCap, CalendarDays, Navigation, Target, Trophy, BarChart3,
  FileSpreadsheet, MessageSquare, FolderOpen, Settings, Shield,
  ChevronLeft, ChevronRight, Map, Vote, Link2, Layers,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  section?: string;
  roles?: string[]; // undefined = all roles
}

// roles: undefined = todos | ['Administrador'] = só admin | etc.
const navItems: NavItem[] = [
  // Principal
  { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={16} />, section: 'Principal', roles: ['Administrador'] },
  { path: '/mapa', label: 'Mapa Eleitoral', icon: <Map size={16} />, section: 'Principal', roles: ['Administrador'] },
  { path: '/bi', label: 'Business Intelligence', icon: <BarChart3 size={16} />, section: 'Principal', roles: ['Administrador'] },

  // CRM
  { path: '/coordenadores', label: 'Coordenadores', icon: <Users size={16} />, section: 'CRM', roles: ['Administrador'] },
  { path: '/liderancas', label: 'Lideranças', icon: <UserCheck size={16} />, section: 'CRM', roles: ['Administrador'] },
  { path: '/eleitores', label: 'Eleitores', icon: <Vote size={16} />, section: 'CRM', roles: ['Administrador'] },
  { path: '/cadastro-link', label: 'Links de Convite', icon: <Link2 size={16} />, section: 'CRM' }, // ALL roles

  // Territorial
  { path: '/nucleos', label: 'Núcleos', icon: <Building2 size={16} />, section: 'Territorial', roles: ['Administrador'] },
  { path: '/projetos', label: 'Projetos', icon: <Layers size={16} />, section: 'Territorial', roles: ['Administrador'] },
  { path: '/turmas', label: 'Turmas', icon: <GraduationCap size={16} />, section: 'Territorial', roles: ['Administrador'] },

  // Operacional
  { path: '/eventos', label: 'Eventos', icon: <CalendarDays size={16} />, section: 'Operacional' }, // ALL roles
  { path: '/agenda', label: 'Agenda', icon: <BookOpen size={16} />, section: 'Operacional' }, // ALL roles
  { path: '/visitas', label: 'Visitas', icon: <Navigation size={16} />, section: 'Operacional' }, // ALL roles

  // Inteligência
  { path: '/metas', label: 'Metas', icon: <Target size={16} />, section: 'Inteligência', roles: ['Administrador'] },
  { path: '/ranking', label: 'Ranking', icon: <Trophy size={16} />, section: 'Inteligência', roles: ['Administrador'] },
  { path: '/tse', label: 'Integração TSE/TRE', icon: <FileSpreadsheet size={16} />, section: 'Inteligência', roles: ['Administrador'] },

  // Comunicação
  { path: '/comunicacao', label: 'Comunicação', icon: <MessageSquare size={16} />, section: 'Comunicação', roles: ['Administrador'] },
  { path: '/documentos', label: 'Documentos', icon: <FolderOpen size={16} />, section: 'Comunicação', roles: ['Administrador'] },

  // Admin
  { path: '/configuracoes', label: 'Configurações', icon: <Settings size={16} />, section: 'Admin', roles: ['Administrador'] },
  { path: '/auditoria', label: 'Auditoria', icon: <Shield size={16} />, section: 'Admin', roles: ['Administrador'] },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen?: boolean;
  onToggle: () => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, mobileOpen, onToggle, onCloseMobile }) => {
  const location = useLocation();
  const { dbUser } = useAuth();
  const userRole = (dbUser?.role || 'Liderança').trim().toLowerCase();

  const isRoleAllowed = (roles?: string[]) => {
    if (!roles || roles.length === 0) return true;
    return roles.some(role => {
      const normalizedRole = role.trim().toLowerCase();
      return normalizedRole === userRole || (normalizedRole === 'administrador' && userRole.includes('admin'));
    });
  };

  // Filter nav items based on user role
  const visibleItems = navItems.filter(item => isRoleAllowed(item.roles));

  const sections = Array.from(new Set(visibleItems.map(i => i.section)));

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">CR</div>
        {!collapsed && (
          <div className="sidebar-brand">
            <div className="sidebar-brand-name">Coordena Rio</div>
            <div className="sidebar-brand-sub">CRM Eleitoral</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {sections.map(section => {
          const sectionItems = visibleItems.filter(i => i.section === section);
          return (
            <div key={section} className="sidebar-section">
              {!collapsed && (
                <div className="sidebar-section-label">{section}</div>
              )}
              {sectionItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `sidebar-item ${isActive ? 'active' : ''}`
                  }
                  end={item.path === '/'}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="sidebar-item-icon">{item.icon}</span>
                  <span className="sidebar-item-label">{item.label}</span>
                  {item.badge && !collapsed && (
                    <span className="sidebar-badge">{item.badge}</span>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="sidebar-collapse-btn" onClick={onToggle}>
          {collapsed ? <ChevronRight size={16} /> : (
            <>
              <ChevronLeft size={16} />
              <span style={{ fontSize: 12, fontWeight: 500 }}>Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
