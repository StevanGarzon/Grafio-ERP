import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Building, User, Phone, Mail, MapPin } from 'lucide-react';
import { clientService, type Client, type ClientContact, type ClientAddress } from '../services/clientService';
import './ClienteFormPage.css';

export default function ClienteFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client State
  const [client, setClient] = useState<Partial<Client>>({
    type: 'PJ',
    status: 'active',
    name: '',
    document: '',
    email: '',
    phone: '',
    notes: ''
  });

  // Contacts State
  const [contacts, setContacts] = useState<ClientContact[]>([
    { name: '', role: '', phone: '', email: '', is_primary: true }
  ]);

  // Addresses State
  const [addresses, setAddresses] = useState<ClientAddress[]>([
    { zip_code: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', is_primary: true }
  ]);

  const handleCepChange = async (cepValue: string) => {
    const newArr = [...addresses];
    newArr[0].zip_code = cepValue;
    setAddresses(newArr);

    const cleanCep = cepValue.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          const updatedArr = [...addresses];
          updatedArr[0] = {
            ...updatedArr[0],
            zip_code: cepValue,
            street: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || ''
          };
          setAddresses(updatedArr);
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
      }
    }
  };

  useEffect(() => {
    if (isEditing && id) {
      const loadClient = async () => {
        try {
          setLoading(true);
          const data = await clientService.getClientById(id);
          setClient(data);
          if (data.contacts && data.contacts.length > 0) setContacts(data.contacts);
          if (data.addresses && data.addresses.length > 0) setAddresses(data.addresses);
        } catch (err) {
          console.error('Erro ao carregar cliente:', err);
          setError('Não foi possível carregar os dados do cliente.');
        } finally {
          setLoading(false);
        }
      };
      loadClient();
    }
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.name) { alert('O nome do cliente é obrigatório.'); return; }
    
    setLoading(true);
    setError(null);

    try {
      if (isEditing) {
        await clientService.updateClient(id!, client);
        alert('Cliente atualizado com sucesso!');
      } else {
        await clientService.createClient(client, contacts, addresses);
        alert('Cliente cadastrado com sucesso!');
      }
      navigate('/clientes');
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      const detail = err.message || 'Erro de conexão com o banco.';
      setError(`Falha ao salvar: ${detail}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-ghost btn-icon" onClick={() => navigate('/clientes')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</h1>
            <p className="page-subtitle">Preencha os dados do cliente para prosseguir</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/clientes')} disabled={loading}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <div className="spinner spinner-sm"></div> : <Save size={16} />}
            Salvar Cliente
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      <div className="form-grid">
        {/* Basic Info */}
        <div className="card">
          <h2 className="card-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
            {client.type === 'PJ' ? <Building size={18} color="var(--primary-400)" /> : <User size={18} color="var(--accent-400)" />}
            Dados Principais
          </h2>
          
          <div className="input-group mb-4">
            <label className="input-label">Tipo de Pessoa</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="type" checked={client.type === 'PJ'} onChange={() => setClient({ ...client, type: 'PJ' })} /> Pessoa Jurídica (CNPJ)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="type" checked={client.type === 'PF'} onChange={() => setClient({ ...client, type: 'PF' })} /> Pessoa Física (CPF)
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="input-group">
              <label className="input-label">Nome / Razão Social</label>
              <input type="text" className="input" value={client.name} onChange={e => setClient({...client, name: e.target.value})} required />
            </div>
            <div className="input-group">
              <label className="input-label">{client.type === 'PJ' ? 'CNPJ' : 'CPF'}</label>
              <input type="text" className="input" value={client.document || ''} onChange={e => setClient({...client, document: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="input-group">
              <label className="input-label">E-mail Principal</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input type="email" className="input" value={client.email || ''} onChange={e => setClient({...client, email: e.target.value})} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Telefone Principal</label>
              <div className="input-with-icon">
                <Phone size={16} className="input-icon" />
                <input type="tel" className="input" value={client.phone || ''} onChange={e => setClient({...client, phone: e.target.value})} />
              </div>
            </div>
          </div>
          
          <div className="input-group">
            <label className="input-label">Status</label>
            <select className="input" value={client.status} onChange={e => setClient({...client, status: e.target.value as any})}>
              <option value="active">Ativo</option>
              <option value="lead">Lead (Prospecto)</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
        </div>

        {/* Address */}
        <div className="card">
          <h2 className="card-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
            <MapPin size={18} color="var(--primary-400)" />
            Endereço Principal
          </h2>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="input-group">
              <label className="input-label">CEP</label>
              <input 
                type="text" 
                className="input" 
                placeholder="00000-000"
                value={addresses[0].zip_code || ''} 
                onChange={e => handleCepChange(e.target.value)} 
              />
            </div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label">Rua / Logradouro</label>
              <input type="text" className="input" value={addresses[0].street} onChange={e => {
                const newArr = [...addresses]; newArr[0].street = e.target.value; setAddresses(newArr);
              }} required />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="input-group">
              <label className="input-label">Número</label>
              <input type="text" className="input" value={addresses[0].number || ''} onChange={e => {
                const newArr = [...addresses]; newArr[0].number = e.target.value; setAddresses(newArr);
              }} />
            </div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label">Complemento</label>
              <input type="text" className="input" value={addresses[0].complement || ''} onChange={e => {
                const newArr = [...addresses]; newArr[0].complement = e.target.value; setAddresses(newArr);
              }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="input-group">
              <label className="input-label">Bairro</label>
              <input type="text" className="input" value={addresses[0].neighborhood || ''} onChange={e => {
                const newArr = [...addresses]; newArr[0].neighborhood = e.target.value; setAddresses(newArr);
              }} />
            </div>
            <div className="input-group">
              <label className="input-label">Cidade</label>
              <input type="text" className="input" value={addresses[0].city} onChange={e => {
                const newArr = [...addresses]; newArr[0].city = e.target.value; setAddresses(newArr);
              }} required />
            </div>
            <div className="input-group">
              <label className="input-label">Estado</label>
              <input type="text" className="input" value={addresses[0].state} onChange={e => {
                const newArr = [...addresses]; newArr[0].state = e.target.value; setAddresses(newArr);
              }} required />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
