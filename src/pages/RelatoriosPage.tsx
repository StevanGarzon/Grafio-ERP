import { useState, useEffect, useRef } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import './RelatoriosPage.css';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement } from 'chart.js';
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement);

export default function RelatoriosPage() {
  const [timeRange] = useState('Este Mês');

  // Mock data for charts
  const monthlyData = [
    { month: 'Jan', value: 45000 },
    { month: 'Fev', value: 52000 },
    { month: 'Mar', value: 48000 },
    { month: 'Abr', value: 61000 },
    { month: 'Mai', value: 55000 },
    { month: 'Jun', value: 67000 },
  ];

  const topProducts = [
    { name: 'Banner Lona', value: 35, color: '#3b82f6' },
    { name: 'Adesivo Vinil', value: 25, color: '#10b981' },
    { name: 'Letra Caixa', value: 20, color: '#f59e0b' },
    { name: 'Fachada ACM', value: 15, color: '#ef4444' },
    { name: 'Outros', value: 5, color: '#6366f1' },
  ];

  const barChartRef = useRef<HTMLCanvasElement>(null);
  const donutChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (barChartRef.current) {
      const ctx = barChartRef.current.getContext('2d');
      if (ctx) {
        new ChartJS(ctx, {
          type: 'bar',
          data: {
            labels: monthlyData.map(d => d.month),
            datasets: [
              {
                label: 'Faturamento',
                data: monthlyData.map(d => d.value),
                backgroundColor: 'rgba(51,102,255,0.6)',
                borderColor: 'rgba(51,102,255,1)',
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true, ticks: { callback: val => `R$ ${val}` } },
            },
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: ctx => `R$ ${ctx.parsed && ctx.parsed.y !== null && ctx.parsed.y !== undefined ? ctx.parsed.y.toLocaleString() : ''}` } },
            },
          },
        });
      }
    }
    if (donutChartRef.current) {
      const ctx = donutChartRef.current.getContext('2d');
      if (ctx) {
        new ChartJS(ctx, {
          type: 'doughnut',
          data: {
            labels: topProducts.map(p => p.name),
            datasets: [
              {
                data: topProducts.map(p => p.value),
                backgroundColor: topProducts.map(p => p.color),
                hoverOffset: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
          },
        });
      }
    }
  }, []);

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Relatórios Avançados (BI)</h1>
          <p className="page-subtitle">Inteligência de dados e performance do negócio</p>
        </div>
        <div className="header-actions">
          <div className="date-picker-mock card">
            <Calendar size={16} />
            <span>{timeRange}</span>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card card">
          <div className="stat-icon-wrap" style={{ background: 'rgba(51,102,255,0.1)', color: 'var(--primary-400)' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Faturamento Total</span>
            <div className="stat-value-group">
              <span className="stat-value">R$ 145.850</span>
              <span className="stat-trend positive"><ArrowUpRight size={14} /> 12.5%</span>
            </div>
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-icon-wrap" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success-400)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Ticket Médio</span>
            <div className="stat-value-group">
              <span className="stat-value">R$ 1.250</span>
              <span className="stat-trend positive"><ArrowUpRight size={14} /> 4.2%</span>
            </div>
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-icon-wrap" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--warning-400)' }}>
            <Users size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Novos Clientes</span>
            <div className="stat-value-group">
              <span className="stat-value">24</span>
              <span className="stat-trend negative"><ArrowDownRight size={14} /> 2.1%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card card" style={{ height: '300px' }}>
          <div className="chart-header">
            <h3 className="chart-title">Faturamento Mensal</h3>
            <BarChart3 size={18} className="text-secondary" />
          </div>
          <canvas ref={barChartRef} className="chart-canvas" />
        </div>

        <div className="chart-card card" style={{ height: '300px' }}>
          <div className="chart-header">
            <h3 className="chart-title">Mix de Produtos</h3>
            <span className="text-xs text-secondary">Participação por categoria</span>
          </div>
          <canvas ref={donutChartRef} className="chart-canvas" />
        </div>
      </div>

      <div className="card mt-6">
        <h3 className="card-title mb-4">Top Clientes (Mês Atual)</h3>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Pedidos</th>
                <th>Total Gasto</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Academia Corpo & Saúde</strong></td>
                <td>12</td>
                <td>R$ 15.420</td>
                <td><span className="badge badge-success">VVIP</span></td>
              </tr>
              <tr>
                <td><strong>Restaurante Sabor Real</strong></td>
                <td>4</td>
                <td>R$ 8.900</td>
                <td><span className="badge badge-primary">Frequente</span></td>
              </tr>
              <tr>
                <td><strong>Tech Solutions Ltda</strong></td>
                <td>2</td>
                <td>R$ 5.200</td>
                <td><span className="badge badge-secondary">Novo</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
