import React, { useState, useEffect } from 'react';
import { Upload, File, Image, Video, FileText, Search, Trash2, Eye, Loader2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

const TYPE_ICON: Record<string, React.ReactNode> = {
  pdf: <FileText size={22} color="#EF4444" />,
  imagem: <Image size={22} color="#10B981" />,
  video: <Video size={22} color="#8B5CF6" />,
  doc: <File size={22} color="#6366F1" />,
};

const TYPE_BG: Record<string, string> = {
  pdf: 'rgba(239,68,68,0.12)',
  imagem: 'rgba(16,185,129,0.12)',
  video: 'rgba(139,92,246,0.12)',
  doc: 'rgba(99,102,241,0.12)',
};

const MOCKUP_PATTERNS = [/mock/i, /sample/i, /demo/i, /exemplo/i, /teste/i];

const getFileType = (name: string, mime: string): string => {
  if (mime.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
  if (mime.includes('image')) return 'imagem';
  if (mime.includes('video')) return 'video';
  return 'doc';
};

const isMockupDoc = (doc: any) => {
  const text = `${doc?.nome || ''} ${doc?.tipo || ''} ${doc?.url || ''}`.toLowerCase();
  return MOCKUP_PATTERNS.some((pattern) => pattern.test(text));
};

const Documentos: React.FC = () => {
  const [search, setSearch] = useState('');
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const { addNotification } = useNotifications();
  const { dbUser } = useAuth();

  useEffect(() => { fetchDocs(); }, []);

  const fetchDocs = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('documentos').select('*').order('created_at', { ascending: false });

    if (!error && data) {
      const visibleDocs = data.filter((doc) => !isMockupDoc(doc));
      setDocs(visibleDocs);

      const mockDocs = data.filter(isMockupDoc);
      if (mockDocs.length > 0) {
        const ids = mockDocs.map((doc) => doc.id).filter(Boolean);
        if (ids.length > 0) {
          await supabase.from('documentos').delete().in('id', ids);
        }
      }
    }
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const tipo = getFileType(file.name, file.type);
    const tamanho = file.size > 1048576
      ? `${(file.size / 1048576).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    setUploading(true);

    let url: string | null = null;
    const fileName = `${Date.now()}_${file.name}`;
    try {
      const { data: storageData, error: storageError } = await supabase.storage
        .from('documentos')
        .upload(fileName, file);

      if (!storageError && storageData) {
        const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(fileName);
        url = urlData?.publicUrl || null;
      }
    } catch {
      // fallback para adição apenas local
    }

    const { data: inserted, error } = await supabase.from('documentos').insert([{
      nome: file.name,
      tipo,
      tamanho,
      url,
      autor: dbUser?.nome || 'Admin',
    }]).select().single();

    if (!error && inserted) {
      setDocs(prev => [inserted, ...prev]);
      addNotification('Arquivo enviado com sucesso!', 'success');
    } else {
      setDocs(prev => [{
        id: Date.now().toString(),
        nome: file.name,
        tipo,
        tamanho,
        url: url || null,
        autor: dbUser?.nome || 'Admin',
        created_at: new Date().toISOString(),
      }, ...prev]);
      addNotification('Arquivo adicionado (sem storage configurado).', 'info');
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleView = (doc: any) => {
    if (doc.url) {
      window.open(doc.url, '_blank', 'noopener,noreferrer');
    } else {
      setPreviewDoc(doc);
    }
  };

  const handleDelete = async (doc: any) => {
    if (!window.confirm(`Excluir "${doc.nome}"?`)) return;
    if (doc.url) {
      const path = doc.url.split('/documentos/').pop();
      if (path) await supabase.storage.from('documentos').remove([path]);
    }
    const { error } = await supabase.from('documentos').delete().eq('id', doc.id);
    if (!error) {
      setDocs(prev => prev.filter(d => d.id !== doc.id));
      addNotification('Documento excluído.', 'success');
    } else {
      setDocs(prev => prev.filter(d => d.id !== doc.id));
      addNotification('Documento removido da lista.', 'info');
    }
  };

  const filtered = docs.filter(d => d.nome?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Documentos</h1>
          <p className="page-subtitle">Biblioteca de arquivos, atas, planos e fotos</p>
        </div>
        <div className="page-actions">
          <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
            {uploading ? <><Loader2 size={14} className="animate-spin" /> Enviando...</> : <><Upload size={14} /> Upload de Arquivo</>}
            <input type="file" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi" />
          </label>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-field" style={{ flex: 1, maxWidth: 360 }}>
          <Search size={14} color="var(--text-tertiary)" />
          <input placeholder="Buscar documento..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{filtered.length} documento{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-tertiary)' }}>
          <Loader2 style={{ display: 'block', margin: '0 auto 8px' }} className="animate-spin" />
          Carregando documentos...
        </div>
      ) : (
        <div className="grid-4 animate-fade-in">
          {filtered.map(d => (
            <div key={d.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 'var(--radius-md)',
                    background: TYPE_BG[d.tipo] || 'rgba(99,102,241,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {TYPE_ICON[d.tipo] || <File size={22} color="#6366F1" />}
                  </div>
                  <span className="badge badge-gray" style={{ textTransform: 'uppercase', fontSize: 10 }}>{d.tipo}</span>
                </div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-all', marginBottom: 6, lineHeight: 1.4 }}>{d.nome}</h3>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                  {d.tamanho} • {d.autor}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  {d.created_at ? new Date(d.created_at).toLocaleDateString('pt-BR') : '—'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: 12, marginTop: 14 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  title="Visualizar documento"
                  onClick={() => handleView(d)}
                >
                  <Eye size={13} /> Visualizar
                </button>
                <button
                  className="btn btn-ghost btn-sm btn-icon"
                  title="Excluir documento"
                  style={{ color: 'var(--danger)' }}
                  onClick={() => handleDelete(d)}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && !loading && (
            <div style={{ gridColumn: '1/-1', padding: 60, textAlign: 'center', color: 'var(--text-tertiary)' }}>
              <FileText size={40} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.3 }} />
              Nenhum documento encontrado. Faça o upload do primeiro arquivo!
            </div>
          )}
        </div>
      )}

      {previewDoc && (
        <div className="modal-backdrop" onClick={() => setPreviewDoc(null)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{previewDoc.nome}</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setPreviewDoc(null)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>
                {previewDoc.tipo === 'pdf' ? '📄' : previewDoc.tipo === 'imagem' ? '🖼️' : previewDoc.tipo === 'video' ? '🎬' : '📁'}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>
                Este documento não possui URL de visualização pública.
              </p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                Para visualizar, configure o Supabase Storage com um bucket público chamado <code style={{ background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4 }}>documentos</code>.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPreviewDoc(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documentos;
