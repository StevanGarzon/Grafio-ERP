import { useState, useEffect } from 'react';
import { Search, Download, Info, FileText, Settings, ClipboardCheck, Receipt, FolderOpen, FileDown, FileCode, Upload, Trash2, Edit } from 'lucide-react';
import { documentService, type Document } from '../services/documentService';
import './ModelosPage.css';

export default function ModelosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Todos');
  const [templates, setTemplates] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [modalEditOpen, setModalEditOpen] = useState(false);

  const categories = ['Todos', 'Produção', 'Instalação/Campo', 'Administrativo', 'Qualidade/POPs'];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const allDocs = await documentService.getDocuments();
      const modelDocs = allDocs.filter(d => 
        d.category === 'Modelos' || 
        d.category === 'Produção' ||
        d.category === 'Instalação/Campo' ||
        d.category === 'Administrativo' ||
        d.category === 'Qualidade/POPs' ||
        d.name.toLowerCase().includes('modelo') || 
        d.name.toLowerCase().includes('checklist') || 
        d.name.toLowerCase().includes('pop')
      );
      setTemplates(modelDocs);
    } catch (error) {
      console.error('Erro ao carregar modelos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setLoading(true);
      const category = activeTab === 'Todos' ? 'Modelos' : activeTab;
      await documentService.uploadDocument(file, category);
      alert('Modelo enviado com sucesso!');
      loadTemplates();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao enviar modelo.');
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleUpdateCategory = async (id: string, newCategory: string) => {
    try {
      setLoading(true);
      await documentService.updateDocument(id, { category: newCategory });
      setModalEditOpen(false);
      loadTemplates();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao atualizar categoria.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, url: string) => {
    if (!confirm('Tem certeza que deseja excluir este modelo?')) return;
    try {
      setLoading(true);
      await documentService.deleteDocument(id, url);
      loadTemplates();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao excluir modelo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const getFileIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('checklist')) return ClipboardCheck;
    if (n.includes('recibo') || n.includes('termo')) return Receipt;
    if (n.includes('pop') || n.includes('manual')) return Settings;
    if (n.includes('produção')) return FolderOpen;
    return FileText;
  };

  const filtered = templates.filter(t => 
    (activeTab === 'Todos' || t.category === activeTab) &&
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div 
      className={`page-container animate-fade-in ${isDragging ? 'dragging-active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="page-header">
        <div>
          <h1 className="page-title">Modelos Operacionais</h1>
          <p className="page-subtitle">Biblioteca de documentos padrão, checklists e POPs da empresa</p>
        </div>
        <div>
          <input 
            type="file" 
            id="template-upload" 
            style={{ display: 'none' }} 
            onChange={onFileChange}
          />
          <button className="btn btn-primary" onClick={() => document.getElementById('template-upload')?.click()} disabled={loading}>
            <Upload size={16} /> {loading ? 'Enviando...' : 'Novo Modelo'}
          </button>
        </div>
      </div>

      <div className="card mb-6">
        <div className="table-toolbar" style={{ border: 'none' }}>
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar modelos..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="category-tabs mb-6" style={{ background: 'var(--bg-card)', padding: '0.5rem', borderRadius: 'var(--radius-lg)' }}>
        {categories.map(cat => (
          <button 
            key={cat} 
            className={`tab-btn ${activeTab === cat ? 'active' : ''}`}
            onClick={() => setActiveTab(cat)}
            style={{ borderRadius: 'var(--radius-md)', padding: '0.625rem 1.25rem' }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="templates-grid" style={{ position: 'relative' }}>
        {isDragging && (
          <div className="drag-overlay-simple" style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(51, 102, 255, 0.1)',
            border: '2px dashed var(--primary-500)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            backdropFilter: 'blur(4px)',
            color: 'var(--primary-500)',
            pointerEvents: 'none' // Evita o flickering
          }}>
            <Upload size={48} />
            <h3 style={{ marginTop: '1rem' }}>Solte para enviar o Modelo</h3>
          </div>
        )}

        {loading && templates.length === 0 ? (
          <div className="spinner-container"><div className="spinner"></div></div>
        ) : filtered.length > 0 ? (
          filtered.map(template => {
            const Icon = getFileIcon(template.name);
            return (
              <div key={template.id} className="template-card card">
                <div className="template-icon-box">
                  <Icon size={28} color="var(--primary-400)" />
                  <span className="format-badge">{template.file_type?.split('/')[1]?.toUpperCase() || 'ARQ'}</span>
                  <div className="template-quick-actions">
                    <button 
                      className="btn-icon-sm" 
                      title="Editar Categoria"
                      onClick={() => { setEditingDocument(template); setModalEditOpen(true); }}
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      className="btn-icon-sm text-danger" 
                      title="Excluir"
                      onClick={() => handleDelete(template.id, template.url)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="template-info">
                  <h3 className="template-name">{template.name}</h3>
                  <p className="template-desc">Modelo oficial para processos de {template.category}.</p>
                  <div className="template-meta">
                    <span className="badge badge-secondary">{template.category}</span>
                  </div>
                </div>
                <a 
                  href={template.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-outline w-full mt-4" 
                  style={{ gap: '0.75rem', textDecoration: 'none', justifyContent: 'center' }}
                  download={template.name}
                >
                  <Download size={16} /> Baixar Modelo
                </a>
              </div>
            );
          })
        ) : (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <h3>Nenhum modelo encontrado</h3>
            <p className="text-secondary">Arraste modelos aqui ou use o botão "Novo Modelo" para cadastrar.</p>
          </div>
        )}
      </div>

      <div className="info-box mt-8">
        <Info size={16} />
        <span>Estes documentos são modelos base. Recomenda-se revisá-los anualmente para manter a ISO/Qualidade.</span>
      </div>

      {/* Edit Category Modal */}
      {modalEditOpen && editingDocument && (
        <div className="modal-backdrop" onClick={() => setModalEditOpen(false)}>
          <div className="modal-content card" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <h2 className="card-title mb-4">Editar Categoria</h2>
            <p className="mb-4 text-secondary">Modelo: <strong>{editingDocument.name}</strong></p>
            <div className="input-group mb-6">
              <label className="input-label">Nova Categoria</label>
              <select 
                className="input" 
                defaultValue={editingDocument.category}
                onChange={(e) => handleUpdateCategory(editingDocument.id, e.target.value)}
              >
                {categories.filter(c => c !== 'Todos').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="Modelos">Geral (Modelos)</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setModalEditOpen(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
