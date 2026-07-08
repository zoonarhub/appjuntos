import React, { useState, useEffect } from 'react';
import { Navigation, Plus, Search, MapPin, Clock, CheckCircle, XCircle, Edit2, Trash2, Loader2, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../contexts/NotificationContext';

const RESULTADO_CONFIG: Record<string, { label: string; badge: string; color: string }> = {
  positivo: { label: 'Positivo', badge: 'badge-success', color: '#10B981' },
  negativo: { label: 'Negativo', badge: 'badge-danger', color: '#EF4444' },
  pendente: { label: 'Pendente', badge: 'badge-warning', color: '#F59E0B' },
  reagendado: { label: 'Reagendado', badge: 'badge-info', color: '#3B82F6' },
};

const Visitas: React.FC = () => {
  const [visitas, setVisitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resultadoFilter, setResultadoFilter] = useState('todos');
  const { addNotification } = useNotifications();

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [selectedVisita, setSelectedVisita] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    endereco: '', bairro: '', municipio: 'Rio de Janeiro',
    data: '', hora: '', responsavel: '', status: 'pendente', observacoes: ''
  });

  useEffect(() => {
    fetchVisitas();
  }, []);

  const fetchVisitas = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('visitas').select('*').order('data', { ascending: false });
    if (!error && data) setVisitas(data);
    setLoading(false);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && selectedVisita) {
      const { error } = await supabase.from('visitas').update(formData).eq('id', selectedVisita.id);
      if (!error) {
        addNotification('Visita atualizada com sucesso', 'success');
        fetchVisitas();
        setShowModal(false);
      } else addNotification('Erro ao atualizar visita', 'error');
    } else {
      const { error } = await supabase.from('visitas').insert([formData]);
      if (!error) {
        addNotification('Visita criada com sucesso', 'success');
        fetchVisitas();
        setShowModal(false);
      } else addNotification('Erro ao criar visita', 'error');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja remover esta visita?')) return;
    const { error } = await supabase.from('visitas').delete().eq('id', id);
    if (!error) {
      addNotification('Visita removida', 'success');
      fetchVisitas();
      if (selectedVisita?.id === id) setSelectedVisita(null);
    } else addNotification('Erro ao remover visita', 'error');
  };

  const handleMarcarRealizada = async (visita: any, resultado: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from('visitas').update({ status: resultado }).eq('id', visita.id);
    if (!error) {
      addNotification(`Visita marcada como ${resultado}`, 'success');
      fetchVisitas();
    }
  };

  const openEdit = (visita: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFormData({
      endereco: visita.endereco || '', bairro: visita.bairro || '', municipio: visita.municipio || 'Rio de Janeiro',
      data: visita.data || '', hora: visita.hora || '', responsavel: visita.responsavel || '',
      status: visita.status || 'pendente', observacoes: visita.observacoes || ''
    });
    setSelectedVisita(visita);
    setIsEditing(true);
    setShowModal(true);
  };

  const openCreate = () => {
    setFormData({
      endereco: '', bairro: '', municipio: 'Rio de Janeiro',
      data: '', hora: '', responsavel: '', status: 'pendente', observacoes: ''
    });
    setSelectedVisita(null);
    setIsEditing(false);
    setShowModal(true);
  };

  const filtered = visitas.filter(v => {
    const matchSearch = v.endereco?.toLowerCase().includes(search.toLowerCase()) ||
      v.bairro?.toLowerCase().includes(search.toLowerCase()) ||
      v.responsavel?.toLowerCase().includes(search.toLowerCase());
    const matchResultado = resultadoFilter === 'todos' || v.status === resultadoFilter;
    return matchSearch && matchResultado;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Visitas</h1>
          <p className="page-subtitle">{visitas.length} visitas registradas • {filtered.length} exibindo</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> Registrar Visita</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4 mb-lg" style={{ marginBottom: 'var(--space-lg)' }}>
        {Object.entries(RESULTADO_CONFIG).map(([key, cfg]) => (
          <div key={key} className="card" style={{ padding: '14px 18px', textAlign: 'center', borderColor: cfg.color + '30' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: cfg.color }}>{visitas.filter(v => v.status === key).length}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginTop: 3 }}>{cfg.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-field" style={{ flex: 1, maxWidth: 380 }}>
          <Search size={14} color="var(--text-tertiary)" />
          <input placeholder="Buscar endereço, bairro, responsável..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 180 }} value={resultadoFilter} onChange={e => setResultadoFilter(e.target.value)}>
          <option value="todos">Todos os Resultados</option>
          {Object.entries(RESULTADO_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Visit Cards */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
          <Loader2 className="animate-spin mx-auto mb-2" />
          Carregando visitas...
        </div>
      ) : (
        <div className="grid-2 animate-fade-in">
          {filtered.map(v => {
            const cfg = RESULTADO_CONFIG[v.status] || RESULTADO_CONFIG.pendente;
            return (
              <div key={v.id} className="card" style={{ borderLeft: `4px solid ${cfg.color}`, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <span className={`badge ${cfg.badge}`} style={{ marginBottom: 8, display: 'inline-block' }}>{cfg.label}</span>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{v.endereco}</h3>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{v.bairro}, {v.municipio}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{v.data}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{v.hora || 'Sem horário'}</div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text-secondary)', marginBottom: 6 }}>
                    <Navigation size={13} color="var(--brand-primary)" /> <span style={{ fontWeight: 600 }}>Responsável:</span> {v.responsavel || 'Não definido'}
                  </div>
                  {v.observacoes && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color: 'var(--text-tertiary)', marginTop: 8, borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
                      <MessageSquare size={13} style={{ marginTop: 2, flexShrink: 0 }} /> 
                      <span style={{ fontStyle: 'italic', lineHeight: 1.4 }}>"{v.observacoes}"</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {v.status === 'pendente' && (
                      <>
                        <button className="btn btn-sm" style={{ background: '#10B98115', color: '#10B981', border: '1px solid #10B98130' }} onClick={(e) => handleMarcarRealizada(v, 'positivo', e)}>
                          <CheckCircle size={14} /> Positivo
                        </button>
                        <button className="btn btn-sm" style={{ background: '#EF444415', color: '#EF4444', border: '1px solid #EF444430' }} onClick={(e) => handleMarcarRealizada(v, 'negativo', e)}>
                          <XCircle size={14} /> Negativo
                        </button>
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={(e) => openEdit(v, e)} title="Editar"><Edit2 size={14} /></button>
                    <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={(e) => handleDelete(v.id, e)} title="Excluir"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
              Nenhuma visita encontrada.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{isEditing ? 'Editar Visita' : 'Registrar Nova Visita'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleCreateOrUpdate} className="modal-body">
              <div className="form-group">
                <label className="form-label">Endereço Completo</label>
                <input required className="form-input" value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Bairro</label>
                  <input required className="form-input" value={formData.bairro} onChange={e => setFormData({...formData, bairro: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Município</label>
                  <input className="form-input" value={formData.municipio} onChange={e => setFormData({...formData, municipio: e.target.value})} />
                </div>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Data</label>
                  <input type="date" required className="form-input" value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora (Opcional)</label>
                  <input type="time" className="form-input" value={formData.hora} onChange={e => setFormData({...formData, hora: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status da Visita</label>
                  <select className="form-select" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="pendente">Pendente</option>
                    <option value="positivo">Realizada (Positivo)</option>
                    <option value="negativo">Realizada (Negativo)</option>
                    <option value="reagendado">Reagendado</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Responsável pela Visita</label>
                <input className="form-input" value={formData.responsavel} onChange={e => setFormData({...formData, responsavel: e.target.value})} />
              </div>

              <div className="form-group">
                <label className="form-label">Observações / Comentários</label>
                <textarea className="form-input" rows={3} placeholder="Detalhes importantes sobre a visita..." value={formData.observacoes} onChange={e => setFormData({...formData, observacoes: e.target.value})} />
              </div>

              <div className="modal-footer" style={{ marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{isEditing ? 'Salvar Alterações' : 'Salvar Visita'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Visitas;
