import { useState, useEffect } from 'react';
import { Plus, Calendar, User, ShieldCheck, RefreshCw, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { contractService, type Contract } from '../services/contractService';
import { clientService } from '../services/clientService';
import './ContratosPage.css';

export default function ContratosPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newContract, setNewContract] = useState({
    client_id: '',
    title: '',
    value: '',
    frequency: 'Mensal',
    next_billing_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split('T')[0],
    auto_generate_visit: true
  });

  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  useEffect(() => {
    loadContracts();
    loadClients();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const data = await contractService.getContracts();
      setContracts(data);
    } catch (error) {
      console.error('Erro ao carregar contratos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const data = await clientService.getClients();
      setClients(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenNew = () => {
    setEditingContract(null);
    setNewContract({ 
      client_id: '', title: '', value: '', frequency: 'Mensal', 
      next_billing_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split('T')[0],
      auto_generate_visit: true 
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (contract: Contract) => {
    setEditingContract(contract);
    setNewContract({
      client_id: contract.client_id,
      title: contract.title,
      value: contract.value.toString(),
      frequency: contract.frequency,
      next_billing_date: contract.next_billing_date || '',
      auto_generate_visit: contract.auto_generate_visit
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        ...newContract,
        value: Number(newContract.value)
      };
      if (editingContract) {
        await contractService.updateContract(editingContract.id, payload);
        alert('Contrato atualizado com sucesso!');
      } else {
        await contractService.createContract(payload);
        alert('Contrato cadastrado com sucesso!');
      }
      setModalOpen(false);
      loadContracts();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao salvar contrato.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este contrato?')) return;
    try {
      setLoading(true);
      await contractService.deleteContract(id);
      loadContracts();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir contrato.');
    } finally {
      setLoading(false);
    }
  };

  const mrr = contracts.reduce((acc, c) => acc + Number(c.value), 0);
  const activeContracts = contracts.filter(c => c.status === 'Ativo').length;

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Contratos de Manutenção</h1>
          <p className="page-subtitle">Gestão de receita recorrente e serviços programados</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenNew}>
          <Plus size={16} /> Novo Contrato
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card card">
          <span className="stat-label">Receita Recorrente (MRR)</span>
          <span className="stat-value">R$ {mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="stat-card card">
          <span className="stat-label">Contratos Ativos</span>
          <span className="stat-value">{activeContracts}</span>
        </div>
        <div className="stat-card card">
          <span className="stat-label">Total de Contratos</span>
          <span className="stat-value">{contracts.length}</span>
        </div>
      </div>

      <div className="contracts-list">
        {loading ? (
          <div className="spinner-container"><div className="spinner"></div></div>
        ) : contracts.length > 0 ? (
          contracts.map(contract => (
            <div key={contract.id} className="contract-item card">
              <div className="contract-main">
                <div className="contract-icon-box">
                  <ShieldCheck size={24} color="var(--success-400)" />
                </div>
                <div className="contract-info">
                  <h3 className="contract-title">{contract.title}</h3>
                  <div className="contract-meta">
                    <span className="meta-item"><User size={14} /> {contract.client?.name || 'Cliente Removido'}</span>
                    <span className="meta-item">
                      <Calendar size={14} /> Próximo: {contract.next_billing_date ? new Date(contract.next_billing_date).toLocaleDateString('pt-BR') : 'A definir'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="contract-side">
                <div className="contract-value">
                  <span className="val-label">{contract.frequency}</span>
                  <span className="val-amount">R$ {Number(contract.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="contract-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button className="btn-ghost btn-icon" onClick={() => handleOpenEdit(contract)} title="Editar"><Edit size={18} /></button>
                  <button className="btn-ghost btn-icon text-danger" onClick={() => handleDelete(contract.id)} title="Excluir"><Trash2 size={18} /></button>
                  <ChevronRight size={20} className="text-secondary" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📜</div>
            <h3>Nenhum contrato cadastrado</h3>
            <p className="text-secondary">Cadastre seus contratos de manutenção recorrente aqui.</p>
          </div>
        )}
      </div>

      {/* Contract Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-content card" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <h2 className="card-title mb-4">{editingContract ? 'Editar Contrato' : 'Novo Contrato de Manutenção'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group mb-4">
                <label className="input-label">Título do Contrato *</label>
                <input 
                  type="text" 
                  className="input" 
                  value={newContract.title} 
                  onChange={e => setNewContract({...newContract, title: e.target.value})} 
                  placeholder="Ex: Manutenção Mensal Fachada Centro" 
                  required 
                />
              </div>

              <div className="input-group mb-4">
                <label className="input-label">Cliente *</label>
                <select 
                  className="input" 
                  value={newContract.client_id} 
                  onChange={e => setNewContract({...newContract, client_id: e.target.value})}
                  required
                >
                  <option value="">Selecione o cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="input-group">
                  <label className="input-label">Valor (R$) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="input" 
                    value={newContract.value} 
                    onChange={e => setNewContract({...newContract, value: e.target.value})} 
                    required 
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Frequência</label>
                  <select 
                    className="input" 
                    value={newContract.frequency} 
                    onChange={e => setNewContract({...newContract, frequency: e.target.value})}
                  >
                    <option value="Mensal">Mensal</option>
                    <option value="Bimestral">Bimestral</option>
                    <option value="Trimestral">Trimestral</option>
                    <option value="Semestral">Semestral</option>
                    <option value="Anual">Anual</option>
                  </select>
                </div>
              </div>

              <div className="input-group mb-6">
                <label className="input-label">Próximo Vencimento</label>
                <input 
                  type="date" 
                  className="input" 
                  value={newContract.next_billing_date} 
                  onChange={e => setNewContract({...newContract, next_billing_date: e.target.value})} 
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Salvando...' : editingContract ? 'Salvar Alterações' : 'Salvar Contrato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="info-box mt-6">
        <RefreshCw size={16} />
        <span>O sistema gera ordens de serviço de manutenção automaticamente 7 dias antes do vencimento do contrato.</span>
      </div>
    </div>
  );
}
