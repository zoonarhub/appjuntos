import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Download, Filter, TrendingUp, BarChart3, PieChart as PieIcon } from 'lucide-react';
import { dashboardStats, eleitores, coordenadores, eventos } from '../data/mock';

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: 'var(--text-tertiary)', marginBottom: 6 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || '#6366F1', fontWeight: 600 }}>{p.name}: {(p.value || 0).toLocaleString('pt-BR')}</p>
      ))}
    </div>
  );
};

// Build age distribution
const faixasEtarias = [
  { faixa: '18-24', homens: eleitores.filter(e => e.idade >= 18 && e.idade <= 24 && e.sexo === 'M').length, mulheres: eleitores.filter(e => e.idade >= 18 && e.idade <= 24 && e.sexo === 'F').length },
  { faixa: '25-34', homens: eleitores.filter(e => e.idade >= 25 && e.idade <= 34 && e.sexo === 'M').length, mulheres: eleitores.filter(e => e.idade >= 25 && e.idade <= 34 && e.sexo === 'F').length },
  { faixa: '35-44', homens: eleitores.filter(e => e.idade >= 35 && e.idade <= 44 && e.sexo === 'M').length, mulheres: eleitores.filter(e => e.idade >= 35 && e.idade <= 44 && e.sexo === 'F').length },
  { faixa: '45-59', homens: eleitores.filter(e => e.idade >= 45 && e.idade <= 59 && e.sexo === 'M').length, mulheres: eleitores.filter(e => e.idade >= 45 && e.idade <= 59 && e.sexo === 'F').length },
  { faixa: '60+', homens: eleitores.filter(e => e.idade >= 60 && e.sexo === 'M').length, mulheres: eleitores.filter(e => e.idade >= 60 && e.sexo === 'F').length },
];

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useNotifications } from '../contexts/NotificationContext';

const BI: React.FC = () => {
  const [periodoFilter, setPeriodoFilter] = useState('7d');
  const { addNotification } = useNotifications();

  const handleExportPDF = async () => {
    const element = document.getElementById('bi-content');
    if (!element) return;
    
    addNotification('Gerando PDF... Aguarde.', 'info');
    
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('bi-coordena-rio.pdf');
      addNotification('PDF exportado com sucesso.', 'success');
    } catch (error) {
      addNotification('Erro ao exportar PDF.', 'error');
    }
  };

  return (
    <div id="bi-content">
      <div className="page-header" data-html2canvas-ignore="true">
        <div>
          <h1 className="page-title">Business Intelligence</h1>
          <p className="page-subtitle">Análise avançada de dados eleitorais e campanhas</p>
        </div>
        <div className="page-actions">
          <select className="form-select" style={{ width: 140 }} value={periodoFilter} onChange={e => setPeriodoFilter(e.target.value)}>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="all">Todo período</option>
          </select>
          <button className="btn btn-secondary btn-sm" onClick={handleExportPDF}><Download size={14} /> Exportar PDF</button>
          <button className="btn btn-primary btn-sm"><Download size={14} /> Excel</button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid-4 mb-lg" style={{ marginBottom: 'var(--space-lg)' }}>
        {[
          { label: 'Taxa de Confirmação', value: `${Math.round((dashboardStats.confirmacaoVotos[0].value / dashboardStats.totalEleitores) * 100)}%`, desc: 'dos eleitores confirmados', color: '#10B981' },
          { label: 'Ticket Médio Votos/Coord.', value: Math.round(dashboardStats.projecaoVotos / dashboardStats.totalCoordenadores).toLocaleString('pt-BR'), desc: 'votos por coordenador', color: '#6366F1' },
          { label: 'Custo por Eleitor', value: 'R$ 4,20', desc: 'estimado por contato', color: '#F59E0B' },
          { label: 'Engajamento Familiar', value: `+${eleitores.reduce((s, e) => s + e.votosFamilia, 0).toLocaleString('pt-BR')}`, desc: 'votos familiares projetados', color: '#8B5CF6' },
        ].map((s, i) => (
          <div key={i} className="card animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid-2 mb-lg" style={{ marginBottom: 'var(--space-lg)' }}>
        {/* Crescimento */}
        <div className="chart-card animate-fade-in">
          <div className="chart-header">
            <div>
              <div className="chart-title">Crescimento de Cadastros</div>
              <div className="chart-subtitle">Evolução mensal de eleitores, eventos e visitas</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dashboardStats.evolucaoMensal}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="mes" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-tertiary)' }} />
              <Line type="monotone" dataKey="eleitores" name="Eleitores" stroke="#6366F1" strokeWidth={2.5} dot={{ fill: '#6366F1', r: 4 }} />
              <Line type="monotone" dataKey="eventos" name="Eventos" stroke="#10B981" strokeWidth={2.5} dot={{ fill: '#10B981', r: 4 }} />
              <Line type="monotone" dataKey="visitas" name="Visitas" stroke="#F59E0B" strokeWidth={2.5} dot={{ fill: '#F59E0B', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuição por Região */}
        <div className="chart-card animate-fade-in delay-2">
          <div className="chart-header">
            <div>
              <div className="chart-title">Eleitores por Região</div>
              <div className="chart-subtitle">Concentração geográfica</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dashboardStats.porRegiao}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="regiao" tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="eleitores" name="Eleitores" fill="#6366F1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="coordenadores" name="Coordenadores" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid-2 mb-lg" style={{ marginBottom: 'var(--space-lg)' }}>
        {/* Faixa Etária */}
        <div className="chart-card animate-fade-in delay-3">
          <div className="chart-header">
            <div>
              <div className="chart-title">Distribuição por Faixa Etária</div>
              <div className="chart-subtitle">Homens vs. Mulheres por idade</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={faixasEtarias}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="faixa" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="homens" name="Homens" fill="#6366F1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="mulheres" name="Mulheres" fill="#EC4899" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Funil Engajamento */}
        <div className="chart-card animate-fade-in delay-4">
          <div className="chart-header">
            <div>
              <div className="chart-title">Funil de Conversão</div>
              <div className="chart-subtitle">Taxa de engajamento por etapa</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
            {dashboardStats.funil.map((f, i) => {
              const pct = Math.round((f.valor / dashboardStats.funil[0].valor) * 100);
              const colors = ['#6366F1', '#8B5CF6', '#A78BFA', '#10B981', '#059669'];
              const prevPct = i > 0 ? Math.round((dashboardStats.funil[i - 1].valor) / dashboardStats.funil[0].valor * 100) : 100;
              const convPct = i > 0 ? Math.round((f.valor / dashboardStats.funil[i - 1].valor) * 100) : 100;
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[i] }} />
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{f.etapa}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>{f.valor.toLocaleString('pt-BR')}</span>
                      <span style={{ color: colors[i], fontWeight: 700 }}>{pct}%</span>
                      {i > 0 && <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>({convPct}% conv.)</span>}
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: colors[i] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="card animate-fade-in" style={{ padding: 'var(--space-md)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginRight: 8 }}>Exportar para:</span>
          {['PDF', 'Excel (XLSX)', 'CSV', 'Power BI', 'Looker Studio'].map(fmt => (
            <button key={fmt} className="btn btn-secondary btn-sm">
              <Download size={13} /> {fmt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BI;
