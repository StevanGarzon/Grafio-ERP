import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Send, MessageSquare, ShieldCheck } from 'lucide-react';
import { artApprovalService } from '../services/artApprovalService';
import './ClienteAprovacaoPage.css';

export default function ClienteAprovacaoPage() {
  const { token } = useParams();
  const [art, setArt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState<'approved' | 'rejected' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!token) return;
    
    const loadArt = async () => {
      try {
        const data = await artApprovalService.getByToken(token);
        setArt(data);
      } catch (err) {
        console.error('Erro ao carregar arte:', err);
      } finally {
        setLoading(false);
      }
    };

    loadArt();
  }, [token]);

  const handleSubmit = async () => {
    if (!response || !token) return;
    setSubmitting(true);
    try {
      await artApprovalService.respond(token, response, feedback);
      setCompleted(true);
    } catch (err) {
      alert('Erro ao enviar resposta. Tente novamente.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="public-loading"><div className="spinner"></div><p>Carregando arte...</p></div>;

  if (completed) {
    return (
      <div className="public-container animate-fade-in">
        <div className="card public-card success-card">
          <div className="success-icon-wrap">
            <CheckCircle2 size={64} />
          </div>
          <h1>{response === 'approved' ? 'Arte Aprovada!' : 'Solicitação Enviada!'}</h1>
          <p>{response === 'approved' 
              ? 'Sua aprovação foi registrada com sucesso. Já enviamos para nossa equipe de produção!' 
              : 'Recebemos suas solicitações de ajuste. Nossa equipe de design fará as alterações e enviará um novo link em breve.'}
          </p>
          <div className="divider"></div>
          <p className="text-sm text-secondary">Você já pode fechar esta aba.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-container animate-fade-in">
      <header className="public-header">
        <div className="public-logo">GRAFIO</div>
        <div className="public-status">
          <ShieldCheck size={16} /> Link Seguro de Aprovação
        </div>
      </header>

      <main className="public-content">
        <div className="art-display-card card">
          <div className="art-header">
            <div>
              <h1 className="art-title">{art.title}</h1>
              <p className="art-subtitle">Enviado por: <strong>{art.company.name}</strong></p>
            </div>
          </div>
          
          <div className="art-image-container">
            <img src={art.image_url} alt="Arte para Aprovação" />
          </div>

          {art.description && (
            <div className="art-notes">
              <div className="notes-label"><MessageSquare size={14}/> Instruções da Gráfica:</div>
              <p>{art.description}</p>
            </div>
          )}
        </div>

        <div className="approval-actions-card card">
          <h2 className="action-title">Sua Resposta</h2>
          <p className="action-subtitle">Confira todos os detalhes antes de decidir.</p>
          
          <div className="action-buttons">
            <button 
              className={`action-btn approve ${response === 'approved' ? 'active' : ''}`}
              onClick={() => { setResponse('approved'); setFeedback(''); }}
            >
              <CheckCircle2 size={24} />
              <div>
                <strong>Aprovar Arte</strong>
                <span>Tudo certo, pode produzir</span>
              </div>
            </button>

            <button 
              className={`action-btn reject ${response === 'rejected' ? 'active' : ''}`}
              onClick={() => setResponse('rejected')}
            >
              <AlertCircle size={24} />
              <div>
                <strong>Solicitar Ajustes</strong>
                <span>Preciso mudar algo</span>
              </div>
            </button>
          </div>

          {response === 'rejected' && (
            <div className="feedback-area animate-fade-in">
              <label className="input-label">O que você gostaria de alterar? *</label>
              <textarea 
                className="input" 
                rows={4} 
                placeholder="Ex: Mudar o telefone para (11) 99999-8888 e trocar o fundo para azul escuro."
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
              ></textarea>
            </div>
          )}

          <button 
            className="btn btn-primary submit-btn" 
            disabled={!response || (response === 'rejected' && !feedback) || submitting}
            onClick={handleSubmit}
            style={{ 
              background: response === 'approved' ? 'var(--success-600)' : response === 'rejected' ? 'var(--danger-500)' : 'var(--primary-600)',
              width: '100%',
              marginTop: '1.5rem',
              height: '56px',
              fontSize: '1rem'
            }}
          >
            {submitting ? <div className="spinner spinner-sm"></div> : <><Send size={18}/> Enviar Resposta Formal</>}
          </button>
          
          <p className="disclaimer">
            Ao clicar em Aprovar, você declara que conferiu todos os textos e detalhes da arte.
          </p>
        </div>
      </main>

      <footer className="public-footer">
        Gerado por GRAFIO ERP — Sistema de Gestão para Comunicação Visual
      </footer>
    </div>
  );
}
