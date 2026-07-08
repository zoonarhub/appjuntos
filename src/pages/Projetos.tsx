import React, { useState, useEffect } from 'react';
import { Plus, Search, BookOpen, Users, GraduationCap, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const STATUS_BADGE: Record<string, string> = {
  ativo: 'badge-success',
  encerrado: 'badge-gray',
  planejamento: 'badge-warning',
  suspenso: 'badge-danger',
};

const CAT_COLORS: Record<string, string> = {
  Tecnologia: '#6366F1',
  Esporte: '#10B981',
  Idioma: '#3B82F6',
  Cultura: '#EC4899',
  Educação: '#F59E0B',
  Profissionalizante: '#8B5CF6',
  Negócios: '#F97316',
  'Meio Ambiente': '#14B8A6',
};

const Projetos: React.FC = () => {
  const navigate = useNavigate();
  const [projetos, setProjetos] = useState<any[]>([]);
  const [nucleos, setNucleos] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [catFilter, setCatFilter] = useState('todos');
  const [selected, setSelected] = useState<any | null>(null);
  
  // Create Modal
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nome: '', nucleo_id: '', categoria: 'Educação', responsavel: '', descricao: '', status: 'ativo'
  });

  useEffect(() => {
    fetchProjetos();
    fetchNucleos();
  }, []);

  const fetchProjetos = async () => {
    const { data, error } = await supabase.from('projetos').select('*, nucleos(nome, regiao)');
    if (!error && data) setProjetos(data);
  };

  const fetchNucleos = async () => {
    const { data } = await supabase.from('nucleos').select('id, nome');
    if (data) setNucleos(data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('projetos').insert([formData]);
      if (!error) {
        setShowCreate(false);
        setFormData({ nome: '', nucleo_id: '', categoria: 'Educação', responsavel: '', descricao: '', status: 'ativo' });
        fetchProjetos();
      } else {
        alert('Erro ao criar: ' + error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const categories = ['todos', 'Tecnologia', 'Esporte', 'Idioma', 'Cultura', 'Educação', 'Profissionalizante', 'Negócios', 'Meio Ambiente'];

  const filtered = projetos.filter(p => {
    const nucleoNome = p.nucleos?.nome || '';
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase()) || nucleoNome.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'todos' || p.status === statusFilter;
    const matchCat = catFilter === 'todos' || p.categoria === catFilter;
    return matchSearch && matchStatus && matchCat;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projetos Sociais</h1>
          <p className="page-subtitle">{projetos.length} projetos cadastrados</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}><Plus size={14} /> Novo Projeto</button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-field" style={{ flex: 1, maxWidth: 360 }}>
          <Search size={14} color="var(--text-tertiary)" />
          <input placeholder="Buscar projeto, núcleo..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 180 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c === 'todos' ? 'Todas as Categorias' : c}</option>)}
        </select>
        <select className="form-select" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="todos">Todos os Status</option>
          <option value="ativo">Ativos</option>
          <option value="planejamento">Planejamento</option>
          <option value="encerrado">Encerrados</option>
        </select>
      </div>

      <div className="grid-3 animate-fade-in">
        {filtered.map(p => {
          const catColor = CAT_COLORS[p.categoria] || '#6366F1';
          return (
            <div key={p.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelected(p)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <span className="badge" style={{ background: catColor + '20', color: catColor }}>{p.categoria}</span>
                    <span className={`badge ${STATUS_BADGE[p.status] || 'badge-gray'}`}>{p.status}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{p.nome}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 3 }}>{p.nucleos?.nome || 'Sem núcleo vinculado'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 14 }}>
                <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Resp: {p.responsavel}</div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
            Nenhum projeto encontrado.
          </div>
        )}
      </div>

      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Novo Projeto</div>
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>Cadastre um novo projeto social</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome do Projeto *</label>
                  <input required className="form-input" placeholder="Ex: Curso de Informática Básica" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Núcleo Vinculado *</label>
                  <select required className="form-select" value={formData.nucleo_id} onChange={e => setFormData({...formData, nucleo_id: e.target.value})}>
                    <option value="">Selecione um núcleo</option>
                    {nucleos.map(n => <option key={n.id} value={n.id}>{n.nome}</option>)}
                  </select>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Categoria</label>
                    <select className="form-select" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})}>
                      {categories.filter(c => c !== 'todos').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="ativo">Ativo</option>
                      <option value="planejamento">Planejamento</option>
                      <option value="suspenso">Suspenso</option>
                      <option value="encerrado">Encerrado</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Responsável</label>
                  <input className="form-input" placeholder="Nome do responsável" value={formData.responsavel} onChange={e => setFormData({...formData, responsavel: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <textarea rows={3} className="form-input" style={{ resize: 'vertical' }} placeholder="Descreva o objetivo do projeto..." value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)} disabled={submitting}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><Plus size={14} className="animate-spin" /> Salvando...</> : <><Plus size={14} /> Criar Projeto</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">{selected.nome}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <span className="badge" style={{ background: (CAT_COLORS[selected.categoria] || '#6366F1') + '20', color: CAT_COLORS[selected.categoria] || '#6366F1' }}>{selected.categoria}</span>
                  <span className={`badge ${STATUS_BADGE[selected.status] || 'badge-gray'}`}>{selected.status}</span>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>{selected.descricao || 'Sem descrição.'}</p>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                <strong>Núcleo:</strong> {selected.nucleos?.nome}<br />
                <strong>Responsável:</strong> {selected.responsavel}<br />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={async () => {
                 if (confirm('Excluir este projeto?')) {
                   await supabase.from('projetos').delete().eq('id', selected.id);
                   setSelected(null);
                   fetchProjetos();
                 }
              }}>Excluir</button>
              <button className="btn btn-primary btn-sm" onClick={() => navigate(`/turmas?projetoId=${selected.id}`)}>Gerenciar Turmas</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projetos;
