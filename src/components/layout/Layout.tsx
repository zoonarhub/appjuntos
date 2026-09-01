import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-wrapper">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}
      
      <Sidebar 
        collapsed={collapsed} 
        mobileOpen={mobileOpen}
        onToggle={() => setCollapsed(c => !c)} 
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Header 
          sidebarCollapsed={collapsed} 
          onMenuClick={() => setMobileOpen(true)}
        />
        <div className="page-container">
          {children}
        </div>
      </div>
    </div>
  );
};
