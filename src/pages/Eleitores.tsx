import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Phone, Download, CheckCircle, XCircle, HelpCircle, AlertCircle, Edit2, Trash2, MapPin, Loader2, Link2, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import BairroSelect from '../components/ui/BairroSelect';
import { useNotifications } from '../contexts/NotificationContext';
import { useIBGE } from '../hooks/useIBGE';
import { saveWithOfflineFallback } from '../lib/offlineHelper';

const VOTO_CONFIG: Record<string, any> = {
  sim: { label: 'Confirmou', color: 'var(--success)', badge: 'badge-success', icon: <CheckCircle size={13} /> },
  nao: { label: 'Não Confirmou', color: 'var(--danger)', badge: 'badge-danger', icon: <XCircle size={13} /> },
  indeciso: { label: 'Indeciso', color: 'var(--warning)', badge: 'badge-warning', icon: <HelpCircle size={13} /> },
  outro_candidato: { label: 'Outro Candidato', color: 'var(--text-tertiary)', badge: 'badge-gray', icon: <AlertCircle size={13} /> },
};

const ORIGEM_BADGE: Record<string, string> = {
  landing: 'badge-info',
  manual: 'badge-gray',
};

const BASE_URL = 'https://appjuntos.vercel.app';

const emptyForm = {
  nome: '', cpf: '', telefone: '', whatsapp: '', instagram: '',
  cep: '', endereco: '', bairro: '', municipio: 'Rio de Janeiro',
  sexo: 'M', idade: 30,
  titulo_eleitor: '', zona_eleitoral: '', secao_eleitoral: '',
  confirmou_voto: 'indeciso', influencia: 0, votos_familia: 0,
  status: 'pendente', origem: 'manual',
};

