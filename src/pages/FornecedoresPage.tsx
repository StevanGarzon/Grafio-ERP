import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Truck, Mail, Phone } from 'lucide-react';
import { supplierService } from '../services/supplierService';

export default function FornecedoresPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getSuppliers(searchTerm);
      setSuppliers(data);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fornecedores</h1>
          <p className="page-subtitle">Gerencie sua rede de fornecedores de suprimentos</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/fornecedores/novo')}>
          <Plus size={16} />
          Novo Fornecedor
        </button>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <form className="search-bar" onSubmit={e => e.preventDefault()}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar fornecedor..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary btn-sm" style={{ marginLeft: '0.5rem' }}>Buscar</button>
          </form>
        </div>

        {loading ? (
          <div className="table-loading"><div className="spinner"></div></div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fornecedor</th>
                  <th>Contato</th>
                  <th>Categorias</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(supplier => (
                  <tr key={supplier.id} className="table-row" onClick={() => navigate(`/fornecedores/${supplier.id}/editar`)}>
                    <td>
                      <div className="client-cell">
                        <div className="client-icon-wrap" style={{ background: 'var(--surface-app)', width: 32, height: 32 }}>
                          <Truck size={14} color="var(--text-tertiary)" />
                        </div>
                        <div>
                          <p className="client-name">{supplier.name}</p>
                          <p className="client-doc">CNPJ: {supplier.document}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-cell">
                        <div className="contact-item">
                          <Mail size={12} /> {supplier.email}
                        </div>
                        <div className="contact-item">
                          <Phone size={12} /> {supplier.phone}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-secondary">{supplier.categories}</span>
                    </td>
                    <td>
                      <span className={`badge ${supplier.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                        {supplier.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
