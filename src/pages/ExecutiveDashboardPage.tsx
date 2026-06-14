import { useState, useEffect } from 'react';
import { Sparkles, DollarSign, TrendingUp, Users, ShieldAlert, Cpu, Wrench, ArrowUpRight, BarChart3, AlertTriangle } from 'lucide-react';
import { financeService } from '../services/financeService';
import './ExecutiveDashboardPage.css';

export default function ExecutiveDashboardPage() {
  const [loading, setLoading] = useState(false);
  const [dashboardSummary, setDashboardSummary] = useState({
    income_pending: 12500,
    income_paid: 32000,
    expense_pending: 4800,
    expense_paid: 18500
  });

  const [aiAnalysis, setAiAnalysis] = useState<string>('');

  useEffect(() => {
    // Generate simulated executive predictive diagnostic
    setAiAnalysis(`[IA Predição e Controladoria]:
• EBITDA Projetado: 28.5% (ótimo desempenho de margem líquida).
• Alerta de Risco: 2 clientes concentram 45% do faturamento pendente. Inadimplência prevista: 2.1%.
• Gargalo Operacional: CNC Router operando com 92% de ocupação. Risco de atraso nas próximas OS de fachadas.
• Recomendação: Programar turno extra na CNC ou subcontratar corte terceirizado para desafogar o backlog.`);
  }, []);

  const totalRevenue = dashboardSummary.income_paid + dashboardSummary.income_pending;
  const totalExpense = dashboardSummary.expense_paid + dashboardSummary.expense_pending;
  const netProfit = totalRevenue - totalExpense;

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Executivo de BI</h1>
          <p className="page-subtitle">Visão executiva em tempo real e análise preditiva de performance</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="fin-kpi-grid mb-6">
        <div className="fin-kpi-card success">
          <p className="fin-kpi-label">EBITDA Estimado</p>
          <p className="fin-kpi-value" style={{ color: 'var(--success-400)' }}>28.5%</p>
          <p className="fin-kpi-sub">Rentabilidade operacional</p>
        </div>
        <div className="fin-kpi-card primary">
          <p className="fin-kpi-label">Faturamento Total</p>
          <p className="fin-kpi-value" style={{ color: 'var(--primary-400)' }}>R$ {totalRevenue.toLocaleString('pt-BR')}</p>
          <p className="fin-kpi-sub">Realizado + Pendente</p>
        </div>
        <div className="fin-kpi-card danger">
          <p className="fin-kpi-label">Custo Operacional</p>
          <p className="fin-kpi-value" style={{ color: 'var(--danger-400)' }}>R$ {totalExpense.toLocaleString('pt-BR')}</p>
          <p className="fin-kpi-sub">Despesas do período</p>
        </div>
        <div className="fin-kpi-card warning">
          <p className="fin-kpi-label">Score de Risco</p>
          <p className="fin-kpi-value" style={{ color: 'var(--warning-400)' }}>Baixo</p>
          <p className="fin-kpi-sub">Saúde financeira geral</p>
        </div>
      </div>

      {/* Main analytical layouts */}
      <div className="form-grid" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        
        {/* IA Analytics */}
        <div className="card" style={{ borderLeft: '4px solid var(--primary-500)' }}>
          <h3 className="card-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} color="var(--primary-400)" /> IA Predição de Gargalos & Insights
          </h3>
          
          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
            {aiAnalysis}
          </pre>
        </div>

        {/* Operational Statistics */}
        <div className="card">
          <h3 className="card-title mb-4">Gargalos e Capacidade Produtiva</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                <span>Ocupação CNC Router</span>
                <span style={{ fontWeight: 600 }}>92%</span>
              </div>
              <div className="asset-depreciation-bar" style={{ height: '8px' }}>
                <div className="asset-depreciation-fill" style={{ width: '92%', background: 'var(--danger-500)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                <span>Ocupação Impressora Mimaki</span>
                <span style={{ fontWeight: 600 }}>64%</span>
              </div>
              <div className="asset-depreciation-bar" style={{ height: '8px' }}>
                <div className="asset-depreciation-fill" style={{ width: '64%', background: 'var(--warning-500)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                <span>Hora-Homem Produtiva</span>
                <span style={{ fontWeight: 600 }}>80%</span>
              </div>
              <div className="asset-depreciation-bar" style={{ height: '8px' }}>
                <div className="asset-depreciation-fill" style={{ width: '80%', background: 'var(--success-500)' }} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
