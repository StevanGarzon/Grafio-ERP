import { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signInWithEmail(email, password);
        if (error) { setError(error); } else { navigate('/'); }
      } else if (mode === 'register') {
        const { error } = await signUpWithEmail(email, password, name);
        if (error) { setError(error); }
        else { setSuccess('Conta criada! Verifique seu e-mail para confirmar.'); }
      } else {
        const { error } = await resetPassword(email);
        if (error) { setError(error); }
        else { setSuccess('E-mail de recuperação enviado! Verifique sua caixa de entrada.'); }
      }
    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background Effects */}
      <div className="login-bg">
        <div className="login-bg-orb login-bg-orb-1" />
        <div className="login-bg-orb login-bg-orb-2" />
        <div className="login-bg-orb login-bg-orb-3" />
        <div className="login-bg-grid" />
      </div>

      <div className="login-container animate-scale-in">
        {/* Logo / Brand */}
        <div className="login-brand">
          <div className="login-logo">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="10" fill="url(#logo-grad)" />
              <path d="M12 14h16v3H12zM12 20h10v3H12zM12 26h14v3H12z" fill="white" fillOpacity="0.9"/>
              <defs>
                <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="40">
                  <stop stopColor="#3366ff" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="login-title">GRAFIO</h1>
          <p className="login-subtitle">ERP para Comunicação Visual</p>
        </div>

        {/* Form Card */}
        <div className="login-card">
          <h2 className="login-card-title">
            {mode === 'login' && 'Bem-vindo de volta'}
            {mode === 'register' && 'Criar sua conta'}
            {mode === 'forgot' && 'Recuperar senha'}
          </h2>
          <p className="login-card-desc">
            {mode === 'login' && 'Acesse sua conta para continuar'}
            {mode === 'register' && 'Preencha os dados para começar'}
            {mode === 'forgot' && 'Informe seu e-mail para recuperar'}
          </p>

          {/* Google OAuth */}
          {mode !== 'forgot' && (
            <div className="login-oauth-section">
              <button className="login-google-btn" onClick={signInWithGoogle} type="button">
                <div className="google-icon-wrapper">
                  <svg width="20" height="20" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                </div>
                <span>Continuar com Google</span>
              </button>
              <div className="login-divider">
                <span>ou entrar com e-mail</span>
              </div>
            </div>
          )}

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {mode === 'register' && (
              <div className="input-group">
                <label className="input-label" htmlFor="name">Nome completo</label>
                <input
                  id="name" type="text" className="input" placeholder="Seu nome"
                  value={name} onChange={(e) => setName(e.target.value)} required
                />
              </div>
            )}

            <div className="input-group">
              <label className="input-label" htmlFor="email">E-mail</label>
              <input
                id="email" type="email" className="input" placeholder="seu@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required
              />
            </div>

            {mode !== 'forgot' && (
              <div className="input-group">
                <label className="input-label" htmlFor="password">Senha</label>
                <input
                  id="password" type="password" className="input" placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  required minLength={6}
                />
              </div>
            )}

            {error && <div className="login-alert login-alert-error">{error}</div>}
            {success && <div className="login-alert login-alert-success">{success}</div>}

            <button type="submit" className="btn btn-primary btn-lg login-submit" disabled={loading}>
              {loading && <span className="spinner spinner-sm" />}
              {mode === 'login' && 'Entrar'}
              {mode === 'register' && 'Criar conta'}
              {mode === 'forgot' && 'Enviar link'}
            </button>
          </form>

          {/* Toggle Actions */}
          <div className="login-footer">
            {mode === 'login' && (
              <>
                <button className="login-link" onClick={() => { setMode('forgot'); setError(null); setSuccess(null); }}>
                  Esqueceu a senha?
                </button>
                <span className="login-footer-text">
                  Não tem conta?{' '}
                  <button className="login-link" onClick={() => { setMode('register'); setError(null); setSuccess(null); }}>
                    Criar conta
                  </button>
                </span>
              </>
            )}
            {mode === 'register' && (
              <span className="login-footer-text">
                Já tem conta?{' '}
                <button className="login-link" onClick={() => { setMode('login'); setError(null); setSuccess(null); }}>
                  Fazer login
                </button>
              </span>
            )}
            {mode === 'forgot' && (
              <button className="login-link" onClick={() => { setMode('login'); setError(null); setSuccess(null); }}>
                ← Voltar para o login
              </button>
            )}
          </div>
        </div>

        <p className="login-legal">
          © 2026 GRAFIO. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
