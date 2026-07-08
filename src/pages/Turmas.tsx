import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, GraduationCap, Users, CheckSquare, Save, X, UserCheck } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Turmas: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialProjetoId = queryParams.get('projetoId') || '';

  const [projetos, setProjetos] = useState<any[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [selectedProjeto, setSelectedProjeto] = useState(initialProjetoId);
  const [showCreate, setShowCreate] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attendanceMode, setAttendanceMode] = useState<'alunos' | 'chamada'>('alunos');
  const [selectedTurma, setSelectedTurma] = useState<any | null>(null);
  const [professorOptions, setProfessorOptions] = useState<any[]>([]);
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nome: '', professor: '', horario: '', alunos_matriculados: 0, status: 'ativa'
  });

  useEffect(() => {
    fetchProjetos();
    loadProfessors();
  }, []);

  useEffect(() => {
    if (selectedProjeto) fetchTurmas();
  }, [selectedProjeto]);

  const fetchProjetos = async () => {
    const { data, error } = await supabase.from('projetos').select('id, nome');
    if (!error && data) {
      setProjetos(data);
      if (!selectedProjeto && data.length > 0) setSelectedProjeto(data[0].id);
    }
  };

  const loadProfessors = async () => {
    try {
      const [{ data: coordData }, { data: userData }] = await Promise.all([
        supabase.from('coordenadores').select('id, nome').order('nome'),
        supabase.from('usuarios').select('id, nome').order('nome'),
      ]);

      const merged = [...(coordData || []), ...(userData || [])]
        .filter((item, index, arr) => arr.findIndex((entry) => entry.nome === item.nome) === index)
        .map((item) => ({ id: item.id, nome: item.nome }));

      setProfessorOptions(merged);
    } catch {
      setProfessorOptions([]);
    }
  };

  const fetchTurmas = async () => {
    const { data, error } = await supabase.from('turmas').select('*').eq('projeto_id', selectedProjeto);
    if (!error && data) setTurmas(data);
  };

  const openStudentsModal = (turma: any, mode: 'alunos' | 'chamada' = 'alunos') => {
    setSelectedTurma(turma);
    setAttendanceMode(mode);
    const stored = localStorage.getItem(`crm_turma_alunos_${turma.id}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setStudents(parsed);
      } catch {
        setStudents([]);
      }
    } else {
      setStudents([]);
    }
    setStudentName('');
    setStudentPhone('');
    setShowStudentsModal(true);
  };

  const saveStudents = (nextStudents: any[]) => {
    setStudents(nextStudents);
    if (selectedTurma?.id) {
      localStorage.setItem(`crm_turma_alunos_${selectedTurma.id}`, JSON.stringify(nextStudents));
    }
  };

  const addStudent = () => {
    const name = studentName.trim();
    if (!name) return;

    const newStudent = {
      id: `${Date.now()}`,
      nome: name,
      telefone: studentPhone.trim(),
      presente: false,
    };

    saveStudents([...students, newStudent]);
    setStudentName('');
    setStudentPhone('');
  };

  const toggleAttendance = (studentId: string) => {
    saveStudents(students.map((student) => student.id === studentId ? { ...student, presente: !student.presente } : student));
  };

  const removeStudent = (studentId: string) => {
    saveStudents(students.filter((student) => student.id !== studentId));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjeto) return alert('Selecione um projeto primeiro.');
    if (submitting) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('turmas').insert([{
        ...formData,
        projeto_id: selectedProjeto,
        professor: formData.professor || 'Não informado',
        alunos_matriculados: students.length || formData.alunos_matriculados || 0,
      }]);

      if (!error) {
        setShowCreate(false);
        setFormData({ nome: '', professor: '', horario: '', alunos_matriculados: 0, status: 'ativa' });
        setStudents([]);
        fetchTurmas();
      } else {
        alert('Erro ao criar turma: ' + error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const persistTurmaStudents = async () => {
    if (!selectedTurma?.id) return;

    const { error } = await supabase.from('turmas').update({ alunos_matriculados: students.length }).eq('id', selectedTurma.id);
    if (!error) {
      fetchTurmas();
      setShowStudentsModal(false);
    }
  };

  const projNome = projetos.find((p) => p.id === selectedProjeto)?.nome || '';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Turmas</h1>
          <p className="page-subtitle">Gerenciamento de turmas, professores, alunos e chamadas presenciais</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={() => {
            setStudents([]);
            setFormData({ nome: '', professor: '', horario: '', alunos_matriculados: 0, status: 'ativa' });
            setShowCreate(true);
          }}><Plus size={14} /> Nova Turma</button>
        </div>
      </div>

      <div className="filter-bar">
        <select className="form-select" style={{ width: 320 }} value={selectedProjeto} onChange={(e) => setSelectedProjeto(e.target.value)}>
          <option value="">Selecione um Projeto</option>
          {projetos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
      </div>

      {!selectedProjeto ? (
        <div className="text-center py-20 text-gray-500">Selecione um projeto para ver suas turmas.</div>
      ) : turmas.length === 0 ? (
        <div className="text-center py-20 text-gray-500">Este projeto não tem turmas cadastradas.</div>
      ) : (
        <div className="grid-2 animate-fade-in">
          {turmas.map((t) => (
            <div key={t.id} className="card relative group">
              <button
                onClick={async () => {
                  if (confirm('Excluir esta turma?')) {
                    await supabase.from('turmas').delete().eq('id', t.id);
                    fetchTurmas();
                  }
                }}
                className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-500/10 rounded"
              >
                Excluir
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <span className={`badge ${t.status === 'ativa' ? 'badge-success' : 'badge-gray'}`} style={{ marginBottom: 6 }}>{t.status}</span>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{t.nome}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{projNome}</p>
                </div>
                <GraduationCap size={24} color="#6366F1" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '14px 0', borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  <strong>Professor:</strong> {t.professor || 'Não informado'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  <strong>Horário:</strong> {t.horario || 'Não informado'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  <strong>Alunos matriculados:</strong> {t.alunos_matriculados || 0}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 12 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => openStudentsModal(t, 'alunos')}><Users size={13} /> Alunos</button>
                <button className="btn btn-primary btn-sm" onClick={() => openStudentsModal(t, 'chamada')}><CheckSquare size={13} /> Fazer Chamada</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Nova Turma</div>
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  {projNome ? `Projeto: ${projNome}` : 'Selecione um projeto'}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome da Turma *</label>
                  <input required className="form-input" placeholder="Ex: Turma A – Manhã" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Professor / Instrutor</label>
                  <input
                    className="form-input"
                    list="professores-list"
                    placeholder="Nome do professor"
                    value={formData.professor}
                    onChange={(e) => setFormData({ ...formData, professor: e.target.value })}
                  />
                  <datalist id="professores-list">
                    {professorOptions.map((option) => <option key={option.id} value={option.nome} />)}
                  </datalist>
                </div>
                <div className="form-group">
                  <label className="form-label">Horário das Aulas</label>
                  <input className="form-input" placeholder="Ex: Seg e Qua, 14:00 – 16:00" value={formData.horario} onChange={(e) => setFormData({ ...formData, horario: e.target.value })} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Alunos Matriculados</label>
                    <input type="number" min={0} className="form-input" value={formData.alunos_matriculados} onChange={(e) => setFormData({ ...formData, alunos_matriculados: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                      <option value="ativa">Ativa</option>
                      <option value="inativa">Inativa</option>
                    </select>
                  </div>
                </div>

                <div className="card" style={{ marginTop: 12, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <strong>Alunos da turma</strong>
                    <span className="badge badge-info">{students.length} cadastrados</span>
                  </div>
                  <div className="grid-2" style={{ marginBottom: 10 }}>
                    <input className="form-input" placeholder="Nome do aluno" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
                    <input className="form-input" placeholder="WhatsApp (opcional)" value={studentPhone} onChange={(e) => setStudentPhone(e.target.value)} />
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addStudent}><Plus size={14} /> Cadastrar aluno</button>
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {students.length === 0 ? (
                      <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Nenhum aluno cadastrado ainda.</div>
                    ) : students.map((student) => (
                      <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
                        <span>{student.nome}</span>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeStudent(student.id)}><X size={13} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)} disabled={submitting}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><Plus size={14} className="animate-spin" /> Salvando...</> : <><Save size={14} /> Criar Turma</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStudentsModal && selectedTurma && (
        <div className="modal-backdrop" onClick={() => setShowStudentsModal(false)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">{attendanceMode === 'chamada' ? 'Chamada da turma' : 'Alunos da turma'}</div>
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>{selectedTurma.nome}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowStudentsModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="card" style={{ padding: 14, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <strong>{attendanceMode === 'chamada' ? 'Marque presença' : 'Cadastre ou ajuste alunos'}</strong>
                  <span className="badge badge-info">{students.length} alunos</span>
                </div>
                <div className="grid-2" style={{ marginBottom: 10 }}>
                  <input className="form-input" placeholder="Nome do aluno" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
                  <input className="form-input" placeholder="WhatsApp (opcional)" value={studentPhone} onChange={(e) => setStudentPhone(e.target.value)} />
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addStudent}><Plus size={14} /> Cadastrar aluno</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {students.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 20 }}>Nenhum aluno cadastrado para esta turma.</div>
                ) : students.map((student) => (
                  <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {attendanceMode === 'chamada' ? (
                        <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => toggleAttendance(student.id)}>
                          {student.presente ? <UserCheck size={14} color="#10B981" /> : <Users size={14} />}
                        </button>
                      ) : (
                        <Users size={14} color="var(--text-tertiary)" />
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{student.nome}</div>
                        {student.telefone && <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{student.telefone}</div>}
                      </div>
                    </div>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeStudent(student.id)}><X size={13} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowStudentsModal(false)}>Fechar</button>
              <button type="button" className="btn btn-primary" onClick={persistTurmaStudents}><Save size={14} /> Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Turmas;
