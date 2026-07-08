import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { MapPin, Phone, Shield, Heart, HeartHandshake, FileText, CheckCircle } from 'lucide-react';
import BairroSelect from '../../components/ui/BairroSelect';

const ConviteEleitor: React.FC = () => {
  const { indicadoId } = useParams();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '', cpf: '', whatsapp: '', instagram: '',
    cep: '', endereco: '', bairro: '', regiao: '',
    pergunta1: '', pergunta2: '', pergunta3: '', pergunta4: '', pergunta5: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => setStep(2);
  const handlePrev = () => setStep(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Create user entry
      const { error } = await supabase.from('eleitores').insert([{
        nome: formData.nome,
        cpf: formData.cpf.replace(/\D/g, ''),
        whatsapp: formData.whatsapp,
        instagram: formData.instagram,
        cep: formData.cep,
        endereco: formData.endereco,
        bairro: formData.bairro,
        regiao: formData.regiao,
        indicado_por: indicadoId || 'Orgânico',
        dados_extras: {
          melhoria_seguranca: formData.pergunta1,
          melhoria_infraestrutura: formData.pergunta2,
          melhoria_saude: formData.pergunta3,
          melhoria_educacao: formData.pergunta4,
          maior_desafio: formData.pergunta5,
        }
      }]);

      if (error) {
        if (error.code === '23505') {
          alert('Este CPF já está cadastrado conosco.');
        } else {
          alert('Erro ao enviar: ' + error.message);
        }
      } else {
        setSuccess(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f1016', color: '#fff' }}>
        <div style={{ maxWidth: 460, width: '90%', background: '#161822', padding: 40, borderRadius: 20, textAlign: 'center', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <CheckCircle size={64} color="#10B981" style={{ margin: '0 auto 20px' }} />
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Cadastro Realizado!</h1>
          <p style={{ color: '#9CA3AF', lineHeight: 1.6, marginBottom: 24 }}>
            Obrigado por se juntar ao <strong>Juntos pelo Rio</strong>. Sua voz é muito importante para nós. Juntos vamos construir um estado melhor para todos!
          </p>
          <a href="https://instagram.com/juntospelorio" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#EC4899', textDecoration: 'none', fontWeight: 600 }}>
            Siga nosso Instagram
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0f1016', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ padding: '20px', background: 'linear-gradient(90deg, #161822 0%, #1e1b4b 100%)', borderBottom: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <HeartHandshake size={32} color="#6366F1" />
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>Juntos pelo Rio</h1>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ maxWidth: 500, width: '100%', background: '#161822', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
          
          <div style={{ padding: '32px 32px 0' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: '#fff' }}>Faça parte do movimento</h2>
            <p style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1.5 }}>
              Somos um grupo que ajuda a população do Estado do Rio. Cadastre-se e nos conte o que precisa melhorar no seu bairro.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 32 }}>
            {step === 1 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9CA3AF', marginBottom: 6 }}>NOME COMPLETO *</label>
                  <input required name="nome" value={formData.nome} onChange={handleChange} style={{ width: '100%', background: '#0B0C10', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 10, color: '#fff', outline: 'none' }} placeholder="Como você se chama?" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9CA3AF', marginBottom: 6 }}>CPF *</label>
                  <input required name="cpf" value={formData.cpf} onChange={handleChange} style={{ width: '100%', background: '#0B0C10', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 10, color: '#fff', outline: 'none' }} placeholder="000.000.000-00" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9CA3AF', marginBottom: 6 }}>WHATSAPP *</label>
                    <input required name="whatsapp" value={formData.whatsapp} onChange={handleChange} style={{ width: '100%', background: '#0B0C10', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 10, color: '#fff', outline: 'none' }} placeholder="(00) 00000-0000" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9CA3AF', marginBottom: 6 }}>INSTAGRAM *</label>
                    <input required name="instagram" value={formData.instagram} onChange={handleChange} style={{ width: '100%', background: '#0B0C10', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 10, color: '#fff', outline: 'none' }} placeholder="@seu_perfil" />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9CA3AF', marginBottom: 6 }}>CEP *</label>
                  <input required name="cep" value={formData.cep} onChange={handleChange} style={{ width: '100%', background: '#0B0C10', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 10, color: '#fff', outline: 'none' }} placeholder="00000-000" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9CA3AF', marginBottom: 6 }}>ENDEREÇO *</label>
                  <input required name="endereco" value={formData.endereco} onChange={handleChange} style={{ width: '100%', background: '#0B0C10', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 10, color: '#fff', outline: 'none' }} placeholder="Rua, número, complemento" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9CA3AF', marginBottom: 6 }}>BAIRRO *</label>
                    <BairroSelect
                      value={formData.bairro}
                      onChange={(value) => setFormData({ ...formData, bairro: value })}
                      municipality="Rio de Janeiro"
                      required
                      className="form-input"
                      style={{ width: '100%', background: '#0B0C10', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 10, color: '#fff', outline: 'none' }}
                      placeholder="Seu bairro"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9CA3AF', marginBottom: 6 }}>REGIÃO / CIDADE *</label>
                    <input required name="regiao" value={formData.regiao} onChange={handleChange} style={{ width: '100%', background: '#0B0C10', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 10, color: '#fff', outline: 'none' }} placeholder="Rio de Janeiro" />
                  </div>
                </div>

                <button type="button" onClick={handleNext} style={{ width: '100%', background: '#6366F1', color: '#fff', border: 'none', padding: '14px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 16 }}>
                  Continuar
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9CA3AF', marginBottom: 6 }}>1. O QUE MAIS PRECISA MELHORAR NA SEGURANÇA DO SEU BAIRRO?</label>
                  <textarea required name="pergunta1" value={formData.pergunta1} onChange={handleChange} rows={2} style={{ width: '100%', background: '#0B0C10', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 10, color: '#fff', outline: 'none', resize: 'vertical' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9CA3AF', marginBottom: 6 }}>2. QUAIS OS PRINCIPAIS PROBLEMAS DE INFRAESTRUTURA?</label>
                  <textarea required name="pergunta2" value={formData.pergunta2} onChange={handleChange} rows={2} style={{ width: '100%', background: '#0B0C10', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 10, color: '#fff', outline: 'none', resize: 'vertical' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9CA3AF', marginBottom: 6 }}>3. COMO AVALIA A SAÚDE PÚBLICA NA SUA REGIÃO?</label>
                  <textarea required name="pergunta3" value={formData.pergunta3} onChange={handleChange} rows={2} style={{ width: '100%', background: '#0B0C10', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 10, color: '#fff', outline: 'none', resize: 'vertical' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9CA3AF', marginBottom: 6 }}>4. O QUE PODE SER FEITO PELA EDUCAÇÃO DAS CRIANÇAS/JOVENS?</label>
                  <textarea required name="pergunta4" value={formData.pergunta4} onChange={handleChange} rows={2} style={{ width: '100%', background: '#0B0C10', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 10, color: '#fff', outline: 'none', resize: 'vertical' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9CA3AF', marginBottom: 6 }}>5. QUAL O MAIOR DESAFIO DA SUA COMUNIDADE HOJE?</label>
                  <textarea required name="pergunta5" value={formData.pergunta5} onChange={handleChange} rows={2} style={{ width: '100%', background: '#0B0C10', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 10, color: '#fff', outline: 'none', resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  <button type="button" onClick={handlePrev} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', padding: '14px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                    Voltar
                  </button>
                  <button type="submit" disabled={submitting} style={{ flex: 2, background: '#10B981', color: '#fff', border: 'none', padding: '14px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                    {submitting ? 'Enviando...' : 'Finalizar Cadastro'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConviteEleitor;
