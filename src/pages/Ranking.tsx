import React, { useEffect, useState } from 'react';
import { Trophy, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

const CATEGORIES = ['Coordenadores', 'Núcleos', 'Projetos'];

const Ranking: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('Coordenadores');
  const [coordenadoresData, setCoordenadoresData] = useState<any[]>([]);
  const [nucleosData, setNucleosData] = useState<any[]>([]);
  const [projetosData, setProjetosData] = useState<any[]>([]);
  const [turmasData, setTurmasData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [{ data: coordenadoresRes }, { data: nucleosRes }, { data: projetosRes }, { data: turmasRes }] = await Promise.all([
        supabase.from('coordenadores').select('*').order('votos', { ascending: false }),
        supabase.from('nucleos').select('*').order('created_at', { ascending: false }),
        supabase.from('projetos').select('*').order('created_at', { ascending: false }),
        supabase.from('turmas').select('*').order('created_at', { ascending: false }),
      ]);

      setCoordenadoresData(coordenadoresRes || []);
      setNucleosData(nucleosRes || []);
      setProjetosData(projetosRes || []);
      setTurmasData(turmasRes || []);
      setLoading(false);
    };

    fetchData();
  }, []);

  const rankingCoords = [...coordenadoresData]
    .sort((a, b) => Number(b.votos || 0) - Number(a.votos || 0))
    .slice(0, 20);

  const rankingNucleos = [...nucleosData]
    .sort((a, b) => Number(b.votos || 0) - Number(a.votos || 0))
    .slice(0, 10);

  const turmaCountsByProjeto = turmasData.reduce((acc: Record<string, number>, turma: any) => {
    const key = turma.projeto_id || 'sem-projeto';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const alunosByProjeto = turmasData.reduce((acc: Record<string, number>, turma: any) => {
    const key = turma.projeto_id || 'sem-projeto';
    acc[key] = (acc[key] || 0) + Number(turma.alunos_matriculados || 0);
    return acc;
  }, {});

  const rankingProjetos = [...projetosData]
    .map((p) => ({
      id: p.id,
      nome: p.nome,
      categoria: p.categoria || 'Geral',
      alunos: alunosByProjeto[p.id] || 0,
      turmas: turmaCountsByProjeto[p.id] || 0,
      professores: 0,
      aulas: 0,
      status: p.status || 'ativo',
    }))
    .sort((a, b) => b.alunos - a.alunos)
    .slice(0, 10);

  const podium = rankingCoords.slice(0, 3);

  if (loading) {
    return <div style={{ padding: 24, color: 'var(--text-tertiary)' }}>Carregando ranking...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Ranking</h1>
          <p className="page-subtitle">Classificação geral de desempenho da campanha</p>
        </div>
        <div className="page-actions">
          <span className="badge badge-warning">🏆 Atualizado hoje</span>
        </div>
      </div>

      <div className="tabs">
        {CATEGORIES.map(c => (
          <button key={c} className={`tab ${activeCategory === c ? 'active' : ''}`} onClick={() => setActiveCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      {activeCategory === 'Coordenadores' && (
        <>
          <div className="card animate-fade-in mb-lg" style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-xl)' }}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Top 3 Coordenadores</div>
            </div>
            <div className="podium">
              <div className="podium-item">
                <div className="avatar avatar-lg" style={{ background: '#9CA3AF', border: '3px solid #9CA3AF' }}>
                  {podium[1]?.nome?.split(' ').map((part: string) => part[0]).slice(0, 2).join('') || 'C'}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 80 }}>{podium[1]?.nome?.split(' ')[0]}</div>
                <div className="podium-bar silver">2°</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{Number(podium[1]?.votos || 0).toLocaleString('pt-BR')}</div>
              </div>
              <div className="podium-item">
                <div style={{ fontSize: 24, marginBottom: 4 }}>👑</div>
                <div className="avatar avatar-xl" style={{ background: '#F59E0B', border: '3px solid #F59E0B' }}>
                  {podium[0]?.nome?.split(' ').map((part: string) => part[0]).slice(0, 2).join('') || 'C'}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', maxWidth: 90 }}>{podium[0]?.nome?.split(' ')[0]}</div>
                <div className="podium-bar gold">1°</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#F59E0B' }}>{Number(podium[0]?.votos || 0).toLocaleString('pt-BR')}</div>
              </div>
              <div className="podium-item">
                <div className="avatar avatar-lg" style={{ background: '#A0522D', border: '3px solid #A0522D' }}>
                  {podium[2]?.nome?.split(' ').map((part: string) => part[0]).slice(0, 2).join('') || 'C'}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 80 }}>{podium[2]?.nome?.split(' ')[0]}</div>
                <div className="podium-bar bronze">3°</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{Number(podium[2]?.votos || 0).toLocaleString('pt-BR')}</div>
              </div>
            </div>
          </div>

          <div className="table-container animate-fade-in delay-2">
            <table>
              <thead>
                <tr>
                  <th>Posição</th>
                  <th>Coordenador</th>
                  <th>Tipo</th>
                  <th>Região</th>
                  <th>Votos</th>
                  <th>Meta</th>
                  <th>% Meta</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rankingCoords.map((c, i) => {
                  const meta = Number(c.meta || 0);
                  const votos = Number(c.votos || 0);
                  const pct = meta > 0 ? Math.round((votos / meta) * 100) : 0;
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 900, fontSize: 16, minWidth: 28, color: i === 0 ? '#F59E0B' : i === 1 ? '#9CA3AF' : i === 2 ? '#A0522D' : 'var(--text-tertiary)' }}>
                            {i + 1}
                          </span>
                          {i < 3 && <span>{['🥇','🥈','🥉'][i]}</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar avatar-sm" style={{ background: `hsl(${i * 47 % 360}, 60%, 50%)` }}>
                            {c.nome?.split(' ').map((part: string) => part[0]).slice(0, 2).join('') || 'C'}
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.nome}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{c.tipo ? c.tipo.replace('Coordenador ', '') : '—'}</td>
                      <td><span className="badge badge-gray">{c.regiao || '—'}</span></td>
                      <td style={{ fontWeight: 800, color: '#6366F1', fontSize: 15 }}>{votos.toLocaleString('pt-BR')}</td>
                      <td style={{ color: 'var(--text-tertiary)' }}>{meta.toLocaleString('pt-BR')}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444' }}>{pct}%</span>
                      </td>
                      <td>
                        <span style={{ color: '#10B981', fontSize: 12, fontWeight: 600 }}>
                          <TrendingUp size={13} style={{ verticalAlign: 'middle' }} /> {pct >= 80 ? 'No prazo' : pct >= 50 ? 'Atenção' : 'Crítico'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeCategory === 'Núcleos' && (
        <div className="table-container animate-fade-in">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Núcleo</th>
                <th>Região</th>
                <th>Votos</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rankingNucleos.map((n, i) => (
                <tr key={n.id}>
                  <td style={{ fontWeight: 700, color: i < 3 ? '#F59E0B' : 'var(--text-tertiary)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{n.nome}</td>
                  <td><span className="badge badge-gray">{n.regiao || '—'}</span></td>
                  <td style={{ fontWeight: 700, color: '#6366F1' }}>{Number(n.votos || 0).toLocaleString('pt-BR')}</td>
                  <td><span className={`badge ${n.status === 'ativo' ? 'badge-success' : 'badge-gray'}`}>{n.status || 'ativo'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeCategory === 'Projetos' && (
        <div className="table-container animate-fade-in">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Projeto</th>
                <th>Categoria</th>
                <th>Alunos</th>
                <th>Turmas</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rankingProjetos.map((p, i) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 700, color: i < 3 ? '#F59E0B' : 'var(--text-tertiary)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.nome}</td>
                  <td><span className="badge badge-gray">{p.categoria}</span></td>
                  <td style={{ fontWeight: 700, color: '#6366F1' }}>{p.alunos}</td>
                  <td>{p.turmas}</td>
                  <td><span className={`badge ${p.status === 'ativo' ? 'badge-success' : 'badge-gray'}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Ranking;
