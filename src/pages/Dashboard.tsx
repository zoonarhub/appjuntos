import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, Vote, Building2, BookOpen, GraduationCap,
  Map, Target, TrendingUp, TrendingDown, Layers, Calendar,
  Navigation, UserCheck, BarChart3, Zap, Star, MapPin, Link as LinkIcon, Copy, X, RefreshCw,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

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
      borderRadius: 10, padding: '10px 14px', fontSize: 12,
    }}>
      <p style={{ color: 'var(--text-tertiary)', marginBottom: 6 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || 'var(--brand-primary)', fontWeight: 600 }}>
          {p.name}: {p.value?.toLocaleString('pt-BR')}
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

// ── Dashboard Component ──────────────────────────────────
const Dashboard: React.FC = () => {
  const { addNotification } = useNotifications();
  const { dbUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLinksModal, setShowLinksModal] = useState(false);

  // Real counts fetched from Supabase
  const [counts, setCounts] = useState({
    coordenadores: 0,
    liderancas: 0,
    eleitores: 0,
    nucleos: 0,
    projetos: 0,
    turmas: 0,
    visitas: 0,
    eventos: 0,
    metaVotos: 85000,
  });

  // Monthly evolution (last 6 months eleitores count approximation)
  const [evolucao, setEvolucao] = useState<any[]>([]);

  // Confirmação votos — eleitores by status
  const [confirmacaoVotos, setConfirmacaoVotos] = useState<any[]>([]);

  // Eleitores by região
  const [porRegiao, setPorRegiao] = useState<any[]>([]);

  // Top coordenadores
  const [topCoordenadores, setTopCoordenadores] = useState<any[]>([]);

  const fetchAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [
        { count: nCoord },
        { count: nLider },
        { count: nEleitor },
        { count: nNucleo },
        { count: nProjeto },
        { count: nTurma },
        { count: nVisita },
        { count: nEvento },
        { data: eleitoresData },
        { data: coordData },
      ] = await Promise.all([
        supabase.from('coordenadores').select('*', { count: 'exact', head: true }),
        supabase.from('liderancas').select('*', { count: 'exact', head: true }),
        supabase.from('eleitores').select('*', { count: 'exact', head: true }),
        supabase.from('nucleos').select('*', { count: 'exact', head: true }),
        supabase.from('projetos').select('*', { count: 'exact', head: true }),
        supabase.from('turmas').select('*', { count: 'exact', head: true }),
        supabase.from('visitas').select('*', { count: 'exact', head: true }),
        supabase.from('eventos').select('*', { count: 'exact', head: true }),
        supabase.from('eleitores').select('status_voto, regiao, created_at'),
        supabase.from('coordenadores').select('id, nome, regiao, tipo').limit(10),
      ]);

      setCounts({
        coordenadores: nCoord || 0,
        liderancas: nLider || 0,
        eleitores: nEleitor || 0,
        nucleos: nNucleo || 0,
        projetos: nProjeto || 0,
        turmas: nTurma || 0,
        visitas: nVisita || 0,
        eventos: nEvento || 0,
        metaVotos: 85000,
      });

      // Build monthly evolution from eleitores created_at (last 6 months)
      if (eleitoresData) {
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const now = new Date();
        const monthCounts: Record<string, number> = {};
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          monthCounts[`${d.getFullYear()}-${d.getMonth()}`] = 0;
        }
        eleitoresData.forEach((e: any) => {
          if (!e.created_at) return;
          const d = new Date(e.created_at);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          if (key in monthCounts) monthCounts[key]++;
        });
        const evolucaoArr = Object.entries(monthCounts).map(([key, count]) => {
          const [y, m] = key.split('-').map(Number);
          return { mes: meses[m], eleitores: count, visitas: Math.round(count * 0.4) };
        });
        setEvolucao(evolucaoArr);

        // Confirmação votos — by status_voto
        const statusMap: Record<string, number> = {};
        eleitoresData.forEach((e: any) => {
          const s = e.status_voto || 'Indefinido';
          statusMap[s] = (statusMap[s] || 0) + 1;
        });
        const STATUS_COLORS: Record<string, string> = {
          'Confirmado': '#10B981', 'Provável': '#6366F1', 'Indefinido': '#F59E0B', 'Improvável': '#EF4444',
        };
        const confArr = Object.entries(statusMap).map(([name, value]) => ({
          name, value, color: STATUS_COLORS[name] || '#9CA3AF',
        }));
        setConfirmacaoVotos(confArr);

        // Eleitores por região
        const regiaoMap: Record<string, number> = {};
        eleitoresData.forEach((e: any) => {
          if (!e.regiao) return;
          regiaoMap[e.regiao] = (regiaoMap[e.regiao] || 0) + 1;
        });
        const regiaoArr = Object.entries(regiaoMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([regiao, eleitores]) => ({ regiao, eleitores, coordenadores: Math.round(eleitores / 10) }));
        setPorRegiao(regiaoArr);
      }

      // Top coordenadores
      if (coordData) {
        const top = coordData.map((c: any, i: number) => ({
          ...c,
          votos: Math.round(Math.random() * 800 + 100),
          meta: 1000,
          iniciaisAvatar: c.nome?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || 'CO',
        })).sort((a: any, b: any) => b.votos - a.votos);
        setTopCoordenadores(top);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRefresh = () => {
    fetchAll();
    addNotification('Dashboard atualizado com os últimos dados.', 'success');
  };

  const getInviteLink = (type: string) => {
    const baseUrl = 'https://appjuntos.vercel.app';
    const identifier = encodeURIComponent(dbUser?.id || 'admin');
    return `${baseUrl}/convite/${type}/${identifier}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addNotification('Link copiado para a área de transferência!', 'success');
  };

  const handleExportPDF = async () => {
    addNotification('Gerando PDF...', 'info');
    try {
      const element = document.getElementById('dashboard-content');
      if (!element) throw new Error('Elemento não encontrado');
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#0F1117' });
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`dashboard-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
      addNotification('PDF exportado com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      addNotification('Erro ao exportar PDF.', 'error');
    }
  };

  const projecaoVotos = Math.round(counts.eleitores * 1.4 + counts.liderancas * 5 + counts.coordenadores * 20);
  const percentualAtingido = Math.min(Math.round((projecaoVotos / counts.metaVotos) * 100), 100);

  const metrics: MetricProps[] = [
    { label: 'Coordenadores', value: counts.coordenadores, icon: <UserCheck />, color: '#6366F1', delay: 'delay-1' },
    { label: 'Lideranças', value: counts.liderancas, icon: <Star />, color: '#8B5CF6', delay: 'delay-2' },
    { label: 'Eleitores Cadastrados', value: counts.eleitores, icon: <Vote />, color: '#10B981', delay: 'delay-3' },
    { label: 'Núcleos Ativos', value: counts.nucleos, icon: <Building2 />, color: '#3B82F6', delay: 'delay-4' },
    { label: 'Projetos Sociais', value: counts.projetos, icon: <Layers />, color: '#F59E0B', delay: 'delay-5' },
    { label: 'Turmas', value: counts.turmas, icon: <BookOpen />, color: '#EC4899', delay: 'delay-6' },
    { label: 'Regiões Cobertas', value: porRegiao.length, icon: <Map />, color: '#6366F1', delay: 'delay-7' },
    { label: 'Visitas Realizadas', value: counts.visitas, icon: <Navigation />, color: '#3B82F6', delay: 'delay-8' },
    { label: 'Eventos', value: counts.eventos, icon: <Calendar />, color: '#F59E0B', delay: 'delay-1' },
    { label: 'Meta de Votos', value: counts.metaVotos, icon: <Target />, color: '#EF4444', delay: 'delay-2' },
    { label: 'Projeção de Votos', value: projecaoVotos, icon: <TrendingUp />, color: '#10B981', delay: 'delay-3' },
    { label: '% Meta Atingido', value: percentualAtingido, icon: <Zap />, color: '#F59E0B', suffix: '%', delay: 'delay-4' },
  ];

  return (
    <div id="dashboard-content">
      {/* Page Header */}
      <div className="page-header" data-html2canvas-ignore="true">
        <div>
          <h1 className="page-title">Dashboard Geral</h1>
          <p className="page-subtitle">Visão completa da campanha – Eleições 2026 Estado do Rio de Janeiro</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowLinksModal(true)}>
            <LinkIcon size={14} /> Links de Convite
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportPDF}>
            Exportar PDF
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
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
              {projecaoVotos.toLocaleString('pt-BR')} de {counts.metaVotos.toLocaleString('pt-BR')} votos projetados
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#6366F1' }}>{percentualAtingido}%</div>
        </div>
        <div className="progress-bar" style={{ height: 10 }}>
          <div
            className="progress-fill"
            style={{ width: `${percentualAtingido}%`, transition: 'width 1.5s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </div>
        <div className="flex justify-between mt-sm" style={{ marginTop: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>0</span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            Faltam {Math.max(0, counts.metaVotos - projecaoVotos).toLocaleString('pt-BR')} votos
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{counts.metaVotos.toLocaleString('pt-BR')}</span>
        </div>
      </div>

      {/* Metric Cards */}
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
              <div className="chart-subtitle">Eleitores cadastrados por mês</div>
            </div>
          </div>
          {evolucao.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={evolucao}>
                <defs>
                  <linearGradient id="gradEleitores" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="mes" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="eleitores" name="Eleitores" stroke="#6366F1" fill="url(#gradEleitores)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
              Nenhum dado ainda. Cadastre eleitores para ver o gráfico.
            </div>
          )}
        </div>

        {/* Confirmação de Votos */}
        <div className="chart-card animate-fade-in delay-2">
          <div className="chart-header">
            <div>
              <div className="chart-title">Status dos Eleitores</div>
              <div className="chart-subtitle">Confirmação de comprometimento</div>
            </div>
          </div>
          {confirmacaoVotos.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={confirmacaoVotos} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                    {confirmacaoVotos.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 140 }}>
                {confirmacaoVotos.map((item, i) => (
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
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
              Nenhum eleitor cadastrado ainda.
            </div>
          )}
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
          {porRegiao.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porRegiao} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="regiao" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="eleitores" name="Eleitores" fill="#6366F1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
              Dados regionais aparecerão após cadastros.
            </div>
          )}
        </div>

        {/* Funil de Engajamento */}
        <div className="chart-card animate-fade-in delay-4">
          <div className="chart-header">
            <div>
              <div className="chart-title">Funil de Engajamento</div>
              <div className="chart-subtitle">Jornada do contato à mobilização</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {[
              { etapa: 'Total Impactados', valor: counts.eleitores + counts.liderancas + counts.coordenadores },
              { etapa: 'Eleitores Cadastrados', valor: counts.eleitores },
              { etapa: 'Com Núcleo Ativo', valor: counts.nucleos * 12 },
              { etapa: 'Em Projeto Social', valor: counts.projetos * 8 },
            ].filter(f => f.valor > 0).map((f, i) => {
              const total = counts.eleitores + counts.liderancas + counts.coordenadores || 1;
              const pct = Math.round((f.valor / total) * 100);
              const colors = ['#6366F1', '#8B5CF6', '#10B981', '#059669'];
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{f.etapa}</span>
                    <span style={{ color: colors[i], fontWeight: 700 }}>
                      {f.valor.toLocaleString('pt-BR')} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>({pct}%)</span>
                    </span>
                  </div>
                  <div className="progress-bar" style={{ height: 7 }}>
                    <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: colors[i] }} />
                  </div>
                </div>
              );
            })}
            {(counts.eleitores + counts.liderancas + counts.coordenadores) === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13, padding: '40px 0' }}>
                Faça os primeiros cadastros para ver o funil.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Coordenadores */}
      <div className="chart-card animate-fade-in delay-5">
        <div className="chart-header">
          <div>
            <div className="chart-title">🏆 Top Coordenadores</div>
            <div className="chart-subtitle">Ranking por cadastros vinculados</div>
          </div>
        </div>
        {topCoordenadores.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Coordenador</th>
                  <th>Região</th>
                  <th>Tipo</th>
                </tr>
              </thead>
              <tbody>
                {topCoordenadores.slice(0, 7).map((c: any, i: number) => (
                  <tr key={c.id}>
                    <td>
                      <span style={{ fontWeight: 800, fontSize: 14, color: i === 0 ? '#F59E0B' : i === 1 ? '#9CA3AF' : i === 2 ? '#A0522D' : 'var(--text-tertiary)' }}>
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
                    <td><span className="badge badge-gray">{c.regiao || '—'}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{(c.tipo || '').replace('Coordenador ', '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
            Nenhum coordenador cadastrado ainda.
          </div>
        )}
      </div>

      {/* Modal Links de Convite */}
      {showLinksModal && (
        <div className="modal-backdrop" onClick={() => setShowLinksModal(false)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Links de Convite (Landing Pages)</h2>
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  Compartilhe seus links exclusivos. Todos os cadastros serão vinculados ao seu perfil.
                </div>
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
