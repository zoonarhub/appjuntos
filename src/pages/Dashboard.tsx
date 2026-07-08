import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, FunnelChart, Funnel, LabelList,
} from 'recharts';
import {
  Users, Vote, Building2, BookOpen, GraduationCap, Trophy,
  Map, Target, TrendingUp, TrendingDown, Layers, Calendar,
  Navigation, UserCheck, BarChart3, Zap, Star, MapPin, Link as LinkIcon, Copy, X
} from 'lucide-react';
import { dashboardStats } from '../data/mock';
import { useAuth } from '../contexts/AuthContext';

// ── Animated Counter ──────────────────────────────────────
const Counter: React.FC<{ end: number; prefix?: string; suffix?: string }> = ({ end, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 1200;
    const steps = 60;
    const increment = end / steps;
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + increment, end);
      setCount(Math.floor(current));
      if (current >= end) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [end]);
  return <>{prefix}{count.toLocaleString('pt-BR')}{suffix}</>;
};

// ── Custom Tooltip ─────────────────────────────────────────
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-default)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 12,
    }}>
      <p style={{ color: 'var(--text-tertiary)', marginBottom: 6 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || 'var(--brand-primary)', fontWeight: 600 }}>
          {p.name}: {p.value.toLocaleString('pt-BR')}
        </p>
      ))}
    </div>
  );
};

// ── Metric Card ───────────────────────────────────────────
interface MetricProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  delta?: string;
  isPositive?: boolean;
  prefix?: string;
  suffix?: string;
  delay?: string;
}

const MetricCard: React.FC<MetricProps> = ({ label, value, icon, color, delta, isPositive, prefix, suffix, delay }) => (
  <div className={`metric-card animate-slide-up ${delay || ''}`}>
    <div className="metric-card-header">
      <span className="metric-card-label">{label}</span>
      <div className="metric-card-icon" style={{ background: color + '20' }}>
        {React.cloneElement(icon as React.ReactElement<any>, { size: 16, color })}
      </div>
    </div>
    <div className="metric-card-value">
      <Counter end={value} prefix={prefix} suffix={suffix} />
    </div>
    {delta && (
      <div className={`metric-card-delta ${isPositive ? 'positive' : 'negative'}`}>
        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {delta}
      </div>
    )}
  </div>
);

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useNotifications } from '../contexts/NotificationContext';

