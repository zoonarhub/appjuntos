import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, GraduationCap, Users, CheckSquare, Save, X, UserCheck, Search, Trash2 } from 'lucide-react';
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
  const [students, setStudents] = useState<any[]>([]); // list of { id, nome, telefone, eleitor_id, presente }
  const [formData, setFormData] = useState({
    nome: '', professor: '', horario: '', alunos_matriculados: 0, status: 'ativa'
  });
  const [chamadaDate, setChamadaDate] = useState(new Date().toISOString().split('T')[0]);

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

  const openStudentsModal = async (turma: any, mode: 'alunos' | 'chamada' = 'alunos') => {
    setSelectedTurma(turma);
    setAttendanceMode(mode);
    setStudentName('');
    setStudentPhone('');
    setChamadaDate(new Date().toISOString().split('T')[0]);
    setShowStudentsModal(true);

    // Fetch existing students from database
    const { data: dbAlunos } = await supabase.from('turma_alunos').select('*').eq('turma_id', turma.id);
    const mappedAlunos = (dbAlunos || []).map(a => ({
      ...a,
      presente: false // reset presente state
    }));

    // If chamadas mode, fetch if today has a chamada
    if (mode === 'chamada') {
       const today = new Date().toISOString().split('T')[0];
       const { data: chamadas } = await supabase
         .from('turma_chamadas')
         .select('id')
         .eq('turma_id', turma.id)
         .eq('data', today);
       
       if (chamadas && chamadas.length > 0) {
         const { data: chamadasAlunos } = await supabase
           .from('turma_chamada_alunos')
           .select('turma_aluno_id, presente')
           .eq('chamada_id', chamadas[0].id);
         
         if (chamadasAlunos) {
            mappedAlunos.forEach(a => {
              const rec = chamadasAlunos.find(ca => ca.turma_aluno_id === a.id);
              if (rec) a.presente = rec.presente;
            });
         }
       }
    }

    setStudents(mappedAlunos);
  };

  const addStudent = async () => {
    const name = studentName.trim();
    if (!name) return;

    const newStudent = {
      id: `local-${Date.now()}`,
      nome: name,
      telefone: studentPhone.trim(),
      presente: false,
    };

    setStudents([...students, newStudent]);
    setStudentName('');
    setStudentPhone('');
  };

  const toggleAttendance = (studentId: string) => {
    setStudents(students.map((student) => 
      student.id === studentId ? { ...student, presente: !student.presente } : student
    ));
  };

  const removeStudent = (studentId: string) => {
    setStudents(students.filter((student) => student.id !== studentId));
  };

  const syncStudentsToDatabase = async (turma_id: string, currentStudents: any[]) => {
    const validStudents = currentStudents.filter(s => s.nome.trim() !== '');
    
    // First, map local students and sync to CRM
    for (const student of validStudents) {
      if (!student.eleitor_id) {
         // create in eleitores
         const { data: eleitor } = await supabase.from('eleitores').insert([{
            nome: student.nome.trim(),
            telefone: student.telefone || '',
            whatsapp: student.telefone || '',
            status: 'ativo',
            municipio: 'Rio de Janeiro',
            origem: 'turma',
            dados_extras: { turma_id, fonte: 'turmas' }
         }]).select('id').single();

         if (eleitor) student.eleitor_id = eleitor.id;
      }
      
      if (String(student.id).startsWith('local-')) {
         // insert into turma_alunos
         const { data: tAluno } = await supabase.from('turma_alunos').insert([{
           turma_id: turma_id,
           nome: student.nome,
           telefone: student.telefone,
           eleitor_id: student.eleitor_id
         }]).select('id').single();
         if (tAluno) student.id = tAluno.id;
      } else {
         // update existing
         await supabase.from('turma_alunos').update({
           nome: student.nome,
           telefone: student.telefone,
           eleitor_id: student.eleitor_id
         }).eq('id', student.id);
      }
    }

    // Handle deletions if any existing student is no longer in the list
    // Normally we would query the current and delete missing ones, but for simplicity we only add/update here,
    // or we can fetch current from DB and delete those not in validStudents.
    const { data: dbAlunos } = await supabase.from('turma_alunos').select('id').eq('turma_id', turma_id);
    if (dbAlunos) {
      const currentIds = validStudents.filter(s => !String(s.id).startsWith('local-')).map(s => s.id);
      const toDelete = dbAlunos.filter(dbA => !currentIds.includes(dbA.id)).map(dbA => dbA.id);
      if (toDelete.length > 0) {
        await supabase.from('turma_alunos').delete().in('id', toDelete);
      }
    }

    // Update Turma count
    await supabase.from('turmas').update({ alunos_matriculados: validStudents.length }).eq('id', turma_id);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjeto) return alert('Selecione um projeto primeiro.');
    if (submitting) return;

    setSubmitting(true);
    try {
      const { data: createdTurma, error } = await supabase.from('turmas').insert([{
        ...formData,
        projeto_id: selectedProjeto,
        professor: formData.professor || 'Não informado',
        alunos_matriculados: students.length || formData.alunos_matriculados || 0,
      }]).select().single();

      if (!error && createdTurma) {
        await syncStudentsToDatabase(createdTurma.id, students);
        setShowCreate(false);
        setFormData({ nome: '', professor: '', horario: '', alunos_matriculados: 0, status: 'ativa' });
        setStudents([]);
        fetchTurmas();
      } else {
        alert('Erro ao criar turma: ' + error?.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const persistTurmaAction = async () => {
    if (!selectedTurma?.id) return;
    setSubmitting(true);

    try {
      if (attendanceMode === 'alunos') {
        await syncStudentsToDatabase(selectedTurma.id, students);
      } else if (attendanceMode === 'chamada') {
        // Sync any new students just in case
        await syncStudentsToDatabase(selectedTurma.id, students);
        
        // Save Chamada
        let chamadaId = '';
        const { data: existingChamada } = await supabase
          .from('turma_chamadas')
          .select('id')
          .eq('turma_id', selectedTurma.id)
          .eq('data', chamadaDate);

        if (existingChamada && existingChamada.length > 0) {
          chamadaId = existingChamada[0].id;
        } else {
          const { data: novaChamada } = await supabase
            .from('turma_chamadas')
            .insert([{ turma_id: selectedTurma.id, data: chamadaDate }])
            .select('id')
            .single();
          if (novaChamada) chamadaId = novaChamada.id;
        }

        if (chamadaId) {
          // Upsert attendance for students
          for (const s of students) {
            if (!String(s.id).startsWith('local-')) {
               await supabase.from('turma_chamada_alunos').upsert({
                 chamada_id: chamadaId,
                 turma_aluno_id: s.id,
                 presente: Boolean(s.presente)
               });
            }
          }
        }
      }
      setShowStudentsModal(false);
      fetchTurmas();
    } catch (e: any) {
      alert('Erro ao salvar: ' + e.message);
    } finally {
      setSubmitting(false);
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
                type="button"
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
                <button className="btn btn-ghost btn-sm" onClick={() => openStudentsModal(t, 'alunos')}><Users size={14} /> Alunos</button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--brand-primary)' }} onClick={() => openStudentsModal(t, 'chamada')}><CheckSquare size={14} /> Chamada</button>
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
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>✕</button>
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
                    <input type="number" min={0} className="form-input" value={formData.alunos_matriculados} onChange={(e) => setFormData({ ...formData, alunos_matriculados: parseInt(e.target.value) || 0 })} disabled={students.length > 0} />
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
                    <strong>Cadastrar alunos</strong>
                    <span className="badge badge-info">{students.length} alunos</span>
                  </div>
                  <div className="grid-2" style={{ marginBottom: 10 }}>
                    <input className="form-input" placeholder="Nome do aluno" value={studentName} onChange={(e) => setStudentName(e.target.value)} onKeyDown={(e) => { if(e.key==='Enter') { e.preventDefault(); addStudent(); } }} />
                    <input className="form-input" placeholder="WhatsApp (opcional)" value={studentPhone} onChange={(e) => setStudentPhone(e.target.value)} onKeyDown={(e) => { if(e.key==='Enter') { e.preventDefault(); addStudent(); } }} />
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addStudent}><Plus size={14} /> Adicionar à lista</button>
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {students.length === 0 ? (
                      <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Nenhum aluno adicionado ainda.</div>
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
                <div className="modal-title">{attendanceMode === 'chamada' ? 'Fazer Chamada' : 'Gerenciar Alunos'}</div>
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>{selectedTurma.nome}</div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowStudentsModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              {attendanceMode === 'chamada' && (
                <div className="form-group mb-md" style={{ marginBottom: 16 }}>
                  <label className="form-label">Data da Chamada</label>
                  <input type="date" className="form-input" value={chamadaDate} onChange={e => setChamadaDate(e.target.value)} />
                </div>
              )}

              <div className="card" style={{ padding: 14, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <strong>{attendanceMode === 'chamada' ? 'Cadastrar aluno extra' : 'Cadastrar novo aluno'}</strong>
                  <span className="badge badge-info">{students.length} alunos</span>
                </div>
                <div className="grid-2" style={{ marginBottom: 10 }}>
                  <input className="form-input" placeholder="Nome do aluno" value={studentName} onChange={(e) => setStudentName(e.target.value)} onKeyDown={(e) => { if(e.key==='Enter') { e.preventDefault(); addStudent(); } }} />
                  <input className="form-input" placeholder="WhatsApp (opcional)" value={studentPhone} onChange={(e) => setStudentPhone(e.target.value)} onKeyDown={(e) => { if(e.key==='Enter') { e.preventDefault(); addStudent(); } }} />
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addStudent}><Plus size={14} /> Adicionar aluno</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {students.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 20 }}>Nenhum aluno na turma.</div>
                ) : students.map((student) => (
                  <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }} onClick={() => attendanceMode === 'chamada' && toggleAttendance(student.id)} className={attendanceMode === 'chamada' ? 'cursor-pointer' : ''}>
                      {attendanceMode === 'chamada' ? (
                        <div className={`checkbox-circle ${student.presente ? 'checked' : ''}`} style={{ 
                          width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--brand-primary)', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          backgroundColor: student.presente ? 'var(--brand-primary)' : 'transparent'
                        }}>
                          {student.presente && <CheckSquare size={14} color="#fff" />}
                        </div>
                      ) : (
                        <Users size={14} color="var(--text-tertiary)" />
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{student.nome}</div>
                        {student.telefone && <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{student.telefone}</div>}
                      </div>
                    </div>
                    {attendanceMode === 'alunos' && (
                       <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => removeStudent(student.id)}>
                         <Trash2 size={16} />
                       </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowStudentsModal(false)} disabled={submitting}>Cancelar</button>
              <button type="button" className="btn btn-primary" onClick={() => { void persistTurmaAction(); }} disabled={submitting}>
                {submitting ? 'Salvando...' : <><Save size={14} /> Salvar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Turmas;
