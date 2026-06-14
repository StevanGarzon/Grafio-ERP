import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Building, User, Mail, Phone, MapPin, FileText, ClipboardList, DollarSign } from 'lucide-react';
import { clientService, type Client } from '../services/clientService';
import './ClientePerfilPage.css';

export default function ClientePerfilPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadClient(id);
  }, [id]);

  const loadClient = async (clientId: string) => {
    try {
      setLoading(true);
      // In a real app: const data = await clientService.getClientById(clientId);
      // Mock data for preview:
      const data = {
        id: clientId,
        name: 'Tech Solutions Ltda',
        document: '12.345.678/0001-90',
        email: 'contato@techsol.com',
        phone: '(11) 98765-4321',
        type: 'PJ',
        status: 'active',
        created_at: new Date().toISOString(),
        addresses: [{ street: 'Av. Paulista', number: '1000', city: 'São Paulo', state: 'SP' }],
        contacts: [{ name: 'Carlos Eduardo', role: 'Diretor', email: 'carlos@techsol.com', phone: '(11) 99999-9999' }]
      };
      setClient(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!client) {
    return <div className="page-container">Cliente não encontrado.</div>;
  }

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="perfil-header">
        <button className="btn-ghost btn-icon" onClick={() => navigate('/clientes')}>
          <ArrowLeft size={20} />
        </button>
        <div className="perfil-title-area">
          <div className="perfil-avatar">
            {client.type === 'PJ' ? <Building size={24} /> : <User size={24} />}
          </div>
          <div>
            <h1 className="page-title">{client.name}</h1>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
              <span className="badge badge-primary">{client.type === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}</span>
              <span className={`badge ${client.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                {client.status === 'active' ? 'Ativo' : client.status}
              </span>
            </div>
          </div>
        </div>
        <div className="ml-auto">
          <button className="btn btn-secondary" onClick={() => navigate(`/clientes/${client.id}/editar`)}>
            <Edit size={16} /> Editar
          </button>
        </div>
      </div>

      <div className="perfil-grid">
        {/* Left Column - Info */}
        <div className="perfil-sidebar">
          <div className="card">
            <h3 className="card-title mb-4">Informações de Contato</h3>
            
            <div className="info-list">
              <div className="info-item">
                <div className="info-icon"><Building size={16} /></div>
                <div className="info-content">
                  <span className="info-label">Documento ({client.type === 'PJ' ? 'CNPJ' : 'CPF'})</span>
                  <span className="info-value">{client.document}</span>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon"><Mail size={16} /></div>
                <div className="info-content">
                  <span className="info-label">E-mail Principal</span>
                  <span className="info-value">{client.email}</span>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon"><Phone size={16} /></div>
                <div className="info-content">
                  <span className="info-label">Telefone</span>
                  <span className="info-value">{client.phone}</span>
                </div>
              </div>
              
              {client.addresses?.[0] && (
                <div className="info-item">
                  <div className="info-icon"><MapPin size={16} /></div>
                  <div className="info-content">
                    <span className="info-label">Endereço Principal</span>
                    <span className="info-value">
                      {client.addresses[0].street}, {client.addresses[0].number} - {client.addresses[0].city}/{client.addresses[0].state}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - 360 Dashboard */}
        <div className="perfil-main">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="stat-card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="stat-icon-wrap" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', width: 36, height: 36 }}>
                  <FileText size={18} />
                </div>
                <div>
                  <p className="stat-label">Orçamentos</p>
                  <p className="stat-value" style={{ fontSize: '1.25rem' }}>0</p>
                </div>
              </div>
            </div>
            <div className="stat-card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="stat-icon-wrap" style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4', width: 36, height: 36 }}>
                  <ClipboardList size={18} />
                </div>
                <div>
                  <p className="stat-label">OS Abertas</p>
                  <p className="stat-value" style={{ fontSize: '1.25rem' }}>0</p>
                </div>
              </div>
            </div>
            <div className="stat-card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="stat-icon-wrap" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', width: 36, height: 36 }}>
                  <DollarSign size={18} />
                </div>
                <div>
                  <p className="stat-label">Faturamento</p>
                  <p className="stat-value" style={{ fontSize: '1.25rem' }}>R$ 0</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity / History */}
          <div className="card h-full">
            <h3 className="card-title mb-4">Histórico Recente</h3>
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>
              <p>Nenhum histórico encontrado para este cliente ainda.</p>
              <button className="btn btn-secondary btn-sm mt-4">Criar Orçamento</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
