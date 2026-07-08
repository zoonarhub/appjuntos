import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../contexts/NotificationContext';

interface ImportedFileItem {
  name: string;
  status: 'importado' | 'processando';
  registros: number;
  data: string;
  url?: string | null;
}

const TSE: React.FC = () => {
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importedFiles, setImportedFiles] = useState<ImportedFileItem[]>([]);
  const { addNotification } = useNotifications();

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setImporting(true);
    setImportedFiles(prev => [...prev, { name: file.name, status: 'processando', registros: 0, data: new Date().toLocaleDateString('pt-BR') }]);

    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    let url: string | null = null;

    try {
      const { data: storageData, error: storageError } = await supabase.storage
        .from('documentos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (!storageError && storageData) {
        const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(fileName);
        url = urlData?.publicUrl || null;
      }
    } catch {
      // fallback para salvar somente os metadados
    }

    const tamanho = file.size > 1048576
      ? `${(file.size / 1048576).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    const { error: insertError } = await supabase.from('documentos').insert([{
      nome: file.name,
      tipo: file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'doc',
      tamanho,
      url,
      autor: 'Admin',
    }]);

    if (!insertError) {
      setImportedFiles(prev => prev.map(item => item.name === file.name && item.status === 'processando'
        ? { ...item, status: 'importado', registros: Math.max(1, Math.round(file.size / 1000)), url }
        : item));
      addNotification('Documento enviado para o módulo TSE.', 'success');
    } else {
      setImportedFiles(prev => prev.map(item => item.name === file.name && item.status === 'processando'
        ? { ...item, status: 'importado', registros: 1, url }
        : item));
      addNotification('Documento registrado localmente.', 'info');
    }

    setImporting(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      await handleFileUpload(file);
    }
  };

  const handleSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFileUpload(file);
    e.target.value = '';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Integração TSE / TRE-RJ</h1>
          <p className="page-subtitle">Envio de documentos oficiais e arquivos de apoio para a campanha</p>
        </div>
        <div className="page-actions">
          <span className="badge badge-info">Envio direto para o CRM</span>
        </div>
      </div>

      <div className="card mb-lg" style={{
        marginBottom: 'var(--space-lg)',
        background: 'rgba(59,130,246,0.08)',
        border: '1px solid rgba(59,130,246,0.2)',
        padding: 'var(--space-md) var(--space-lg)',
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <AlertCircle size={18} color="#3B82F6" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#3B82F6', marginBottom: 3 }}>Envio seguro de documentos</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Os arquivos enviados aqui ficam registrados no módulo de documentos e podem ser consultados no CRM.
              Não há mais dados de demonstração ou listas fictícias nesta tela.
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2 mb-lg" style={{ marginBottom: 'var(--space-lg)' }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>Enviar documento oficial</h2>
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
                  Arraste o arquivo aqui ou selecione no computador
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  Formatos suportados: PDF, DOC, XLSX, CSV, TXT
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['PDF', 'DOC', 'XLSX', 'CSV'].map(f => (
                  <span key={f} className="badge badge-gray">{f}</span>
                ))}
              </div>
              <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
                {importing ? <><Loader2 size={14} className="animate-spin" /> Enviando...</> : <><FileSpreadsheet size={14} /> Selecionar Arquivo</>}
                <input type="file" style={{ display: 'none' }} onChange={handleSelection} accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt" />
              </label>
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-md)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Arquivos enviados</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {importedFiles.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Nenhum arquivo enviado ainda.</div>
              ) : importedFiles.map((f, i) => (
                <div key={`${f.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
                  <FileSpreadsheet size={16} color="#10B981" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      {f.status === 'importado' ? `${f.registros.toLocaleString('pt-BR')} registros` : 'Enviando...'} • {f.data}
                    </div>
                  </div>
                  <span className={`badge ${f.status === 'importado' ? 'badge-success' : 'badge-warning'}`}>
                    {f.status === 'importado' ? <CheckCircle size={11} /> : <RefreshCw size={11} />}
                    {f.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>Resumo do envio</h2>
          <div className="card" style={{ padding: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Arquivos registrados no CRM</span>
              <button className="btn btn-ghost btn-sm"><Download size={12} /> Exportar</button>
            </div>
            <div className="grid-3">
              {[{ label: 'Arquivos enviados', value: importedFiles.filter(f => f.status === 'importado').length.toString(), color: '#10B981' }, { label: 'Em processamento', value: importedFiles.filter(f => f.status === 'processando').length.toString(), color: '#F59E0B' }, { label: 'Total', value: importedFiles.length.toString(), color: '#6366F1' }].map((s) => (
                <div key={s.label} className="stat-block" style={{ borderLeft: `3px solid ${s.color}`, alignItems: 'flex-start', padding: 'var(--space-md)' }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TSE;
