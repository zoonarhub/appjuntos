import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Download, Eye, Edit2, Trash2, Phone, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../contexts/NotificationContext';
import { useIBGE } from '../hooks/useIBGE';
import { saveWithOfflineFallback } from '../lib/offlineHelper';
import BairroSelect from '../components/ui/BairroSelect';

const TIPOS = ['Todos', 'Coordenador Geral', 'Coordenador Regional', 'Coordenador Local'];
const STATUS = ['Todos', 'ativo', 'inativo'];

const TIPO_COLORS: Record<string, string> = {
  'Coordenador Geral': 'badge-primary',
  'Coordenador Regional': 'badge-purple',
  'Coordenador Local': 'badge-info',
  'Liderança': 'badge-success',
  'Voluntário': 'badge-warning',
};

const Coordenadores: React.FC = () => {
  const [coordenadores, setCoordenadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const { addNotification } = useNotifications();

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { municipios } = useIBGE();

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    tipo: 'Coordenador Local',
    regiao: 'Centro',
    bairro: '',
    municipio: 'Rio de Janeiro',
    meta: 0,
    status: 'ativo',
    telefone: '' // Assuming we add this loosely or omit it from DB if not exist
  });

  useEffect(() => {
    fetchCoordenadores();
  }, []);

  const fetchCoordenadores = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('coordenadores').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setCoordenadores(data);
    }
    setLoading(false);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    
    try {
      if (isEditing && selectedPerson) {
        const result = await saveWithOfflineFallback('coordenadores', formData, selectedPerson.id, 'UPDATE');
        if (result.success) {
          addNotification(result.savedLocally ? 'Salvo localmente (offline). Sincroniza quando conectar.' : 'Coordenador atualizado com sucesso', result.savedLocally ? 'warning' : 'success');
          if (!result.savedLocally) fetchCoordenadores();
          setShowModal(false);
        } else {
          addNotification('Erro ao atualizar: ' + result.error, 'error');
        }
      } else {
        // Prevenir duplicados (CPF) somente quando online
        if (navigator.onLine) {
          const { data: existing } = await supabase.from('coordenadores').select('id').eq('cpf', formData.cpf).single();
          if (existing) {
            addNotification('Já existe um cadastro com este CPF.', 'error');
            return;
          }
        }
        const result = await saveWithOfflineFallback('coordenadores', formData);
        if (result.success) {
          addNotification(result.savedLocally ? 'Salvo localmente (offline). Sincroniza quando conectar.' : 'Coordenador cadastrado com sucesso!', result.savedLocally ? 'warning' : 'success');
          if (!result.savedLocally) fetchCoordenadores();
          setShowModal(false);
        } else {
          addNotification('Erro ao cadastrar: ' + result.error, 'error');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja remover esta coordenador?')) return;
    const { error } = await supabase.from('coordenadores').delete().eq('id', id);
    if (!error) {
      addNotification('Coordenador removido', 'success');
      fetchCoordenadores();
      if (selectedPerson?.id === id) setSelectedPerson(null);
    } else {
      addNotification('Erro ao remover', 'error');
    }
  };

  const openEdit = (coordenador: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFormData({
      nome: coordenador.nome || '',
      cpf: coordenador.cpf || '',
      tipo: coordenador.tipo || 'Liderança',
      regiao: coordenador.regiao || '',
      bairro: coordenador.bairro || '',
      municipio: coordenador.municipio || 'Rio de Janeiro',
      meta: coordenador.meta || 0,
      status: coordenador.status || 'ativo',
      telefone: ''
    });
    setSelectedPerson(coordenador);
    setIsEditing(true);
    setShowModal(true);
  };

  const openCreate = () => {
    setFormData({
      nome: '', cpf: '', tipo: 'Coordenador Local', regiao: 'Centro',
      bairro: '', municipio: 'Rio de Janeiro', meta: 0, status: 'ativo', telefone: ''
    });
    setSelectedPerson(null);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleExport = () => {
    addNotification('Exportando base de coordenadores...', 'info');
    // Implementação CSV simulação
    setTimeout(() => addNotification('Exportação concluída', 'success'), 1000);
  };

  const filtered = useMemo(() => coordenadores.filter(p => {
    const matchSearch = p.nome?.toLowerCase().includes(search.toLowerCase()) ||
      p.cpf?.includes(search) ||
      p.bairro?.toLowerCase().includes(search.toLowerCase());
    const matchTipo = tipoFilter === 'Todos' || p.tipo === tipoFilter;
    const matchStatus = statusFilter === 'Todos' || p.status === statusFilter;
    return matchSearch && matchTipo && matchStatus;
  }), [search, tipoFilter, statusFilter, coordenadores]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Coordenadores</h1>
          <p className="page-subtitle">{coordenadores.length} registros • {filtered.length} exibindo</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>
            <Download size={14} /> Exportar
          </button>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <Plus size={14} /> Novo Coordenador
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid-4 mb-lg" style={{ marginBottom: 'var(--space-lg)' }}>
        {[
          { label: 'Total Cadastros', value: coordenadores.length, color: '#6366F1' },
          { label: 'Ativos', value: coordenadores.filter(p => p.status === 'ativo').length, color: '#10B981' },
          { label: 'Inativos', value: coordenadores.filter(p => p.status === 'inativo').length, color: '#EF4444' },
          { label: 'Coordenadores', value: coordenadores.filter(p => p.tipo?.includes('Coordenador')).length, color: '#F59E0B' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-field" style={{ flex: 1, maxWidth: 400 }}>
          <Search size={14} color="var(--text-tertiary)" />
          <input
            placeholder="Buscar por nome, CPF, bairro..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="form-select" style={{ width: 200 }} value={tipoFilter} onChange={e => setTipoFilter(e.target.value)}>
          {TIPOS.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="form-select" style={{ width: 140 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {STATUS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-container animate-fade-in">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <Loader2 className="animate-spin mx-auto mb-2" />
            Carregando coordenadores...
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Região / Bairro</th>
                <th>Votos / Meta</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} onClick={() => { setSelectedPerson(p); setIsEditing(false); setShowModal(true); }} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.nome}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>CPF: {p.cpf}</div>
                  </td>
                  <td><span className={`badge ${TIPO_COLORS[p.tipo] || 'badge-gray'}`}>{p.tipo}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                      <MapPin size={12} color="var(--text-tertiary)" /> {p.bairro}, {p.regiao}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.votos || 0} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>/ {p.meta || 0}</span></div>
                  </td>
                  <td>
                    <span className={`status-dot ${p.status === 'ativo' ? 'active' : 'inactive'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setSelectedPerson(p); setIsEditing(false); setShowModal(true); }}><Eye size={14} /></button>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={(e) => openEdit(p, e)}><Edit2 size={14} /></button>
                      <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={(e) => handleDelete(p.id, e)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>Nenhum registro encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal View / Edit / Create */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {!isEditing && selectedPerson ? 'Detalhes do Coordenador' : (selectedPerson ? 'Editar Coordenador' : 'Novo Coordenador')}
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            {!isEditing && selectedPerson ? (
              // Modo Visualização
              <div className="modal-body">
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
                   <div className="avatar avatar-lg" style={{ background: 'var(--brand-primary)' }}>
                     {selectedPerson.nome.substring(0, 2).toUpperCase()}
                   </div>
                   <div>
                     <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{selectedPerson.nome}</h3>
                     <span className={`badge ${TIPO_COLORS[selectedPerson.tipo] || 'badge-gray'}`} style={{ marginTop: 4 }}>{selectedPerson.tipo}</span>
                   </div>
                </div>
                
                <div className="grid-2">
                  <div>
                    <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 12 }}>Informações de Contato</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--text-tertiary)' }}>CPF:</span> {selectedPerson.cpf}</div>
                      <div style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--text-tertiary)' }}>Bairro:</span> {selectedPerson.bairro}</div>
                      <div style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--text-tertiary)' }}>Região:</span> {selectedPerson.regiao}</div>
                      <div style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--text-tertiary)' }}>Município:</span> {selectedPerson.municipio}</div>
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 12 }}>Desempenho</h4>
                    <div className="grid-2">
                      <div className="stat-block">
                        <div className="stat-block-value">{selectedPerson.meta || 0}</div>
                        <div className="stat-block-label">Meta de Votos</div>
                      </div>
                      <div className="stat-block">
                        <div className="stat-block-value" style={{ color: 'var(--success)' }}>{selectedPerson.votos || 0}</div>
                        <div className="stat-block-label">Votos Confirmados</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer" style={{ marginTop: 32 }}>
                  <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Fechar</button>
                  <button className="btn btn-primary" onClick={() => openEdit(selectedPerson)}><Edit2 size={14} /> Editar</button>
                </div>
              </div>
            ) : (
              // Modo Edição / Criação
              <form onSubmit={handleCreateOrUpdate} className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Nome Completo</label>
                    <input required className="form-input" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CPF</label>
                    <input required className="form-input" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} disabled={isEditing && !!selectedPerson} />
                  </div>
                </div>
                
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Tipo de Liderança</label>
                    <select className="form-select" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                      {TIPOS.filter(t => t !== 'Todos').map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                </div>

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Região *</label>
                    <input required className="form-input" value={formData.regiao} onChange={e => setFormData({...formData, regiao: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bairro *</label>
                    <BairroSelect
                      required
                      value={formData.bairro}
                      onChange={(value) => setFormData({ ...formData, bairro: value })}
                      municipality={formData.municipio}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Município *</label>
                    <select required className="form-select" value={formData.municipio} onChange={e => setFormData({ ...formData, municipio: e.target.value })}>
                      <option value="">Selecione o Município</option>
                      {municipios.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
                      <option value="Outro">Outro (Fora do RJ)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Meta de Votos</label>
                  <input type="number" className="form-input" value={formData.meta} onChange={e => setFormData({...formData, meta: parseInt(e.target.value) || 0})} />
                </div>

                <div className="modal-footer" style={{ marginTop: 24 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={submitting}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : (selectedPerson ? 'Salvar Alterações' : 'Cadastrar')}
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

export default Coordenadores;
