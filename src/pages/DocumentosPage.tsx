import { useState, useEffect } from 'react';
import { Search, FileText, Download, Trash2, Folder, Filter, Upload, FileCode, FileImage, FileDown, Edit } from 'lucide-react';
import { documentService, type Document } from '../services/documentService';
import './DocumentosPage.css';

export default function DocumentosPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');

  const categories = ['Todos', 'Contratos', 'Manuais', 'Administrativo', 'Marketing', 'Modelos'];

  const [isDragging, setIsDragging] = useState(false);

  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [modalEditOpen, setModalEditOpen] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentService.getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setLoading(true);
      await documentService.uploadDocument(file, activeCategory === 'Todos' ? 'Geral' : activeCategory);
      alert('Arquivo enviado com sucesso!');
      loadDocuments();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao enviar arquivo.');
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
      loadDocuments();
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar categoria.');
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

  const handleDelete = async (id: string, url: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;
    try {
      setLoading(true);
      await documentService.deleteDocument(id, url);
      loadDocuments();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir documento.');
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type?.includes('image')) return <FileImage size={32} color="var(--success-400)" />;
    if (type?.includes('pdf')) return <FileText size={32} color="var(--danger-400)" />;
    if (type?.includes('zip') || type?.includes('rar')) return <FileDown size={32} color="var(--warning-400)" />;
    return <FileCode size={32} color="var(--primary-400)" />;
  };

  const filteredDocs = documents.filter(doc => 
    (activeCategory === 'Todos' || doc.category === activeCategory) &&
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="page-title">Documentos (GED)</h1>
          <p className="page-subtitle">Central de arquivos e documentos da empresa</p>
        </div>
        <div>
          <input 
            type="file" 
            id="file-upload" 
            style={{ display: 'none' }} 
            onChange={onFileChange}
          />
          <button className="btn btn-primary" onClick={() => document.getElementById('file-upload')?.click()} disabled={loading}>
            <Upload size={16} /> {loading ? 'Enviando...' : 'Upload de Arquivo'}
          </button>
        </div>
      </div>

      <div className="doc-layout">
        <aside className="doc-sidebar card">
          <h3 className="sidebar-title"><Filter size={16}/> Categorias</h3>
          <div className="category-list">
            {categories.map(cat => (
              <button 
                key={cat} 
                className={`category-item ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                <Folder size={16} />
                <span>{cat}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className={`doc-main ${isDragging ? 'drag-highlight' : ''}`}>
          {isDragging && (
            <div className="drag-overlay">
              <div className="drag-message">
                <Upload size={48} />
                <h3>Solte para fazer o Upload</h3>
                <p>O arquivo será salvo na categoria: <strong>{activeCategory}</strong></p>
              </div>
            </div>
          )}
          
          <div className="card mb-4">
            <div className="table-toolbar">
              <div className="search-bar">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar arquivos..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="doc-grid">
            {loading && documents.length === 0 ? (
              <div className="spinner-container"><div className="spinner"></div></div>
            ) : filteredDocs.length > 0 ? (
              filteredDocs.map(doc => (
                <div key={doc.id} className="doc-card card">
                  <div className="doc-icon">
                    {getFileIcon(doc.file_type || '')}
                  </div>
                  <div className="doc-info">
                    <h4 className="doc-name" title={doc.name}>{doc.name}</h4>
                    <span className="doc-meta">{doc.category} • {formatSize(doc.size_bytes)}</span>
                  </div>
                  <div className="doc-actions">
                    <button 
                      className="btn-ghost btn-icon" 
                      title="Editar Categoria"
                      onClick={() => { setEditingDocument(doc); setModalEditOpen(true); }}
                    >
                      <Edit size={16} />
                    </button>
                    <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn-ghost btn-icon" 
                      title="Baixar"
                      download={doc.name}
                    >
                      <Download size={16} />
                    </a>
                    <button 
                      className="btn-ghost btn-icon text-danger" 
                      title="Excluir"
                      onClick={() => handleDelete(doc.id, doc.url)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state card" style={{ textAlign: 'center', padding: '4rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
                <h3>Nenhum documento encontrado</h3>
                <p className="text-secondary">Arraste arquivos aqui para fazer o upload instantâneo.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Edit Category Modal */}
      {modalEditOpen && editingDocument && (
        <div className="modal-backdrop" onClick={() => setModalEditOpen(false)}>
          <div className="modal-content card" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <h2 className="card-title mb-4">Editar Categoria</h2>
            <p className="mb-4 text-secondary">Arquivo: <strong>{editingDocument.name}</strong></p>
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
