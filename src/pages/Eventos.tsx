import React, { useState, useEffect } from 'react';
import { CalendarDays, Plus, Clock, MapPin, Users, Search, Edit2, Trash2, Eye, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../contexts/NotificationContext';
import BairroSelect from '../components/ui/BairroSelect';

const TIPO_COLORS: Record<string, string> = {
  'Reunião': '#6366F1', 'Carreata': '#F59E0B', 'Caminhada': '#10B981',
  'Panfletagem': '#3B82F6', 'Curso': '#8B5CF6', 'Ação Social': '#EC4899',
  'Debate': '#EF4444', 'Comício': '#F97316',
};

const STATUS_BADGE: Record<string, string> = {
  realizado: 'badge-success', agendado: 'badge-primary', cancelado: 'badge-danger',
};

const Eventos: React.FC = () => {
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const { addNotification } = useNotifications();

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    nome: '', tipo: 'Reunião', data: '', hora: '', local: '', bairro: '', municipio: 'Rio de Janeiro',
    responsavel: '', descricao: '', participantes: 0, custo: 0, status: 'agendado'
  });

  useEffect(() => {
    fetchEventos();
  }, []);

  const fetchEventos = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('eventos').select('*').order('data', { ascending: false });
    if (!error && data) setEventos(data);
    setLoading(false);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && selectedEvento) {
      const { error } = await supabase.from('eventos').update(formData).eq('id', selectedEvento.id);
      if (!error) {
        addNotification('Evento atualizado com sucesso', 'success');
        fetchEventos();
        setShowModal(false);
      } else addNotification('Erro ao atualizar evento', 'error');
    } else {
      const { error } = await supabase.from('eventos').insert([formData]);
      if (!error) {
        addNotification('Evento criado com sucesso', 'success');
        fetchEventos();
        setShowModal(false);
      } else addNotification('Erro ao criar evento', 'error');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja remover este evento?')) return;
    const { error } = await supabase.from('eventos').delete().eq('id', id);
    if (!error) {
      addNotification('Evento removido', 'success');
      fetchEventos();
      if (selectedEvento?.id === id) setSelectedEvento(null);
    } else addNotification('Erro ao remover evento', 'error');
  };

  const openEdit = (evento: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFormData({
      nome: evento.nome || '', tipo: evento.tipo || 'Reunião', data: evento.data || '', hora: evento.hora || '',
      local: evento.local || '', bairro: evento.bairro || '', municipio: evento.municipio || 'Rio de Janeiro',
      responsavel: evento.responsavel || '', descricao: evento.descricao || '', participantes: evento.participantes || 0,
      custo: evento.custo || 0, status: evento.status || 'agendado'
    });
    setSelectedEvento(evento);
    setIsEditing(true);
    setShowModal(true);
  };

  const openCreate = () => {
    setFormData({
      nome: '', tipo: 'Reunião', data: '', hora: '', local: '', bairro: '', municipio: 'Rio de Janeiro',
      responsavel: '', descricao: '', participantes: 0, custo: 0, status: 'agendado'
    });
    setSelectedEvento(null);
    setIsEditing(false);
    setShowModal(true);
  };

  const tiposDisponiveis = ['todos', ...Object.keys(TIPO_COLORS)];

  const filtered = eventos.filter(e => {
    const matchSearch = e.nome?.toLowerCase().includes(search.toLowerCase()) || e.local?.toLowerCase().includes(search.toLowerCase());
    const matchTipo = tipoFilter === 'todos' || e.tipo === tipoFilter;
    const matchStatus = statusFilter === 'todos' || e.status === statusFilter;
    return matchSearch && matchTipo && matchStatus;
  });

  const totalParticipantes = eventos.reduce((s, e) => s + (e.participantes || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Eventos</h1>
          <p className="page-subtitle">{eventos.length} eventos registrados</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> Novo Evento</button>
        </div>
      </div>

      <div className="grid-4 mb-lg" style={{ marginBottom: 'var(--space-lg)' }}>
        {[
          { label: 'Total Eventos', value: eventos.length, color: '#6366F1' },
          { label: 'Realizados', value: eventos.filter(e => e.status === 'realizado').length, color: '#10B981' },
          { label: 'Agendados', value: eventos.filter(e => e.status === 'agendado').length, color: '#F59E0B' },
          { label: 'Total Participantes', value: totalParticipantes, color: '#8B5CF6' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '14px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value.toLocaleString('pt-BR')}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="filter-bar">
        <div className="search-field" style={{ flex: 1, maxWidth: 350 }}>
          <Search size={14} color="var(--text-tertiary)" />
          <input placeholder="Buscar eventos, locais..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 160 }} value={tipoFilter} onChange={e => setTipoFilter(e.target.value)}>
          {tiposDisponiveis.map(t => <option key={t} value={t}>{t === 'todos' ? 'Todos os Tipos' : t}</option>)}
        </select>
        <select className="form-select" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="todos">Todos os Status</option>
          <option value="agendado">Agendado</option>
          <option value="realizado">Realizado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
          <Loader2 className="animate-spin mx-auto mb-2" />
          Carregando eventos...
        </div>
      ) : (
        <div className="grid-cards animate-fade-in">
          {filtered.map(e => (
            <div key={e.id} className="card" style={{ cursor: 'pointer', borderTop: `4px solid ${TIPO_COLORS[e.tipo] || '#9CA3AF'}` }} onClick={() => { setSelectedEvento(e); setIsEditing(false); setShowModal(true); }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: TIPO_COLORS[e.tipo] || '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{e.tipo}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{e.nome}</h3>
                  <span className={`badge ${STATUS_BADGE[e.status] || 'badge-gray'}`}>{e.status}</span>
                </div>
                <div style={{ background: 'var(--bg-elevated)', padding: '6px 10px', borderRadius: 8, textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 2 }}>
                    {e.data ? new Date(e.data).toLocaleString('pt-BR', { month: 'short' }) : '-'}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--brand-primary)', lineHeight: 1 }}>
                    {e.data ? new Date(e.data).getDate() : '-'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <Clock size={13} color="var(--text-tertiary)" /> {e.hora || 'Sem horário'}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <MapPin size={13} color="var(--text-tertiary)" /> {e.local}, {e.bairro}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <Users size={13} color="var(--text-tertiary)" /> {e.participantes || 0} participantes est.
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={(ev) => openEdit(e, ev)}><Edit2 size={14} /></button>
                <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={(ev) => handleDelete(e.id, ev)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
              Nenhum evento encontrado.
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{!isEditing && selectedEvento ? 'Detalhes do Evento' : (selectedEvento ? 'Editar Evento' : 'Novo Evento')}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            {!isEditing && selectedEvento ? (
              <div className="modal-body">
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
                   <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(99,102,241,0.1)', color: TIPO_COLORS[selectedEvento.tipo] || '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <CalendarDays size={28} />
                   </div>
                   <div>
                     <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{selectedEvento.nome}</h3>
                     <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                       <span className={`badge ${STATUS_BADGE[selectedEvento.status] || 'badge-gray'}`}>{selectedEvento.status}</span>
                       <span style={{ fontSize: 12, color: TIPO_COLORS[selectedEvento.tipo], fontWeight: 600, padding: '2px 8px', background: `${TIPO_COLORS[selectedEvento.tipo]}15`, borderRadius: 10 }}>{selectedEvento.tipo}</span>
                     </div>
                   </div>
                </div>
                
                <div className="grid-2">
                  <div>
                    <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 12 }}>Informações</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--text-tertiary)' }}>Data:</span> {selectedEvento.data}</div>
                      <div style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--text-tertiary)' }}>Hora:</span> {selectedEvento.hora}</div>
                      <div style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--text-tertiary)' }}>Local:</span> {selectedEvento.local}</div>
                      <div style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--text-tertiary)' }}>Bairro/Região:</span> {selectedEvento.bairro} - {selectedEvento.municipio}</div>
                      <div style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--text-tertiary)' }}>Responsável:</span> {selectedEvento.responsavel}</div>
                      {selectedEvento.descricao && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}><span style={{ color: 'var(--text-tertiary)' }}>Descrição:</span> {selectedEvento.descricao}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 12 }}>Estatísticas</h4>
                    <div className="grid-2">
                      <div className="stat-block"><div className="stat-block-value">{selectedEvento.participantes || 0}</div><div className="stat-block-label">Participantes</div></div>
                      <div className="stat-block"><div className="stat-block-value">R$ {selectedEvento.custo || 0}</div><div className="stat-block-label">Custo</div></div>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer" style={{ marginTop: 32 }}>
                  <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Fechar</button>
                  <button className="btn btn-primary" onClick={() => openEdit(selectedEvento)}><Edit2 size={14} /> Editar</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateOrUpdate} className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Nome do Evento</label>
                    <input required className="form-input" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tipo de Evento</label>
                    <select className="form-select" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                      {Object.keys(TIPO_COLORS).map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Data</label>
                    <input type="date" required className="form-input" value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Horário</label>
                    <input type="time" className="form-input" value={formData.hora} onChange={e => setFormData({...formData, hora: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="agendado">Agendado</option>
                      <option value="realizado">Realizado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Local (Rua/Espaço)</label>
                    <input className="form-input" value={formData.local} onChange={e => setFormData({...formData, local: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bairro</label>
                    <BairroSelect
                      value={formData.bairro}
                      onChange={(value) => setFormData({ ...formData, bairro: value })}
                      municipality={formData.municipio}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Município</label>
                    <input className="form-input" value={formData.municipio} onChange={e => setFormData({...formData, municipio: e.target.value})} />
                  </div>
                </div>
                
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Participantes Esperados</label>
                    <input type="number" className="form-input" value={formData.participantes} onChange={e => setFormData({...formData, participantes: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Custo Estimado (R$)</label>
                    <input type="number" className="form-input" value={formData.custo} onChange={e => setFormData({...formData, custo: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Responsável</label>
                  <input className="form-input" value={formData.responsavel} onChange={e => setFormData({...formData, responsavel: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição / Observações</label>
                  <textarea className="form-input" rows={2} value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} />
                </div>

                <div className="modal-footer" style={{ marginTop: 24 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">{isEditing ? 'Salvar Alterações' : 'Criar Evento'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Eventos;
