import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Calendar, FileText, User, Tag } from 'lucide-react';
import { clientService } from '../services/clientService';
import { osService } from '../services/osService';
import './OrdemServicoFormPage.css';

export default function OrdemServicoFormPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [clients, setClients] = useState<any[]>([]);
  
  // OS State
  const [clientId, setClientId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [priority, setPriority] = useState('normal');
  const [description, setDescription] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // Items State
  const [items, setItems] = useState<any[]>([
    { id: '1', product_id: '', description: '', quantity: 1, production_details: '' }
  ]);

  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoading(true);
        const data = await clientService.getClients();
        setClients(data);
      } catch (err) {
        console.error('Erro ao carregar clientes:', err);
      } finally {
        setLoading(false);
      }
    };
    loadClients();
  }, []);

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), product_id: '', description: '', quantity: 1, production_details: '' }]);
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
    if (!description) { alert('O resumo do serviço é obrigatório.'); return; }
    
    setLoading(true);
    try {
      await osService.createServiceOrder({
        client_id: clientId,
        delivery_date: deliveryDate || null,
        priority: priority as any,
        description,
        internal_notes: internalNotes,
        status: 'pending'
      }, items);
      
      alert('Ordem de Serviço criada com sucesso!');
      navigate('/ordens-servico');
    } catch (err: any) {
      console.error('Erro ao salvar OS:', err);
      alert('Erro ao salvar O.S.: ' + (err.message || 'Verifique sua conexão.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-ghost btn-icon" onClick={() => navigate('/ordens-servico')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">Nova Ordem de Serviço</h1>
            <p className="page-subtitle">Emita uma nova OS técnica para produção</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/ordens-servico')} disabled={loading}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <div className="spinner spinner-sm"></div> : <Save size={16} />} Salvar O.S.
          </button>
        </div>
      </div>

      <div className="form-grid" style={{ gridTemplateColumns: '1fr 350px' }}>
        
        {/* Main Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h2 className="card-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              <User size={18} color="var(--primary-400)" /> Dados da O.S.
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="input-group">
                <label className="input-label">Cliente *</label>
                <select className="input" value={clientId} onChange={e => setClientId(e.target.value)} required>
                  <option value="">Selecione um cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Resumo do Serviço (Título) *</label>
                <input type="text" className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Fachada e Adesivos Frota" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="input-group">
                <label className="input-label">Data de Entrega Prometida</label>
                <div className="input-with-icon">
                  <Calendar size={16} className="input-icon" />
                  <input type="date" className="input" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Prioridade</label>
                <select className="input" value={priority} onChange={e => setPriority(e.target.value)}>
                  <option value="low">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente (Parar Máquina)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                <Tag size={18} color="var(--accent-400)" /> Itens de Produção
              </h2>
              <button className="btn btn-secondary btn-sm" onClick={addItem}>
                <Plus size={14} /> Adicionar Item
              </button>
            </div>

            <div className="items-table-wrap">
              <table className="items-table">
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>Item / Serviço</th>
                    <th style={{ width: '10%' }}>Qtd</th>
                    <th style={{ width: '55%' }}>Detalhes Técnicos / Acabamento</th>
                    <th style={{ width: '5%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        <input type="text" className="input input-sm" placeholder="Ex: Adesivo Vinil" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} required />
                      </td>
                      <td>
                        <input type="number" min="0.1" step="0.1" className="input input-sm" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} />
                      </td>
                      <td>
                        <textarea 
                          className="input input-sm" 
                          rows={2} 
                          placeholder="Medidas, tipo de corte, sangria, acabamento (ilhós, bainha)..." 
                          value={item.production_details} 
                          onChange={e => handleItemChange(index, 'production_details', e.target.value)}
                        />
                      </td>
                      <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
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
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h2 className="card-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              <FileText size={18} color="var(--neutral-400)" /> Instruções Internas
            </h2>
            <div className="input-group">
              <label className="input-label">Anotações para a Equipe</label>
              <textarea 
                className="input" 
                rows={10} 
                value={internalNotes} 
                onChange={e => setInternalNotes(e.target.value)} 
                placeholder="Atenção especial ao pantone X. Ligar para o cliente antes de instalar."
              ></textarea>
            </div>
            
            <button className="btn btn-primary w-full mt-6" onClick={handleSubmit} disabled={loading}>
              Salvar O.S.
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
