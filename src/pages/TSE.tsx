import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Database, Download, RefreshCw } from 'lucide-react';
import { ZONAS_ELEITORAIS, MUNICIPIOS_RJ } from '../data/mock';

const TSE: React.FC = () => {
  const [dragOver, setDragOver] = useState(false);
  const [importedFiles, setImportedFiles] = useState<{name: string; status: string; registros: number; data: string}[]>([
    { name: 'eleitorado_rj_2024.csv', status: 'processado', registros: 12487, data: '15/03/2026' },
    { name: 'locais_votacao_rj.xlsx', status: 'processado', registros: 847, data: '20/03/2026' },
    { name: 'secoes_rj_2024.csv', status: 'processado', registros: 3241, data: '22/03/2026' },
  ]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    // Simulate import
    const files = Array.from(e.dataTransfer.files);
    files.forEach(f => {
      setImportedFiles(prev => [...prev, {
        name: f.name,
        status: 'processando',
        registros: 0,
        data: new Date().toLocaleDateString('pt-BR'),
      }]);
      setTimeout(() => {
        setImportedFiles(prev => prev.map(pf =>
          pf.name === f.name ? { ...pf, status: 'processado', registros: Math.floor(Math.random() * 5000 + 500) } : pf
        ));
      }, 2000);
    });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Integração TSE / TRE-RJ</h1>
          <p className="page-subtitle">Importação de bases públicas oficiais dos órgãos eleitorais</p>
        </div>
        <div className="page-actions">
          <span className="badge badge-info">Dados oficiais TRE-RJ 2026</span>
        </div>
      </div>

      {/* LGPD Notice */}
      <div className="card mb-lg" style={{
        marginBottom: 'var(--space-lg)',
        background: 'rgba(59,130,246,0.08)',
        border: '1px solid rgba(59,130,246,0.2)',
        padding: 'var(--space-md) var(--space-lg)',
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <AlertCircle size={18} color="#3B82F6" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#3B82F6', marginBottom: 3 }}>Conformidade LGPD e Legislação Eleitoral</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Este módulo importa <strong>apenas bases públicas</strong> oficialmente disponibilizadas pelo TRE/TSE.
              Não realiza coleta automatizada de dados pessoais dos sistemas dos tribunais.
              Todos os cruzamentos são realizados em conformidade com a Lei Geral de Proteção de Dados (LGPD).
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2 mb-lg" style={{ marginBottom: 'var(--space-lg)' }}>
        {/* Upload Zone */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>Importar Base de Dados</h2>
          <div
            className="upload-zone"
            style={{ borderColor: dragOver ? '#6366F1' : undefined, background: dragOver ? 'rgba(99,102,241,0.08)' : undefined }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <Upload size={32} color={dragOver ? '#6366F1' : 'var(--text-tertiary)'} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Arraste arquivos aqui ou clique para selecionar
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  Formatos suportados: CSV, XLSX, TXT (padrão TSE/TRE)
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['CSV', 'XLSX', 'TXT'].map(f => (
                  <span key={f} className="badge badge-gray">{f}</span>
                ))}
              </div>
              <button className="btn btn-primary btn-sm">
                <FileSpreadsheet size={14} /> Selecionar Arquivo
              </button>
            </div>
          </div>

          {/* Imported Files */}
          <div style={{ marginTop: 'var(--space-md)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Arquivos Importados</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {importedFiles.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
                  <FileSpreadsheet size={16} color="#10B981" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      {f.status === 'processado' ? `${f.registros.toLocaleString('pt-BR')} registros` : 'Processando...'} • {f.data}
                    </div>
                  </div>
                  <span className={`badge ${f.status === 'processado' ? 'badge-success' : 'badge-warning'}`}>
                    {f.status === 'processado' ? <CheckCircle size={11} /> : <RefreshCw size={11} />}
                    {f.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Zonas Eleitorais */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>Zonas Eleitorais – RJ</h2>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                {ZONAS_ELEITORAIS.length} zonas carregadas
              </span>
              <button className="btn btn-ghost btn-sm"><Download size={12} /> Exportar</button>
            </div>
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)' }}>
                    {['Zona', 'Município', 'Seções'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ZONAS_ELEITORAIS.map((z, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 12px', fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#6366F1' }}>{z.zona}</td>
                      <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-secondary)' }}>{z.municipio}</td>
                      <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{z.secoes.toLocaleString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Cruzamento Estatístico */}
      <div className="card animate-fade-in">
        <div className="chart-header">
          <div>
            <div className="chart-title">Cruzamento Estatístico</div>
            <div className="chart-subtitle">Correlação entre base cadastrada e dados oficiais TSE</div>
          </div>
          <button className="btn btn-primary btn-sm"><RefreshCw size={14} /> Recalcular</button>
        </div>
        <div className="grid-3">
          {[
            { label: 'Eleitores Válidos', value: '94%', desc: 'zona/seção confirmada', color: '#10B981', detail: 457 },
            { label: 'Pendências', value: '4%', desc: 'dados para completar', color: '#F59E0B', detail: 19 },
            { label: 'Inconsistências', value: '2%', desc: 'divergência com TSE', color: '#EF4444', detail: 11 },
          ].map((s, i) => (
            <div key={i} className="stat-block" style={{ borderLeft: `3px solid ${s.color}`, alignItems: 'flex-start', padding: 'var(--space-md)' }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{s.desc} ({s.detail} registros)</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TSE;
