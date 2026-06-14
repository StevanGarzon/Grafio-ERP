import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, CheckCircle2, Download, Send, Printer, User, Building, MapPin } from 'lucide-react';
import { quoteService } from '../services/quoteService';
import { osService } from '../services/osService';
import './OrcamentoViewPage.css';

export default function OrcamentoViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await quoteService.getQuoteById(id);
        setQuote(data);
      } catch (err) {
        console.error('Erro ao carregar orçamento:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;
  if (!quote) return (
    <div className="page-container">
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p>Orçamento não encontrado.</p>
        <button className="btn btn-primary mt-4" onClick={() => navigate('/orcamentos')}>Voltar para Lista</button>
      </div>
    </div>
  );

  const handleApprove = async () => {
    try {
      setLoading(true);
      await quoteService.updateQuoteStatus(id!, 'approved');
      await osService.convertQuoteToOS(id!);
      setQuote({ ...quote, status: 'approved' });
      alert('Orçamento aprovado e Ordem de Serviço gerada com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao aprovar orçamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header print-hide">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-ghost btn-icon" onClick={() => navigate('/orcamentos')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">Orçamento #{String(quote.number).padStart(5, '0')}</h1>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span className={`badge ${quote.status === 'approved' ? 'badge-success' : quote.status === 'sent' ? 'badge-primary' : 'badge-neutral'}`}>
                {quote.status.toUpperCase()}
              </span>
              <span className="badge badge-neutral">Emitido: {new Date(quote.issue_date).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={16} /> Imprimir / PDF
          </button>
          <button className="btn btn-secondary">
            <Send size={16} /> Enviar p/ Cliente
          </button>
          {quote.status !== 'approved' && (
            <button className="btn btn-primary" onClick={handleApprove} style={{ background: 'var(--accent-500)' }}>
              <CheckCircle2 size={16} /> Aprovar Orçamento
            </button>
          )}
        </div>
      </div>

      <div className="view-grid">
        <div className="card print-card">
          {/* Header do Documento */}
          <div className="doc-header">
            <div className="doc-brand">
              <h2 className="doc-logo-text">GRAFIO</h2>
              <p className="doc-company-info">Sua Empresa de Comunicação Visual<br/>CNPJ: 00.000.000/0001-00</p>
            </div>
            <div className="doc-meta">
              <h2>ORÇAMENTO</h2>
              <p><strong>Nº:</strong> {String(quote.number).padStart(5, '0')}</p>
              <p><strong>Data:</strong> {new Date(quote.issue_date).toLocaleDateString('pt-BR')}</p>
              <p><strong>Validade:</strong> {new Date(quote.valid_until).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <div className="divider"></div>

          {/* Dados do Cliente */}
          <div className="doc-client">
            <h3 className="doc-section-title">Dados do Cliente</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><strong>{quote.client.name}</strong></p>
                <p>{quote.client.type === 'PJ' ? 'CNPJ:' : 'CPF:'} {quote.client.document}</p>
                <p>{quote.client.email} | {quote.client.phone}</p>
              </div>
              <div>
                {quote.client.addresses?.[0] && (
                  <>
                    <p><strong>Endereço:</strong></p>
                    <p>{quote.client.addresses[0].street}, {quote.client.addresses[0].number}</p>
                    <p>{quote.client.addresses[0].city} - {quote.client.addresses[0].state}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="divider"></div>

          {/* Itens */}
          <div className="doc-items">
            <h3 className="doc-section-title">Itens do Orçamento</h3>
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th style={{ textAlign: 'center' }}>Qtd</th>
                  <th style={{ textAlign: 'right' }}>V. Unitário</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item: any) => (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>R$ {item.unit_price.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>R$ {item.total_price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="doc-footer-grid">
            <div className="doc-notes">
              {quote.notes && (
                <>
                  <h3 className="doc-section-title">Observações</h3>
                  <p className="text-sm whitespace-pre-wrap">{quote.notes}</p>
                </>
              )}
            </div>
            <div className="doc-totals">
              <div className="doc-total-row">
                <span>Subtotal:</span>
                <span>R$ {quote.subtotal.toFixed(2)}</span>
              </div>
              {quote.discount > 0 && (
                <div className="doc-total-row">
                  <span>Desconto:</span>
                  <span>- R$ {quote.discount.toFixed(2)}</span>
                </div>
              )}
              {quote.shipping > 0 && (
                <div className="doc-total-row">
                  <span>Frete/Taxas:</span>
                  <span>R$ {quote.shipping.toFixed(2)}</span>
                </div>
              )}
              <div className="doc-total-row doc-grand-total">
                <span>Total:</span>
                <span>R$ {quote.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar (Internal Info - Hidden on Print) */}
        <div className="view-sidebar print-hide">
          <div className="card mb-4">
            <h3 className="card-title mb-4">Anotações Internas</h3>
            <p className="text-sm text-secondary whitespace-pre-wrap">
              {quote.internal_notes || 'Nenhuma anotação interna.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