// ── Custom Tooltip ─────────────────────────────────────────
// ... keeping previous counter and tooltip definitions same, applying them inline
const Dashboard: React.FC = () => {
  const [s, setS] = useState(dashboardStats);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const { addNotification } = useNotifications();
  const { dbUser } = useAuth();
  
  const getInviteLink = (type: string) => {
    const baseUrl = 'https://juntossomosmaisfortes.vercel.app';
    const identifier = encodeURIComponent(dbUser?.nome || 'Admin');
    return `${baseUrl}/convite/${type}/${identifier}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addNotification('Link copiado para a área de transferência!', 'success');
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Simulate real data fetch
      setS({...dashboardStats});
      setIsRefreshing(false);
      addNotification('Dashboard atualizado com os últimos dados.', 'success');
    }, 1000);
  };

  const handleExportPDF = async () => {
    addNotification('Gerando PDF com dados do dashboard...', 'info');
    try {
      const element = document.getElementById('dashboard-content');
      if (!element) throw new Error('Elemento do dashboard não encontrado');
      
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`dashboard-coordena-rio-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
      addNotification('PDF exportado com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      addNotification('Erro ao exportar PDF.', 'error');
    }
  };

  const metrics: MetricProps[] = [
    { label: 'Coordenadores', value: s.totalCoordenadores, icon: <UserCheck />, color: '#6366F1', delta: '+4 este mês', isPositive: true, delay: 'delay-1' },
    { label: 'Lideranças', value: s.totalLiderancas, icon: <Star />, color: '#8B5CF6', delta: '+12 este mês', isPositive: true, delay: 'delay-2' },
    { label: 'Eleitores Cadastrados', value: s.totalEleitores, icon: <Vote />, color: '#10B981', delta: '+48 este mês', isPositive: true, delay: 'delay-3' },
    { label: 'Núcleos Ativos', value: s.totalNucleos, icon: <Building2 />, color: '#3B82F6', delta: '+2 este mês', isPositive: true, delay: 'delay-4' },
    { label: 'Projetos Sociais', value: s.totalProjetos, icon: <Layers />, color: '#F59E0B', delay: 'delay-5' },
    { label: 'Total de Aulas', value: s.totalAulas, icon: <BookOpen />, color: '#EC4899', delta: '+24 aulas', isPositive: true, delay: 'delay-6' },
    { label: 'Alunos nos Projetos', value: s.totalAlunos, icon: <GraduationCap />, color: '#14B8A6', delta: '+67 alunos', isPositive: true, delay: 'delay-7' },
    { label: 'Professores', value: s.totalProfessores, icon: <Users />, color: '#F97316', delay: 'delay-8' },
    { label: 'Regiões Cobertas', value: s.totalRegioes, icon: <Map />, color: '#6366F1', delay: 'delay-1' },
    { label: 'Zonas Eleitorais', value: s.totalZonas, icon: <MapPin />, color: '#8B5CF6', delay: 'delay-2' },
    { label: 'Seções Eleitorais', value: s.totalSecoes, icon: <BarChart3 />, color: '#10B981', delay: 'delay-3' },
    { label: 'Visitas Realizadas', value: s.totalVisitas, icon: <Navigation />, color: '#3B82F6', delta: '+8 esta semana', isPositive: true, delay: 'delay-4' },
    { label: 'Eventos', value: s.totalEventos, icon: <Calendar />, color: '#F59E0B', delay: 'delay-5' },
    { label: 'Meta de Votos', value: s.metaVotos, icon: <Target />, color: '#EF4444', delay: 'delay-6' },
    { label: 'Projeção de Votos', value: s.projecaoVotos, icon: <TrendingUp />, color: '#10B981', delta: '+2.1% vs. mês anterior', isPositive: true, delay: 'delay-7' },
    { label: '% Meta Atingido', value: s.percentualAtingido, icon: <Zap />, color: '#F59E0B', suffix: '%', delta: 'Meta: 85.000 votos', isPositive: true, delay: 'delay-8' },
  ];

  return (
    <div id="dashboard-content">
      {/* Header */}
      <div className="page-header" data-html2canvas-ignore="true">
        <div>
          <h1 className="page-title">Dashboard Geral</h1>
          <p className="page-subtitle">Visão completa da campanha – Eleições 2026 Estado do Rio de Janeiro</p>
        </div>
        <div className="page-actions">
          <span className="badge badge-success">● Sistema Online</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowLinksModal(true)}>
            <LinkIcon size={14} /> Links de Convite
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportPDF}>Exportar PDF</button>
          <button className="btn btn-primary btn-sm" onClick={handleRefresh} disabled={isRefreshing}>
            <Zap size={14} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* Progress Banner */}
      <div className="card card-glass animate-fade-in mb-lg" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
        border: '1px solid rgba(99,102,241,0.2)',
        marginBottom: 'var(--space-lg)',
      }}>
        <div className="flex items-center justify-between mb-sm" style={{ marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              Progresso Geral da Meta Eleitoral
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              {s.projecaoVotos.toLocaleString('pt-BR')} de {s.metaVotos.toLocaleString('pt-BR')} votos projetados
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#6366F1' }}>{s.percentualAtingido}%</div>
        </div>
        <div className="progress-bar" style={{ height: 10 }}>
          <div
            className="progress-fill"
            style={{ width: `${s.percentualAtingido}%`, transition: 'width 1.5s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </div>
        <div className="flex justify-between mt-sm" style={{ marginTop: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>0</span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            Faltam {(s.metaVotos - s.projecaoVotos).toLocaleString('pt-BR')} votos
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{s.metaVotos.toLocaleString('pt-BR')}</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid-cards" style={{ marginBottom: 'var(--space-xl)' }}>
        {metrics.map((m, i) => <MetricCard key={i} {...m} />)}
      </div>

      {/* Charts Row 1 */}
      <div className="grid-2 mb-lg" style={{ marginBottom: 'var(--space-lg)' }}>

        {/* Evolução de Cadastros */}
        <div className="chart-card animate-fade-in">
          <div className="chart-header">
            <div>
              <div className="chart-title">Evolução de Cadastros</div>
              <div className="chart-subtitle">Eleitores, eventos e visitas por mês</div>
            </div>
            <span className="badge badge-success">+28%</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={s.evolucaoMensal}>
              <defs>
                <linearGradient id="gradEleitores" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradEventos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="mes" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="eleitores" name="Eleitores" stroke="#6366F1" fill="url(#gradEleitores)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="visitas" name="Visitas" stroke="#10B981" fill="url(#gradEventos)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Confirmação de Votos */}
        <div className="chart-card animate-fade-in delay-2">
          <div className="chart-header">
            <div>
              <div className="chart-title">Confirmação de Votos</div>
              <div className="chart-subtitle">Status de comprometimento dos eleitores</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={s.confirmacaoVotos}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {s.confirmacaoVotos.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 140 }}>
              {s.confirmacaoVotos.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.2 }}>{item.name}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid-2 mb-lg" style={{ marginBottom: 'var(--space-lg)' }}>

        {/* Eleitores por Região */}
        <div className="chart-card animate-fade-in delay-3">
          <div className="chart-header">
            <div>
              <div className="chart-title">Eleitores por Região</div>
              <div className="chart-subtitle">Distribuição territorial</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={s.porRegiao} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="regiao" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="eleitores" name="Eleitores" fill="#6366F1" radius={[0, 4, 4, 0]} />
              <Bar dataKey="coordenadores" name="Coordenadores" fill="#10B981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Funil de Conversão */}
        <div className="chart-card animate-fade-in delay-4">
          <div className="chart-header">
            <div>
              <div className="chart-title">Funil de Engajamento</div>
              <div className="chart-subtitle">Jornada do contato à mobilização</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {s.funil.map((f, i) => {
              const pct = Math.round((f.valor / s.funil[0].valor) * 100);
              const colors = ['#6366F1', '#8B5CF6', '#A78BFA', '#10B981', '#059669'];
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{f.etapa}</span>
                    <span style={{ color: colors[i], fontWeight: 700 }}>
                      {f.valor.toLocaleString('pt-BR')} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>({pct}%)</span>
                    </span>
                  </div>
                  <div className="progress-bar" style={{ height: 7 }}>
                    <div className="progress-fill" style={{ width: `${pct}%`, background: colors[i] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ranking Top 5 */}
      <div className="chart-card animate-fade-in delay-5">
        <div className="chart-header">
          <div>
            <div className="chart-title">🏆 Top Coordenadores</div>
            <div className="chart-subtitle">Ranking por votos confirmados</div>
          </div>
          <button className="btn btn-ghost btn-sm">Ver todos</button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Coordenador</th>
                <th>Região</th>
                <th>Tipo</th>
                <th>Votos</th>
                <th>Meta</th>
                <th>Progresso</th>
              </tr>
            </thead>
            <tbody>
              {s.rankingCoordenadores.slice(0, 7).map((c: any, i) => {
                const pct = Math.round((c.votos / c.meta) * 100);
                return (
                  <tr key={c.id}>
                    <td>
                      <span style={{
                        fontWeight: 800, fontSize: 14,
                        color: i === 0 ? '#F59E0B' : i === 1 ? '#9CA3AF' : i === 2 ? '#A0522D' : 'var(--text-tertiary)',
                      }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}°`}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-sm" style={{ background: `hsl(${(i * 47) % 360}, 60%, 55%)` }}>
                          {c.iniciaisAvatar}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.nome}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-gray">{c.regiao}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{c.tipo.replace('Coordenador ', '')}</td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>{c.votos.toLocaleString('pt-BR')}</td>
                    <td style={{ color: 'var(--text-tertiary)' }}>{c.meta.toLocaleString('pt-BR')}</td>
                    <td style={{ minWidth: 120 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div className="progress-fill" style={{
                            width: `${Math.min(pct, 100)}%`,
                            background: pct >= 80 ? '#10B981' : pct >= 50 ? '#6366F1' : '#F59E0B',
                          }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', minWidth: 30 }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal Links de Convite */}
      {showLinksModal && (
        <div className="modal-backdrop" onClick={() => setShowLinksModal(false)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Links de Convite (Landing Pages)</h2>
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>Compartilhe seus links exclusivos para cadastros externos. Todos os cadastros serão vinculados ao seu perfil ({dbUser?.nome || 'Admin'}).</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowLinksModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Convite para Eleitores (Juntos pelo Rio)', type: 'eleitor', color: '#10B981' },
                { label: 'Convite para Lideranças', type: 'lideranca', color: '#8B5CF6' },
                { label: 'Convite para Coordenadores', type: 'coordenador', color: '#6366F1' },
              ].map((link) => (
                <div key={link.type} style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontWeight: 700, color: link.color }}>
                    <LinkIcon size={16} /> {link.label}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input 
                      readOnly 
                      value={getInviteLink(link.type)} 
                      style={{ flex: 1, background: 'var(--bg-default)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 12, outline: 'none' }}
                    />
                    <button className="btn btn-secondary" style={{ padding: '8px 12px' }} onClick={() => copyToClipboard(getInviteLink(link.type))}>
                      <Copy size={14} /> Copiar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
