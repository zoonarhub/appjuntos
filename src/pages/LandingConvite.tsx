import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, Users, Heart, Shield, Star, ChevronRight, ChevronLeft, Loader2, MapPin, Phone, User, FileText, Hash } from 'lucide-react';

const BASE_URL = 'https://juntossomosmaisfortes.vercel.app';

// Star Rating component
const StarRating: React.FC<{ value: number; onChange: (v: number) => void; label: string }> = ({ value, onChange, label }) => (
  <div style={{ marginBottom: 24 }}>
    <p style={{ fontSize: 15, fontWeight: 500, color: '#1e293b', marginBottom: 12, lineHeight: 1.5 }}>{label}</p>
    <div style={{ display: 'flex', gap: 8 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          style={{
            width: 48, height: 48, borderRadius: 12,
            background: n <= value ? 'linear-gradient(135deg, #10b981, #059669)' : '#f1f5f9',
            border: n <= value ? '2px solid #059669' : '2px solid #e2e8f0',
            color: n <= value ? 'white' : '#94a3b8',
            fontSize: 20, cursor: 'pointer',
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: n <= value ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          ⭐
        </button>
      ))}
      <span style={{ marginLeft: 8, fontSize: 13, color: '#64748b', alignSelf: 'center' }}>
        {value === 0 ? 'Não avaliado' : value === 1 ? 'Muito ruim' : value === 2 ? 'Ruim' : value === 3 ? 'Regular' : value === 4 ? 'Bom' : 'Excelente'}
      </span>
    </div>
  </div>
);

const LandingConvite: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [convidador, setConvidador] = useState<any>(null);
  const [loadingConvidador, setLoadingConvidador] = useState(true);
  const [step, setStep] = useState<'form' | 'perguntas' | 'sucesso'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const [formData, setFormData] = useState({
    nome: '', cpf: '', whatsapp: '', cep: '', endereco: '', instagram: '',
    titulo_eleitor: '', zona_eleitoral: '', secao_eleitoral: '',
  });

  const [pesquisa, setPesquisa] = useState({
    nota_ruas: 0, nota_iluminacao: 0, nota_seguranca: 0, nota_saude: 0,
    necessidade_principal: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (token) fetchConvidador();
  }, [token]);

  const fetchConvidador = async () => {
    setLoadingConvidador(true);
    const { data } = await supabase
      .from('coordenadores')
      .select('id, nome, tipo, bairro, regiao')
      .eq('link_token', token)
      .single();
    if (data) {
      setConvidador(data);
    } else {
      // Try usuarios table
      const { data: usr } = await supabase
        .from('usuarios')
        .select('id, nome, perfil, bairro')
        .eq('link_token', token)
        .single();
      if (usr) setConvidador({ ...usr, tipo: usr.perfil || 'Liderança' });
    }
    setLoadingConvidador(false);
  };

  const buscarCep = async (cep: string) => {
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          endereco: `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`
        }));
      }
    } catch {}
    setCepLoading(false);
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formData.nome.trim()) errs.nome = 'Nome é obrigatório';
    if (!formData.cpf.replace(/\D/g, '') || formData.cpf.replace(/\D/g, '').length !== 11)
      errs.cpf = 'CPF inválido (11 dígitos)';
    if (!formData.whatsapp.replace(/\D/g, '') || formData.whatsapp.replace(/\D/g, '').length < 10)
      errs.whatsapp = 'WhatsApp inválido';
    if (!formData.cep.replace(/\D/g, '') || formData.cep.replace(/\D/g, '').length !== 8)
      errs.cep = 'CEP inválido (8 dígitos)';
    if (!formData.endereco.trim()) errs.endereco = 'Endereço é obrigatório';
    if (!formData.instagram.trim()) errs.instagram = 'Instagram é obrigatório';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) setStep('perguntas');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload: any = {
      nome: formData.nome,
      cpf: formData.cpf.replace(/\D/g, ''),
      whatsapp: formData.whatsapp.replace(/\D/g, ''),
      cep: formData.cep.replace(/\D/g, ''),
      endereco: formData.endereco,
      instagram: formData.instagram.startsWith('@') ? formData.instagram : '@' + formData.instagram,
      titulo_eleitor: formData.titulo_eleitor || null,
      zona_eleitoral: formData.zona_eleitoral || null,
      secao_eleitoral: formData.secao_eleitoral || null,
      nota_ruas: pesquisa.nota_ruas || null,
      nota_iluminacao: pesquisa.nota_iluminacao || null,
      nota_seguranca: pesquisa.nota_seguranca || null,
      nota_saude: pesquisa.nota_saude || null,
      necessidade_principal: pesquisa.necessidade_principal || null,
      confirmou_voto: 'indeciso',
      origem: 'landing',
      status: 'pendente',
    };

    if (convidador?.id) {
      payload.indicado_por = convidador.id;
    }

    const { error } = await supabase.from('eleitores').insert([payload]);

    if (!error && convidador?.id) {
      // Increment total_indicados (best effort — ignore errors)
      await supabase
        .from('coordenadores')
        .update({ total_indicados: (convidador.total_indicados || 0) + 1 })
        .eq('id', convidador.id);
    }

    setSubmitting(false);
    setStep('sucesso');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: 12,
    border: '2px solid #e2e8f0', fontSize: 15, outline: 'none',
    background: '#f8fafc', color: '#0f172a', transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 600,
    color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  const fieldError = (field: string) => errors[field] ? (
    <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors[field]}</p>
  ) : null;

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf4', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Import Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        input:focus, select:focus, textarea:focus {
          border-color: #10b981 !important;
          background: white !important;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.15) !important;
        }
        .btn-green {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white; border: none; padding: 16px 32px;
          border-radius: 14px; font-size: 16px; font-weight: 700;
          cursor: pointer; width: 100%; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .btn-green:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(16,185,129,0.4); }
        .btn-green:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .choice-btn {
          padding: 12px 16px; border-radius: 10px; border: 2px solid #e2e8f0;
          background: white; cursor: pointer; transition: all 0.2s; text-align: left;
          font-size: 14px; font-weight: 500; color: #374151; width: 100%;
        }
        .choice-btn.active {
          border-color: #10b981; background: #ecfdf5; color: #059669;
        }
        .choice-btn:hover { border-color: #10b981; }
      `}</style>

      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
        padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 12, boxShadow: '0 4px 20px rgba(6,78,59,0.3)',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Heart size={24} color="white" fill="white" />
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'white', lineHeight: 1 }}>Juntos pelo Rio</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>Transformando comunidades com ação</div>
        </div>
      </header>

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(160deg, #064e3b, #065f46, #0d9488)',
        padding: '48px 24px 64px', textAlign: 'center',
      }}>
        {loadingConvidador ? (
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Carregando...</div>
        ) : convidador ? (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.12)', borderRadius: 100,
            padding: '8px 20px', marginBottom: 24, backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #34d399)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              fontSize: 14, fontWeight: 800, color: 'white',
            }}>
              {convidador.nome?.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
              Convite de <strong style={{ color: 'white' }}>{convidador.nome}</strong>
            </span>
          </div>
        ) : (
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 16 }}>Link de convite da comunidade</div>
        )}

        <h1 style={{
          fontSize: 36, fontWeight: 900, color: 'white', lineHeight: 1.15,
          marginBottom: 16, letterSpacing: '-0.02em',
        }}>
          Faça parte da mudança <br />
          <span style={{ color: '#6ee7b7' }}>que o Rio merece!</span>
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
          O <strong style={{ color: '#6ee7b7' }}>Juntos pelo Rio</strong> é um grupo de moradores comprometidos em melhorar a qualidade de vida das comunidades do estado. Cadastre-se e participe!
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 32, flexWrap: 'wrap' }}>
          {[
            { icon: '🤝', label: 'Ação Comunitária' },
            { icon: '🏗️', label: 'Melhorias de Infraestrutura' },
            { icon: '🛡️', label: 'Mais Segurança' },
          ].map(item => (
            <div key={item.label} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.85)' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{item.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px 60px' }}>

        {/* Steps Indicator */}
        {step !== 'sucesso' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', padding: '32px 0 24px' }}>
            {['Seus Dados', 'Pesquisa'].map((s, i) => (
              <React.Fragment key={s}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: (step === 'form' && i === 0) || (step === 'perguntas' && i === 1)
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : (step === 'perguntas' && i === 0) ? '#059669' : '#e2e8f0',
                    color: (step === 'form' && i === 0) || (step === 'perguntas' && i === 1) || (step === 'perguntas' && i === 0)
                      ? 'white' : '#94a3b8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, flexShrink: 0, transition: 'all 0.3s',
                  }}>
                    {step === 'perguntas' && i === 0 ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{s}</span>
                </div>
                {i < 1 && <div style={{ width: 40, height: 2, background: '#e2e8f0', borderRadius: 2 }} />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* STEP 1: Form */}
        {step === 'form' && (
          <div style={{ background: 'white', borderRadius: 20, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Seus dados pessoais</h2>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28 }}>
              Campos com <span style={{ color: '#ef4444' }}>*</span> são obrigatórios. Seus dados são confidenciais.
            </p>

            <form onSubmit={handleNextStep}>
              {/* Nome */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Nome Completo *</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input style={{ ...inputStyle, paddingLeft: 42 }} placeholder="Seu nome completo" value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })} />
                </div>
                {fieldError('nome')}
              </div>

              {/* CPF */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>CPF *</label>
                <div style={{ position: 'relative' }}>
                  <FileText size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input style={{ ...inputStyle, paddingLeft: 42 }} placeholder="000.000.000-00" value={formData.cpf}
                    onChange={e => setFormData({ ...formData, cpf: e.target.value })} />
                </div>
                {fieldError('cpf')}
              </div>

              {/* WhatsApp */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>WhatsApp *</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input style={{ ...inputStyle, paddingLeft: 42 }} placeholder="(21) 99999-9999" value={formData.whatsapp}
                    onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} />
                </div>
                {fieldError('whatsapp')}
              </div>

              {/* Instagram */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Instagram *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 16 }}>@</span>
                  <input style={{ ...inputStyle, paddingLeft: 36 }} placeholder="seu_instagram" value={formData.instagram}
                    onChange={e => setFormData({ ...formData, instagram: e.target.value })} />
                </div>
                {fieldError('instagram')}
              </div>

              {/* CEP + Endereço */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={labelStyle}>CEP *</label>
                  <div style={{ position: 'relative' }}>
                    <Hash size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input style={{ ...inputStyle, paddingLeft: 42 }} placeholder="00000-000" value={formData.cep}
                      onChange={e => {
                        setFormData({ ...formData, cep: e.target.value });
                        buscarCep(e.target.value);
                      }} />
                    {cepLoading && <Loader2 size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} className="animate-spin" />}
                  </div>
                  {fieldError('cep')}
                </div>
                <div>
                  <label style={labelStyle}>Endereço * {cepLoading ? '(buscando...)' : ''}</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input style={{ ...inputStyle, paddingLeft: 42 }} placeholder="Rua, Bairro - Cidade/UF" value={formData.endereco}
                      onChange={e => setFormData({ ...formData, endereco: e.target.value })} />
                  </div>
                  {fieldError('endereco')}
                </div>
              </div>

              {/* Dados eleitorais opcionais */}
              <div style={{
                background: '#f0fdf4', borderRadius: 12, padding: 20,
                border: '1px dashed #86efac', marginBottom: 24,
              }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#15803d', marginBottom: 16 }}>
                  📋 Dados do Título de Eleitor (opcional — pode ser preenchido depois)
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 11 }}>Nº do Título</label>
                    <input style={{ ...inputStyle, padding: '10px 12px', fontSize: 13 }} placeholder="000000000000"
                      value={formData.titulo_eleitor} onChange={e => setFormData({ ...formData, titulo_eleitor: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 11 }}>Zona Eleitoral</label>
                    <input style={{ ...inputStyle, padding: '10px 12px', fontSize: 13 }} placeholder="001"
                      value={formData.zona_eleitoral} onChange={e => setFormData({ ...formData, zona_eleitoral: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 11 }}>Seção</label>
                    <input style={{ ...inputStyle, padding: '10px 12px', fontSize: 13 }} placeholder="0001"
                      value={formData.secao_eleitoral} onChange={e => setFormData({ ...formData, secao_eleitoral: e.target.value })} />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-green">
                Avançar para a pesquisa <ChevronRight size={20} />
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: Pesquisa */}
        {step === 'perguntas' && (
          <div style={{ background: 'white', borderRadius: 20, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Pesquisa da Comunidade</h2>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28 }}>
              Sua opinião vai ajudar a identificar as principais necessidades do seu bairro.
            </p>

            <form onSubmit={handleSubmit}>
              <StarRating
                label="1. Como você avalia as condições das ruas e calçadas do seu bairro?"
                value={pesquisa.nota_ruas}
                onChange={v => setPesquisa({ ...pesquisa, nota_ruas: v })}
              />
              <StarRating
                label="2. Como está a iluminação pública na sua região?"
                value={pesquisa.nota_iluminacao}
                onChange={v => setPesquisa({ ...pesquisa, nota_iluminacao: v })}
              />
              <StarRating
                label="3. Como você avalia a segurança pública na sua área?"
                value={pesquisa.nota_seguranca}
                onChange={v => setPesquisa({ ...pesquisa, nota_seguranca: v })}
              />
              <StarRating
                label="4. Como são os serviços de saúde (postos, UPAs) na sua região?"
                value={pesquisa.nota_saude}
                onChange={v => setPesquisa({ ...pesquisa, nota_saude: v })}
              />

              {/* Pergunta 5 - Multipla escolha */}
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: 15, fontWeight: 500, color: '#1e293b', marginBottom: 14, lineHeight: 1.5 }}>
                  5. Qual a principal necessidade da sua comunidade hoje?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    '🏗️ Melhoria de ruas e pavimentação',
                    '💡 Iluminação pública',
                    '🛡️ Mais segurança e policiamento',
                    '🏥 Mais acesso à saúde',
                    '📚 Educação e cursos profissionalizantes',
                    '🌳 Praças, parques e áreas de lazer',
                    '🚌 Transporte público melhor',
                    '💧 Saneamento básico e água tratada',
                  ].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      className={`choice-btn ${pesquisa.necessidade_principal === opt ? 'active' : ''}`}
                      onClick={() => setPesquisa({ ...pesquisa, necessidade_principal: opt })}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={() => setStep('form')} style={{
                  flex: '0 0 auto', padding: '16px 20px', borderRadius: 14,
                  border: '2px solid #e2e8f0', background: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: '#475569',
                  fontSize: 15,
                }}>
                  <ChevronLeft size={20} /> Voltar
                </button>
                <button type="submit" className="btn-green" disabled={submitting}>
                  {submitting ? <><Loader2 size={18} className="animate-spin" /> Enviando...</> : '✅ Concluir Cadastro'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: Sucesso */}
        {step === 'sucesso' && (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', boxShadow: '0 12px 40px rgba(16,185,129,0.4)',
            }}>
              <CheckCircle size={52} color="white" strokeWidth={2.5} />
            </div>

            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#064e3b', marginBottom: 12 }}>
              Cadastro realizado! 🎉
            </h2>
            <p style={{ fontSize: 16, color: '#374151', marginBottom: 8, lineHeight: 1.6 }}>
              Bem-vindo(a) ao <strong>Juntos pelo Rio</strong>!<br />
              Seu cadastro foi recebido com sucesso.
            </p>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 36, lineHeight: 1.6 }}>
              Em breve um membro da nossa equipe entrará em contato pelo seu WhatsApp para apresentar as próximas ações da comunidade.
            </p>

            <div style={{
              background: '#f0fdf4', borderRadius: 16, padding: 24,
              border: '1px solid #bbf7d0', maxWidth: 400, margin: '0 auto 32px',
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#15803d', marginBottom: 16 }}>
                🙌 Indique seus amigos e vizinhos!
              </p>
              <p style={{ fontSize: 13, color: '#374151', marginBottom: 16, lineHeight: 1.5 }}>
                Cada pessoa que você trouxer para o grupo fortalece ainda mais nossa comunidade.
              </p>
              <button
                onClick={() => navigator.share ? navigator.share({ title: 'Juntos pelo Rio', url: window.location.href }) : navigator.clipboard.writeText(window.location.href)}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white', border: 'none', padding: '12px 24px',
                  borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Compartilhar este link 📲
              </button>
            </div>

            <div style={{
              background: 'white', borderRadius: 16, padding: 20,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)', maxWidth: 400, margin: '0 auto',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: '🤝', text: 'Participar de reuniões e ações da comunidade' },
                  { icon: '📢', text: 'Receber novidades e informações importantes' },
                  { icon: '🏆', text: 'Ajudar a construir um Rio melhor para todos' },
                ].map(item => (
                  <div key={item.text} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', textAlign: 'left' }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center', padding: '24px', borderTop: '1px solid #e2e8f0',
        background: 'white', fontSize: 12, color: '#94a3b8',
      }}>
        © 2024 Juntos pelo Rio · Todos os direitos reservados<br />
        <span style={{ fontSize: 11 }}>Seus dados são protegidos e não serão compartilhados com terceiros</span>
      </div>
    </div>
  );
};

export default LandingConvite;
