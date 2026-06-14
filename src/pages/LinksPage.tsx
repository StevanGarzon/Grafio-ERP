import { useState, useEffect } from 'react';
import { ExternalLink, Plus, Search, Trash2, Edit, Globe, Info } from 'lucide-react';
import { linkService, type Link } from '../services/linkService';
import './LinksPage.css';

export default function LinksPage() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [formData, setFormData] = useState({ title: '', url: '', category: 'Geral', description: '' });

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      setLoading(true);
      const data = await linkService.getLinks();
      setLinks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingLink) {
        await linkService.updateLink(editingLink.id, formData);
      } else {
        await linkService.createLink(formData);
      }
      setModalOpen(false);
      setEditingLink(null);
      setFormData({ title: '', url: '', category: 'Geral', description: '' });
      loadLinks();
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Erro ao salvar link.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este link?')) return;
    try {
      await linkService.deleteLink(id);
      loadLinks();
    } catch (error) {
      alert('Erro ao excluir.');
    }
  };

  const filteredLinks = links.filter(link => 
    link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Links Úteis</h1>
          <p className="page-subtitle">Acesso rápido aos portais e ferramentas externas</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingLink(null); setFormData({ title: '', url: '', category: 'Geral', description: '' }); setModalOpen(true); }}>
          <Plus size={16} /> Adicionar Link
        </button>
      </div>

      <div className="card mb-6">
        <div className="table-toolbar">
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por título ou categoria..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="links-grid">
        {loading ? (
          <div className="spinner-container"><div className="spinner"></div></div>
        ) : filteredLinks.length > 0 ? (
          filteredLinks.map(link => (
            <div key={link.id} className="link-card card">
              <div className="link-icon-box">
                <Globe size={24} color="var(--primary-400)" />
              </div>
              <div className="link-content">
                <div className="link-header">
                  <span className="link-category">{link.category}</span>
                  <div className="link-actions">
                    <button className="btn-icon-sm" onClick={() => { setEditingLink(link); setFormData({ title: link.title, url: link.url, category: link.category, description: link.description }); setModalOpen(true); }}><Edit size={14}/></button>
                    <button className="btn-icon-sm text-danger" onClick={() => handleDelete(link.id)}><Trash2 size={14}/></button>
                  </div>
                </div>
                <h3 className="link-title">{link.title}</h3>
                <p className="link-description">{link.description || 'Sem descrição'}</p>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm w-full mt-4" style={{ gap: '0.5rem' }}>
                  Acessar Site <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state card" style={{ gridColumn: '1/-1' }}>
            <Info size={32} />
            <p>Nenhum link encontrado. Comece adicionando um!</p>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-content card" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <h2 className="card-title mb-6">{editingLink ? 'Editar Link' : 'Novo Link Útil'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group mb-4">
                <label className="input-label">Título</label>
                <input type="text" className="input" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Receita Federal (NFe)" />
              </div>
              <div className="input-group mb-4">
                <label className="input-label">URL (Link)</label>
                <input type="url" className="input" required value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} placeholder="https://..." />
              </div>
              <div className="input-group mb-4">
                <label className="input-label">Categoria</label>
                <input type="text" className="input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Ex: Fiscal, Transportes, Fornecedores" />
              </div>
              <div className="input-group mb-6">
                <label className="input-label">Descrição (Opcional)</label>
                <textarea className="input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3}></textarea>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>Salvar Link</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
