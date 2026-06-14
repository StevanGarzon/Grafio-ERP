import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, FileText, MoreVertical, Calendar, User, DollarSign, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { quoteService, type Quote } from '../services/quoteService';
import './OrcamentosPage.css';

export default function OrcamentosPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState<string>('all');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadQuotes();
  }, [currentTab]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const data = await quoteService.getQuotes(currentTab === 'all' ? undefined : currentTab, searchTerm);
      setQuotes(data);
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadQuotes();
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      setLoading(true);
      await quoteService.updateQuoteStatus(id, newStatus as any);
      
      // AUTO-CREATE OS: If approved, generate the Service Order automatically
      if (newStatus === 'approved') {
        const { osService } = await import('../services/osService');
        await osService.convertQuoteToOS(id);
        alert('Orçamento Aprovado! Uma nova Ordem de Serviço foi gerada automaticamente.');
      }

      setQuotes(prev => prev.map(q => q.id === id ? { ...q, status: newStatus as any } : q));
      setActiveMenu(null);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'draft': return { label: 'Rascunho', color: 'var(--neutral-400)', bg: 'rgba(148,163,184,0.1)', icon: FileText };
      case 'sent': return { label: 'Enviado', color: 'var(--primary-400)', bg: 'rgba(51,102,255,0.1)', icon: Clock };
      case 'approved': return { label: 'Aprovado', color: 'var(--accent-400)', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle2 };
      case 'rejected': return { label: 'Rejeitado', color: 'var(--danger-400)', bg: 'rgba(244,63,94,0.1)', icon: XCircle };
      default: return { label: status, color: 'var(--neutral-400)', bg: 'transparent', icon: FileText };
    }
  };

  return (
    <div className="page-container animate-fade-in" onClick={() => setActiveMenu(null)}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Orçamentos</h1>
          <p className="page-subtitle">Crie e gerencie as propostas comerciais</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/orcamentos/novo')}>
          <Plus size={16} />
          Novo Orçamento
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button className={`tab-btn ${currentTab === 'all' ? 'active' : ''}`} onClick={() => setCurrentTab('all')}>Todos</button>
        <button className={`tab-btn ${currentTab === 'draft' ? 'active' : ''}`} onClick={() => setCurrentTab('draft')}>Rascunhos</button>
        <button className={`tab-btn ${currentTab === 'sent' ? 'active' : ''}`} onClick={() => setCurrentTab('sent')}>Enviados</button>
        <button className={`tab-btn ${currentTab === 'approved' ? 'active' : ''}`} onClick={() => setCurrentTab('approved')}>Aprovados</button>
        <button className={`tab-btn ${currentTab === 'rejected' ? 'active' : ''}`} onClick={() => setCurrentTab('rejected')}>Rejeitados</button>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <form className="search-bar" onSubmit={handleSearch}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por número ou cliente..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary btn-sm" style={{ marginLeft: '0.5rem' }}>Buscar</button>
          </form>
        </div>

        {loading ? (
          <div className="table-loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Orçamento</th>
                  <th>Cliente</th>
                  <th>Emissão</th>
                  <th>Valor Total</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {quotes.length > 0 ? (
                  quotes.map(quote => {
                    const statusDisplay = getStatusDisplay(quote.status);
                    const StatusIcon = statusDisplay.icon;
                    return (
                      <tr key={quote.id} className="table-row">
                        <td onClick={() => navigate(`/orcamentos/${quote.id}`)}>
                          <div className="font-mono font-bold" style={{ color: 'var(--primary-400)' }}>
                            #{String(quote.number).padStart(5, '0')}
                          </div>
                        </td>
                        <td onClick={() => navigate(`/orcamentos/${quote.id}`)}>
                          <div className="client-cell">
                            <div className="client-icon-wrap" style={{ background: 'var(--surface-app)', width: 32, height: 32 }}>
                              <User size={14} color="var(--text-tertiary)" />
                            </div>
                            <span className="font-medium">{quote.client?.name}</span>
                          </div>
                        </td>
                        <td onClick={() => navigate(`/orcamentos/${quote.id}`)}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                            <Calendar size={14} />
                            {new Date(quote.issue_date).toLocaleDateString('pt-BR')}
                          </div>
                        </td>
                        <td onClick={() => navigate(`/orcamentos/${quote.id}`)}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                            <DollarSign size={14} color="var(--text-tertiary)" />
                            {quote.total_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                        </td>
                        <td onClick={() => navigate(`/orcamentos/${quote.id}`)}>
                          <div className="badge" style={{ background: statusDisplay.bg, color: statusDisplay.color, padding: '4px 10px' }}>
                            <StatusIcon size={12} />
                            {statusDisplay.label}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', position: 'relative' }}>
                          <button 
                            className="btn-ghost btn-icon" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setActiveMenu(activeMenu === quote.id ? null : quote.id);
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {activeMenu === quote.id && (
                            <div className="dropdown-menu-custom">
                              <button onClick={() => navigate(`/orcamentos/${quote.id}`)}>Visualizar</button>
                              
                              <div className="dropdown-divider"></div>
                              <p className="dropdown-label">Mudar Status</p>
                              {quote.status !== 'sent' && <button onClick={() => handleStatusUpdate(quote.id, 'sent')}>Marcar Enviado</button>}
                              {quote.status !== 'approved' && <button onClick={() => handleStatusUpdate(quote.id, 'approved')} style={{ color: 'var(--accent-400)' }}>Aprovar</button>}
                              {quote.status !== 'rejected' && <button onClick={() => handleStatusUpdate(quote.id, 'rejected')} style={{ color: 'var(--danger-400)' }}>Recusar</button>}
                              
                              <div className="dropdown-divider"></div>
                              <button onClick={() => navigate(`/orcamentos/${quote.id}/editar`)}>Editar</button>
                              <button onClick={() => window.print()}>Imprimir</button>
                              <button className="delete" onClick={() => alert('Excluir #' + quote.number)}>Excluir</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="table-empty">Nenhum orçamento encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
