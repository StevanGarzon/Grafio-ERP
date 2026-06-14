import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, User, Building, MoreVertical, MapPin, Mail, Phone } from 'lucide-react';
import { clientService, type Client } from '../services/clientService';
import './ClientesPage.css';

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadClients();
  }, [statusFilter]); // Reload when status filter changes

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await clientService.getClients(searchTerm);
      
      let filtered = data;
      if (statusFilter) {
        filtered = filtered.filter(c => c.status === statusFilter);
      }
      
      setClients(filtered);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadClients();
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      setLoading(true);
      await clientService.updateClient(id, { status: newStatus as any });
      setClients(prev => prev.map(c => c.id === id ? { ...c, status: newStatus as any } : c));
      setActiveMenu(null);
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar status do cliente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o cliente ${name}?`)) return;
    
    try {
      setLoading(true);
      await clientService.deleteClient(id);
      setClients(prev => prev.filter(c => c.id !== id));
      setActiveMenu(null);
      alert('Cliente excluído com sucesso.');
    } catch (error: any) {
      console.error(error);
      const msg = error.message || 'Erro desconhecido';
      alert(`Erro ao excluir cliente: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="badge badge-success">Ativo</span>;
      case 'inactive': return <span className="badge badge-danger">Inativo</span>;
      case 'lead': return <span className="badge badge-warning">Lead</span>;
      default: return <span className="badge badge-neutral">{status}</span>;
    }
  };

  return (
    <div className="page-container animate-fade-in" onClick={() => setActiveMenu(null)}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">Gerencie seus clientes e leads</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/clientes/novo')}>
          <Plus size={16} />
          Novo Cliente
        </button>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <form className="search-bar" onSubmit={handleSearch}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por nome, documento ou e-mail..."
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
              <option value="active">Ativos</option>
              <option value="lead">Leads</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="table-loading">
            <div className="spinner"></div>
            <span>Carregando clientes...</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contato</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clients.length > 0 ? (
                  clients.map(client => (
                    <tr key={client.id} className="table-row">
                      <td onClick={() => navigate(`/clientes/${client.id}`)}>
                        <div className="client-cell">
                          <div className="client-icon-wrap" style={{ background: client.type === 'PJ' ? 'rgba(51,102,255,0.1)' : 'rgba(139,92,246,0.1)' }}>
                            {client.type === 'PJ' ? <Building size={16} color="var(--primary-400)" /> : <User size={16} color="#8b5cf6" />}
                          </div>
                          <div>
                            <p className="client-name">{client.name}</p>
                            <p className="client-doc">{client.document}</p>
                          </div>
                        </div>
                      </td>
                      <td onClick={() => navigate(`/clientes/${client.id}`)}>
                        <div className="contact-cell">
                          {client.email && (
                            <span className="contact-item"><Mail size={12} /> {client.email}</span>
                          )}
                          {client.phone && (
                            <span className="contact-item"><Phone size={12} /> {client.phone}</span>
                          )}
                        </div>
                      </td>
                      <td onClick={() => navigate(`/clientes/${client.id}`)}>{getStatusBadge(client.status)}</td>
                      <td style={{ textAlign: 'right', position: 'relative' }}>
                        <button 
                          className="btn-ghost btn-icon" 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setActiveMenu(activeMenu === client.id ? null : client.id);
                          }}
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {activeMenu === client.id && (
                          <div className="dropdown-menu-custom">
                            <button onClick={() => navigate(`/clientes/${client.id}/editar`)}>Editar</button>
                            
                            <div className="dropdown-divider"></div>
                            <p className="dropdown-label">Mudar Status</p>
                            {client.status !== 'active' && <button onClick={() => handleStatusUpdate(client.id, 'active')} style={{ color: 'var(--accent-400)' }}>Ativar Cliente</button>}
                            {client.status !== 'lead' && <button onClick={() => handleStatusUpdate(client.id, 'lead')} style={{ color: 'var(--warning-400)' }}>Marcar como Lead</button>}
                            {client.status !== 'inactive' && <button onClick={() => handleStatusUpdate(client.id, 'inactive')} style={{ color: 'var(--danger-400)' }}>Inativar</button>}
                            
                            <div className="dropdown-divider"></div>
                            <button onClick={() => navigate(`/visitas/${client.id}/executar`)}>Nova Visita</button>
                            <button className="delete" onClick={() => handleDeleteClient(client.id, client.name)}>Excluir</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="table-empty">Nenhum cliente encontrado.</td>
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