const Eleitores: React.FC = () => {
  const [eleitores, setEleitores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [votoFilter, setVotoFilter] = useState('todos');
  const [origemFilter, setOrigemFilter] = useState('todos');
  const { addNotification } = useNotifications();

  const [showModal, setShowModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dados' | 'eleitor' | 'pesquisa'>('dados');
  const [formData, setFormData] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const { municipios } = useIBGE();

  useEffect(() => { fetchEleitores(); }, []);

  const fetchEleitores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('eleitores')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setEleitores(data);
    setLoading(false);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const payload = { ...formData };
    try {
      if (isEditing && selectedPerson) {
        const result = await saveWithOfflineFallback('eleitores', payload, selectedPerson.id, 'UPDATE');
        if (result.success) {
          addNotification(result.savedLocally ? 'Atualização salva localmente (sem internet). Será sincronizada depois.' : 'Eleitor atualizado com sucesso', result.savedLocally ? 'warning' : 'success');
          if (!result.savedLocally) fetchEleitores();
          setShowModal(false);
        } else {
          addNotification('Erro ao atualizar eleitor: ' + result.error, 'error');
        }
      } else {
        // Prevenir duplicados (CPF) somente quando online
        if (payload.cpf && navigator.onLine) {
          const { data: existing } = await supabase.from('eleitores').select('id').eq('cpf', payload.cpf).single();
          if (existing) {
            addNotification('Já existe um eleitor com este CPF.', 'error');
            return;
          }
        }
        const result = await saveWithOfflineFallback('eleitores', payload);
        if (result.success) {
          addNotification(result.savedLocally ? 'Eleitor salvo localmente (sem internet). Será sincronizado quando a conexão voltar.' : 'Eleitor cadastrado com sucesso!', result.savedLocally ? 'warning' : 'success');
          if (!result.savedLocally) fetchEleitores();
          setShowModal(false);
        } else {
          addNotification('Erro ao cadastrar eleitor: ' + result.error, 'error');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, ev: React.MouseEvent) => {
    ev.stopPropagation();
    if (!window.confirm('Remover este eleitor?')) return;
    const { error } = await supabase.from('eleitores').delete().eq('id', id);
    if (!error) { addNotification('Eleitor removido', 'success'); fetchEleitores(); if (selectedPerson?.id === id) setSelectedPerson(null); }
    else addNotification('Erro ao remover eleitor', 'error');
  };

  const openEdit = (p: any, ev?: React.MouseEvent) => {
    if (ev) ev.stopPropagation();
    setFormData({
      nome: p.nome || '', cpf: p.cpf || '', telefone: p.telefone || '', whatsapp: p.whatsapp || '',
      instagram: p.instagram || '', cep: p.cep || '', endereco: p.endereco || '',
      bairro: p.bairro || '', municipio: p.municipio || 'Rio de Janeiro',
      sexo: p.sexo || 'M', idade: p.idade || 30,
      titulo_eleitor: p.titulo_eleitor || '', zona_eleitoral: p.zona_eleitoral || '',
      secao_eleitoral: p.secao_eleitoral || '', confirmou_voto: p.confirmou_voto || 'indeciso',
      influencia: p.influencia || 0, votos_familia: p.votos_familia || 0,
      status: p.status || 'pendente', origem: p.origem || 'manual',
    });
    setSelectedPerson(p); setIsEditing(true); setActiveTab('dados'); setShowModal(true);
  };

  const openCreate = () => {
    setFormData({ ...emptyForm }); setSelectedPerson(null); setIsEditing(false); setActiveTab('dados'); setShowModal(true);
  };

  const handleExport = () => {
    const csv = ['Nome,CPF,WhatsApp,Instagram,CEP,Endereço,Bairro,Município,Zona,Seção,Intenção de Voto,Origem',
      ...eleitores.map(e => `${e.nome},${e.cpf || ''},${e.whatsapp || e.telefone || ''},${e.instagram || ''},${e.cep || ''},${e.endereco || ''},${e.bairro || ''},${e.municipio || ''},${e.zona_eleitoral || ''},${e.secao_eleitoral || ''},${e.confirmou_voto || ''},${e.origem || 'manual'}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'eleitores.csv'; a.click();
    addNotification('Arquivo exportado com sucesso!', 'success');
  };

  const filtered = useMemo(() => eleitores.filter(e => {
    const matchSearch = e.nome?.toLowerCase().includes(search.toLowerCase()) ||
      e.bairro?.toLowerCase().includes(search.toLowerCase()) ||
      e.whatsapp?.includes(search) || e.telefone?.includes(search) ||
      e.cpf?.includes(search.replace(/\D/g, ''));
    const matchVoto = votoFilter === 'todos' || e.confirmou_voto === votoFilter;
    const matchOrigem = origemFilter === 'todos' || e.origem === origemFilter;
    return matchSearch && matchVoto && matchOrigem;
  }), [search, votoFilter, origemFilter, eleitores]);

  const stats = useMemo(() => ({
    total: eleitores.length,
    confirmados: eleitores.filter(e => e.confirmou_voto === 'sim').length,
    indecisos: eleitores.filter(e => e.confirmou_voto === 'indeciso').length,
    negativo: eleitores.filter(e => e.confirmou_voto === 'nao').length,
    landing: eleitores.filter(e => e.origem === 'landing').length,
    comTitulo: eleitores.filter(e => e.titulo_eleitor).length,
  }), [eleitores]);

  const tabBtn = (tab: typeof activeTab, label: string) => (
    <button type="button" onClick={() => setActiveTab(tab)} style={{
      padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer',
      background: activeTab === tab ? 'var(--brand-primary)' : 'transparent',
      color: activeTab === tab ? 'white' : 'var(--text-secondary)',
      border: activeTab === tab ? 'none' : '1px solid var(--border-default)',
    }}>{label}</button>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">CRM Eleitoral</h1>
          <p className="page-subtitle">{eleitores.length} cadastrados • {filtered.length} exibindo</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={handleExport}><Download size={14} /> Exportar CSV</button>
          <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> Novo Eleitor</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4 mb-lg" style={{ marginBottom: 'var(--space-lg)', gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {[
          { label: 'Total', value: stats.total, color: '#6366F1' },
          { label: 'Confirmados', value: stats.confirmados, color: '#10B981' },
          { label: 'Indecisos', value: stats.indecisos, color: '#F59E0B' },
          { label: 'Não Votam', value: stats.negativo, color: '#EF4444' },
          { label: 'Via Landing', value: stats.landing, color: '#3B82F6' },
          { label: 'Com Título', value: stats.comTitulo, color: '#8B5CF6' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-field" style={{ flex: 1, maxWidth: 400 }}>
          <Search size={14} color="var(--text-tertiary)" />
          <input placeholder="Buscar por nome, bairro, CPF, telefone..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 180 }} value={votoFilter} onChange={e => setVotoFilter(e.target.value)}>
          <option value="todos">Intenção de Voto</option>
          <option value="sim">Confirmado</option>
          <option value="indeciso">Indeciso</option>
          <option value="nao">Não Confirma</option>
          <option value="outro_candidato">Outro Candidato</option>
        </select>
        <select className="form-select" style={{ width: 160 }} value={origemFilter} onChange={e => setOrigemFilter(e.target.value)}>
          <option value="todos">Todas as Origens</option>
          <option value="landing">Via Landing Page</option>
          <option value="manual">Cadastro Manual</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container animate-fade-in">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <Loader2 style={{ display: 'block', margin: '0 auto 8px' }} className="animate-spin" />
            Carregando eleitores...
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Eleitor</th>
                <th>Contatos</th>
                <th>Intenção</th>
                <th>Localização</th>
                <th>Título</th>
                <th>Origem</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => {
                const cfg = VOTO_CONFIG[e.confirmou_voto || 'indeciso'] || VOTO_CONFIG.indeciso;
                return (
                  <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => openEdit(e)}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{e.nome}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>CPF: {e.cpf || '—'}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {(e.whatsapp || e.telefone) && (
                          <a href={`https://wa.me/55${(e.whatsapp || e.telefone).replace(/\D/g, '')}`}
                            target="_blank" rel="noreferrer" onClick={ev => ev.stopPropagation()}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#25D366', fontSize: 12, textDecoration: 'none' }}>
                            <Phone size={12} /> {e.whatsapp || e.telefone}
                          </a>
                        )}
                        {e.instagram && (
                          <a href={`https://instagram.com/${e.instagram.replace('@', '')}`}
                            target="_blank" rel="noreferrer" onClick={ev => ev.stopPropagation()}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#E1306C', fontSize: 12, textDecoration: 'none' }}>
                            <span style={{ fontSize: 12 }}>📸</span> {e.instagram}
                          </a>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${cfg.badge}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <MapPin size={11} color="var(--text-tertiary)" />
                          {e.bairro || '—'}, {e.municipio || '—'}
                        </div>
                        {e.cep && <div style={{ color: 'var(--text-tertiary)', fontSize: 11, marginTop: 2 }}>CEP: {e.cep}</div>}
                      </div>
                    </td>
                    <td>
                      {e.titulo_eleitor ? (
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          <div>Zona: {e.zona_eleitoral || '—'}</div>
                          <div>Seção: {e.secao_eleitoral || '—'}</div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-disabled)', fontStyle: 'italic' }}>Não informado</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${e.origem === 'landing' ? 'badge-info' : 'badge-gray'}`} style={{ fontSize: 11 }}>
                        {e.origem === 'landing' ? '🔗 Landing' : '✏️ Manual'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={(ev) => { ev.stopPropagation(); openEdit(e, ev); }}><Edit2 size={14} /></button>
                        <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={(ev) => handleDelete(e.id, ev)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>Nenhum eleitor encontrado.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{isEditing ? 'Editar Eleitor' : 'Novo Eleitor'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, padding: '0 24px 4px', borderBottom: '1px solid var(--border-subtle)' }}>
              {tabBtn('dados', '👤 Dados Pessoais')}
              {tabBtn('eleitor', '🗳️ Dados Eleitorais')}
              {tabBtn('pesquisa', '📊 Pesquisa')}
            </div>

            <form onSubmit={handleCreateOrUpdate}>
              <div className="modal-body">

                {/* TAB DADOS */}
                {activeTab === 'dados' && (
                  <div>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Nome Completo *</label>
                        <input required className="form-input" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">CPF *</label>
                        <input required className="form-input" placeholder="000.000.000-00" value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">WhatsApp *</label>
                        <input required className="form-input" placeholder="(21) 99999-9999" value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Instagram *</label>
                        <input required className="form-input" placeholder="@usuario" value={formData.instagram} onChange={e => setFormData({ ...formData, instagram: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">CEP *</label>
                        <input required className="form-input" placeholder="00000-000" value={formData.cep} onChange={e => setFormData({ ...formData, cep: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Endereço Completo *</label>
                        <input required className="form-input" placeholder="Rua, nº, Bairro" value={formData.endereco} onChange={e => setFormData({ ...formData, endereco: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid-3">
                      <div className="form-group">
                        <label className="form-label">Bairro *</label>
                        <BairroSelect
                          value={formData.bairro}
                          onChange={(value) => setFormData({ ...formData, bairro: value })}
                          municipality={formData.municipio || 'Rio de Janeiro'}
                          required
                          className="form-input"
                          placeholder="Seu bairro"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Região / Município *</label>
                        <select required className="form-select" value={formData.municipio} onChange={e => setFormData({ ...formData, municipio: e.target.value })}>
                          <option value="">Selecione o Município</option>
                          {municipios.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
                          <option value="Outro">Outro (Fora do RJ)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Intenção de Voto</label>
                        <select className="form-select" value={formData.confirmou_voto} onChange={e => setFormData({ ...formData, confirmou_voto: e.target.value })}>
                          <option value="indeciso">Indeciso</option>
                          <option value="sim">Confirmado</option>
                          <option value="nao">Não Confirma</option>
                          <option value="outro_candidato">Outro Candidato</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB ELEITOR */}
                {activeTab === 'eleitor' && (
                  <div>
                    <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: 16, marginBottom: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
                      ℹ️ Os dados eleitorais são <strong>opcionais</strong> e podem ser adicionados depois quando o eleitor disponibilizar o título.
                    </div>
                    <div className="grid-3">
                      <div className="form-group">
                        <label className="form-label">Nº do Título de Eleitor</label>
                        <input className="form-input" placeholder="000000000000" value={formData.titulo_eleitor} onChange={e => setFormData({ ...formData, titulo_eleitor: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Zona Eleitoral</label>
                        <input className="form-input" placeholder="001" value={formData.zona_eleitoral} onChange={e => setFormData({ ...formData, zona_eleitoral: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Seção Eleitoral</label>
                        <input className="form-input" placeholder="0001" value={formData.secao_eleitoral} onChange={e => setFormData({ ...formData, secao_eleitoral: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Votos Familiares Estimados</label>
                        <input type="number" className="form-input" value={formData.votos_familia} onChange={e => setFormData({ ...formData, votos_familia: parseInt(e.target.value) || 0 })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Influência (0-10)</label>
                        <input type="number" min={0} max={10} className="form-input" value={formData.influencia} onChange={e => setFormData({ ...formData, influencia: parseInt(e.target.value) || 0 })} />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB PESQUISA */}
                {activeTab === 'pesquisa' && (
                  <div>
                    <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: 16, marginBottom: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
                      📊 Dados da pesquisa comunitária respondida via landing page (somente leitura para cadastros via link).
                    </div>
                    {selectedPerson ? (
                      <div className="grid-2">
                        {[
                          { label: 'Ruas e Calçadas', val: selectedPerson.nota_ruas },
                          { label: 'Iluminação Pública', val: selectedPerson.nota_iluminacao },
                          { label: 'Segurança Pública', val: selectedPerson.nota_seguranca },
                          { label: 'Saúde (UPA/Postos)', val: selectedPerson.nota_saude },
                        ].map(item => (
                          <div key={item.label} className="card" style={{ padding: '14px 16px' }}>
                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>{item.label}</div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {[1, 2, 3, 4, 5].map(n => (
                                <span key={n} style={{ fontSize: 18, opacity: n <= (item.val || 0) ? 1 : 0.2 }}>⭐</span>
                              ))}
                              {!item.val && <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Não respondido</span>}
                            </div>
                          </div>
                        ))}
                        <div className="card" style={{ padding: '14px 16px', gridColumn: '1/-1' }}>
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>Principal Necessidade</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                            {selectedPerson.necessidade_principal || <em style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>Não respondido</em>}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: 14 }}>
                        Dados de pesquisa disponíveis somente ao editar um eleitor existente.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={submitting}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : isEditing ? 'Salvar Alterações' : 'Cadastrar Eleitor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Eleitores;
