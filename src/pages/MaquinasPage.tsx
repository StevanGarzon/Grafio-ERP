import { useState, useEffect } from 'react';
import { Settings, Plus, Wrench, AlertTriangle, Activity, Clock, Trash2, QrCode, Printer, X } from 'lucide-react';
import './MaquinasPage.css';

import { equipmentService, type Equipment, type MaintenanceLog } from '../services/equipmentService';

export default function MaquinasPage() {
  const [machines, setMachines] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newMachine, setNewMachine] = useState({
    name: '',
    type: 'Impressora',
    brand: '',
    model: '',
    status: 'Operacional' as const
  });

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [maintModalOpen, setMaintModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<Equipment | null>(null);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  
  // QR Code Label Generator States
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [selectedForLabel, setSelectedForLabel] = useState<Equipment | null>(null);
  const [labelColor, setLabelColor] = useState<'dark' | 'blue' | 'yellow' | 'white'>('dark');

  const [newLog, setNewLog] = useState({
    description: '',
    maintenance_type: 'Preventiva' as const,
    cost: 0,
    performed_at: new Date().toISOString().split('T')[0],
    next_due_date: ''
  });

  useEffect(() => {
    loadMachines();
  }, []);

  const loadMachines = async () => {
    try {
      setLoading(true);
      const data = await equipmentService.getEquipment();
      setMachines(data);
    } catch (error) {
      console.error('Erro ao carregar máquinas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (machine: Equipment) => {
    try {
      setSelectedMachine(machine);
      setLoading(true);
      const data = await equipmentService.getMaintenanceLogs(machine.id);
      setLogs(data);
      setHistoryModalOpen(true);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar histórico.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMaint = (machine: Equipment) => {
    setSelectedMachine(machine);
    setNewLog({
      description: '',
      maintenance_type: 'Preventiva',
      cost: 0,
      performed_at: new Date().toISOString().split('T')[0],
      next_due_date: ''
    });
    setMaintModalOpen(true);
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine) return;
    try {
      setLoading(true);
      await equipmentService.addMaintenanceLog({
        ...newLog,
        equipment_id: selectedMachine.id,
        company_id: selectedMachine.company_id
      });
      setMaintModalOpen(false);
      alert('Manutenção registrada com sucesso!');
      loadMachines();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao registrar manutenção.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await equipmentService.createEquipment(newMachine);
      setModalOpen(false);
      setNewMachine({ name: '', type: 'Impressora', brand: '', model: '', status: 'Operacional' });
      alert('Equipamento cadastrado com sucesso!');
      loadMachines();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao cadastrar equipamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este equipamento?')) return;
    try {
      setLoading(true);
      await equipmentService.deleteEquipment(id);
      loadMachines();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir equipamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLabel = (machine: Equipment) => {
    setSelectedForLabel(machine);
    setLabelColor('dark');
    setLabelModalOpen(true);
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestão de Máquinas & Ativos</h1>
          <p className="page-subtitle">Controle de vida útil, manutenção e saúde dos seus equipamentos</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Novo Equipamento
        </button>
      </div>

      <div className="machines-grid">
        {loading && !historyModalOpen && !maintModalOpen ? (
          <div className="spinner-container"><div className="spinner"></div></div>
        ) : machines.length > 0 ? (
          machines.map(m => (
            <div key={m.id} className="machine-card card">
              <div className="machine-header">
                <div className="machine-icon-wrap">
                  <Settings size={24} />
                </div>
                <div className={`status-tag ${m.status === 'Manutenção' ? 'warning' : m.status === 'Inativo' ? 'danger' : 'success'}`}>
                  {m.status}
                </div>
              </div>
              
              <h3 className="machine-name">{m.name}</h3>
              <p className="machine-type">{m.type} {m.brand ? `| ${m.brand}` : ''} {m.model || ''}</p>

              <div className="health-section">
                <div className="health-header">
                  <span>Status do Ativo</span>
                  <span className="health-val">{m.status}</span>
                </div>
                <div className="health-bar">
                  <div className="health-fill" style={{ 
                    width: '100%', 
                    background: m.status === 'Operacional' ? 'var(--success-500)' : m.status === 'Manutenção' ? 'var(--warning-500)' : 'var(--danger-500)' 
                  }}></div>
                </div>
              </div>

              <div className="machine-footer" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <div className="last-maint">
                    <Clock size={14} /> Última: {m.last_log ? new Date(m.last_log.performed_at).toLocaleDateString('pt-BR') : 'Nenhuma'}
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className="btn-ghost btn-icon text-danger" onClick={() => handleDelete(m.id)} title="Excluir"><Trash2 size={16} /></button>
                    <button className="btn-ghost btn-icon" onClick={() => loadHistory(m)} title="Ver Histórico"><Activity size={16} /></button>
                    <button className="btn-ghost btn-icon" onClick={() => handleOpenMaint(m)} title="Registrar Manutenção"><Wrench size={16} /></button>
                    <button className="btn-ghost btn-icon" onClick={() => handleOpenLabel(m)} title="Gerar Etiqueta QR"><QrCode size={16} /></button>
                  </div>
                </div>
                
                {m.last_log?.next_due_date && (
                  <div className="alert-item" style={{ background: 'rgba(51,102,255,0.1)', color: 'var(--primary-400)', width: '100%', padding: '4px 8px', borderRadius: '4px' }}>
                    <AlertTriangle size={14} /> Próxima Revisão: {new Date(m.last_log.next_due_date).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem' }}>
            <div className="empty-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚙️</div>
            <h3>Nenhuma máquina cadastrada</h3>
            <p className="text-secondary">Cadastre seus equipamentos para começar o controle de manutenção.</p>
          </div>
        )}
      </div>

      {/* New Equipment Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-content card" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <h2 className="card-title mb-4">Novo Equipamento / Ativo</h2>
            <form onSubmit={handleCreateMachine}>
              <div className="input-group mb-4">
                <label className="input-label">Nome da Máquina *</label>
                <input 
                  type="text" 
                  className="input" 
                  value={newMachine.name} 
                  onChange={e => setNewMachine({...newMachine, name: e.target.value})} 
                  placeholder="Ex: Plotter Roland VG3" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="input-group">
                  <label className="input-label">Tipo</label>
                  <select 
                    className="input" 
                    value={newMachine.type} 
                    onChange={e => setNewMachine({...newMachine, type: e.target.value})}
                  >
                    <option value="Impressora">Impressora</option>
                    <option value="Plotter">Plotter</option>
                    <option value="Router CNC">Router CNC</option>
                    <option value="Laser">Corte Laser</option>
                    <option value="Laminadora">Laminadora</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Status Inicial</label>
                  <select 
                    className="input" 
                    value={newMachine.status} 
                    onChange={e => setNewMachine({...newMachine, status: e.target.value as any})}
                  >
                    <option value="Operacional">Operacional</option>
                    <option value="Manutenção">Em Manutenção</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar Equipamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance History Modal */}
      {historyModalOpen && selectedMachine && (
        <div className="modal-backdrop" onClick={() => setHistoryModalOpen(false)}>
          <div className="modal-content card" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="card-title" style={{ margin: 0 }}>Histórico: {selectedMachine.name}</h2>
              <button className="btn btn-sm btn-secondary" onClick={() => setHistoryModalOpen(false)}>Fechar</button>
            </div>
            
            <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Tipo</th>
                    <th>Descrição</th>
                    <th style={{ textAlign: 'right' }}>Custo</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length > 0 ? logs.map(log => (
                    <tr key={log.id}>
                      <td className="text-sm">{new Date(log.performed_at).toLocaleDateString('pt-BR')}</td>
                      <td>
                        <span className={`badge ${log.maintenance_type === 'Corretiva' ? 'badge-danger' : 'badge-neutral'}`}>
                          {log.maintenance_type}
                        </span>
                      </td>
                      <td className="text-sm">{log.description}</td>
                      <td className="text-sm" style={{ textAlign: 'right' }}>R$ {Number(log.cost).toFixed(2)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="table-empty">Nenhum registro encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Maintenance Modal */}
      {maintModalOpen && selectedMachine && (
        <div className="modal-backdrop" onClick={() => setMaintModalOpen(false)}>
          <div className="modal-content card" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <h2 className="card-title mb-4">Registrar Manutenção</h2>
            <p className="text-sm text-secondary mb-4">Equipamento: <strong>{selectedMachine.name}</strong></p>
            
            <form onSubmit={handleAddMaintenance}>
              <div className="input-group mb-4">
                <label className="input-label">Descrição do Serviço *</label>
                <textarea 
                  className="input" 
                  rows={3} 
                  value={newLog.description} 
                  onChange={e => setNewLog({...newLog, description: e.target.value})}
                  placeholder="Ex: Troca de filtros e limpeza das cabeças"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="input-group">
                  <label className="input-label">Tipo de Manutenção</label>
                  <select 
                    className="input" 
                    value={newLog.maintenance_type} 
                    onChange={e => setNewLog({...newLog, maintenance_type: e.target.value as any})}
                  >
                    <option value="Preventiva">Preventiva</option>
                    <option value="Corretiva">Corretiva</option>
                    <option value="Troca de Peça">Troca de Peça</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Custo (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="input" 
                    value={newLog.cost} 
                    onChange={e => setNewLog({...newLog, cost: Number(e.target.value)})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="input-group">
                  <label className="input-label">Data da Execução</label>
                  <input 
                    type="date" 
                    className="input" 
                    value={newLog.performed_at} 
                    onChange={e => setNewLog({...newLog, performed_at: e.target.value})} 
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Próxima Revisão</label>
                  <input 
                    type="date" 
                    className="input" 
                    value={newLog.next_due_date} 
                    onChange={e => setNewLog({...newLog, next_due_date: e.target.value})} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setMaintModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar Manutenção'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Label Generator Modal */}
      {labelModalOpen && selectedForLabel && (
        <div className="modal-backdrop print-no-print" onClick={() => setLabelModalOpen(false)}>
          <div className="modal-content card" style={{ maxWidth: 660 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="card-title" style={{ margin: 0 }}>Gerador de Etiqueta Patrimonial</h2>
              <button className="btn-icon-xs" onClick={() => setLabelModalOpen(false)}><X size={16} /></button>
            </div>

            <div className="label-modal-grid">
              {/* Settings customize column */}
              <div className="label-settings-panel">
                <div>
                  <label className="input-label" style={{ fontSize: '0.75rem' }}>Visual / Tema do Adesivo</label>
                  <div className="theme-selector-group">
                    {[
                      { id: 'dark', label: 'Slate Graphite (Escuro)' },
                      { id: 'blue', label: 'Blue Industry (Azul)' },
                      { id: 'yellow', label: 'Safety Warning (Amarelo)' },
                      { id: 'white', label: 'Thermal Roll (Branco/Preto)' }
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        className={`theme-radio-btn ${labelColor === t.id ? 'active' : ''}`}
                        onClick={() => setLabelColor(t.id as any)}
                      >
                        <div style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: t.id === 'dark' ? '#0f172a' : t.id === 'blue' ? '#1e3a8a' : t.id === 'yellow' ? '#fbbf24' : '#ffffff',
                          border: '1px solid var(--border-color)',
                          marginRight: '0.375rem'
                        }} />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <button className="btn btn-primary w-full" onClick={() => window.print()}>
                    <Printer size={14} style={{ marginRight: '0.25rem' }} /> Imprimir Etiqueta
                  </button>
                </div>
              </div>

              {/* Tag Preview Column */}
              <div className="label-preview-panel">
                <div className={`printable-label-card label-theme-${labelColor}`}>
                  <div className="label-card-header">
                    <span>GRAFIO . ERP</span>
                    <span>CONTROLE PATRIMONIAL</span>
                  </div>

                  <div className="label-card-body">
                    <div className="label-card-details">
                      <div className="label-card-title">{selectedForLabel.name}</div>
                      <div className="label-card-text">
                        <strong>TIPO:</strong> {selectedForLabel.type}
                      </div>
                      <div className="label-card-text">
                        <strong>MARCA:</strong> {selectedForLabel.brand || '-'}
                      </div>
                      <div className="label-card-text">
                        <strong>MODELO:</strong> {selectedForLabel.model || '-'}
                      </div>
                      <div className="label-card-text" style={{ fontSize: '0.5625rem', marginTop: '0.25rem', opacity: 0.7 }}>
                        ID: {selectedForLabel.id.substring(0, 18).toUpperCase()}
                      </div>
                    </div>

                    <div className="label-card-qr-box">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://grafio-erp.com/maquinas?id=${selectedForLabel.id}`)}`}
                        alt="Unique QR Code"
                      />
                    </div>
                  </div>

                  <div className="label-card-footer">
                    <span>Escaneie para histórico</span>
                    
                    <div className="barcode-sim-lines">
                      <div className="barcode-line-thin" />
                      <div className="barcode-line-thick" />
                      <div className="barcode-line-thin" />
                      <div className="barcode-line-wide" />
                      <div className="barcode-line-thick" />
                      <div className="barcode-line-thin" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
