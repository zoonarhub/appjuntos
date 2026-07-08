import React, { useState, useEffect } from 'react';
import { Send, Plus, Search, MessageSquare, Phone, Mail, Sparkles, Sliders, Loader2, Trash2, X, Users, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../contexts/NotificationContext';

const CANAL_BADGE: Record<string, string> = {
  WhatsApp: 'badge-success',
  SMS: 'badge-info',
  'E-mail': 'badge-purple',
};

const STATUS_BADGE: Record<string, string> = {
  ativo: 'badge-success',
  agendado: 'badge-warning',
  rascunho: 'badge-gray',
  pausado: 'badge-danger',
};

const emptyForm = {
  nome: '', canal: 'WhatsApp', mensagem: '', segmentacao: 'todos', status: 'rascunho', data_envio: ''
};

const Comunicacao: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'campanhas' | 'templates'>('campanhas');
  const [search, setSearch] = useState('');
  const [campanhas, setCampanhas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => { fetchCampanhas(); }, []);

  const fetchCampanhas = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('campanhas').select('*').order('created_at', { ascending: false });
    if (!error && data) setCampanhas(data);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const { error } = await supabase.from('campanhas').insert([{
      ...formData,
      data_envio: formData.data_envio ? new Date(formData.data_envio).toISOString() : null,
    }]);
    if (!error) {
      addNotification('Campanha criada com sucesso!', 'success');
      setShowModal(false);
      setFormData({ ...emptyForm });
      fetchCampanhas();
    } else {
      addNotification('Erro ao criar campanha: ' + error.message, 'error');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir esta campanha?')) return;
    const { error } = await supabase.from('campanhas').delete().eq('id', id);
    if (!error) {
      addNotification('Campanha removida.', 'success');
      fetchCampanhas();
    }
  };

  const handleToggleStatus = async (camp: any) => {
    const newStatus = camp.status === 'ativo' ? 'pausado' : 'ativo';
    const { error } = await supabase.from('campanhas').update({ status: newStatus }).eq('id', camp.id);
    if (!error) {
      addNotification(`Campanha ${newStatus === 'ativo' ? 'ativada' : 'pausada'}.`, 'success');
      fetchCampanhas();
    }
  };

  const filtered = campanhas.filter(c =>
    c.nome?.toLowerCase().includes(search.toLowerCase()) ||
    c.canal?.toLowerCase().includes(search.toLowerCase())
  );

  const templates = [
    { nome: 'Boas-vindas WhatsApp', desc: 'Disparo de boas-vindas com link personalizado.', canal: 'WhatsApp', msg: 'Olá {nome}! Seja bem-vindo(a) ao grupo Juntos pelo Rio! 🌊 Estamos felizes em ter você conosco.' },
    { nome: 'Lembrete Reunião de Núcleo', desc: 'Informativo de data/hora do próximo encontro.', canal: 'WhatsApp', msg: 'Olá {nome}! Lembrando que nossa reunião de núcleo será amanhã às {horario}. Contamos com sua presença! 🤝' },
    { nome: 'Confirmação de Voto SMS', desc: 'Mensagem curta com link de pesquisa rápida.', canal: 'SMS', msg: 'Coordena Rio: Confirme seu apoio em {link}. Juntos somos mais fortes!' },
    { nome: 'Newsletter Mensal', desc: 'Informativo completo sobre ações sociais do grupo.', canal: 'E-mail', msg: 'Prezado(a) {nome},\n\nConfira as novidades deste mês do grupo Juntos pelo Rio...' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Comunicação</h1>
          <p className="page-subtitle">Disparo integrado e segmentado via WhatsApp, SMS e E-mail</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Nova Campanha
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4 mb-lg" style={{ marginBottom: 'var(--space-lg)', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Total Campanhas', value: campanhas.length, color: '#6366F1' },
          { label: 'Ativas', value: campanhas.filter(c => c.status === 'ativo').length, color: '#10B981' },
          { label: 'Agendadas', value: campanhas.filter(c => c.status === 'agendado').length, color: '#F59E0B' },
          { label: 'Total Enviados', value: campanhas.reduce((s, c) => s + (c.enviados || 0), 0), color: '#8B5CF6' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value.toLocaleString('pt-BR')}</div>
          </div>
        ))}
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'campanhas' ? 'active' : ''}`} onClick={() => setActiveTab('campanhas')}>Campanhas</button>
        <button className={`tab ${activeTab === 'templates' ? 'active' : ''}`} onClick={() => setActiveTab('templates')}>Modelos / Templates</button>
      </div>

      <div className="filter-bar">
        <div className="search-field" style={{ flex: 1, maxWidth: 360 }}>
          <Search size={14} color="var(--text-tertiary)" />
          <input placeholder="Buscar campanha ou template..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {activeTab === 'campanhas' ? (
        <div className="table-container animate-fade-in">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
              <Loader2 style={{ display: 'block', margin: '0 auto 8px' }} className="animate-spin" />
              Carregando campanhas...
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Campanha</th>
                  <th>Canal</th>
                  <th>Segmentação</th>
                  <th style={{ textAlign: 'center' }}>Enviados</th>
                  <th style={{ textAlign: 'center' }}>Abertos</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.nome}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.mensagem}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${CANAL_BADGE[c.canal] || 'badge-gray'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {c.canal === 'WhatsApp' ? <MessageSquare size={11} /> : c.canal === 'SMS' ? <Phone size={11} /> : <Mail size={11} />}
                        {c.canal}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {c.segmentacao === 'todos' ? '🌐 Todos' : c.segmentacao === 'bairro' ? '📍 Por Bairro' : '🏛️ Por Núcleo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{c.enviados || 0}</td>
                    <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                      {c.abertos || 0}
                      {c.enviados > 0 && <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 4 }}>({Math.round((c.abertos || 0) / c.enviados * 100)}%)</span>}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {c.data_envio ? new Date(c.data_envio).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[c.status] || 'badge-gray'}`}>{c.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm btn-icon" title={c.status === 'ativo' ? 'Pausar' : 'Ativar'} onClick={() => handleToggleStatus(c)}>
                          {c.status === 'ativo' ? '⏸' : '▶️'}
                        </button>
                        <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} title="Excluir" onClick={() => handleDelete(c.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
                      Nenhuma campanha cadastrada ainda. Clique em "Nova Campanha" para começar!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="grid-3 animate-fade-in">
          {templates.filter(t => t.nome.toLowerCase().includes(search.toLowerCase())).map((t, i) => (
            <div key={i} className="card">
              <span className={`badge ${CANAL_BADGE[t.canal] || 'badge-gray'}`} style={{ marginBottom: 10 }}>{t.canal}</span>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{t.nome}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>{t.desc}</p>
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, fontStyle: 'italic', lineHeight: 1.5 }}>
                "{t.msg.substring(0, 80)}..."
              </div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => { setFormData({ ...emptyForm, canal: t.canal, nome: t.nome, mensagem: t.msg }); setShowModal(true); }}>
                  <Sliders size={13} /> Usar Template
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nova Campanha */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Nova Campanha</div>
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>Configure e agende um disparo</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome da Campanha *</label>
                  <input required className="form-input" placeholder="Ex: Boas-vindas Junho 2026" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Canal de Disparo *</label>
                    <select required className="form-select" value={formData.canal} onChange={e => setFormData({ ...formData, canal: e.target.value })}>
                      <option value="WhatsApp">📱 WhatsApp</option>
                      <option value="SMS">💬 SMS</option>
                      <option value="E-mail">📧 E-mail</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Segmentação</label>
                    <select className="form-select" value={formData.segmentacao} onChange={e => setFormData({ ...formData, segmentacao: e.target.value })}>
                      <option value="todos">🌐 Todos os cadastros</option>
                      <option value="bairro">📍 Por Bairro</option>
                      <option value="nucleo">🏛️ Por Núcleo</option>
                    </select>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                      <option value="rascunho">Rascunho</option>
                      <option value="agendado">Agendado</option>
                      <option value="ativo">Ativo (enviar agora)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data de Envio</label>
                    <input type="datetime-local" className="form-input" value={formData.data_envio} onChange={e => setFormData({ ...formData, data_envio: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Mensagem / Conteúdo</label>
                  <textarea rows={5} className="form-input" style={{ resize: 'vertical' }}
                    placeholder="Use {nome} para personalizar com o nome do destinatário, {link} para o link de convite..."
                    value={formData.mensagem} onChange={e => setFormData({ ...formData, mensagem: e.target.value })} />
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>
                    {formData.mensagem.length} caracteres
                    {formData.canal === 'SMS' && formData.mensagem.length > 160 && (
                      <span style={{ color: 'var(--warning)', marginLeft: 8 }}>⚠️ SMS será dividido em {Math.ceil(formData.mensagem.length / 160)} partes</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : <><Send size={14} /> Criar Campanha</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Comunicacao;
