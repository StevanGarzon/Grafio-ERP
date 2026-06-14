import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, CheckCircle2, Printer, User, Calendar, Clock, AlertTriangle, FileText, Tag } from 'lucide-react';
import { osService, type ServiceOrder } from '../services/osService';
import './OrdemServicoViewPage.css';

export default function OrdemServicoViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await osService.getServiceOrderById(id);
        setOrder(data);
      } catch (err) {
        console.error('Erro ao carregar O.S.:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;
  if (!order) return (
    <div className="page-container">
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p>Ordem de Serviço não encontrada.</p>
        <button className="btn btn-primary mt-4" onClick={() => navigate('/ordens-servico')}>Voltar para Lista</button>
      </div>
    </div>
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="badge badge-neutral">Fila de Espera</span>;
      case 'production': return <span className="badge badge-primary">Em Produção</span>;
      case 'finishing': return <span className="badge badge-warning">Acabamento</span>;
      case 'ready': return <span className="badge badge-success">Pronto p/ Retirada</span>;
      case 'delivered': return <span className="badge badge-neutral">Entregue</span>;
      case 'cancelled': return <span className="badge badge-danger">Cancelado</span>;
      default: return <span className="badge badge-neutral">{status}</span>;
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header print-hide">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-ghost btn-icon" onClick={() => navigate('/ordens-servico')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">O.S. #{String(order.number).padStart(5, '0')}</h1>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              {getStatusBadge(order.status)}
              <span className={`badge ${order.priority === 'urgent' ? 'badge-danger' : 'badge-neutral'}`}>
                Prioridade: {order.priority.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={16} /> Imprimir Produção
          </button>
          <button className="btn btn-secondary" onClick={() => navigate(`/ordens-servico/${order.id}/editar`)}>
            <Edit size={16} /> Editar O.S.
          </button>
          {order.status === 'pending' && (
            <button className="btn btn-primary" onClick={() => navigate('/producao')}>
              Iniciar Produção
            </button>
          )}
        </div>
      </div>

      <div className="view-grid">
        <div className="card print-card">
          {/* Header do Documento de Produção */}
          <div className="doc-header">
            <div className="doc-brand">
              <h2 className="doc-logo-text">GRAFIO</h2>
              <p className="doc-company-info">ORDEM DE SERVIÇO TÉCNICA</p>
            </div>
            <div className="doc-meta">
              <h2>O.S. #{String(order.number).padStart(5, '0')}</h2>
              <p><strong>Emissão:</strong> {new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
              <p><strong>Entrega:</strong> <span style={{ color: order.priority === 'urgent' ? 'red' : 'inherit', fontWeight: 'bold' }}>
                {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('pt-BR') : 'A COMBINAR'}
              </span></p>
            </div>
          </div>

          <div className="divider"></div>

          {/* Informações do Cliente */}
          <div className="doc-client">
            <h3 className="doc-section-title">Dados do Cliente</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><strong>{order.client?.name}</strong></p>
                <p>{order.client?.document}</p>
                <p>{order.client?.phone}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p><strong>Referência:</strong></p>
                <p>{order.description}</p>
                {order.quote && <p>Origem: Orçamento #{String(order.quote.number).padStart(5, '0')}</p>}
              </div>
            </div>
          </div>

          <div className="divider"></div>

          {/* Itens de Produção */}
          <div className="doc-items">
            <h3 className="doc-section-title">Itens e Especificações Técnicas</h3>
            <table className="doc-table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Item</th>
                  <th style={{ textAlign: 'center', width: '10%' }}>Qtd</th>
                  <th style={{ width: '60%' }}>Detalhes de Produção / Acabamento</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item: any) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.description}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ fontSize: '0.8125rem', whiteSpace: 'pre-wrap' }}>
                      {item.production_details || 'Sem detalhes específicos.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divider"></div>

          {/* Instruções e Observações */}
          <div className="doc-footer-grid">
            <div className="doc-notes">
              <h3 className="doc-section-title">Instruções para a Equipe</h3>
              <div className="notes-box">
                {order.internal_notes || 'Nenhuma instrução adicional.'}
              </div>
            </div>
            <div className="doc-signatures">
              <div className="signature-line">
                <p>Responsável Produção</p>
              </div>
              <div className="signature-line" style={{ marginTop: '3rem' }}>
                <p>Conferência Final</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info - Hidden on Print */}
        <div className="view-sidebar print-hide">
          <div className="card mb-4">
            <h3 className="card-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} /> Linha do Tempo
            </h3>
            <div className="timeline-mini">
              <div className="timeline-item-mini active">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <p className="timeline-title">O.S. Criada</p>
                  <p className="timeline-time">{new Date(order.created_at).toLocaleString('pt-BR')}</p>
                </div>
              </div>
              {/* More steps could be added here dynamically */}
            </div>
          </div>

          <div className="card">
            <h3 className="card-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Tag size={18} /> Orçamento Vinculado
            </h3>
            {order.quote ? (
              <button className="btn btn-secondary w-full" onClick={() => navigate(`/orcamentos/${order.quote_id}`)}>
                Ver Orçamento #{String(order.quote.number).padStart(5, '0')}
              </button>
            ) : (
              <p className="text-sm text-secondary">Venda direta (sem orçamento).</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
