import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldAlert, Search, RefreshCw, Loader2, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const MODULO_BADGE: Record<string, string> = {
  'Login': 'badge-info',
  'Eleitores': 'badge-success',
  'Pessoas': 'badge-purple',
  'Núcleos': 'badge-warning',
  'Projetos': 'badge-gray',
  'Eventos': 'badge-danger',
  'Comunicação': 'badge-info',
  'Configurações': 'badge-danger',
};

const Auditoria: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduloFilter, setModuloFilter] = useState('todos');
  const { dbUser } = useAuth();

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('auditoria_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (!error && data) {
      setLogs(data);
    }
    setLoading(false);
  };

  const modulos = ['todos', ...Array.from(new Set(logs.map(l => l.modulo).filter(Boolean)))];

  const filtered = logs.filter(l => {
    const matchSearch =
      l.usuario_nome?.toLowerCase().includes(search.toLowerCase()) ||
      l.acao?.toLowerCase().includes(search.toLowerCase()) ||
      l.modulo?.toLowerCase().includes(search.toLowerCase());
    const matchMod = moduloFilter === 'todos' || l.modulo === moduloFilter;
    return matchSearch && matchMod;
  });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR');
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Check admin access
  if (dbUser?.role !== 'Administrador') {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-tertiary)' }}>
        <ShieldAlert size={48} style={{ display: 'block', margin: '0 auto 16px', opacity: 0.4 }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Acesso Restrito</h2>
        <p>Apenas Administradores podem visualizar a trilha de auditoria.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Trilha de Auditoria</h1>
          <p className="page-subtitle">Logs completos de ações executadas no sistema — {logs.length} registros</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Atualizar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4 mb-lg" style={{ marginBottom: 'var(--space-lg)', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Total de Logs', value: logs.length, color: '#6366F1' },
          { label: 'Hoje', value: logs.filter(l => l.created_at && new Date(l.created_at).toDateString() === new Date().toDateString()).length, color: '#10B981' },
          { label: 'Com Sucesso', value: logs.filter(l => l.status === 'sucesso').length, color: '#F59E0B' },
          { label: 'Com Erro', value: logs.filter(l => l.status !== 'sucesso').length, color: '#EF4444' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value.toLocaleString('pt-BR')}</div>
          </div>
        ))}
      </div>

      <div className="filter-bar">
        <div className="search-field" style={{ flex: 1, maxWidth: 360 }}>
          <Search size={14} color="var(--text-tertiary)" />
          <input placeholder="Buscar por usuário, ação, módulo..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 200 }} value={moduloFilter} onChange={e => setModuloFilter(e.target.value)}>
          {modulos.map(m => (
            <option key={m} value={m}>{m === 'todos' ? 'Todos os Módulos' : m}</option>
          ))}
        </select>
      </div>

      <div className="table-container animate-fade-in">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <Loader2 style={{ display: 'block', margin: '0 auto 8px' }} className="animate-spin" />
            Carregando logs de auditoria...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <ShieldAlert size={40} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.3 }} />
            {logs.length === 0
              ? 'Nenhum log registrado ainda. Os logs aparecerão aqui conforme o sistema é usado.'
              : 'Nenhum log corresponde ao filtro.'}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Ação / Operação</th>
                <th>Módulo</th>
                <th>IP de Acesso</th>
                <th>Data</th>
                <th>Hora</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{l.usuario_nome || '—'}</div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', maxWidth: 280 }}>{l.acao}</td>
                  <td>
                    <span className={`badge ${MODULO_BADGE[l.modulo] || 'badge-gray'}`}>{l.modulo || '—'}</span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{l.ip || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {l.created_at ? formatDate(l.created_at) : '—'}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {l.created_at ? formatTime(l.created_at) : '—'}
                  </td>
                  <td>
                    <span className={`badge ${l.status === 'sucesso' ? 'badge-success' : 'badge-danger'}`}>
                      {l.status || 'sucesso'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Auditoria;
