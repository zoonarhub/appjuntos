import React, { useState, useEffect } from 'react';
import { Link2, Copy, Check, QrCode, RefreshCw, ExternalLink, Loader2, Users, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
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
  const [coordenadores, setCoordenadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchCoordenadores();
  }, []);

  const fetchCoordenadores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coordenadores')
      .select('id, nome, tipo, bairro, regiao, link_token, total_indicados, status, meta, votos')
      .order('nome');
    if (!error && data) setCoordenadores(data);
    setLoading(false);
  };

  const handleCopy = (token: string, id: string) => {
    const link = `${getPublicBaseUrl()}/convite/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    addNotification('Link copiado!', 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const generateToken = async (coord: any) => {
    setGeneratingId(coord.id);
    const newToken = Math.random().toString(36).substring(2, 12);
    const { error } = await supabase
      .from('coordenadores')
      .update({ link_token: newToken })
      .eq('id', coord.id);
    if (!error) {
      addNotification('Novo link gerado com sucesso!', 'success');
      fetchCoordenadores();
    } else {
      addNotification('Erro ao gerar link', 'error');
    }
    setGeneratingId(null);
  };

  const handleCopyUrl = (key: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(key);
    addNotification('Link copiado!', 'success');
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const totalCadastros = coordenadores.reduce((s, c) => s + (c.total_indicados || 0), 0);
  const comLink = coordenadores.filter(c => c.link_token).length;
  const publicLinks = [
    { key: 'landing', label: 'Landing de captação', href: `${getPublicBaseUrl()}/convite/demo` },
    { key: 'eleitor', label: 'Convite para eleitor', href: `${getPublicBaseUrl()}/convite/eleitor/demo` },
    { key: 'lideranca', label: 'Convite para liderança', href: `${getPublicBaseUrl()}/convite/lideranca/demo` },
    { key: 'coordenador', label: 'Convite para coordenador', href: `${getPublicBaseUrl()}/convite/coordenador/demo` },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Links de Convite</h1>
          <p className="page-subtitle">Links exclusivos para captação via landing page "Juntos pelo Rio"</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={fetchCoordenadores}>
            <RefreshCw size={14} /> Atualizar
          </button>
          <a href={`${getPublicBaseUrl()}/convite/demo`} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
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
              Cada coordenador recebe um link único. Quando alguém se cadastra pela landing page <strong>"Juntos pelo Rio"</strong> via esse link, os dados são automaticamente vinculados ao coordenador no CRM.
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>URL base</div>
            <code style={{ fontSize: 12, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: 6 }}>
              {getPublicBaseUrl()}/convite/TOKEN
            </code>
          </div>
        </div>
      </div>

      <div className="card mb-lg" style={{ marginBottom: 'var(--space-lg)', padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
          Links públicos de captura
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {publicLinks.map((link) => (
            <div key={link.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 12px', border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{link.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{link.href}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
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

      {/* Stats */}
      <div className="grid-4 mb-lg" style={{ marginBottom: 'var(--space-lg)' }}>
        {[
          { label: 'Total Coordenadores', value: coordenadores.length, color: '#6366F1' },
          { label: 'Com Link Ativo', value: comLink, color: '#10B981' },
          { label: 'Cadastros via Link', value: totalCadastros, color: '#F59E0B' },
          { label: 'Média por Link', value: comLink > 0 ? Math.round(totalCadastros / comLink) : 0, color: '#8B5CF6' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '14px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value.toLocaleString('pt-BR')}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Links Table */}
      <div className="table-container animate-fade-in">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <Loader2 style={{ display: 'block', margin: '0 auto 8px' }} className="animate-spin" />
            Carregando coordenadores...
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Coordenador</th>
                <th>Tipo / Região</th>
                <th>Link de Convite</th>
                <th style={{ textAlign: 'center' }}>Cadastros</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {coordenadores.map((c, i) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700, color: 'var(--text-tertiary)', width: 40 }}>{i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar avatar-sm" style={{ background: `hsl(${i * 53 % 360}, 60%, 50%)`, color: 'white' }}>
                        {c.nome?.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.nome}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 12 }}>
                      <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{c.tipo}</div>
                      <div style={{ color: 'var(--text-tertiary)' }}>{c.bairro} · {c.regiao}</div>
                    </div>
                  </td>
                  <td>
                    {c.link_token ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <code style={{
                          background: 'var(--bg-elevated)', padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)', fontSize: 11, color: '#10B981',
                          border: '1px solid var(--border-subtle)', fontFamily: 'monospace',
                          maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          display: 'block',
                        }} title={`${getPublicBaseUrl()}/convite/${c.link_token}`}>
                          /convite/{c.link_token}
                        </code>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-disabled)', fontStyle: 'italic' }}>
                        Sem link gerado
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                      <Users size={14} color="var(--text-tertiary)" />
                      <span style={{ fontWeight: 700, color: '#10B981', fontSize: 15 }}>{c.total_indicados || 0}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${c.status === 'ativo' ? 'badge-success' : 'badge-gray'}`}>
                      {c.status || 'ativo'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {c.link_token ? (
                        <>
                          <button
                            className="btn btn-secondary btn-sm btn-icon"
                            title="Copiar link de convite"
                            onClick={() => handleCopy(c.link_token, c.id)}
                          >
                            {copiedId === c.id ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
                          </button>
                          <a
                            href={`${getPublicBaseUrl()}/convite/${c.link_token}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-ghost btn-sm btn-icon"
                            title="Abrir landing page"
                          >
                            <ExternalLink size={13} />
                          </a>
                        </>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => generateToken(c)}
                          disabled={generatingId === c.id}
                        >
                          {generatingId === c.id ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
                          {generatingId === c.id ? 'Gerando...' : 'Gerar Link'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {coordenadores.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
                    Nenhum coordenador encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CadastroPorLink;
