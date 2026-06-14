import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, TrendingUp, TrendingDown, DollarSign, Calendar, FileText } from 'lucide-react';
import { financeService } from '../services/financeService';
import { clientService } from '../services/clientService';
import { supplierService } from '../services/supplierService';

export default function TransacaoFormPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [clients, setClients] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  
  const [transaction, setTransaction] = useState({
    description: '',
    amount: '',
    due_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    notes: '',
    client_id: '',
    supplier_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cData, sData] = await Promise.all([
        clientService.getClients(),
        supplierService.getSuppliers()
      ]);
      setClients(cData);
      setSuppliers(sData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await financeService.createTransaction({
        ...transaction,
        type,
        amount: Number(transaction.amount)
      });
      navigate('/financeiro');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar lançamento.');
    } finally {
      setLoading(false);
    }
  };

  const isIncome = type === 'income';

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-ghost btn-icon" onClick={() => navigate('/financeiro')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">Novo Lançamento</h1>
            <p className="page-subtitle">Cadastre uma nova conta a {isIncome ? 'receber' : 'pagar'}</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/financeiro')} disabled={loading}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ background: isIncome ? 'var(--success-600)' : 'var(--danger-500)' }}>
            {loading ? <div className="spinner spinner-sm"></div> : <Save size={16} />}
            Salvar Lançamento
          </button>
        </div>
      </div>

      <div className="form-grid" style={{ gridTemplateColumns: '1fr 400px' }}>
        <div className="card">
          {/* Tipo Selector */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <button 
              type="button" 
              className={`btn ${!isIncome ? 'btn-primary' : 'btn-secondary'}`} 
              style={!isIncome ? { background: 'var(--danger-500)', borderColor: 'var(--danger-500)' } : {}}
              onClick={() => setType('expense')}
            >
              <TrendingDown size={16} /> Despesa (A Pagar)
            </button>
            <button 
              type="button" 
              className={`btn ${isIncome ? 'btn-primary' : 'btn-secondary'}`} 
              style={isIncome ? { background: 'var(--success-600)', borderColor: 'var(--success-600)' } : {}}
              onClick={() => setType('income')}
            >
              <TrendingUp size={16} /> Receita (A Receber)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label">Descrição *</label>
              <input type="text" className="input" placeholder={isIncome ? 'Ex: Sinal Orçamento #1002' : 'Ex: Compra de Lonas'} value={transaction.description} onChange={e => setTransaction({...transaction, description: e.target.value})} required />
            </div>
            
            <div className="input-group">
              <label className="input-label">Valor (R$) *</label>
              <div className="input-with-icon">
                <DollarSign size={16} className="input-icon" />
                <input type="number" step="0.01" min="0.01" className="input" value={transaction.amount} onChange={e => setTransaction({...transaction, amount: e.target.value})} required />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Data de Vencimento *</label>
              <div className="input-with-icon">
                <Calendar size={16} className="input-icon" />
                <input type="date" className="input" value={transaction.due_date} onChange={e => setTransaction({...transaction, due_date: e.target.value})} required />
              </div>
            </div>
          </div>

          <div className="input-group mb-4">
            <label className="input-label">{isIncome ? 'Cliente Vinculado (Opcional)' : 'Fornecedor Vinculado (Opcional)'}</label>
            <select 
              className="input" 
              value={isIncome ? transaction.client_id : transaction.supplier_id}
              onChange={e => setTransaction({
                ...transaction, 
                [isIncome ? 'client_id' : 'supplier_id']: e.target.value
              })}
            >
              <option value="">Selecione...</option>
              {isIncome ? (
                clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
              ) : (
                suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
              )}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Status Inicial</label>
            <select className="input" value={transaction.status} onChange={e => setTransaction({...transaction, status: e.target.value})}>
              <option value="pending">Pendente (Ainda não {isIncome ? 'recebido' : 'pago'})</option>
              <option value="paid">Já {isIncome ? 'Recebido' : 'Pago'}</option>
            </select>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
            <FileText size={18} color="var(--neutral-400)" /> Observações
          </h2>
          <div className="input-group">
            <textarea className="input" rows={8} value={transaction.notes} onChange={e => setTransaction({...transaction, notes: e.target.value})} placeholder="Anotações internas sobre este lançamento..."></textarea>
          </div>
        </div>
      </div>
    </div>
  );
}
