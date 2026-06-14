import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Truck, Mail, Phone, MapPin } from 'lucide-react';
import { supplierService } from '../services/supplierService';

export default function FornecedorFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [supplier, setSupplier] = useState<any>({
    name: '',
    document: '',
    email: '',
    phone: '',
    categories: '',
    notes: '',
    status: 'active'
  });

  useEffect(() => {
    if (isEditing && id) {
      loadSupplier();
    }
  }, [id]);

  const loadSupplier = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getSupplierById(id!);
      setSupplier(data);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar dados do fornecedor.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing && id) {
        await supplierService.updateSupplier(id, supplier);
      } else {
        await supplierService.createSupplier(supplier);
      }
      navigate('/fornecedores');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar fornecedor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-ghost btn-icon" onClick={() => navigate('/fornecedores')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">{isEditing ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h1>
            <p className="page-subtitle">Cadastre os dados da empresa parceira</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/fornecedores')} disabled={loading}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <div className="spinner spinner-sm"></div> : <Save size={16} />}
            Salvar Fornecedor
          </button>
        </div>
      </div>

      <div className="form-grid">
        <div className="card">
          <h2 className="card-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
            <Truck size={18} color="var(--primary-400)" />
            Dados do Fornecedor
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="input-group">
              <label className="input-label">Razão Social / Nome Fantasia *</label>
              <input type="text" className="input" value={supplier.name} onChange={e => setSupplier({...supplier, name: e.target.value})} required />
            </div>
            <div className="input-group">
              <label className="input-label">CNPJ</label>
              <input type="text" className="input" value={supplier.document} onChange={e => setSupplier({...supplier, document: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="input-group">
              <label className="input-label">E-mail Comercial</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input type="email" className="input" value={supplier.email} onChange={e => setSupplier({...supplier, email: e.target.value})} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Telefone / WhatsApp</label>
              <div className="input-with-icon">
                <Phone size={16} className="input-icon" />
                <input type="tel" className="input" value={supplier.phone} onChange={e => setSupplier({...supplier, phone: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="input-group mb-4">
            <label className="input-label">Categorias Fornecidas</label>
            <input type="text" className="input" placeholder="Ex: Lonas, Tintas Eco-Solvente, Ferramentas" value={supplier.categories} onChange={e => setSupplier({...supplier, categories: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Status</label>
              <select className="input" value={supplier.status} onChange={e => setSupplier({...supplier, status: e.target.value})}>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
            <MapPin size={18} color="var(--neutral-400)" />
            Observações e Logística
          </h2>

          <div className="input-group">
            <label className="input-label">Anotações Internas (Prazos de entrega, frete, dias de faturamento)</label>
            <textarea className="input" rows={6} value={supplier.notes} onChange={e => setSupplier({...supplier, notes: e.target.value})} placeholder="Entrega apenas de terças e quintas. Faturamento para 30/60 dias."></textarea>
          </div>
        </div>
      </div>
    </div>
  );
}
