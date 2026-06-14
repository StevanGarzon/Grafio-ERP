import { useAuth } from '../contexts/AuthContext';
import {
  Users, FileText, ClipboardList, DollarSign,
  TrendingUp, TrendingDown, ArrowRight, Clock,
  CheckCircle2, AlertTriangle, Calendar
} from 'lucide-react';
import './DashboardPage.css';

const stats = [
  { label: 'Clientes', value: '0', icon: Users, color: '#3366ff', change: '+0%', positive: true },
  { label: 'Orçamentos', value: '0', icon: FileText, color: '#8b5cf6', change: '+0%', positive: true },
  { label: 'Ordens de Serviço', value: '0', icon: ClipboardList, color: '#06b6d4', change: '+0%', positive: true },
  { label: 'Faturamento', value: 'R$ 0', icon: DollarSign, color: '#10b981', change: '+0%', positive: true },
];

const recentActivities = [
  { id: 1, type: 'info', icon: Clock, text: 'Sistema inicializado', time: 'Agora' },
  { id: 2, type: 'success', icon: CheckCircle2, text: 'Módulos carregados com sucesso', time: 'Agora' },
  { id: 3, type: 'warning', icon: AlertTriangle, text: 'Configure seu Supabase para começar', time: 'Pendente' },
];

const quickActions = [
  { label: 'Novo Cliente', path: '/clientes/novo', icon: Users, color: '#3366ff' },
  { label: 'Novo Orçamento', path: '/orcamentos/novo', icon: FileText, color: '#8b5cf6' },
  { label: 'Nova OS', path: '/ordens-servico/nova', icon: ClipboardList, color: '#06b6d4' },
  { label: 'Agenda', path: '/agenda', icon: Calendar, color: '#f59e0b' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário';

  return (
    <div className="dashboard animate-fade-in">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-greeting">
            Olá, <span className="dashboard-greeting-name">{firstName}</span> 👋
          </h1>
          <p className="dashboard-greeting-sub">
            Aqui está o resumo do seu dia. Vamos produzir!
          </p>
        </div>
        <div className="dashboard-date">
          <Calendar size={16} />
          <span>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="dashboard-stats stagger-children">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value">{stat.value}</p>
              </div>
              <div className="stat-icon-wrap" style={{ background: `${stat.color}15`, color: stat.color }}>
                <stat.icon size={20} />
              </div>
            </div>
            <div className="stat-change-row">
              <span className={`stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                {stat.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {stat.change}
              </span>
              <span className="stat-period">vs. mês anterior</span>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="dashboard-grid">
        {/* Quick Actions */}
        <div className="dashboard-section">
          <h2 className="dashboard-section-title">Ações Rápidas</h2>
          <div className="quick-actions">
            {quickActions.map((action) => (
              <button key={action.label} className="quick-action-btn">
                <div className="quick-action-icon" style={{ background: `${action.color}15`, color: action.color }}>
                  <action.icon size={20} />
                </div>
                <span className="quick-action-label">{action.label}</span>
                <ArrowRight size={14} className="quick-action-arrow" />
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-section">
          <h2 className="dashboard-section-title">Atividade Recente</h2>
          <div className="activity-list">
            {recentActivities.map((activity) => (
              <div key={activity.id} className={`activity-item activity-${activity.type}`}>
                <div className="activity-icon-wrap">
                  <activity.icon size={16} />
                </div>
                <div className="activity-content">
                  <span className="activity-text">{activity.text}</span>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Follow-up Widget */}
        <div className="dashboard-section follow-up-section" style={{ gridColumn: 'span 2' }}>
          <h2 className="dashboard-section-title">🔥 Ação Recomendada: Follow-up de Vendas</h2>
          <div className="follow-up-grid card" style={{ padding: '1.5rem !important' }}>
            <div className="follow-up-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(245,158,11,0.05)', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, background: 'var(--warning-500)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <Clock size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9375rem' }}>Academia Corpo & Saúde</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Orçamento #1052 parado há 4 dias (R$ 2.450,00)</p>
                </div>
              </div>
              <button 
                className="btn btn-success btn-sm" 
                style={{ gap: '0.5rem' }}
                onClick={() => {
                  const message = "Olá! Gostaria de verificar se você recebeu o Orçamento #1052 para a Academia Corpo & Saúde no valor de R$ 2.450,00. Ficamos no aguardo para iniciar a produção!";
                  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                }}
              >
                <CheckCircle2 size={14} /> Cobrar via WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="dashboard-welcome-banner">
        <div className="dashboard-welcome-content">
          <h3>🚀 Bem-vindo ao GRAFIO ERP</h3>
          <p>
            Seu sistema de gestão para comunicação visual está pronto.
            Comece cadastrando seus clientes e criando seus primeiros orçamentos.
          </p>
        </div>
        <div className="dashboard-welcome-glow" />
      </div>
    </div>
  );
}
