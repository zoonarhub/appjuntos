import React, { useState, useEffect } from 'react';
import { Shield, Users, Lock, CheckCircle2, UserPlus, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

const Configuracoes: React.FC = () => {
  const { dbUser } = useAuth();
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<'perfis' | 'usuarios'>('usuarios');
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ nome: '', cpf: '', cargo: 'Liderança' });
  const [submitting, setSubmitting] = useState(false);

  // Perfis states
  const [perfil, setPerfil] = useState('Coordenador Geral');
  const perfisPermissao = [
    { nome: 'Administrador', modulos: ['Dashboard', 'Mapa', 'BI', 'Pessoas', 'Eleitores', 'Núcleos', 'Projetos', 'Eventos', 'Comunicação', 'Configurações'], acao: 'Acesso Total' },
    { nome: 'Coordenador Geral', modulos: ['Dashboard', 'Mapa', 'BI', 'Pessoas', 'Eleitores', 'Núcleos', 'Projetos', 'Eventos', 'Comunicação'], acao: 'Visualizar / Editar' },
    { nome: 'Coordenador Regional', modulos: ['Dashboard', 'Mapa', 'Pessoas', 'Eleitores', 'Núcleos', 'Eventos'], acao: 'Visualizar / Editar própria região' },
    { nome: 'Coordenador Local', modulos: ['Dashboard', 'Eleitores', 'Eventos'], acao: 'Visualizar própria área' },
    { nome: 'Liderança', modulos: ['Eleitores'], acao: 'Visualizar própria equipe' },
  ];

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('usuarios').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setUsuarios(data);
    }
    setLoading(false);
  };

  const toggleAcesso = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('usuarios').update({ status_acesso: !currentStatus }).eq('id', id);
    if (!error) {
      setUsuarios(usuarios.map(u => u.id === id ? { ...u, status_acesso: !currentStatus } : u));
      addNotification(`Acesso ${!currentStatus ? 'liberado' : 'bloqueado'} com sucesso.`, 'success');
    } else {
      addNotification('Erro ao atualizar status: ' + error.message, 'error');
    }
  };

  const deleteUsuario = async (id: string) => {
    if (!window.confirm('Deseja realmente excluir este usuário?')) return;
    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    if (!error) {
      setUsuarios(usuarios.filter(u => u.id !== id));
      addNotification('Usuário excluído com sucesso.', 'success');
    } else {
      addNotification('Erro ao excluir usuário.', 'error');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const cleanCpf = formData.cpf.replace(/\D/g, '');
    
    if (cleanCpf.length !== 11) {
      addNotification('CPF inválido.', 'warning');
      setSubmitting(false);
      return;
    }

    const { data, error } = await supabase.from('usuarios').insert([{
      nome: formData.nome,
      cpf: cleanCpf,
      role: formData.cargo,
      senha: '123456',
      senha_temporaria: true,
      status_acesso: true
    }]).select().single();

    if (!error && data) {
      addNotification('Acesso criado e liberado com sucesso!', 'success');
      setUsuarios([data, ...usuarios]);
      setShowModal(false);
      setFormData({ nome: '', cpf: '', cargo: 'Liderança' });
    } else {
      console.error(error);
      addNotification('Erro: ' + (error?.message || 'Erro desconhecido'), 'error');
    }
    setSubmitting(false);
  };

  const formatCPF = (val: string) => {
    return val
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  if (dbUser?.role !== 'Administrador') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <Lock className="w-16 h-16 text-gray-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
        <p className="text-gray-400">Apenas o Administrador pode visualizar e alterar configurações do sistema.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configurações e Segurança</h1>
          <p className="page-subtitle">Gerencie permissões, usuários e controle de acesso do sistema</p>
        </div>
        <div className="page-actions">
          {activeTab === 'usuarios' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              <UserPlus size={14} /> Novo Acesso
            </button>
          )}
        </div>
      </div>

      <div className="tabs mb-md" style={{ marginBottom: 'var(--space-lg)' }}>
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`tab ${activeTab === 'usuarios' ? 'active' : ''}`}
        >
          Acessos e Usuários
        </button>
        <button
          onClick={() => setActiveTab('perfis')}
          className={`tab ${activeTab === 'perfis' ? 'active' : ''}`}
        >
          Perfis de Permissão (RBAC)
        </button>
      </div>

      {activeTab === 'usuarios' && (
        <div className="card animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <Users size={18} color="var(--brand-primary)" />
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Gerenciamento de Acessos</h3>
          </div>
          
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Perfil / Cargo</th>
                  <th>Status de Acesso</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}><Loader2 className="animate-spin" style={{ display: 'block', margin: '0 auto 8px' }}/>Carregando usuários...</td></tr>
                ) : usuarios.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>Nenhum usuário encontrado.</td></tr>
                ) : (
                  usuarios.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.nome}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{formatCPF(u.cpf)}</td>
                      <td>
                        <select 
                          className="form-select"
                          style={{ padding: '6px 12px', fontSize: 13, height: 'auto', minHeight: 32 }}
                          value={u.role}
                          onChange={async (e) => {
                            const newRole = e.target.value;
                            const { error } = await supabase.from('usuarios').update({ role: newRole }).eq('id', u.id);
                            if (!error) setUsuarios(usuarios.map(user => user.id === u.id ? { ...user, role: newRole } : user));
                          }}
                        >
                          <option>Administrador</option>
                          <option>Coordenador Geral</option>
                          <option>Coordenador Regional</option>
                          <option>Coordenador Local</option>
                          <option>Liderança</option>
                        </select>
                      </td>
                      <td>
                        <span className={`badge ${u.status_acesso ? 'badge-success' : 'badge-warning'}`}>
                          {u.status_acesso ? <CheckCircle2 size={12} style={{ marginRight: 4 }} /> : <Lock size={12} style={{ marginRight: 4 }} />}
                          {u.status_acesso ? 'Liberado' : 'Aguardando'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                          <button 
                            onClick={() => toggleAcesso(u.id, u.status_acesso)}
                            className="btn btn-secondary btn-sm"
                          >
                            {u.status_acesso ? 'Bloquear' : 'Liberar'}
                          </button>
                          <button 
                            onClick={() => deleteUsuario(u.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--danger)', borderColor: 'var(--danger-alpha)' }}
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'perfis' && (
        <div className="grid-3 animate-fade-in">
          {/* Roles list */}
          <div className="card" style={{ gridColumn: 'span 1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Perfis de Usuários</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {perfisPermissao.map(p => (
                <button
                  key={p.nome}
                  className={`btn btn-secondary w-full`}
                  style={{
                    justifyContent: 'flex-start',
                    background: perfil === p.nome ? 'rgba(43,92,255,0.12)' : undefined,
                    borderColor: perfil === p.nome ? 'var(--brand-primary)' : undefined,
                    color: perfil === p.nome ? 'var(--brand-primary)' : undefined
                  }}
                  onClick={() => setPerfil(p.nome)}
                >
                  <Shield size={14} /> {p.nome}
                </button>
              ))}
            </div>
          </div>

          {/* Permissions list */}
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              Permissões do Perfil: <span style={{ color: 'var(--brand-primary)' }}>{perfil}</span>
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>
              Regra geral: {perfisPermissao.find(p => p.nome === perfil)?.acao}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { mod: 'Dashboard', desc: 'Acesso aos cards e gráficos da página inicial' },
                { mod: 'Mapa Eleitoral', desc: 'Visualização de eleitores, núcleos e pins no mapa' },
                { mod: 'Business Intelligence', desc: 'Visualização e exportação de relatórios avançados' },
                { mod: 'Pessoas', desc: 'Gestão de coordenadores, voluntários e auxiliares' },
                { mod: 'Eleitores', desc: 'Cadastro e atualização de status de voto' },
                { mod: 'Núcleos', desc: 'Criação e gestão de núcleos territoriais' },
                { mod: 'Projetos', desc: 'Gestão de cursos, turmas e presença de alunos' },
                { mod: 'Comunicação', desc: 'Envio de campanhas de WhatsApp, SMS e E-mail' },
                { mod: 'Configurações', desc: 'Modificar permissões e segurança do sistema' },
              ].map(m => {
                const hasAccess = perfisPermissao.find(p => p.nome === perfil)?.modulos.includes(m.mod.split(' ')[0]) || false;
                return (
                  <div key={m.mod} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{m.mod}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{m.desc}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`badge ${hasAccess ? 'badge-success' : 'badge-gray'}`}>
                        {hasAccess ? 'Acesso Ativo' : 'Bloqueado'}
                      </span>
                      <input type="checkbox" checked={hasAccess} readOnly style={{ accentColor: 'var(--brand-primary)', width: 16, height: 16 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar Acesso */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Liberar Novo Acesso</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="modal-body">
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Preencha os dados abaixo. O login será liberado imediatamente. A senha padrão do usuário será <strong>123456</strong> e ele deverá alterá-la no primeiro acesso.
                </p>
                <div className="form-group">
                  <label className="form-label">Nome Completo</label>
                  <input required className="form-input" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">CPF (Login)</label>
                  <input required className="form-input" value={formData.cpf} onChange={e => setFormData({...formData, cpf: formatCPF(e.target.value)})} maxLength={14} placeholder="000.000.000-00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Cargo / Perfil</label>
                  <select className="form-select" value={formData.cargo} onChange={e => setFormData({...formData, cargo: e.target.value})}>
                    <option>Administrador</option>
                    <option>Coordenador Geral</option>
                    <option>Coordenador Regional</option>
                    <option>Coordenador Local</option>
                    <option>Liderança</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : 'Criar e Liberar Acesso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Configuracoes;
