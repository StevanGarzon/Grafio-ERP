import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, AlertCircle, Calendar, MoreHorizontal } from 'lucide-react';
import { osService } from '../services/osService';
import './ProducaoPage.css';

// Types for Kanban
type ColumnType = 'pending' | 'production' | 'finishing' | 'ready';
interface Column {
  id: ColumnType;
  title: string;
  color: string;
}

const columns: Column[] = [
  { id: 'pending', title: 'Fila de Espera', color: 'var(--neutral-500)' },
  { id: 'production', title: 'Em Produção', color: 'var(--primary-500)' },
  { id: 'finishing', title: 'Acabamento', color: 'var(--warning-500)' },
  { id: 'ready', title: 'Pronto p/ Entrega', color: 'var(--accent-500)' }
];

export default function ProducaoPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await osService.getServiceOrders();
      // Only show tasks that belong to the Kanban columns
      const kanbanStatuses = ['pending', 'production', 'finishing', 'ready'];
      setTasks(data.filter(os => kanbanStatuses.includes(os.status)));
    } catch (error) {
      console.error('Erro ao carregar produção:', error);
    } finally {
      setLoading(false);
    }
  };

  const moveTask = async (taskId: string, newStatus: ColumnType) => {
    try {
      // Update locally for speed
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      
      // Save to DB
      await osService.updateServiceOrderStatus(taskId, newStatus);
    } catch (error) {
      console.error('Erro ao mover tarefa:', error);
      alert('Erro ao salvar nova posição.');
      loadTasks(); // Reload to sync with DB
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return <span className="kanban-badge bg-danger">Urgente</span>;
      case 'high': return <span className="kanban-badge bg-warning">Alta</span>;
      default: return null;
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

  return (
    <div className="page-container animate-fade-in" style={{ height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }} onClick={() => setActiveMenu(null)}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <div>
          <h1 className="page-title">PCP - Painel de Controle de Produção</h1>
          <p className="page-subtitle">Acompanhe o fluxo de trabalho (Kanban)</p>
        </div>
      </div>

      <div className="kanban-board">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          
          return (
            <div key={col.id} className="kanban-column">
              <div className="kanban-column-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="kanban-column-dot" style={{ background: col.color }}></div>
                  <h3 className="kanban-column-title">{col.title}</h3>
                </div>
                <span className="kanban-column-count">{colTasks.length}</span>
              </div>
              
              <div className="kanban-column-content">
                {colTasks.map(task => (
                  <div key={task.id} className="kanban-card" onClick={(e) => e.stopPropagation()}>
                    <div className="kanban-card-header">
                      <span className="kanban-os-number" onClick={() => navigate(`/ordens-servico/${task.id}`)} style={{ cursor: 'pointer' }}>
                        OS-{String(task.number).padStart(5, '0')}
                      </span>
                      <div style={{ position: 'relative' }}>
                        <button 
                          className="btn-ghost btn-icon kanban-more"
                          onClick={() => setActiveMenu(activeMenu === task.id ? null : task.id)}
                        >
                          <MoreHorizontal size={14} />
                        </button>
                        
                        {activeMenu === task.id && (
                          <div className="dropdown-menu-custom" style={{ right: 0, top: '100%', minWidth: '150px', zIndex: 100 }}>
                            <button onClick={() => navigate(`/ordens-servico/${task.id}`)}>Visualizar O.S.</button>
                            <button onClick={() => navigate(`/ordens-servico/${task.id}/editar`)}>Editar O.S.</button>
                            <div className="dropdown-divider"></div>
                            <button className="delete" onClick={() => moveTask(task.id, 'cancelled' as any)}>Cancelar O.S.</button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <h4 className="kanban-card-title">{task.description}</h4>
                    <p className="kanban-card-client">{task.client?.name}</p>
                    
                    <div className="kanban-card-footer">
                      <div className="kanban-card-date">
                        <Calendar size={12} />
                        <span className={task.priority === 'urgent' ? 'text-danger font-bold' : ''}>
                          {task.delivery_date ? new Date(task.delivery_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'A Combinar'}
                        </span>
                      </div>
                      <div className="kanban-card-badges">
                        {getPriorityBadge(task.priority)}
                      </div>
                    </div>

                    {/* Quick Move Buttons (Since drag&drop is complex without libraries, we add quick action buttons) */}
                    <div className="kanban-card-actions">
                      {col.id !== 'pending' && <button onClick={() => moveTask(task.id, columns[columns.findIndex(c => c.id === col.id) - 1].id as ColumnType)}>← Voltar</button>}
                      {col.id !== 'ready' && <button onClick={() => moveTask(task.id, columns[columns.findIndex(c => c.id === col.id) + 1].id as ColumnType)}>Avançar →</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
