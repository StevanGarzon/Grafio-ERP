import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, User, FileText, DollarSign, Calculator } from 'lucide-react';
import { quoteService } from '../services/quoteService';
import { clientService } from '../services/clientService';
import { productService } from '../services/productService';
import './OrcamentoFormPage.css';

export default function OrcamentoFormPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Data sources
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  // Quote State
  const [clientId, setClientId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);

  // Items State
  const [items, setItems] = useState<any[]>([
    { id: Date.now().toString(), product_id: '', description: '', quantity: 1, unit_price: 0, total_price: 0 }
  ]);

  // Derived totals
  const subtotal = items.reduce((acc, item) => acc + item.total_price, 0);
  const totalAmount = subtotal - discount + shipping;

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [clientsData, productsData] = await Promise.all([
          clientService.getClients(),
          productService.getProducts()
        ]);
        setClients(clientsData);
        setProducts(productsData);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    const item = newItems[index];
    item[field] = value;

    // Auto-fill price and description from product
    if (field === 'product_id' && value) {
      const prod = products.find(p => p.id === value);
      if (prod) {
        item.description = prod.name;
        item.unit_price = prod.base_price;
      }
    }

    // Auto calculate total
    if (field === 'quantity' || field === 'unit_price' || field === 'product_id') {
      item.total_price = Number(item.quantity) * Number(item.unit_price);
    }

    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), product_id: '', description: '', quantity: 1, unit_price: 0, total_price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = [...items];
      newItems.splice(index, 1);
      setItems(newItems);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) { alert('Selecione um cliente.'); return; }
    if (items.some(item => !item.description)) { alert('Todos os itens devem ter uma descrição.'); return; }
    
    setLoading(true);
    try {
      await quoteService.createQuote({
        client_id: clientId,
        valid_until: validUntil || null,
        subtotal,
        discount,
        shipping,
        total_amount: totalAmount,
        notes,
        internal_notes: internalNotes,
        status: 'draft'
      }, items);
      
      alert('Orçamento criado com sucesso!');
      navigate('/orcamentos');
    } catch (err: any) {
      console.error('Erro ao salvar orçamento:', err);
      alert('Erro ao salvar orçamento: ' + (err.message || 'Verifique sua conexão.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-ghost btn-icon" onClick={() => navigate('/orcamentos')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">Novo Orçamento</h1>
            <p className="page-subtitle">Crie uma proposta comercial detalhada</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/orcamentos')} disabled={loading}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <div className="spinner spinner-sm"></div> : <Save size={16} />} Salvar Orçamento
          </button>
        </div>
      </div>

      <div className="form-grid" style={{ gridTemplateColumns: '1fr 350px' }}>
        
        {/* Main Content: Client and Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card">
            <h2 className="card-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              <User size={18} color="var(--primary-400)" /> Cliente e Dados Base
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="input-group">
                <label className="input-label">Cliente *</label>
                <select className="input" value={clientId} onChange={e => setClientId(e.target.value)} required>
                  <option value="">Selecione um cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Válido até</label>
                <input type="date" className="input" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                <FileText size={18} color="var(--accent-400)" /> Itens do Orçamento
              </h2>
              <button className="btn btn-secondary btn-sm" onClick={addItem}>
                <Plus size={14} /> Adicionar Item
              </button>
            </div>

            <div className="items-table-wrap">
              <table className="items-table">
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>Produto/Serviço</th>
                    <th style={{ width: '30%' }}>Descrição</th>
                    <th style={{ width: '10%' }}>Qtd</th>
                    <th style={{ width: '15%' }}>V. Unitário</th>
                    <th style={{ width: '10%' }}>Subtotal</th>
                    <th style={{ width: '5%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        <select className="input input-sm" value={item.product_id} onChange={e => handleItemChange(index, 'product_id', e.target.value)}>
                          <option value="">Item avulso (Sem produto)</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </td>
                      <td>
                        <input type="text" className="input input-sm" placeholder="Descrição do item" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} required />
                      </td>
                      <td>
                        <input type="number" min="1" step="0.1" className="input input-sm" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} />
                      </td>
                      <td>
                        <div className="input-with-icon">
                          <DollarSign size={12} className="input-icon" />
                          <input type="number" min="0" step="0.01" className="input input-sm" value={item.unit_price} onChange={e => handleItemChange(index, 'unit_price', e.target.value)} />
                        </div>
                      </td>
                      <td>
                        <span className="font-mono" style={{ paddingLeft: '0.5rem', fontWeight: 600 }}>R$ {item.total_price.toFixed(2)}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn-ghost btn-icon text-danger" onClick={() => removeItem(index)} disabled={items.length === 1}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h2 className="card-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              <FileText size={18} color="var(--neutral-400)" /> Observações
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="input-group">
                <label className="input-label">Observações (Visível para o cliente)</label>
                <textarea className="input" rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Condições de pagamento, prazos de entrega..."></textarea>
              </div>
              <div className="input-group">
                <label className="input-label">Anotações Internas</label>
                <textarea className="input" rows={4} value={internalNotes} onChange={e => setInternalNotes(e.target.value)} placeholder="Anotações para a equipe (não sai no PDF)"></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Totals Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card sticky-totals">
            <h2 className="card-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              <Calculator size={18} color="var(--primary-400)" /> Resumo
            </h2>

            <div className="totals-row">
              <span className="totals-label">Subtotal</span>
              <span className="totals-value">R$ {subtotal.toFixed(2)}</span>
            </div>

            <div className="totals-row">
              <span className="totals-label">Desconto (R$)</span>
              <input type="number" min="0" step="0.01" className="input input-sm totals-input" value={discount} onChange={e => setDiscount(Number(e.target.value))} />
            </div>

            <div className="totals-row">
              <span className="totals-label">Frete / Acréscimo (R$)</span>
              <input type="number" min="0" step="0.01" className="input input-sm totals-input" value={shipping} onChange={e => setShipping(Number(e.target.value))} />
            </div>

            <div className="divider"></div>

            <div className="totals-row totals-grand">
              <span className="totals-label">TOTAL</span>
              <span className="totals-value">R$ {totalAmount.toFixed(2)}</span>
            </div>

            <button className="btn btn-primary w-full mt-6" onClick={handleSubmit} disabled={loading}>
              Salvar Orçamento
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
