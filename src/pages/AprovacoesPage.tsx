import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ExternalLink, CheckCircle2, XCircle, Clock, Copy, Share2 } from 'lucide-react';
import { artApprovalService } from '../services/artApprovalService';
import './AprovacoesPage.css';

export default function AprovacoesPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const data = await artApprovalService.getApprovals(searchTerm);
      setApprovals(data);
    } catch (error) {
      console.error('Erro ao carregar aprovações:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (token: string) => {
    if (!token) {
      alert('Esta aprovação ainda não possui um link válido.');
      return;
    }
    const link = `${window.location.origin}/aprovacao/${token}`;
    navigator.clipboard.writeText(link);
    alert('Link de aprovação copiado!');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="badge badge-success"><CheckCircle2 size={12}/> Aprovada</span>;
      case 'rejected': return <span className="badge badge-danger"><XCircle size={12}/> Ajustes Solicitados</span>;
      default: return <span className="badge badge-warning"><Clock size={12}/> Aguardando</span>;
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Aprovação de Artes</h1>
          <p className="page-subtitle">Envie artes para aprovação do cliente e receba o aceite formal</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/aprovacoes/nova')}>
          <Plus size={16} />
          Nova Aprovação
        </button>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <form className="search-bar" onSubmit={e => { e.preventDefault(); loadApprovals(); }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por título ou cliente..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>
        </div>

        {loading ? (
          <div className="table-loading"><div className="spinner"></div></div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Arte / Título</th>
                  <th>Cliente</th>
                  <th>Data de Envio</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Compartilhar</th>
                </tr>
              </thead>
              <tbody>
                 {approvals.map(art => (
                  <tr key={art.id} className="table-row">
                    <td>
                      <div className="font-medium text-primary">{art.title}</div>
                      <div className="text-xs text-secondary mt-1">ID: {art.id.slice(0,8)}</div>
                      {art.status === 'rejected' && art.client_feedback && (
                        <div style={{ 
                          marginTop: '0.75rem', 
                          padding: '0.75rem', 
                          background: 'rgba(245, 158, 11, 0.1)', 
                          borderLeft: '3px solid #f59e0b',
                          borderRadius: '4px',
                          fontSize: '0.8125rem',
                          color: '#b45309'
                        }}>
                          <strong>Ajuste solicitado:</strong> "{art.client_feedback}"
                        </div>
                      )}
                    </td>
                    <td><span className="text-sm">{art.client?.name}</span></td>
                    <td><span className="text-sm text-secondary">{new Date(art.created_at).toLocaleDateString('pt-BR')}</span></td>
                    <td>{getStatusBadge(art.status)}</td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => copyLink(art.token)} title="Copiar Link">
                          <Copy size={14} />
                        </button>
                        <button className="btn btn-sm btn-secondary" onClick={() => window.open(`/aprovacao/${art.token}`, '_blank')} title="Visualizar como Cliente">
                          <ExternalLink size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
