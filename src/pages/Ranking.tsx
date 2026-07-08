import React, { useState } from 'react';
import { coordenadores, nucleos, projetos, dashboardStats } from '../data/mock';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

const CATEGORIES = ['Coordenadores', 'Núcleos', 'Projetos'];

const Ranking: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('Coordenadores');

  const rankingCoords = [...coordenadores]
    .sort((a, b) => b.votos - a.votos)
    .slice(0, 20);

  const rankingNucleos = [...nucleos]
    .sort((a, b) => b.participantes - a.participantes)
    .slice(0, 10);

  const rankingProjetos = [...projetos]
    .sort((a, b) => b.alunos - a.alunos)
    .slice(0, 10);

  const podium = rankingCoords.slice(0, 3);

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

      {/* Category Tabs */}
      <div className="tabs">
        {CATEGORIES.map(c => (
          <button key={c} className={`tab ${activeCategory === c ? 'active' : ''}`} onClick={() => setActiveCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      {activeCategory === 'Coordenadores' && (
        <>
          {/* Podium */}
          <div className="card animate-fade-in mb-lg" style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-xl)' }}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Top 3 Coordenadores</div>
            </div>
            <div className="podium">
              {/* 2nd */}
              <div className="podium-item">
                <div className="avatar avatar-lg" style={{ background: '#9CA3AF', border: '3px solid #9CA3AF' }}>
                  {podium[1]?.iniciaisAvatar}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 80 }}>{podium[1]?.nome.split(' ')[0]}</div>
                <div className="podium-bar silver">2°</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{podium[1]?.votos.toLocaleString('pt-BR')}</div>
              </div>
              {/* 1st */}
              <div className="podium-item">
                <div style={{ fontSize: 24, marginBottom: 4 }}>👑</div>
                <div className="avatar avatar-xl" style={{ background: '#F59E0B', border: '3px solid #F59E0B' }}>
                  {podium[0]?.iniciaisAvatar}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', maxWidth: 90 }}>{podium[0]?.nome.split(' ')[0]}</div>
                <div className="podium-bar gold">1°</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#F59E0B' }}>{podium[0]?.votos.toLocaleString('pt-BR')}</div>
              </div>
              {/* 3rd */}
              <div className="podium-item">
                <div className="avatar avatar-lg" style={{ background: '#A0522D', border: '3px solid #A0522D' }}>
                  {podium[2]?.iniciaisAvatar}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 80 }}>{podium[2]?.nome.split(' ')[0]}</div>
                <div className="podium-bar bronze">3°</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{podium[2]?.votos.toLocaleString('pt-BR')}</div>
              </div>
            </div>
          </div>

          {/* Full Ranking Table */}
          <div className="table-container animate-fade-in delay-2">
            <table>
              <thead>
                <tr>
                  <th>Posição</th>
                  <th>Coordenador</th>
                  <th>Tipo</th>
                  <th>Região</th>
                  <th>Equipe</th>
                  <th>Votos</th>
                  <th>Meta</th>
                  <th>% Meta</th>
                  <th>Tendência</th>
                </tr>
              </thead>
              <tbody>
                {rankingCoords.map((c, i) => {
                  const pct = Math.round((c.votos / c.meta) * 100);
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
                            {c.iniciaisAvatar}
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.nome}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{c.tipo.replace('Coordenador ', '')}</td>
                      <td><span className="badge badge-gray">{c.regiao}</span></td>
                      <td style={{ textAlign: 'center' }}>{c.equipe}</td>
                      <td style={{ fontWeight: 800, color: '#6366F1', fontSize: 15 }}>{c.votos.toLocaleString('pt-BR')}</td>
                      <td style={{ color: 'var(--text-tertiary)' }}>{c.meta.toLocaleString('pt-BR')}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444' }}>{pct}%</span>
                      </td>
                      <td>
                        <span style={{ color: '#10B981', fontSize: 12, fontWeight: 600 }}>
                          <TrendingUp size={13} style={{ verticalAlign: 'middle' }} /> +{Math.floor(Math.random() * 50 + 5)}
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
                <th>Participantes</th>
                <th>Projetos</th>
                <th>Eventos</th>
                <th>Meta</th>
                <th>% Meta</th>
              </tr>
            </thead>
            <tbody>
              {rankingNucleos.map((n, i) => (
                <tr key={n.id}>
                  <td style={{ fontWeight: 700, color: i < 3 ? '#F59E0B' : 'var(--text-tertiary)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{n.nome}</td>
                  <td><span className="badge badge-gray">{n.regiao}</span></td>
                  <td style={{ fontWeight: 700, color: '#6366F1' }}>{n.participantes}</td>
                  <td>{n.projetos}</td>
                  <td>{n.eventos}</td>
                  <td style={{ color: 'var(--text-tertiary)' }}>{n.meta}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#10B981' }}>{Math.round((n.participantes/n.meta)*100)}%</span>
                  </td>
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
                <th>Professores</th>
                <th>Aulas</th>
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
                  <td>{p.professores}</td>
                  <td>{p.aulas}</td>
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
