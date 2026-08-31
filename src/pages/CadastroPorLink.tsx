import React, { useState, useEffect } from 'react';
import { Link2, Copy, Check, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

const DEFAULT_PUBLIC_URL = 'https://appjuntos.vercel.app';

const getPublicBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_PUBLIC_APP_URL?.trim();
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return DEFAULT_PUBLIC_URL;
};

const CadastroPorLink: React.FC = () => {
  const { dbUser } = useAuth();
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [userCoordRecord, setUserCoordRecord] = useState<any>(null);
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (dbUser) {
      fetchUserCoordinatorRecord();
    }
  }, [dbUser]);

  const fetchUserCoordinatorRecord = async () => {
    const { data } = await supabase
      .from('coordenadores')
      .select('link_token')
      .eq('usuario_id', dbUser.id)
      .maybeSingle();
    if (data) setUserCoordRecord(data);
  };

  const handleCopyUrl = (key: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(key);
    addNotification('Link copiado!', 'success');
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const tokenToUse = userCoordRecord?.link_token || dbUser?.link_token || dbUser?.id || 'publico';
  
  const publicLinks = [
    { key: 'landing', label: 'Landing de captação (Eleitores)', href: `${getPublicBaseUrl()}/convite/${tokenToUse}` },
    { key: 'lideranca', label: 'Convite para Lideranças', href: `${getPublicBaseUrl()}/convite/lideranca/${tokenToUse}` },
    { key: 'coordenador', label: 'Convite para Coordenadores', href: `${getPublicBaseUrl()}/convite/coordenador/${tokenToUse}` },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Links de Convite</h1>
          <p className="page-subtitle">Links exclusivos para captação via landing page "Juntos pelo Rio"</p>
        </div>
        <div className="page-actions">
          <a href={`${getPublicBaseUrl()}/convite/${tokenToUse}`} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
            <ExternalLink size={14} /> Ver Landing Page
          </a>
        </div>
      </div>

      {/* Info Banner */}
      <div className="card mb-lg" style={{
        marginBottom: 'var(--space-lg)',
        background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.05))',
        border: '1px solid rgba(16,185,129,0.2)',
      }}>
        <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-lg)', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Link2 size={24} color="#10B981" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              Como funcionam os links de convite?
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Cada pessoa recebe um link único. Quando alguém se cadastra pela landing page <strong>"Juntos pelo Rio"</strong> via esse link, os dados são automaticamente vinculados a quem compartilhou.
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>Seu token</div>
            <code style={{ fontSize: 12, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: 6 }}>
              {tokenToUse}
            </code>
          </div>
        </div>
      </div>

      <div className="card mb-lg" style={{ marginBottom: 'var(--space-lg)', padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          Seus links de convite
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>
          Vinculados a: <strong style={{ color: 'var(--brand-primary)' }}>{dbUser?.nome || 'Usuário'}</strong> • Token: <code style={{ color: '#10B981' }}>{tokenToUse}</code>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {publicLinks.map((link) => (
            <div key={link.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 12px', border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{link.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{link.href}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="badge badge-success" style={{ fontSize: 11 }}>ativo</span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleCopyUrl(link.key, link.href)}>
                  {copiedUrl === link.key ? <Check size={13} /> : <Copy size={13} />} Copiar
                </button>
                <a href={link.href} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                  <ExternalLink size={13} /> Abrir
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CadastroPorLink;
