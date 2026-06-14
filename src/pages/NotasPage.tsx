import { useState, useEffect } from 'react';
import { Plus, Trash2, Pin, PinOff, Search, Edit3, Check, X } from 'lucide-react';
import { noteService, type Note } from '../services/noteService';
import './NotasPage.css';

export default function NotasPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [content, setContent] = useState('');

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await noteService.getNotes();
      setNotes(data);
    } catch (error) {
      console.error('Erro ao carregar notas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    try {
      setLoading(true);
      if (editingNote) {
        await noteService.updateNote(editingNote.id, { content });
      } else {
        await noteService.createNote(content);
      }
      setContent('');
      setEditingNote(null);
      setIsAdding(false);
      loadNotes();
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Erro ao salvar nota.');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePin = async (note: Note) => {
    try {
      await noteService.updateNote(note.id, { is_pinned: !note.is_pinned });
      loadNotes();
    } catch (error) {
      alert('Erro ao fixar nota.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta nota?')) return;
    try {
      await noteService.deleteNote(id);
      loadNotes();
    } catch (error) {
      alert('Erro ao excluir nota.');
    }
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setContent(note.content);
    setIsAdding(true);
  };

  const filteredNotes = notes.filter(n => n.content.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notas Rápidas</h1>
          <p className="page-subtitle">Anotações e lembretes para sua equipe</p>
        </div>
        {!isAdding && (
          <button className="btn btn-primary" onClick={() => { setEditingNote(null); setContent(''); setIsAdding(true); }}>
            <Plus size={16} /> Nova Nota
          </button>
        )}
      </div>

      <div className="card mb-6">
        <div className="table-toolbar">
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar nas notas..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isAdding && (
        <div className="note-editor card animate-slide-in mb-6" style={{ borderLeft: `4px solid ${editingNote?.color || '#3b82f6'}` }}>
          <textarea 
            className="note-textarea" 
            placeholder="Digite sua nota aqui..."
            autoFocus
            value={content}
            onChange={e => setContent(e.target.value)}
          ></textarea>
          <div className="note-editor-footer">
            <button className="btn btn-secondary" onClick={() => { setIsAdding(false); setEditingNote(null); setContent(''); }}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave}>
              <Check size={16} /> {editingNote ? 'Atualizar Nota' : 'Salvar Nota'}
            </button>
          </div>
        </div>
      )}

      <div className="notes-grid">
        {loading && notes.length === 0 ? (
          <div className="spinner-container"><div className="spinner"></div></div>
        ) : filteredNotes.map(note => (
          <div key={note.id} className={`note-card ${note.is_pinned ? 'pinned' : ''}`} style={{ '--note-color': note.color } as any}>
            <div className="note-header">
              <span className="note-date">{new Date(note.created_at).toLocaleDateString('pt-BR')}</span>
              <button className="note-pin-btn" onClick={() => handleTogglePin(note)}>
                {note.is_pinned ? <PinOff size={16} /> : <Pin size={16} />}
              </button>
            </div>
            <div className="note-content">
              {note.content}
            </div>
            <div className="note-footer">
              <button className="note-action-btn" title="Editar" onClick={() => handleEdit(note)}><Edit3 size={14}/></button>
              <button className="note-action-btn delete" title="Excluir" onClick={() => handleDelete(note.id)}><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
        {!loading && filteredNotes.length === 0 && (
          <div className="empty-state card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>
            <p className="text-secondary">Nenhuma nota encontrada. Clique em "Nova Nota" para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
