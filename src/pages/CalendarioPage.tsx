import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, Trash2, X, Save } from 'lucide-react';
import './CalendarioPage.css';

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const DAYS_WEEK_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const CATEGORY_LABELS: Record<string, string> = {
  technical_visit: 'Visita Técnica',
  installation: 'Instalação',
  meeting: 'Reunião com Cliente',
  reminder: 'Lembrete / Tarefa',
};

const emptyEventForm = {
  title: '',
  category: 'technical_visit' as 'technical_visit' | 'installation' | 'meeting' | 'reminder',
  date: new Date().toISOString().split('T')[0],
  time: '09:00',
  client: '',
  description: '',
};

interface CalendarEvent {
  id: string;
  title: string;
  category: 'technical_visit' | 'installation' | 'meeting' | 'reminder';
  date: string;
  time: string;
  client: string;
  description: string;
}

function toISO(d: Date) {
  return d.toISOString().split('T')[0];
}

function getMonthDaysGrid(baseDate: Date) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  
  // Get index of the first day of the month (e.g. 0 is Sunday, 1 is Monday...)
  const firstDayIndex = new Date(year, month, 1).getDay();
  
  // Get total days in the month
  const totalDays = new Date(year, month + 1, 0).getDate();
  
  // Get total days in the previous month
  const prevMonthTotalDays = new Date(year, month, 0).getDate();
  
  const days: { date: Date; isCurrentMonth: boolean }[] = [];
  
  // 1. Fill previous month padded days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthTotalDays - i),
      isCurrentMonth: false,
    });
  }
  
  // 2. Fill current month days
  for (let i = 1; i <= totalDays; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }
  
  // 3. Fill next month padded days up to standard 42 cells grid
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }
  
  return days;
}

