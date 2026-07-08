import React, { useEffect, useState } from 'react';
import { Target, TrendingUp, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Metas: React.FC = () => {
  const [coordenadoresData, setCoordenadoresData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('coordenadores').select('*').order('votos', { ascending: false });
      if (!error && data) setCoordenadoresData(data);
      setLoading(false);
    };

    fetchData();
  }, []);

  const rankingCoords = [...coordenadoresData]
    .sort((a, b) => (Number(b.votos || 0) / Math.max(Number(b.meta || 1), 1)) - (Number(a.votos || 0) / Math.max(Number(a.meta || 1), 1)))
    .slice(0, 15);

  const totalMeta = coordenadoresData.reduce((s, c) => s + Number(c.meta || 0), 0);
  const totalAtual = coordenadoresData.reduce((s, c) => s + Number(c.votos || 0), 0);
  const globalPct = totalMeta > 0 ? Math.round((totalAtual / totalMeta) * 100) : 0;
  const faltam = Math.max(totalMeta - totalAtual, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Metas Eleitorais</h1>
          <p className="page-subtitle">Acompanhamento de metas individuais e globais da campanha</p>
        </div>
        <div className="page-actions">
          <span className="badge badge-success">Eleições 05/10/2026</span>
        </div>
      </div>

      <div className="card animate-fade-in mb-lg" style={{
        marginBottom: 'var(--space-lg)',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
        border: '1px solid rgba(99,102,241,0.2)',
      }}>
        <div className="grid-4">
          <div style={{ textAlign: 'center', gridColumn: 'span 1' }}>
            <div style={{ fontSize: 52, fontWeight: 900, color: '#6366F1', lineHeight: 1 }}>{globalPct}%</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>Meta Global Atingida</div>
            <div className="progress-bar" style={{ marginTop: 12, height: 8 }}>
              <div className="progress-fill" style={{ width: `${Math.min(globalPct, 100)}%` }} />
            </div>
          </div>
          {[
            { label: 'Meta Total de Votos', value: totalMeta.toLocaleString('pt-BR'), color: '#6366F1', icon: <Target size={20} /> },
            { label: 'Projeção Atual', value: totalAtual.toLocaleString('pt-BR'), color: '#10B981', icon: <TrendingUp size={20} /> },
            { label: 'Faltam', value: faltam.toLocaleString('pt-BR'), color: '#F59E0B', icon: <Trophy size={20} /> },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: 'var(--space-md)', borderLeft: '1px solid var(--border-subtle)' }}>
              <div style={{ marginBottom: 8, color: s.color }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card animate-fade-in delay-2">
        <div className="chart-header">
          <div>
            <div className="chart-title">Metas por Coordenador</div>
            <div className="chart-subtitle">Progresso individual de cada coordenador</div>
          </div>
        </div>
        <div className="table-container">
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)' }}>Carregando metas...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Coordenador</th>
                  <th>Região</th>
                  <th>Meta</th>
                  <th>Atual</th>
                  <th>% Atingido</th>
                  <th>Progresso</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rankingCoords.map((c, i) => {
                  const meta = Number(c.meta || 0);
                  const atual = Number(c.votos || 0);
                  const pct = meta > 0 ? Math.round((atual / meta) * 100) : 0;
                  const color = pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700, color: i < 3 ? '#F59E0B' : 'var(--text-tertiary)' }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar avatar-sm" style={{ background: `hsl(${i * 47 % 360}, 60%, 50%)` }}>
                            {c.nome?.split(' ').map((part: string) => part[0]).slice(0, 2).join('') || 'C'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{c.nome}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{c.tipo ? c.tipo.replace('Coordenador ', 'Coord. ') : 'Coordenador'}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-gray">{c.regiao || '—'}</span></td>
                      <td style={{ fontWeight: 700 }}>{meta.toLocaleString('pt-BR')}</td>
                      <td style={{ fontWeight: 700, color }}>{atual.toLocaleString('pt-BR')}</td>
                      <td>
                        <span style={{ fontWeight: 800, fontSize: 15, color }}>{pct}%</span>
                      </td>
                      <td style={{ minWidth: 140 }}>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${pct >= 80 ? 'badge-success' : pct >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                          {pct >= 80 ? 'No prazo' : pct >= 50 ? 'Atenção' : 'Crítico'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Metas;
