import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, MapPin, Users, Target, Layers, Edit2, Trash2, Eye, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../contexts/NotificationContext';
import { useIBGE } from '../hooks/useIBGE';
import { saveWithOfflineFallback } from '../lib/offlineHelper';
import BairroSelect from '../components/ui/BairroSelect';

const STATUS_BADGE: Record<string, string> = {
  ativo: 'badge-success',
  inativo: 'badge-danger',
  planejamento: 'badge-warning',
};

const Nucleos: React.FC = () => {
  const [nucleos, setNucleos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const { addNotification } = useNotifications();

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [selectedNucleo, setSelectedNucleo] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { municipios } = useIBGE();

  const [formData, setFormData] = useState({
    nome: '', regiao: '', bairro: '', municipio: 'Rio de Janeiro',
    responsavel: '', equipe: 0, participantes: 0, meta: 0, status: 'ativo',
    descricao: ''
  });

  useEffect(() => {
    fetchNucleos();
  }, []);

  const fetchNucleos = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('nucleos').select('*').order('created_at', { ascending: false });
    if (!error && data) setNucleos(data);
    setLoading(false);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      if (isEditing && selectedNucleo) {
        const result = await saveWithOfflineFallback('nucleos', formData, selectedNucleo.id, 'UPDATE');
        if (result.success) {
          addNotification(result.savedLocally ? 'Salvo localmente (offline). Sincroniza ao conectar.' : 'Núcleo atualizado com sucesso', result.savedLocally ? 'warning' : 'success');
          if (!result.savedLocally) fetchNucleos();
          setShowModal(false);
        } else { addNotification('Erro ao atualizar: ' + result.error, 'error'); }
      } else {
        const result = await saveWithOfflineFallback('nucleos', formData);
        if (result.success) {
          addNotification(result.savedLocally ? 'Salvo localmente (offline). Sincroniza ao conectar.' : 'Núcleo cadastrado com sucesso!', result.savedLocally ? 'warning' : 'success');
          if (!result.savedLocally) fetchNucleos();
          setShowModal(false);
        } else { addNotification('Erro ao cadastrar: ' + result.error, 'error'); }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja remover este núcleo? Todos os projetos e turmas atreladas poderão ser afetados.')) return;
    const { error } = await supabase.from('nucleos').delete().eq('id', id);
    if (!error) {
      addNotification('Núcleo removido', 'success');
      fetchNucleos();
      if (selectedNucleo?.id === id) setSelectedNucleo(null);
    } else {
      addNotification('Erro ao remover núcleo', 'error');
    }
  };

  const openEdit = (nucleo: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFormData({
      nome: nucleo.nome || '', regiao: nucleo.regiao || '', bairro: nucleo.bairro || '',
      municipio: nucleo.municipio || 'Rio de Janeiro', responsavel: nucleo.responsavel || '',
      equipe: nucleo.equipe || 0, participantes: nucleo.participantes || 0,
      meta: nucleo.meta || 0, status: nucleo.status || 'ativo', descricao: nucleo.descricao || ''
    });
    setSelectedNucleo(nucleo);
    setIsEditing(true);
    setShowModal(true);
  };

  const openCreate = () => {
    setFormData({
      nome: '', regiao: '', bairro: '', municipio: 'Rio de Janeiro',
      responsavel: '', equipe: 0, participantes: 0, meta: 0, status: 'ativo', descricao: ''
    });
    setSelectedNucleo(null);
    setIsEditing(false);
    setShowModal(true);
  };

  const toggleStatus = async (nucleo: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = nucleo.status === 'ativo' ? 'inativo' : 'ativo';
    const { error } = await supabase.from('nucleos').update({ status: newStatus }).eq('id', nucleo.id);
    if (!error) {
      addNotification(`Núcleo marcado como ${newStatus}`, 'success');
      fetchNucleos();
    }
  };

  const filtered = nucleos.filter(n => {
    const matchSearch = n.nome?.toLowerCase().includes(search.toLowerCase()) ||
      n.bairro?.toLowerCase().includes(search.toLowerCase()) ||
      n.responsavel?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'todos' || n.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Núcleos</h1>
          <p className="page-subtitle">{nucleos.length} núcleos cadastrados • {filtered.length} exibindo</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> Novo Núcleo</button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid-4 mb-lg" style={{ marginBottom: 'var(--space-lg)' }}>
        {[
          { label: 'Total', value: nucleos.length, color: '#6366F1' },
          { label: 'Ativos', value: nucleos.filter(n => n.status === 'ativo').length, color: '#10B981' },
          { label: 'Planejamento', value: nucleos.filter(n => n.status === 'planejamento').length, color: '#F59E0B' },
          { label: 'Total Participantes', value: nucleos.reduce((s, n) => s + (n.participantes || 0), 0), color: '#8B5CF6' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '14px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value.toLocaleString('pt-BR')}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-field" style={{ flex: 1, maxWidth: 380 }}>
          <Search size={14} color="var(--text-tertiary)" />
          <input placeholder="Buscar núcleo, bairro, responsável..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="todos">Todos os Status</option>
          <option value="ativo">Ativos</option>
          <option value="planejamento">Planejamento</option>
          <option value="inativo">Inativos</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
          <Loader2 className="animate-spin mx-auto mb-2" />
          Carregando núcleos...
        </div>
      ) : (
        <div className="grid-cards animate-fade-in">
          {filtered.map(n => (
            <div key={n.id} className="card" style={{ cursor: 'pointer', border: n.status === 'inativo' ? '1px dashed var(--border-default)' : undefined, opacity: n.status === 'inativo' ? 0.7 : 1 }} onClick={() => { setSelectedNucleo(n); setIsEditing(false); setShowModal(true); }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(99,102,241,0.1)', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{n.nome}</h3>
                    <span className={`badge ${STATUS_BADGE[n.status] || 'badge-gray'}`} onClick={(e) => toggleStatus(n, e)} title="Clique para alternar status" style={{ cursor: 'pointer' }}>{n.status}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={(e) => openEdit(n, e)}><Edit2 size={14} /></button>
                  <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={(e) => handleDelete(n.id, e)}><Trash2 size={14} /></button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--text-tertiary)' }}>
                  <MapPin size={12} /> {n.bairro}, {n.regiao}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--text-tertiary)' }}>
                  <Users size={12} /> {n.responsavel || 'Sem responsável'}
                </div>
              </div>

              <div className="grid-3" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, marginTop: 'auto' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{n.participantes || 0}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Membros</div>
                </div>
                <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{n.projetos_count || 0}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Projetos</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{n.meta || 0}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Meta</div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
              Nenhum núcleo encontrado.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{!isEditing && selectedNucleo ? 'Detalhes do Núcleo' : (selectedNucleo ? 'Editar Núcleo' : 'Novo Núcleo')}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            {!isEditing && selectedNucleo ? (
              <div className="modal-body">
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
                   <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(99,102,241,0.1)', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <Building2 size={28} />
                   </div>
                   <div>
                     <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{selectedNucleo.nome}</h3>
                     <span className={`badge ${STATUS_BADGE[selectedNucleo.status] || 'badge-gray'}`} style={{ marginTop: 6 }}>{selectedNucleo.status}</span>
                   </div>
                </div>
                
                <div className="grid-2">
                  <div>
                    <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 12 }}>Informações</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--text-tertiary)' }}>Responsável:</span> {selectedNucleo.responsavel}</div>
                      <div style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--text-tertiary)' }}>Bairro/Região:</span> {selectedNucleo.bairro}, {selectedNucleo.regiao}</div>
                      <div style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--text-tertiary)' }}>Município:</span> {selectedNucleo.municipio}</div>
                      {selectedNucleo.descricao && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}><span style={{ color: 'var(--text-tertiary)' }}>Descrição:</span> {selectedNucleo.descricao}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 12 }}>Estatísticas</h4>
                    <div className="grid-2">
                      <div className="stat-block"><div className="stat-block-value">{selectedNucleo.participantes || 0}</div><div className="stat-block-label">Membros</div></div>
                      <div className="stat-block"><div className="stat-block-value">{selectedNucleo.equipe || 0}</div><div className="stat-block-label">Equipe</div></div>
                      <div className="stat-block"><div className="stat-block-value">{selectedNucleo.projetos_count || 0}</div><div className="stat-block-label">Projetos</div></div>
                      <div className="stat-block"><div className="stat-block-value">{selectedNucleo.meta || 0}</div><div className="stat-block-label">Meta</div></div>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer" style={{ marginTop: 32 }}>
                  <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Fechar</button>
                  <button className="btn btn-primary" onClick={() => openEdit(selectedNucleo)}><Edit2 size={14} /> Editar</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateOrUpdate} className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Nome do Núcleo</label>
                    <input required className="form-input" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Responsável (Coordenador Local)</label>
                    <input className="form-input" value={formData.responsavel} onChange={e => setFormData({...formData, responsavel: e.target.value})} />
                  </div>
                </div>

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Região</label>
                    <input className="form-input" value={formData.regiao} onChange={e => setFormData({...formData, regiao: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bairro</label>
                    <BairroSelect
                      required
                      value={formData.bairro}
                      onChange={(value) => setFormData({ ...formData, bairro: value })}
                      municipality={formData.municipio}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Município</label>
                    <select required className="form-select" value={formData.municipio} onChange={e => setFormData({ ...formData, municipio: e.target.value })}>
                      <option value="">Selecione o Município</option>
                      {municipios.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
                      <option value="Outro">Outro (Fora do RJ)</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Membros (Estimado)</label>
                    <input type="number" className="form-input" value={formData.participantes} onChange={e => setFormData({...formData, participantes: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Meta de Votos</label>
                    <input type="number" className="form-input" value={formData.meta} onChange={e => setFormData({...formData, meta: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="ativo">Ativo</option>
                      <option value="planejamento">Em Planejamento</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <textarea className="form-input" rows={2} value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} />
                </div>

                <div className="modal-footer" style={{ marginTop: 24 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={submitting}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
                    {isEditing ? 'Salvar Alterações' : 'Criar Núcleo'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Nucleos;