export default function CalendarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('grafio_calendar_events');
    if (saved) return JSON.parse(saved);
    
    // Seed beautiful initial mock events
    const today = new Date();
    const getSeedDate = (dayOffset: number) => {
      const d = new Date(today);
      d.setDate(today.getDate() + dayOffset);
      return toISO(d);
    };

    return [
      {
        id: 'evt-1',
        title: 'Instalação Fachada Luminosa',
        category: 'installation' as const,
        date: getSeedDate(-2),
        time: '08:30',
        client: 'Supermercado Sol',
        description: 'Instalação física e elétrica do painel luminoso frontal em estrutura metálica com cantoneiras de reforço.'
      },
      {
        id: 'evt-2',
        title: 'Visita Técnica / Medições de Altura',
        category: 'technical_visit' as const,
        date: getSeedDate(-1),
        time: '14:00',
        client: 'Clínica Sorrir Sempre',
        description: 'Levantamento métrico preciso e registros fotográficos da fachada superior para projeto de ACM.'
      },
      {
        id: 'evt-3',
        title: 'Reunião Briefing - Letreiro Backlight',
        category: 'meeting' as const,
        date: getSeedDate(1),
        time: '10:00',
        client: 'Academia FitLife',
        description: 'Apresentação da proposta conceitual em 3D e validação do orçamento comercial.'
      },
      {
        id: 'evt-4',
        title: 'Manutenção Preventiva - Totem Combustível',
        category: 'technical_visit' as const,
        date: getSeedDate(3),
        time: '09:00',
        client: 'Posto Petrobrás Central',
        description: 'Substituição das fontes de alimentação queimadas e ajuste dos módulos de LED.'
      },
      {
        id: 'evt-5',
        title: 'Entrega de Placas de Sinalização Interna',
        category: 'installation' as const,
        date: getSeedDate(5),
        time: '11:30',
        client: 'Condomínio Spazio',
        description: 'Fixação de placas de acrílico com espaçadores de inox em rotas de fuga e elevadores.'
      },
      {
        id: 'evt-6',
        title: 'Revisar Estoque de Lonas e Tintas Solventes',
        category: 'reminder' as const,
        date: getSeedDate(2),
        time: '16:30',
        client: 'GRAFIO Produção',
        description: 'Verificar inventário de rolos de lona 440g e estoque de tintas de impressão solvente Mimaki.'
      }
    ];
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState(emptyEventForm);

  useEffect(() => {
    localStorage.setItem('grafio_calendar_events', JSON.stringify(events));
  }, [events]);

  const daysGrid = getMonthDaysGrid(currentDate);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToday = () => {
    setCurrentDate(new Date());
  };

  const openNew = (dateStr?: string) => {
    setEditingEvent(null);
    setForm({
      ...emptyEventForm,
      date: dateStr || toISO(new Date()),
    });
    setModalOpen(true);
  };

  const openEdit = (evt: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvent(evt);
    setForm({
      title: evt.title,
      category: evt.category,
      date: evt.date,
      time: evt.time,
      client: evt.client,
      description: evt.description,
    });
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent) {
      setEvents(prev => prev.map(evt => evt.id === editingEvent.id ? { ...form, id: evt.id } : evt));
    } else {
      const newEvent = {
        ...form,
        id: `evt-${Date.now()}`,
      };
      setEvents(prev => [...prev, newEvent]);
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Deseja excluir este compromisso do calendário?')) return;
    setEvents(prev => prev.filter(evt => evt.id !== id));
    setModalOpen(false);
  };

  // Sort upcoming events chronologically
  const upcomingEvents = events
    .filter(evt => evt.date >= toISO(new Date()))
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
    .slice(0, 8);

  const todayISO = toISO(new Date());

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendário & Agenda</h1>
          <p className="page-subtitle">Central de agendamentos operacionais, visitas de campo e reuniões</p>
        </div>
        <button className="btn btn-primary" onClick={() => openNew()}>
          <Plus size={16} /> Novo Compromisso
        </button>
      </div>

      <div className="cal-page-grid">
        {/* Main Calendar Section */}
        <div className="cal-main-col card">
          <div className="cal-header-row">
            <h2 className="cal-month-title">
              {MONTHS_PT[currentDate.getMonth()]} de {currentDate.getFullYear()}
            </h2>
            <div className="cal-nav-btns">
              <button className="btn btn-secondary btn-sm" onClick={prevMonth}>
                <ChevronLeft size={16} />
              </button>
              <button className="btn btn-secondary btn-sm" onClick={goToday}>
                Hoje
              </button>
              <button className="btn btn-secondary btn-sm" onClick={nextMonth}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday Row */}
          <div className="cal-weekday-row">
            {DAYS_WEEK_PT.map(d => (
              <div key={d} className="cal-weekday-label">
                {d}
              </div>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="cal-month-grid">
            {daysGrid.map(({ date, isCurrentMonth }, idx) => {
              const dateStr = toISO(date);
              const isToday = dateStr === todayISO;
              const cellEvents = events.filter(evt => evt.date === dateStr);
              
              return (
                <div 
                  key={idx} 
                  className={`cal-day-cell ${isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''}`}
                  onClick={() => openNew(dateStr)}
                >
                  <div className="cal-cell-header">
                    <span className="cal-day-number">{date.getDate()}</span>
                  </div>
                  
                  <div className="cal-cell-events">
                    {cellEvents.map(evt => (
                      <div
                        key={evt.id}
                        className={`cal-mini-event ${evt.category}`}
                        title={`${evt.title} - ${evt.time}`}
                        onClick={(e) => openEdit(evt, e)}
                      >
                        {evt.time.slice(0, 5)} {evt.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar Agenda Section */}
        <div className="cal-agenda-sidebar">
          <div className="cal-agenda-title-row">
            <h3 className="cal-agenda-title">Próximos Compromissos</h3>
            <span className="badge badge-secondary">{upcomingEvents.length}</span>
          </div>

          <div className="cal-agenda-list">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map(evt => {
                const dateParts = evt.date.split('-');
                const formattedDate = `${dateParts[2]}/${dateParts[1]}`;
                return (
                  <div 
                    key={evt.id} 
                    className="cal-agenda-item"
                    onClick={(e) => openEdit(evt, e)}
                  >
                    <div className="cal-agenda-meta">
                      <span className={`cal-category-tag ${evt.category}`}>
                        {CATEGORY_LABELS[evt.category]}
                      </span>
                      <span className="cal-agenda-time">
                        <Clock size={10} /> {formattedDate} às {evt.time.slice(0, 5)}
                      </span>
                    </div>
                    <div className="cal-agenda-subject">{evt.title}</div>
                    {evt.client && <div className="cal-agenda-client">Cliente: {evt.client}</div>}
                    {evt.description && <div className="cal-agenda-desc">{evt.description}</div>}
                  </div>
                );
              })
            ) : (
              <div className="cal-agenda-empty">
                Não há compromissos futuros agendados.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-content card" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="card-title">{editingEvent ? 'Editar Compromisso' : 'Novo Compromisso'}</h2>
              <button className="btn-icon-xs" onClick={() => setModalOpen(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleSave}>
              <div className="input-group mb-4">
                <label className="input-label">Título do Compromisso</label>
                <input 
                  type="text" 
                  className="input" 
                  required 
                  value={form.title} 
                  onChange={e => setForm({...form, title: e.target.value})} 
                  placeholder="Ex: Instalação Painel de ACM" 
                />
              </div>

              <div className="form-row mb-4">
                <div className="input-group">
                  <label className="input-label">Categoria</label>
                  <select 
                    className="input" 
                    value={form.category} 
                    onChange={e => setForm({...form, category: e.target.value as any})}
                  >
                    <option value="technical_visit">Visita Técnica</option>
                    <option value="installation">Instalação</option>
                    <option value="meeting">Reunião com Cliente</option>
                    <option value="reminder">Lembrete / Tarefa</option>
                  </select>
                </div>
                
                <div className="input-group">
                  <label className="input-label">Cliente</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={form.client} 
                    onChange={e => setForm({...form, client: e.target.value})} 
                    placeholder="Nome do cliente" 
                  />
                </div>
              </div>

              <div className="form-row mb-4">
                <div className="input-group">
                  <label className="input-label">Data</label>
                  <input 
                    type="date" 
                    className="input" 
                    required 
                    value={form.date} 
                    onChange={e => setForm({...form, date: e.target.value})} 
                  />
                </div>
                
                <div className="input-group">
                  <label className="input-label">Horário</label>
                  <input 
                    type="time" 
                    className="input" 
                    required 
                    value={form.time} 
                    onChange={e => setForm({...form, time: e.target.value})} 
                  />
                </div>
              </div>

              <div className="input-group mb-6">
                <label className="input-label">Descrição / Notas de Campo</label>
                <textarea 
                  className="input" 
                  rows={3} 
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                  placeholder="Materiais necessários, pauta da reunião ou notas adicionais..."
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {editingEvent && (
                    <button 
                      type="button" 
                      className="btn btn-secondary danger btn-sm" 
                      onClick={(e) => handleDelete(editingEvent.id, e)}
                    >
                      <Trash2 size={12} style={{ display: 'inline', marginRight: '0.25rem' }} /> Excluir
                    </button>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">
                    <Save size={14} /> Salvar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
