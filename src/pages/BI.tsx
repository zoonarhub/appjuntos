import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Download, Filter, TrendingUp, BarChart3, PieChart as PieIcon } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../contexts/NotificationContext';

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

const BI: React.FC = () => {
  const [periodoFilter, setPeriodoFilter] = useState('7d');
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);

  // Data states
  const [kpis, setKpis] = useState({
    taxaConfirmacao: 0,
    ticketMedio: 0,
    custoPorEleitor: 'R$ 4,20', // Mantemos fixo ou calculamos se houver campo de custo
    engajamentoFamiliar: 0,
  });
  
  const [evolucaoMensal, setEvolucaoMensal] = useState<any[]>([]);
  const [porRegiao, setPorRegiao] = useState<any[]>([]);
  const [faixasEtarias, setFaixasEtarias] = useState<any[]>([]);
  const [funil, setFunil] = useState<any[]>([]);

  const fetchBIData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch data
      const [{ data: eleitores }, { data: coordenadores }, { data: liderancas }, { data: eventos }, { data: visitas }] = await Promise.all([
        supabase.from('eleitores').select('id, created_at, confirmou_voto, bairro, data_nascimento, sexo'),
        supabase.from('coordenadores').select('id, created_at, bairro'),
        supabase.from('liderancas').select('id, created_at'),
        supabase.from('eventos').select('id, created_at'),
        supabase.from('visitas').select('id, created_at'),
      ]);

      const eleitoresList = eleitores || [];
      const coordenadoresList = coordenadores || [];
      
      const totalEleitores = eleitoresList.length;
      const totalCoordenadores = coordenadoresList.length;
      const confirmados = eleitoresList.filter(e => e.confirmou_voto === 'sim').length;
      
      // KPIs
      setKpis({
        taxaConfirmacao: totalEleitores > 0 ? Math.round((confirmados / totalEleitores) * 100) : 0,
        ticketMedio: totalCoordenadores > 0 ? Math.round(totalEleitores / totalCoordenadores) : 0,
        custoPorEleitor: 'R$ 4,20', // Mantendo estático como estimativa
        engajamentoFamiliar: Math.round(totalEleitores * 1.5), // Estimativa de 1.5 pessoas por familia
      });

      // Evolução Mensal (últimos 6 meses)
      const mesesLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const now = new Date();
      const monthMap: Record<string, any> = {};
      
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        monthMap[key] = { mes: mesesLabels[d.getMonth()], eleitores: 0, eventos: 0, visitas: 0 };
      }

      const mapByDate = (list: any[], type: string) => {
        list.forEach(item => {
          if (!item.created_at) return;
          const d = new Date(item.created_at);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          if (monthMap[key]) {
            monthMap[key][type]++;
          }
        });
      };

      mapByDate(eleitoresList, 'eleitores');
      mapByDate(eventos || [], 'eventos');
      mapByDate(visitas || [], 'visitas');

      setEvolucaoMensal(Object.values(monthMap));

      // Distribuição por Região
      const regiaoMap: Record<string, { eleitores: number, coordenadores: number }> = {};
      eleitoresList.forEach(e => {
        if (!e.bairro) return;
        if (!regiaoMap[e.bairro]) regiaoMap[e.bairro] = { eleitores: 0, coordenadores: 0 };
        regiaoMap[e.bairro].eleitores++;
      });
      coordenadoresList.forEach(c => {
        if (!c.bairro) return;
        if (!regiaoMap[c.bairro]) regiaoMap[c.bairro] = { eleitores: 0, coordenadores: 0 };
        regiaoMap[c.bairro].coordenadores++;
      });

      const regiaoArr = Object.entries(regiaoMap)
        .map(([regiao, data]) => ({ regiao, ...data }))
        .sort((a, b) => b.eleitores - a.eleitores)
        .slice(0, 8);
      setPorRegiao(regiaoArr);

      // Faixas Etárias
      const idades = {
        '18-24': { homens: 0, mulheres: 0 },
        '25-34': { homens: 0, mulheres: 0 },
        '35-44': { homens: 0, mulheres: 0 },
        '45-59': { homens: 0, mulheres: 0 },
        '60+': { homens: 0, mulheres: 0 },
      };

      eleitoresList.forEach(e => {
        if (!e.data_nascimento || !e.sexo) return;
        
        // Calcular idade (aproximação simples)
        const diffMs = Date.now() - new Date(e.data_nascimento).getTime();
        const ageDate = new Date(diffMs); 
        const idade = Math.abs(ageDate.getUTCFullYear() - 1970);
        
        const sexo = e.sexo === 'Masculino' || e.sexo === 'M' ? 'homens' : 'mulheres';

        if (idade >= 18 && idade <= 24) idades['18-24'][sexo]++;
        else if (idade >= 25 && idade <= 34) idades['25-34'][sexo]++;
        else if (idade >= 35 && idade <= 44) idades['35-44'][sexo]++;
        else if (idade >= 45 && idade <= 59) idades['45-59'][sexo]++;
        else if (idade >= 60) idades['60+'][sexo]++;
      });

      setFaixasEtarias(Object.entries(idades).map(([faixa, vals]) => ({ faixa, ...vals })));

      // Funil
      setFunil([
        { etapa: 'Total Contatos (Estimado)', valor: totalEleitores * 3 },
        { etapa: 'Cadastros Realizados', valor: totalEleitores },
        { etapa: 'Votos Confirmados', valor: confirmados },
      ]);

    } catch (error) {
      console.error('Error fetching BI data', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBIData();
  }, [fetchBIData, periodoFilter]); // Recarregar se mudar o filtro no futuro

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
      pdf.save(`bi-coordena-rio-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
      addNotification('PDF exportado com sucesso.', 'success');
    } catch (error) {
      addNotification('Erro ao exportar PDF.', 'error');
    }
  };

  if (loading) {
    return <div style={{ padding: 24, color: 'var(--text-tertiary)' }}>Processando dados de BI...</div>;
  }

  return (
    <div id="bi-content">
      <div className="page-header" data-html2canvas-ignore="true">
        <div>
          <h1 className="page-title">Business Intelligence</h1>
          <p className="page-subtitle">Análise avançada de dados eleitorais e campanhas baseada no CRM</p>
        </div>
        <div className="page-actions">
          <select className="form-select" style={{ width: 140 }} value={periodoFilter} onChange={e => setPeriodoFilter(e.target.value)}>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="all">Todo período</option>
          </select>
          <button className="btn btn-secondary btn-sm" onClick={handleExportPDF}><Download size={14} /> Exportar PDF</button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid-4 mb-lg" style={{ marginBottom: 'var(--space-lg)' }}>
        {[
          { label: 'Taxa de Confirmação', value: `${kpis.taxaConfirmacao}%`, desc: 'dos eleitores confirmados', color: '#10B981' },
          { label: 'Ticket Médio Votos', value: kpis.ticketMedio.toLocaleString('pt-BR'), desc: 'votos reais por coordenador', color: '#6366F1' },
          { label: 'Custo por Eleitor', value: kpis.custoPorEleitor, desc: 'estimado por contato', color: '#F59E0B' },
          { label: 'Engajamento Familiar', value: `+${kpis.engajamentoFamiliar.toLocaleString('pt-BR')}`, desc: 'votos familiares projetados', color: '#8B5CF6' },
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
              <div className="chart-subtitle">Evolução mensal de eleitores, eventos e visitas (CRM)</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={evolucaoMensal}>
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
              <div className="chart-subtitle">Concentração geográfica no CRM</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={porRegiao}>
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
              <div className="chart-subtitle">Homens vs. Mulheres por idade (CRM)</div>
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
          {funil.length > 0 && funil[0].valor > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              {funil.map((f, i) => {
                const pct = Math.round((f.valor / funil[0].valor) * 100);
                const colors = ['#6366F1', '#8B5CF6', '#10B981'];
                const convPct = i > 0 && funil[i - 1].valor > 0 ? Math.round((f.valor / funil[i - 1].valor) * 100) : 100;
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
                      <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: colors[i] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              Aguardando os primeiros cadastros para montar o funil.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BI;

