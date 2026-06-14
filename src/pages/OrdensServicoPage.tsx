import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Calendar, User, MoreVertical, AlertTriangle, AlertCircle, Clock } from 'lucide-react';
import { osService, type ServiceOrder } from '../services/osService';
import './OrdensServicoPage.css';

export default function OrdensServicoPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await osService.getServiceOrders(statusFilter as any, searchTerm);
      setOrders(data);
    } catch (error) {
      console.error('Erro ao carregar O.S.:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      setLoading(true);
      await osService.updateServiceOrderStatus(id, newStatus as any);
      setOrders(prev => prev.map(os => os.id === id ? { ...os, status: newStatus as any } : os));
      setActiveMenu(null);
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar status da O.S.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending': return <span className="badge badge-neutral">Fila de Espera</span>;
      case 'production': return <span className="badge badge-primary">Em Produção</span>;
      case 'finishing': return <span className="badge badge-warning">Acabamento</span>;
      case 'ready': return <span className="badge badge-success">Pronto p/ Retirada</span>;
      case 'delivered': return <span className="badge" style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}>Finalizado</span>;
      case 'cancelled': return <span className="badge badge-danger">Cancelado</span>;
      default: return <span className="badge badge-neutral">{status}</span>;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle size={14} className="text-danger" />;
      case 'high': return <AlertCircle size={14} className="text-warning" />;
      case 'normal': return <Clock size={14} className="text-primary" />;
      default: return null;
    }
  };

  return (
    <div className="page-container animate-fade-in" onClick={() => setActiveMenu(null)}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Ordens de Serviço</h1>
          <p className="page-subtitle">Gerencie os pedidos em andamento</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/ordens-servico/nova')}>
          <Plus size={16} />
          Nova O.S.
        </button>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <form className="search-bar" onSubmit={e => { e.preventDefault(); loadOrders(); }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar O.S. ou Cliente..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary btn-sm" style={{ marginLeft: '0.5rem' }}>Buscar</button>
          </form>
          
          <div className="table-filters">
            <select 
              className="input" 
              style={{ width: 'auto', padding: '0.5rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos os status</option>
              <option value="pending">Fila de Espera</option>
              <option value="production">Em Produção</option>
              <option value="ready">Pronto</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="table-loading"><div className="spinner"></div></div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>O.S.</th>
                  <th>Cliente</th>
                  <th>Serviço (Resumo)</th>
                  <th>Entrega</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map(os => (
                    <tr key={os.id} className="table-row">
                      <td onClick={() => navigate(`/ordens-servico/${os.id}`)}>
                        <div className="font-mono font-bold" style={{ color: 'var(--primary-400)' }}>
                          OS-{String(os.number).padStart(5, '0')}
                        </div>
                      </td>
                      <td onClick={() => navigate(`/ordens-servico/${os.id}`)}>
                        <div className="client-cell">
                          <User size={14} color="var(--text-tertiary)" />
                          <span className="font-medium">{os.client?.name}</span>
                        </div>
                      </td>
                      <td onClick={() => navigate(`/ordens-servico/${os.id}`)}>
                        <span className="text-sm truncate" style={{ maxWidth: '250px', display: 'block' }}>
                          {os.description}
                        </span>
                      </td>
                      <td onClick={() => navigate(`/ordens-servico/${os.id}`)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                          {getPriorityIcon(os.priority)}
                          <span className={os.priority === 'urgent' ? 'text-danger font-bold' : ''}>
                            {os.delivery_date ? new Date(os.delivery_date).toLocaleDateString('pt-BR') : 'A Combinar'}
                          </span>
                        </div>
                      </td>
                      <td onClick={() => navigate(`/ordens-servico/${os.id}`)}>{getStatusDisplay(os.status)}</td>
                      <td style={{ textAlign: 'right', position: 'relative' }}>
                        <button 
                          className="btn-ghost btn-icon" 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setActiveMenu(activeMenu === os.id ? null : os.id);
                          }}
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {activeMenu === os.id && (
                          <div className="dropdown-menu-custom">
                            <button onClick={() => navigate(`/ordens-servico/${os.id}`)}>Visualizar</button>
                            
                            <div className="dropdown-divider"></div>
                            <p className="dropdown-label">Mudar Status</p>
                            {os.status !== 'production' && <button onClick={() => handleStatusUpdate(os.id, 'production')}>Em Produção</button>}
                            {os.status !== 'ready' && <button onClick={() => handleStatusUpdate(os.id, 'ready')} style={{ color: 'var(--accent-400)' }}>Pronto p/ Retirada</button>}
                            {os.status !== 'delivered' && <button onClick={() => handleStatusUpdate(os.id, 'delivered')}>Entregue</button>}
                            {os.status !== 'cancelled' && <button onClick={() => handleStatusUpdate(os.id, 'cancelled')} style={{ color: 'var(--danger-400)' }}>Cancelar</button>}

                            <div className="dropdown-divider"></div>
                            <button onClick={() => navigate(`/ordens-servico/${os.id}/editar`)}>Editar</button>
                            <button onClick={() => navigate(`/ordens-servico/${os.id}/etiqueta`)}>Imprimir Etiqueta</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="table-empty">Nenhuma O.S. encontrada.</td>
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
