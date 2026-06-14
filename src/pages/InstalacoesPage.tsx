import { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, MapPin, Clock, Users, Wrench, CheckCircle2, XCircle, Trash2, Edit, X, Save, ImageIcon, Printer, Search, FileText, DollarSign, Star } from 'lucide-react';
import { installationService, type Installation } from '../services/installationService';
import './InstalacoesPage.css';

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const STATUS_CONFIG = {
  scheduled:   { label: 'Agendado',    color: 'var(--primary-400)',  bg: 'rgba(51,102,255,0.12)' },
  in_progress: { label: 'Em andamento',color: 'var(--warning-400)',  bg: 'rgba(245,158,11,0.12)' },
  completed:   { label: 'Concluído',   color: 'var(--success-400)',  bg: 'rgba(16,185,129,0.12)' },
  cancelled:   { label: 'Cancelado',   color: 'var(--danger-400)',   bg: 'rgba(239,68,68,0.12)'  },
};

function getWeekDays(baseDate: Date) {
  const day = baseDate.getDay();
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toISO(d: Date) {
  return d.toISOString().split('T')[0];
}

const emptyForm = {
  client_name: '', address: '', service_type: 'Fachada',
  scheduled_date: toISO(new Date()), scheduled_time: '08:00',
  team_members: '', notes: '', status: 'scheduled' as Installation['status'],
  image_url: '',
};

const emptyReportForm = {
  clientName: '',
  osNumber: '',
  serviceType: 'Fachada',
  date: toISO(new Date()),
  installer: '',
  procedures: '',
  expenses: [] as { id: string; description: string; category: string; value: number }[],
  receipts: [] as string[],
  satisfaction: 5,
  status: 'completed' as const,
  checklist: { structure: true, electrical: false, clean: true, signature: false }
};

export default function InstalacoesPage() {
  const [activeTab, setActiveTab] = useState<'agenda' | 'reports'>('agenda');
  const [weekBase, setWeekBase] = useState(new Date());
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Installation | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  // Installation Reports States
  const [reports, setReports] = useState<any[]>(() => {
    const saved = localStorage.getItem('grafio_installation_reports');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'rep-1',
        clientName: 'Supermercado Sol',
        osNumber: 'OS-2026-440',
        serviceType: 'Luminoso',
        date: '2026-05-15',
        installer: 'Carlos Oliveira',
        procedures: 'Instalação do painel luminoso frontal em estrutura de aço reforçada com cantoneiras de 1.5 polegadas. Fixação feita com parabolts químicos devido ao substrato de concreto poroso. Isolamento e passagem da fiação elétrica interna e instalação de reator bivolt selado IP67 para os módulos de LED Samsung.',
        expenses: [
          { id: 'exp-1', description: 'Combustível veículo equipe', category: 'transporte', value: 120.00 },
          { id: 'exp-2', description: 'Parafusos auto-brocantes extras e fita isolante', category: 'ferragens', value: 45.90 },
          { id: 'exp-3', description: 'Almoço equipe de instalação (3 pessoas)', category: 'alimentacao', value: 85.00 }
        ],
        receipts: [
          'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80'
        ],
        satisfaction: 5,
        status: 'completed',
        checklist: { structure: true, electrical: true, clean: true, signature: true }
      },
      {
        id: 'rep-2',
        clientName: 'Clínica Sorrir Sempre',
        osNumber: 'OS-2026-445',
        serviceType: 'Adesivação',
        date: '2026-05-16',
        installer: 'Pedro Santos',
        procedures: 'Aplicação de vinil adesivo jateado com recorte eletrônico em divisórias de vidro temperado nas salas de consultórios 1, 2 e recepção. Utilizada espátula de feltro para evitar riscos e soprador térmico para acabamento e fixação nas bordas dos vidros.',
        expenses: [
          { id: 'exp-4', description: 'Almoço instaladores', category: 'alimentacao', value: 50.00 }
        ],
        receipts: [
          'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80'
        ],
        satisfaction: 4,
        status: 'pending',
        checklist: { structure: true, electrical: false, clean: true, signature: false }
      }
    ];
  });

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<any | null>(null);
  const [reportForm, setReportForm] = useState<typeof emptyReportForm>(emptyReportForm);
  const [printReport, setPrintReport] = useState<any | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    localStorage.setItem('grafio_installation_reports', JSON.stringify(reports));
  }, [reports]);

  const weekDays = getWeekDays(weekBase);
  const weekStart = toISO(weekDays[0]);
  const weekEnd   = toISO(weekDays[6]);

  useEffect(() => { loadInstallations(); }, [weekStart, weekEnd]);

  const loadInstallations = async () => {
    try {
      setLoading(true);
      const data = await installationService.getInstallations(weekStart, weekEnd);
      setInstallations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };


  const openEdit = (inst: Installation) => {
    setEditing(inst);
    setSavedId(inst.id);
    setForm({
      client_name: inst.client_name, address: inst.address,
      service_type: inst.service_type, scheduled_date: inst.scheduled_date,
      scheduled_time: inst.scheduled_time, team_members: inst.team_members,
      notes: inst.notes, status: inst.status,
      image_url: inst.image_url || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editing) {
        await installationService.updateInstallation(editing.id, form);
        setSavedId(editing.id);
      } else {
        const created = await installationService.createInstallation(form);
        setSavedId(created.id);
      }
      setModalOpen(false);
      loadInstallations();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar instalação.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    const targetId = savedId || editing?.id;
    if (!targetId) {
      alert('Salve a instalação primeiro antes de anexar uma imagem.');
      return;
    }
    try {
      setUploadingImage(true);
      const url = await installationService.uploadImage(file, targetId);
      await installationService.updateInstallation(targetId, { image_url: url });
      setForm(prev => ({ ...prev, image_url: url }));
      loadInstallations();
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar imagem.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta instalação?')) return;
    try {
      await installationService.deleteInstallation(id);
      loadInstallations();
    } catch (err) {
      alert('Erro ao excluir.');
    }
  };

  const handleStatus = async (inst: Installation, status: Installation['status']) => {
    try {
      await installationService.updateInstallation(inst.id, { status });
      loadInstallations();
    } catch (err) { console.error(err); }
  };

  const openNew = (date?: string) => {
    setEditing(null);
    setSavedId(null);
    setForm({ ...emptyForm, scheduled_date: date || toISO(new Date()) });
    setModalOpen(true);
  };

  const prevWeek = () => { const d = new Date(weekBase); d.setDate(d.getDate() - 7); setWeekBase(d); };
  const nextWeek = () => { const d = new Date(weekBase); d.setDate(d.getDate() + 7); setWeekBase(d); };
  const goToday  = () => setWeekBase(new Date());

  // Reports Specific Handlers
  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingReport) {
      setReports(prev => prev.map(r => r.id === editingReport.id ? { ...reportForm, id: r.id } : r));
    } else {
      const newReport = {
        ...reportForm,
        id: `rep-${Date.now()}`
      };
      setReports(prev => [newReport, ...prev]);
    }
    setReportModalOpen(false);
  };

  const handleDeleteReport = (id: string) => {
    if (!confirm('Tem certeza de que deseja excluir este relatório?')) return;
    setReports(prev => prev.filter(r => r.id !== id));
  };

  const openNewReport = () => {
    setEditingReport(null);
    setReportForm(emptyReportForm);
    setReportModalOpen(true);
  };

  const openEditReport = (rep: any) => {
    setEditingReport(rep);
    setReportForm(rep);
    setReportModalOpen(true);
  };

  const addExpenseRow = () => {
    setReportForm(prev => ({
      ...prev,
      expenses: [
        ...prev.expenses,
        { id: `exp-${Date.now()}`, description: '', category: 'alimentacao', value: 0 }
      ]
    }));
  };

  const updateExpenseField = (id: string, field: string, val: any) => {
    setReportForm(prev => ({
      ...prev,
      expenses: prev.expenses.map(exp => exp.id === id ? { ...exp, [field]: val } : exp)
    }));
  };

  const removeExpenseRow = (id: string) => {
    setReportForm(prev => ({
      ...prev,
      expenses: prev.expenses.filter(exp => exp.id !== id)
    }));
  };

  const handleMockReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReceipt(true);
    setTimeout(() => {
      const mockImages = [
        'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80'
      ];
      const selectedUrl = mockImages[Math.floor(Math.random() * mockImages.length)];
      setReportForm(prev => ({
        ...prev,
        receipts: [...prev.receipts, selectedUrl]
      }));
      setUploadingReceipt(false);
    }, 1000);
  };

  const removeReceipt = (url: string) => {
    setReportForm(prev => ({
      ...prev,
      receipts: prev.receipts.filter(r => r !== url)
    }));
  };

  const todayStr = toISO(new Date());
  const totalWeek = installations.length;
  const completedWeek = installations.filter(i => i.status === 'completed').length;

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header print-no-print">
        <div>
          <h1 className="page-title">{activeTab === 'agenda' ? 'Agenda de Instalações' : 'Relatórios de Instalação'}</h1>
          <p className="page-subtitle">
            {activeTab === 'agenda' ? 'Programação semanal da equipe de campo' : 'Gerenciamento de relatórios técnicos de serviços concluídos'}
          </p>
        </div>
        <div>
          {activeTab === 'agenda' ? (
            <button className="btn btn-primary" onClick={() => openNew()}>
              <Plus size={16} /> Nova Instalação
            </button>
          ) : (
            <button className="btn btn-primary" onClick={openNewReport}>
              <Plus size={16} /> Novo Relatório
            </button>
          )}
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="tabs-nav print-no-print">
        <button 
          className={`tab-btn ${activeTab === 'agenda' ? 'active' : ''}`}
          onClick={() => setActiveTab('agenda')}
        >
          <Clock size={16} /> Agenda de Campo
        </button>
        <button 
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <FileText size={16} /> Relatórios de Instalação
        </button>
      </div>

      {activeTab === 'agenda' ? (
        <>
          {/* Summary cards */}
          <div className="inst-summary-row mb-6">
            <div className="inst-summary-card">
              <span className="inst-summary-num">{totalWeek}</span>
              <span className="inst-summary-label">Esta semana</span>
            </div>
            <div className="inst-summary-card success">
              <span className="inst-summary-num">{completedWeek}</span>
              <span className="inst-summary-label">Concluídas</span>
            </div>
            <div className="inst-summary-card warning">
              <span className="inst-summary-num">{totalWeek - completedWeek}</span>
              <span className="inst-summary-label">Pendentes</span>
            </div>
          </div>

          {/* Week navigator */}
          <div className="week-nav card mb-6">
            <button className="btn btn-secondary btn-sm" onClick={prevWeek}><ChevronLeft size={18} /></button>
            <div className="week-nav-center">
              <span className="week-nav-label">
                {weekDays[0].getDate()} {MONTHS_PT[weekDays[0].getMonth()]} — {weekDays[6].getDate()} {MONTHS_PT[weekDays[6].getMonth()]} {weekDays[6].getFullYear()}
              </span>
              <button className="btn-today" onClick={goToday}>Hoje</button>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={nextWeek}><ChevronRight size={18} /></button>
          </div>

          {/* Weekly grid */}
          <div className="week-grid">
            {weekDays.map(day => {
              const dayStr = toISO(day);
              const isToday = dayStr === todayStr;
              const dayInsts = installations.filter(i => i.scheduled_date === dayStr);
              const isPast = dayStr < todayStr;

              return (
                <div key={dayStr} className={`day-column card ${isToday ? 'today' : ''} ${isPast ? 'past' : ''}`}>
                  {/* Day header */}
                  <div className="day-header">
                    <div className={`day-name ${isToday ? 'today' : ''}`}>{DAYS_PT[day.getDay()]}</div>
                    <div className={`day-num ${isToday ? 'today' : ''}`}>{day.getDate()}</div>
                    <button className="add-day-btn" title="Agendar neste dia" onClick={() => openNew(dayStr)}>
                      <Plus size={12} />
                    </button>
                  </div>

                  {/* Installations for this day */}
                  <div className="day-content">
                    {loading && dayInsts.length === 0 && (
                      <div className="day-loading"><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div></div>
                    )}
                    {dayInsts.map(inst => {
                      const s = STATUS_CONFIG[inst.status];
                      return (
                        <div
                          key={inst.id}
                          className="inst-card"
                          style={{ borderLeft: `3px solid ${s.color}`, background: s.bg }}
                        >
                          <div className="inst-card-header">
                            <span className="inst-status-badge" style={{ color: s.color }}>{s.label}</span>
                            <div className="inst-card-actions">
                              <button className="btn-icon-xs" onClick={() => openEdit(inst)}><Edit size={11} /></button>
                              <button className="btn-icon-xs danger" onClick={() => handleDelete(inst.id)}><Trash2 size={11} /></button>
                            </div>
                          </div>
                          <div className="inst-client">{inst.client_name}</div>
                          {inst.image_url && (
                            <div className="inst-thumbnail">
                              <img src={inst.image_url} alt="Miniatura do serviço" />
                            </div>
                          )}
                          <div className="inst-detail"><Clock size={11} /> {inst.scheduled_time.slice(0,5)}</div>
                          {inst.address && <div className="inst-detail"><MapPin size={11} /> {inst.address}</div>}
                          {inst.team_members && <div className="inst-detail"><Users size={11} /> {inst.team_members}</div>}
                          {inst.service_type && <div className="inst-detail"><Wrench size={11} /> {inst.service_type}</div>}
                          <div className="inst-card-btns">
                            {inst.status !== 'completed' && (
                              <button className="btn-status success" onClick={() => handleStatus(inst, 'completed')}>
                                <CheckCircle2 size={11} /> Concluir
                              </button>
                            )}
                            {inst.status !== 'cancelled' && inst.status !== 'completed' && (
                              <button className="btn-status danger" onClick={() => handleStatus(inst, 'cancelled')}>
                                <XCircle size={11} /> Cancelar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {!loading && dayInsts.length === 0 && (
                      <div className="day-empty" onClick={() => openNew(dayStr)}>+ Agendar</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* Reports Summary Row */}
          <div className="inst-summary-row mb-6 print-no-print">
            <div className="inst-summary-card">
              <span className="inst-summary-num">{reports.length}</span>
              <span className="inst-summary-label">Relatórios Criados</span>
            </div>
            <div className="inst-summary-card success">
              <span className="inst-summary-num font-sans" style={{ fontSize: '1.5rem', wordBreak: 'break-all' }}>
                R$ {reports.reduce((sum, rep) => sum + rep.expenses.reduce((s: number, e: any) => s + Number(e.value || 0), 0), 0).toFixed(2).replace('.', ',')}
              </span>
              <span className="inst-summary-label">Gastos Totais Reembolsados</span>
            </div>
            <div className="inst-summary-card warning">
              <span className="inst-summary-num">
                {reports.filter(r => r.status === 'pending').length}
              </span>
              <span className="inst-summary-label">Relatórios Pendentes</span>
            </div>
          </div>

          {/* Reports List & Filter card */}
          <div className="card mb-6 print-no-print">
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="input-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Buscar por cliente, instalador, OS..." 
                    style={{ paddingLeft: '2.25rem' }}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                </div>
              </div>
              
              <div className="input-group" style={{ width: 180, marginBottom: 0 }}>
                <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="all">Todos os Status</option>
                  <option value="completed">Concluídos</option>
                  <option value="pending">Pendentes</option>
                  <option value="needs_adjustment">Requer Ajustes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reports Table Grid */}
          <div className="reports-table-container print-no-print">
            {reports.filter(r => {
              const matchesSearch = r.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    r.installer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    (r.osNumber && r.osNumber.toLowerCase().includes(searchQuery.toLowerCase()));
              const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
              return matchesSearch && matchesStatus;
            }).length > 0 ? (
              <table className="reports-table">
                <thead>
                  <tr>
                    <th className="reports-th">Cliente</th>
                    <th className="reports-th">OS</th>
                    <th className="reports-th">Serviço</th>
                    <th className="reports-th">Data</th>
                    <th className="reports-th">Instalador</th>
                    <th className="reports-th">Gastos</th>
                    <th className="reports-th">Status</th>
                    <th className="reports-th" style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.filter(r => {
                    const matchesSearch = r.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                          r.installer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                          (r.osNumber && r.osNumber.toLowerCase().includes(searchQuery.toLowerCase()));
                    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
                    return matchesSearch && matchesStatus;
                  }).map(rep => {
                    const totalSpent = rep.expenses.reduce((s: number, e: any) => s + Number(e.value || 0), 0);
                    return (
                      <tr key={rep.id}>
                        <td className="reports-td" style={{ fontWeight: 600 }}>{rep.clientName}</td>
                        <td className="reports-td"><span className="badge badge-secondary">{rep.osNumber || '-'}</span></td>
                        <td className="reports-td">{rep.serviceType}</td>
                        <td className="reports-td">{new Date(rep.date).toLocaleDateString('pt-BR')}</td>
                        <td className="reports-td">{rep.installer}</td>
                        <td className="reports-td" style={{ color: 'var(--success-400)', fontWeight: 600 }}>
                          R$ {totalSpent.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="reports-td">
                          <span className="badge" style={{ 
                            background: rep.status === 'completed' ? 'rgba(16,185,129,0.12)' : 
                                        rep.status === 'pending' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                            color: rep.status === 'completed' ? 'var(--success-400)' : 
                                   rep.status === 'pending' ? 'var(--warning-400)' : 'var(--danger-400)'
                          }}>
                            {rep.status === 'completed' ? 'Concluído' : rep.status === 'pending' ? 'Pendente' : 'Requer Ajuste'}
                          </span>
                        </td>
                        <td className="reports-td" style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button className="btn-icon-xs" title="Visualizar & Imprimir" onClick={() => setPrintReport(rep)}>
                              <Printer size={12} />
                            </button>
                            <button className="btn-icon-xs" title="Editar Relatório" onClick={() => openEditReport(rep)}>
                              <Edit size={12} />
                            </button>
                            <button className="btn-icon-xs danger" title="Excluir Relatório" onClick={() => handleDeleteReport(rep.id)}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <FileText size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <p>Nenhum relatório de instalação encontrado.</p>
                <button className="btn btn-primary btn-sm mt-4" onClick={openNewReport}>
                  <Plus size={12} /> Criar Primeiro Relatório
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-content card" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="card-title">{editing ? 'Editar Instalação' : 'Nova Instalação'}</h2>
              <button className="btn-icon-xs" onClick={() => setModalOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-row mb-4">
                <div className="input-group">
                  <label className="input-label">Data</label>
                  <input type="date" className="input" required value={form.scheduled_date} onChange={e => setForm({...form, scheduled_date: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="input-label">Horário</label>
                  <input type="time" className="input" required value={form.scheduled_time} onChange={e => setForm({...form, scheduled_time: e.target.value})} />
                </div>
              </div>
              <div className="input-group mb-4">
                <label className="input-label">Cliente</label>
                <input type="text" className="input" required value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} placeholder="Nome do cliente" />
              </div>
              <div className="input-group mb-4">
                <label className="input-label">Endereço</label>
                <input type="text" className="input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Endereço da instalação" />
              </div>
              <div className="form-row mb-4">
                <div className="input-group">
                  <label className="input-label">Tipo de Serviço</label>
                  <select className="input" value={form.service_type} onChange={e => setForm({...form, service_type: e.target.value})}>
                    {['Fachada', 'Letreiro', 'Totem', 'Adesivação', 'Plotagem', 'Luminoso', 'Manutenção'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Status</label>
                  <select className="input" value={form.status} onChange={e => setForm({...form, status: e.target.value as any})}>
                    <option value="scheduled">Agendado</option>
                    <option value="in_progress">Em andamento</option>
                    <option value="completed">Concluído</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>
              <div className="input-group mb-4">
                <label className="input-label">Equipe</label>
                <input type="text" className="input" value={form.team_members} onChange={e => setForm({...form, team_members: e.target.value})} placeholder="Ex: Carlos, Pedro" />
              </div>
              <div className="input-group mb-4">
                <label className="input-label">Imagem do Serviço</label>
                <input
                  type="file"
                  id="inst-img-upload"
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                />
                <div
                  className="inst-img-upload-area"
                  onClick={() => document.getElementById('inst-img-upload')?.click()}
                >
                  {form.image_url ? (
                    <img src={form.image_url} alt="Preview" className="inst-img-preview" />
                  ) : (
                    <div className="inst-img-placeholder">
                      {uploadingImage ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : <><ImageIcon size={20} /><span>Clique para anexar imagem do serviço</span></>}
                    </div>
                  )}
                </div>
              </div>
              <div className="input-group mb-6">
                <label className="input-label">Observações</label>
                <textarea className="input" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Materiais necessários, detalhes..."></textarea>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Save size={14} /> {editing ? 'Salvar Alterações' : 'Agendar Instalação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="modal-backdrop print-no-print" onClick={() => setReportModalOpen(false)}>
          <div className="modal-content card" style={{ maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="card-title">{editingReport ? 'Editar Relatório de Instalação' : 'Novo Relatório de Instalação'}</h2>
              <button className="btn-icon-xs" onClick={() => setReportModalOpen(false)}><X size={16} /></button>
            </div>
            
            <form onSubmit={handleSaveReport}>
              <div className="form-row mb-4">
                <div className="input-group">
                  <label className="input-label">Cliente</label>
                  <input type="text" className="input" required value={reportForm.clientName} onChange={e => setReportForm({...reportForm, clientName: e.target.value})} placeholder="Nome do cliente" />
                </div>
                <div className="input-group">
                  <label className="input-label">Número da OS</label>
                  <input type="text" className="input" value={reportForm.osNumber} onChange={e => setReportForm({...reportForm, osNumber: e.target.value})} placeholder="Ex: OS-2026-102" />
                </div>
              </div>

              <div className="form-row mb-4">
                <div className="input-group">
                  <label className="input-label">Tipo de Serviço</label>
                  <select className="input" value={reportForm.serviceType} onChange={e => setReportForm({...reportForm, serviceType: e.target.value})}>
                    {['Fachada', 'Letreiro', 'Totem', 'Adesivação', 'Plotagem', 'Luminoso', 'Manutenção'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Data da Instalação</label>
                  <input type="date" className="input" required value={reportForm.date} onChange={e => setReportForm({...reportForm, date: e.target.value})} />
                </div>
              </div>

              <div className="form-row mb-4">
                <div className="input-group">
                  <label className="input-label">Instalador Líder</label>
                  <input type="text" className="input" required value={reportForm.installer} onChange={e => setReportForm({...reportForm, installer: e.target.value})} placeholder="Responsável de campo" />
                </div>
                <div className="input-group">
                  <label className="input-label">Status do Relatório</label>
                  <select className="input" value={reportForm.status} onChange={e => setReportForm({...reportForm, status: e.target.value as any})}>
                    <option value="completed">Concluído e Aprovado</option>
                    <option value="pending">Em Análise / Pendente</option>
                    <option value="needs_adjustment">Requer Ajustes</option>
                  </select>
                </div>
              </div>

              <div className="input-group mb-4">
                <label className="input-label">Descritivo dos Procedimentos Técnicos</label>
                <textarea 
                  className="input" 
                  rows={4} 
                  required
                  value={reportForm.procedures} 
                  onChange={e => setReportForm({...reportForm, procedures: e.target.value})} 
                  placeholder="Descreva o passo-a-passo técnico realizado na instalação física, elétrica, fixações, etc..."
                />
              </div>

              {/* Expense ledger section */}
              <div className="mb-4">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label className="input-label" style={{ marginBottom: 0 }}><DollarSign size={14} style={{ display: 'inline', marginRight: '0.25rem' }} /> Tabela de Gastos e Reembolsos de Campo</label>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addExpenseRow}>
                    + Adicionar Gasto
                  </button>
                </div>
                
                {reportForm.expenses.length > 0 ? (
                  <div className="expenses-table-container">
                    <table className="expenses-table">
                      <thead>
                        <tr>
                          <th className="expenses-th" style={{ width: '45%' }}>Descrição do Gasto</th>
                          <th className="expenses-th" style={{ width: '25%' }}>Categoria</th>
                          <th className="expenses-th" style={{ width: '20%' }}>Valor (R$)</th>
                          <th className="expenses-th" style={{ width: '10%', textAlign: 'right' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportForm.expenses.map((exp: any) => (
                          <tr key={exp.id}>
                            <td className="expenses-td">
                              <input 
                                type="text" 
                                className="input input-sm" 
                                required
                                placeholder="Ex: Pedágio, Parafusos extras..." 
                                value={exp.description}
                                onChange={e => updateExpenseField(exp.id, 'description', e.target.value)}
                              />
                            </td>
                            <td className="expenses-td">
                              <select 
                                className="input input-sm"
                                value={exp.category}
                                onChange={e => updateExpenseField(exp.id, 'category', e.target.value)}
                              >
                                <option value="alimentacao">Alimentação</option>
                                <option value="transporte">Transporte/Combustível</option>
                                <option value="ferragens">Ferragens/Fixação</option>
                                <option value="outros">Outros</option>
                              </select>
                            </td>
                            <td className="expenses-td">
                              <input 
                                type="number" 
                                step="0.01"
                                className="input input-sm" 
                                required
                                value={exp.value}
                                onChange={e => updateExpenseField(exp.id, 'value', parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td className="expenses-td" style={{ textAlign: 'right' }}>
                              <button type="button" className="btn-icon-xs danger" onClick={() => removeExpenseRow(exp.id)}>
                                <Trash2 size={11} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Nenhuma despesa adicionada a este relatório.
                  </div>
                )}

                <div className="expenses-total-banner">
                  <span>VALOR TOTAL DAS DESPESAS:</span>
                  <span>R$ {reportForm.expenses.reduce((sum: number, item: any) => sum + Number(item.value || 0), 0).toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              {/* Photos and Receipts attachment */}
              <div className="input-group mb-4">
                <label className="input-label"><ImageIcon size={14} style={{ display: 'inline', marginRight: '0.25rem' }} /> Fotos de Recibos & Instalação Final</label>
                <input
                  type="file"
                  id="report-receipt-upload"
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleMockReceiptUpload}
                />
                
                <div
                  className="inst-img-upload-area"
                  style={{ height: 100 }}
                  onClick={() => document.getElementById('report-receipt-upload')?.click()}
                >
                  <div className="inst-img-placeholder" style={{ flexDirection: 'row', gap: '0.5rem' }}>
                    {uploadingReceipt ? (
                      <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                    ) : (
                      <><Plus size={16} /><span>Clique para anexar fotos de recibos ou instalação concluída</span></>
                    )}
                  </div>
                </div>

                {reportForm.receipts.length > 0 && (
                  <div className="receipts-grid">
                    {reportForm.receipts.map((url, idx) => (
                      <div key={idx} className="receipt-card">
                        <img src={url} alt="Recibo" />
                        <button type="button" className="receipt-remove-btn" onClick={() => removeReceipt(url)}>
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Checklist & Rating */}
              <div className="form-row mb-6">
                <div className="input-group">
                  <label className="input-label">Nível de Satisfação do Cliente</label>
                  <div className="stars-input">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star} 
                        type="button" 
                        className={`star-btn ${star <= reportForm.satisfaction ? 'filled' : ''}`}
                        onClick={() => setReportForm({...reportForm, satisfaction: star})}
                      >
                        <Star size={20} fill={star <= reportForm.satisfaction ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="input-group">
                  <label className="input-label">Conformidades de Campo</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                      <input 
                        type="checkbox" 
                        checked={reportForm.checklist.structure}
                        onChange={e => setReportForm({
                          ...reportForm, 
                          checklist: { ...reportForm.checklist, structure: e.target.checked }
                        })}
                      />
                      <span>Estrutura 100% segura e fixada</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                      <input 
                        type="checkbox" 
                        checked={reportForm.checklist.electrical}
                        onChange={e => setReportForm({
                          ...reportForm, 
                          checklist: { ...reportForm.checklist, electrical: e.target.checked }
                        })}
                      />
                      <span>Rede elétrica isolada / testada</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                      <input 
                        type="checkbox" 
                        checked={reportForm.checklist.clean}
                        onChange={e => setReportForm({
                          ...reportForm, 
                          checklist: { ...reportForm.checklist, clean: e.target.checked }
                        })}
                      />
                      <span>Local limpo e sem resíduos</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                      <input 
                        type="checkbox" 
                        checked={reportForm.checklist.signature}
                        onChange={e => setReportForm({
                          ...reportForm, 
                          checklist: { ...reportForm.checklist, signature: e.target.checked }
                        })}
                      />
                      <span>Termo assinado pelo cliente</span>
                    </label>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setReportModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  <Save size={14} /> Salvar Relatório
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {printReport && (
        <div className="report-print-backdrop print-no-print" onClick={() => setPrintReport(null)}>
          <div className="report-print-modal card animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="report-print-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Printer size={18} color="var(--primary-400)" />
                <h3 className="card-title" style={{ margin: 0 }}>Visualização de Impressão</h3>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                  <Printer size={12} /> Imprimir / PDF
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setPrintReport(null)}>
                  Fechar
                </button>
              </div>
            </div>
            
            <div className="report-print-body">
              <div className="printable-sheet">
                <div className="printable-sheet-header">
                  <div className="printable-sheet-logo">
                    GRAFIO<span style={{ color: 'var(--primary-500)' }}>.ERP</span>
                  </div>
                  <div className="printable-sheet-title">
                    <h2>Relatório de Instalação de Serviço</h2>
                    <p>Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                  <div>
                    <strong>Cliente:</strong> {printReport.clientName}<br />
                    <strong>Ordem de Serviço (OS):</strong> {printReport.osNumber || 'Não especificada'}<br />
                    <strong>Tipo de Serviço:</strong> {printReport.serviceType}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong>Data da Instalação:</strong> {new Date(printReport.date).toLocaleDateString('pt-BR')}<br />
                    <strong>Instalador Líder:</strong> {printReport.installer}<br />
                    <strong>Status:</strong> {printReport.status === 'completed' ? 'Concluído' : printReport.status === 'pending' ? 'Pendente' : 'Requer Ajustes'}
                  </div>
                </div>

                <div className="printable-section-title">Procedimentos Técnicos</div>
                <p style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap', margin: 0, color: '#334155' }}>
                  {printReport.procedures || 'Nenhum procedimento descrito.'}
                </p>

                <div className="printable-section-title">Tabela de Despesas de Campo</div>
                {printReport.expenses && printReport.expenses.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Descrição</th>
                        <th>Categoria</th>
                        <th style={{ textAlign: 'right' }}>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printReport.expenses.map((exp: any) => (
                        <tr key={exp.id}>
                          <td>{exp.description}</td>
                          <td style={{ textTransform: 'capitalize' }}>{exp.category}</td>
                          <td style={{ textAlign: 'right' }}>R$ {Number(exp.value).toFixed(2).replace('.', ',')}</td>
                        </tr>
                      ))}
                      <tr style={{ fontWeight: 'bold', background: '#f8fafc' }}>
                        <td colSpan={2}>Valor Total das Despesas</td>
                        <td style={{ textAlign: 'right' }}>
                          R$ {printReport.expenses.reduce((sum: number, item: any) => sum + Number(item.value || 0), 0).toFixed(2).replace('.', ',')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <p style={{ fontSize: '0.875rem', color: '#64748b', fontStyle: 'italic', margin: 0 }}>
                    Nenhuma despesa declarada para esta instalação.
                  </p>
                )}

                <div className="printable-section-title">Anexos & Registros Fotográficos</div>
                {printReport.receipts && printReport.receipts.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                    {printReport.receipts.map((url: string, index: number) => (
                      <div key={index} style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden', height: '150px' }}>
                        <img src={url} alt={`Anexo ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.875rem', color: '#64748b', fontStyle: 'italic', margin: 0 }}>
                    Nenhum registro fotográfico ou recibo anexado.
                  </p>
                )}

                <div className="printable-section-title">Assinaturas e Conformidades</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: '1.5rem', fontSize: '0.8125rem', marginTop: '1.5rem' }}>
                  <div>
                    <div style={{ borderBottom: '1px solid #94a3b8', height: '40px' }}></div>
                    <p style={{ textAlign: 'center', margin: '4px 0 0', color: '#64748b' }}>Assinatura do Técnico Responsável</p>
                  </div>
                  <div>
                    <div style={{ borderBottom: '1px solid #94a3b8', height: '40px', textAlign: 'center', lineHeight: '50px', color: '#334155', fontWeight: 'bold' }}>
                      {printReport.satisfaction} / 5 Estrelas
                    </div>
                    <p style={{ textAlign: 'center', margin: '4px 0 0', color: '#64748b' }}>Satisfação do Cliente</p>
                  </div>
                  <div>
                    <div style={{ borderBottom: '1px solid #94a3b8', height: '40px' }}></div>
                    <p style={{ textAlign: 'center', margin: '4px 0 0', color: '#64748b' }}>Assinatura do Cliente / Recebedor</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
