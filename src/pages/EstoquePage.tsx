import { useState, useEffect } from 'react';
import { Search, Plus, PackageSearch, AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { inventoryService, type InventoryItem } from '../services/inventoryService';
import { supplierService } from '../services/supplierService';
import './EstoquePage.css';

export default function EstoquePage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  
  // Transaction Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [transactionType, setTransactionType] = useState<'in' | 'out'>('in');
  const [transactionQty, setTransactionQty] = useState(0);
  const [transactionReason, setTransactionReason] = useState('');

  // New Item Modal
  const [newItemModalOpen, setNewItemModalOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({
    name: '',
    sku: '',
    category: '',
    unit: 'm²',
    min_quantity: 0,
    current_quantity: 0,
    supplier_id: '',
    location: ''
  });

  useEffect(() => {
    loadItems();
    loadSuppliers();
  }, [lowStockFilter]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getInventoryItems(searchTerm, lowStockFilter);
      setItems(data);
    } catch (error) {
      console.error('Erro ao carregar estoque:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const data = await supplierService.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenTransaction = (item: any, type: 'in' | 'out') => {
    setSelectedItem(item);
    setTransactionType(type);
    setTransactionQty(0);
    setTransactionReason('');
    setModalOpen(true);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await inventoryService.registerTransaction(
        selectedItem.id,
        transactionType,
        transactionQty,
        transactionReason
      );
      setModalOpen(false);
      alert('Movimentação registrada com sucesso!');
      loadItems();
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar movimentação.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await inventoryService.createInventoryItem({
        ...newItem,
        supplier_id: newItem.supplier_id || null
      });
      setNewItemModalOpen(false);
      setNewItem({ name: '', sku: '', category: '', unit: 'm²', min_quantity: 0, current_quantity: 0, supplier_id: '', location: '' });
      alert('Item cadastrado com sucesso!');
      loadItems();
    } catch (err) {
      console.error(err);
      alert('Erro ao cadastrar item.');
    } finally {
      setLoading(false);
    }
  };

  const lowStockCount = items.filter(i => i.current_quantity <= i.min_quantity).length;

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Almoxarifado</h1>
          <p className="page-subtitle">Controle as matérias-primas e suprimentos da gráfica</p>
        </div>
        <button className="btn btn-primary" onClick={() => setNewItemModalOpen(true)}>
          <Plus size={16} />
          Novo Item de Estoque
        </button>
      </div>

      {/* Dashboard Widgets */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="stat-icon-wrap" style={{ background: 'rgba(244,63,94,0.1)', color: 'var(--danger-500)', width: 40, height: 40 }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="stat-label">Itens em Alerta</p>
              <p className="stat-value" style={{ color: 'var(--text-primary)' }}>{lowStockCount}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="stat-icon-wrap" style={{ background: 'rgba(51,102,255,0.1)', color: 'var(--primary-400)', width: 40, height: 40 }}>
              <PackageSearch size={20} />
            </div>
            <div>
              <p className="stat-label">Total de Itens</p>
              <p className="stat-value" style={{ color: 'var(--text-primary)' }}>{items.length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="stat-icon-wrap" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success-500)', width: 40, height: 40 }}>
              <RefreshCw size={20} />
            </div>
            <div>
              <p className="stat-label">Movimentações Hoje</p>
              <p className="stat-value" style={{ color: 'var(--text-primary)' }}>-</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <form className="search-bar" onSubmit={e => { e.preventDefault(); loadItems(); }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por nome ou SKU..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary btn-sm" style={{ marginLeft: '0.5rem' }}>Buscar</button>
          </form>
          
          <div className="table-filters" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={lowStockFilter} onChange={e => setLowStockFilter(e.target.checked)} />
              Mostrar apenas estoque baixo
            </label>
          </div>
        </div>

        {loading ? (
          <div className="table-loading"><div className="spinner"></div></div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item / SKU</th>
                  <th>Fornecedor</th>
                  <th>Localização</th>
                  <th style={{ textAlign: 'center' }}>Qtd Atual</th>
                  <th style={{ textAlign: 'center' }}>Ações Rápidas</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? items.map(item => {
                  const isLowStock = item.current_quantity <= item.min_quantity;
                  return (
                    <tr key={item.id} className="table-row">
                      <td>
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</div>
                        <div className="font-mono text-sm text-tertiary mt-1">SKU: {item.sku || '-'} | {item.category || '-'}</div>
                      </td>
                      <td><span className="text-sm">{item.supplier?.name || '-'}</span></td>
                      <td><span className="text-sm text-secondary">{item.location || '-'}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                          <span className={`badge ${isLowStock ? 'badge-danger' : 'badge-neutral'}`} style={{ fontSize: '1rem', padding: '4px 12px' }}>
                            {item.current_quantity} {item.unit}
                          </span>
                          {isLowStock && <span className="text-xs text-danger flex items-center gap-1"><AlertTriangle size={10}/> Abaixo do Mín. ({item.min_quantity})</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => handleOpenTransaction(item, 'in')} title="Dar Entrada">
                            <ArrowDownRight size={14} className="text-success" /> Entrada
                          </button>
                          <button className="btn btn-sm btn-secondary" onClick={() => handleOpenTransaction(item, 'out')} title="Dar Baixa">
                            <ArrowUpRight size={14} className="text-danger" /> Saída
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={5} className="table-empty">Nenhum item encontrado no estoque.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      {modalOpen && selectedItem && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-content card" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <h2 className="card-title mb-4">
              Registrar {transactionType === 'in' ? 'Entrada' : 'Saída'}
            </h2>
            <p className="text-sm text-secondary mb-4">Item: <strong style={{ color: 'var(--text-primary)' }}>{selectedItem.name}</strong></p>
            
            <form onSubmit={handleSaveTransaction}>
              <div className="input-group mb-4">
                <label className="input-label">Quantidade ({selectedItem.unit})</label>
                <input 
                  type="number" 
                  min="0.1" 
                  step="0.1" 
                  className="input" 
                  value={transactionQty}
                  onChange={e => setTransactionQty(Number(e.target.value))}
                  required 
                  autoFocus
                />
              </div>
              
              <div className="input-group mb-6">
                <label className="input-label">Motivo / Observação</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder={transactionType === 'in' ? 'Ex: Compra NF 1234' : 'Ex: Produção OS 501'} 
                  value={transactionReason}
                  onChange={e => setTransactionReason(e.target.value)}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ background: transactionType === 'in' ? 'var(--success-600)' : 'var(--danger-500)' }} disabled={loading}>
                  {loading ? 'Salvando...' : `Confirmar ${transactionType === 'in' ? 'Entrada' : 'Saída'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Item Modal */}
      {newItemModalOpen && (
        <div className="modal-backdrop" onClick={() => setNewItemModalOpen(false)}>
          <div className="modal-content card" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <h2 className="card-title mb-4">Cadastrar Novo Item de Estoque</h2>
            <form onSubmit={handleCreateItem}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="input-group">
                  <label className="input-label">Nome do Item *</label>
                  <input type="text" className="input" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="Ex: Lona Fosca 440g" required />
                </div>
                <div className="input-group">
                  <label className="input-label">SKU / Código</label>
                  <input type="text" className="input" value={newItem.sku} onChange={e => setNewItem({...newItem, sku: e.target.value})} placeholder="Ex: LN-F-440" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="input-group">
                  <label className="input-label">Categoria</label>
                  <input type="text" className="input" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} placeholder="Ex: Lonas" />
                </div>
                <div className="input-group">
                  <label className="input-label">Unidade de Medida *</label>
                  <select className="input" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} required>
                    <option value="m²">m² (Metro Quadrado)</option>
                    <option value="m">m (Metro Linear)</option>
                    <option value="L">L (Litro)</option>
                    <option value="Un">Un (Unidade)</option>
                    <option value="Cx">Cx (Caixa)</option>
                    <option value="Kg">Kg (Quilo)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="input-group">
                  <label className="input-label">Quantidade Mínima (Alerta)</label>
                  <input type="number" step="0.1" className="input" value={newItem.min_quantity} onChange={e => setNewItem({...newItem, min_quantity: Number(e.target.value)})} />
                </div>
                <div className="input-group">
                  <label className="input-label">Estoque Inicial</label>
                  <input type="number" step="0.1" className="input" value={newItem.current_quantity} onChange={e => setNewItem({...newItem, current_quantity: Number(e.target.value)})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="input-group">
                  <label className="input-label">Fornecedor Preferencial</label>
                  <select className="input" value={newItem.supplier_id} onChange={e => setNewItem({...newItem, supplier_id: e.target.value})}>
                    <option value="">Selecione um fornecedor</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Localização no Almoxarifado</label>
                  <input type="text" className="input" value={newItem.location} onChange={e => setNewItem({...newItem, location: e.target.value})} placeholder="Ex: Prateleira B3" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setNewItemModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Cadastrando...' : 'Cadastrar Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
