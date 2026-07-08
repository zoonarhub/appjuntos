import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { MapPin, Eye, EyeOff, Sun, Moon, Shield } from 'lucide-react';

export default function Login() {
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const { dbUser, signIn, updatePassword, theme, toggleTheme } = useAuth();

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (dbUser?.status_acesso && !dbUser?.senha_temporaria) {
    return <Navigate to="/" replace />;
  }

  const formatCPF = (val: string) => {
    return val
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn(cpf, senha);

    if (result.error === 'PENDING') {
      setIsPending(true);
    } else if (result.error === 'CHANGE_PASSWORD') {
      setIsChangingPassword(true);
    } else if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    setError('');
    
    const result = await updatePassword(newPassword);
    
    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  const isDark = theme === 'dark';

  if (isPending) {
    return (
      <div className={`login-bg ${isDark ? 'dark' : 'light'}`}>
        <button onClick={toggleTheme} className="theme-toggle-btn">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="login-card">
          <div className="login-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
            <Shield size={32} className="text-white" />
          </div>
          <h2 className="login-title">Acesso Pendente</h2>
          <p className="login-subtitle">
            Seu cadastro foi realizado com sucesso! Aguarde a liberação pelo administrador do sistema.
          </p>
          <div className="pending-notice">
            <span>CPF registrado</span>
            <span className="font-bold">{cpf}</span>
          </div>
          <button onClick={() => setIsPending(false)} className="login-btn-secondary">
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  if (isChangingPassword) {
    return (
      <div className={`login-bg ${isDark ? 'dark' : 'light'}`}>
        <button onClick={toggleTheme} className="theme-toggle-btn">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="login-card">
          <div className="login-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Shield size={32} className="text-white" />
          </div>
          <h2 className="login-title">Nova Senha</h2>
          <p className="login-subtitle" style={{ marginBottom: 24 }}>
            Por segurança, crie uma nova senha para acessar o sistema.
          </p>
          
          <form onSubmit={handlePasswordChange} className="login-form">
            <div className="login-field">
              <label>Nova Senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo de 6 caracteres"
                required
                minLength={6}
                className="login-input"
              />
            </div>

            <div className="login-field">
              <label>Confirme a Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                required
                minLength={6}
                className="login-input"
              />
            </div>

            {error && (
              <div className="login-error">
                <span>⚠</span> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="login-btn-primary">
              {loading ? <span className="login-spinner" /> : 'Salvar e Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`login-bg ${isDark ? 'dark' : 'light'}`}>
      <button onClick={toggleTheme} className="theme-toggle-btn">
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Animated Background Blobs */}
      <div className="login-blob login-blob-1" />
      <div className="login-blob login-blob-2" />
      <div className="login-blob login-blob-3" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-icon">
          <MapPin size={32} className="text-white" />
        </div>

        <h1 className="login-title">Coordena Rio</h1>
        <p className="login-subtitle">CRM de Campanha Política • RJ</p>

        <form onSubmit={handleLogin} className="login-form">
          <div className="login-field">
            <label>CPF</label>
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(formatCPF(e.target.value))}
              placeholder="000.000.000-00"
              maxLength={14}
              required
              className="login-input"
            />
          </div>

          <div className="login-field">
            <label>Senha</label>
            <div className="login-password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                required
                className="login-input"
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error">
              <span>⚠</span> {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="login-btn-primary">
            {loading ? (
              <span className="login-spinner" />
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <p className="login-hint">
          Primeiro acesso? Use seu CPF e a senha <strong>123456</strong>
        </p>
      </div>

      <style>{`
        .login-bg {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          transition: background 0.4s;
        }
        .login-bg.dark {
          background: #030712;
          color: #f9fafb;
        }
        .login-bg.light {
          background: #f0f4ff;
          color: #111827;
        }
        .theme-toggle-btn {
          position: fixed;
          top: 20px;
          right: 24px;
          z-index: 100;
          border: none;
          cursor: pointer;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .dark .theme-toggle-btn {
          background: rgba(255,255,255,0.08);
          color: #fbbf24;
        }
        .light .theme-toggle-btn {
          background: rgba(0,0,0,0.06);
          color: #6366f1;
        }
        .theme-toggle-btn:hover { opacity: 0.8; transform: scale(1.05); }
        
        .login-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          animation: floatBlob 8s ease-in-out infinite alternate;
        }
        .login-blob-1 { width: 400px; height: 400px; top: -100px; left: -100px; }
        .login-blob-2 { width: 300px; height: 300px; bottom: -80px; right: -60px; animation-delay: -3s; }
        .login-blob-3 { width: 250px; height: 250px; top: 50%; left: 50%; transform: translate(-50%,-50%); animation-delay: -5s; }
        .dark .login-blob-1 { background: rgba(99,102,241,0.18); }
        .dark .login-blob-2 { background: rgba(0,229,255,0.12); }
        .dark .login-blob-3 { background: rgba(139,92,246,0.10); }
        .light .login-blob-1 { background: rgba(99,102,241,0.15); }
        .light .login-blob-2 { background: rgba(14,165,233,0.12); }
        .light .login-blob-3 { background: rgba(139,92,246,0.08); }
        @keyframes floatBlob {
          from { transform: scale(1) translate(0,0); }
          to { transform: scale(1.08) translate(20px,30px); }
        }
        
        .login-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
          padding: 44px 40px 36px;
          border-radius: 24px;
          text-align: center;
          backdrop-filter: blur(24px);
          transition: background 0.4s, border-color 0.4s, box-shadow 0.4s;
          animation: slideUp 0.5s ease-out;
        }
        .dark .login-card {
          background: rgba(17,24,39,0.85);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03);
        }
        .light .login-card {
          background: rgba(255,255,255,0.9);
          border: 1px solid rgba(99,102,241,0.15);
          box-shadow: 0 32px 80px rgba(99,102,241,0.12), 0 0 0 1px rgba(255,255,255,0.5);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .login-icon {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          background: linear-gradient(135deg, #2b5cff, #00e5ff);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          box-shadow: 0 12px 40px rgba(43,92,255,0.4);
        }
        .login-icon svg { color: white; }
        
        .login-title {
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin-bottom: 6px;
        }
        .dark .login-title { color: #f9fafb; }
        .light .login-title { color: #111827; }
        
        .login-subtitle {
          font-size: 13px;
          margin-bottom: 32px;
        }
        .dark .login-subtitle { color: rgba(249,250,251,0.45); }
        .light .login-subtitle { color: rgba(17,24,39,0.5); }
        
        .login-form { text-align: left; display: flex; flex-direction: column; gap: 18px; }
        
        .login-field { display: flex; flex-direction: column; gap: 7px; }
        .login-field label {
          font-size: 13px;
          font-weight: 600;
        }
        .dark .login-field label { color: rgba(249,250,251,0.7); }
        .light .login-field label { color: rgba(17,24,39,0.7); }
        
        .login-input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 15px;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .dark .login-input {
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          color: #f9fafb;
        }
        .dark .login-input::placeholder { color: rgba(249,250,251,0.25); }
        .dark .login-input:focus {
          border-color: #4f7eff;
          background: rgba(79,126,255,0.06);
          box-shadow: 0 0 0 3px rgba(79,126,255,0.12);
        }
        .light .login-input {
          background: #fff;
          border: 1.5px solid rgba(99,102,241,0.2);
          color: #111827;
        }
        .light .login-input::placeholder { color: rgba(17,24,39,0.3); }
        .light .login-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }
        
        .login-password-wrapper { position: relative; }
        .login-password-wrapper .login-input { padding-right: 48px; }
        .login-eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .dark .login-eye-btn { color: rgba(249,250,251,0.4); }
        .dark .login-eye-btn:hover { color: #f9fafb; }
        .light .login-eye-btn { color: rgba(17,24,39,0.4); }
        .light .login-eye-btn:hover { color: #111827; }
        
        .login-error {
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .dark .login-error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #fca5a5; }
        .light .login-error { background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.2); color: #dc2626; }
        
        .login-btn-primary {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          background: linear-gradient(135deg, #2b5cff 0%, #4f9eff 100%);
          color: white;
          letter-spacing: 0.2px;
          transition: all 0.2s;
          box-shadow: 0 8px 24px rgba(43,92,255,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 4px;
        }
        .login-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 32px rgba(43,92,255,0.45);
        }
        .login-btn-primary:active { transform: translateY(0); }
        .login-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .login-btn-secondary {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 8px;
        }
        .dark .login-btn-secondary { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); color: #d1d5db; }
        .dark .login-btn-secondary:hover { background: rgba(255,255,255,0.12); }
        .light .login-btn-secondary { background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.15); color: #4f46e5; }
        .light .login-btn-secondary:hover { background: rgba(99,102,241,0.12); }
        
        .login-hint {
          margin-top: 24px;
          font-size: 12px;
          text-align: center;
        }
        .dark .login-hint { color: rgba(249,250,251,0.3); }
        .dark .login-hint strong { color: rgba(249,250,251,0.55); }
        .light .login-hint { color: rgba(17,24,39,0.4); }
        .light .login-hint strong { color: rgba(17,24,39,0.65); }
        
        .pending-notice {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 16px;
          border-radius: 12px;
          margin: 20px 0;
          font-size: 13px;
        }
        .dark .pending-notice { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); color: #fde68a; }
        .light .pending-notice { background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25); color: #92400e; }
        
        .login-spinner {
          width: 20px; height: 20px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
