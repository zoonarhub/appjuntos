import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CheckCircle, HeartHandshake } from 'lucide-react';
import BairroSelect from '../../components/ui/BairroSelect';
import { saveWithOfflineFallback } from '../../lib/offlineHelper';

const ConviteCoordenador: React.FC = () => {
  const { indicadoId } = useParams();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '', cpf: '', whatsapp: '', instagram: '',
    cep: '', endereco: '', bairro: '', regiao: 'Rio de Janeiro', tipo: 'Regional'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const payload = {
        nome: formData.nome,
        cpf: formData.cpf.replace(/\D/g, ''),
        whatsapp: formData.whatsapp,
        bairro: formData.bairro,
        regiao: formData.regiao,
        municipio: 'Rio de Janeiro',
        tipo: `Coordenador ${formData.tipo}`,
        indicado_por: indicadoId || 'Admin',
        meta: formData.tipo === 'Geral' ? 500 : formData.tipo === 'Regional' ? 250 : 100,
        votos: 0,
        status: 'ativo'
      };

      const result = await saveWithOfflineFallback('coordenadores', payload);

      if (!result.success) {
        if (result.error?.includes('23505') || result.error?.toLowerCase().includes('unique')) {
          alert('Este CPF já está cadastrado conosco.');
        } else {
          console.error('Erro ao inserir coordenador:', result.error);
          alert('Erro ao enviar: ' + result.error);
        }
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      console.error('Erro inesperado:', err);
      alert('Erro inesperado ao salvar. Tente novamente.');
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
            Bem-vindo(a) como <strong>Coordenador(a)</strong> do Juntos pelo Rio. Entraremos em contato pelo WhatsApp para te orientar sobre os próximos passos e metas.
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
        <HeartHandshake size={32} color="#10B981" />
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>Juntos pelo Rio</h1>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ maxWidth: 500, width: '100%', background: '#161822', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
          
          <div style={{ padding: '32px 32px 0' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: '#fff' }}>Seja um Coordenador</h2>
            <p style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1.5 }}>
              Sua liderança faz a diferença. Junte-se a nós para mobilizar o estado e trazer melhorias reais para o Rio de Janeiro.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9CA3AF', marginBottom: 6 }}>NOME COMPLETO *</label>
                <input required name="nome" value={formData.nome} onChange={handleChange} style={{ width: '100%', background: '#0B0C10', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 10, color: '#fff', outline: 'none' }} placeholder="Seu nome" />
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
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9CA3AF', marginBottom: 6 }}>INSTAGRAM</label>
                  <input name="instagram" value={formData.instagram} onChange={handleChange} style={{ width: '100%', background: '#0B0C10', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 10, color: '#fff', outline: 'none' }} placeholder="@seu_perfil" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9CA3AF', marginBottom: 6 }}>TIPO DE COORDENADOR *</label>
                <select required name="tipo" value={formData.tipo} onChange={handleChange} style={{ width: '100%', background: '#0B0C10', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 10, color: '#fff', outline: 'none' }}>
                  <option value="Municipal">Municipal</option>
                  <option value="Regional">Regional</option>
                  <option value="Geral">Geral</option>
                </select>
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
                    municipality={formData.regiao || 'Rio de Janeiro'}
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

              <button type="submit" disabled={submitting} style={{ width: '100%', background: '#10B981', color: '#fff', border: 'none', padding: '14px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', marginTop: 16, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Enviando...' : 'Finalizar Cadastro de Coordenador'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConviteCoordenador;
