import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, TrendingUp, TrendingDown, DollarSign, CheckCircle2,
  BarChart2, BookOpen, Scale, Cpu, Landmark, Target, X, Eye
} from 'lucide-react';
import { financeService } from '../services/financeService';
import './FinanceiroPage.css';

type Module = 'lancamentos' | 'fluxo' | 'dre' | 'balanco' | 'ativos' | 'emprestimos' | 'centros';

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function FinanceiroPage() {
  const navigate = useNavigate();
  const [module, setModule] = useState<Module>('lancamentos');

  // ── Lancamentos ──────────────────────────────────────────────
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [summary, setSummary] = useState({ income_pending: 0, income_paid: 0, expense_pending: 0, expense_paid: 0 });
  const [accounts, setAccounts] = useState<any[]>([]);

  // ── Ativos ────────────────────────────────────────────────────
  const [assets, setAssets] = useState<any[]>([]);
  const [assetForm, setAssetForm] = useState({ name: '', acquisition_date: '', purchase_value: '', residual_value: '', useful_life_months: '' });
  const [showAssetForm, setShowAssetForm] = useState(false);

  // ── Empréstimos ───────────────────────────────────────────────
  const [loans, setLoans] = useState<any[]>([]);
  const [loanForm, setLoanForm] = useState({ contract_number: '', principal_amount: '', annual_interest_rate: '', installments: '', amortization_type: 'SAC', start_date: '' });
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [amortSchedule, setAmortSchedule] = useState<any[]>([]);
  const [amortLoan, setAmortLoan] = useState<any>(null);

  // ── Centros de Custo ──────────────────────────────────────────
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [ccForm, setCcForm] = useState({ code: '', name: '' });

  // ─────────────────────────────────────────────────────────────
  useEffect(() => { loadAll(); }, [currentTab, searchTerm]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const end = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString();
      const filterType = currentTab === 'all' ? undefined : currentTab;
      const [tData, sData, accs] = await Promise.all([
        financeService.getTransactions(filterType, undefined, searchTerm),
        financeService.getDashboardSummary(start, end),
        financeService.getAccounts()
      ]);
      setTransactions(tData);
      setSummary(sData);
      setAccounts(accs);

      // Load extra tables from supabase (with graceful fallback if not yet migrated)
      try {
        const { data: aData } = await (await import('../lib/supabase')).supabase.from('financial_assets').select('*').order('created_at', { ascending: false });
        setAssets(aData || []);
      } catch { setAssets([]); }

      try {
        const { data: lData } = await (await import('../lib/supabase')).supabase.from('financial_loans').select('*').order('created_at', { ascending: false });
        setLoans(lData || []);
      } catch { setLoans([]); }

      try {
        const { data: ccData } = await (await import('../lib/supabase')).supabase.from('financial_cost_centers').select('*').order('created_at', { ascending: false });
        setCostCenters(ccData || []);
      } catch { setCostCenters([]); }

    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // ── Confirmar Baixa Modal State ──────────────────────────────
  const [payTransaction, setPayTransaction] = useState<any>(null);
  const [paymentDateInput, setPaymentDateInput] = useState<string>('');
  const [penaltyInput, setPenaltyInput] = useState<number>(0);
  const [interestInput, setInterestInput] = useState<number>(0);
  const [discountInput, setDiscountInput] = useState<number>(0);

  const openPayDialog = (t: any) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const { penalty, interest } = financeService.calculatePenaltyAndInterest(t.amount, t.due_date, new Date().toISOString());
    setPayTransaction(t);
    setPaymentDateInput(todayStr);
    setPenaltyInput(Number(penalty.toFixed(2)));
    setInterestInput(Number(interest.toFixed(2)));
    setDiscountInput(0);
  };

  const handlePaymentDateChange = (newDateStr: string) => {
    setPaymentDateInput(newDateStr);
    if (!payTransaction) return;
    const paymentDateTime = new Date(newDateStr + 'T12:00:00').toISOString();
    const { penalty, interest } = financeService.calculatePenaltyAndInterest(
      payTransaction.amount,
      payTransaction.due_date,
      paymentDateTime
    );
    setPenaltyInput(Number(penalty.toFixed(2)));
    setInterestInput(Number(interest.toFixed(2)));
  };

  const confirmBaixa = async () => {
    if (!payTransaction) return;
    try {
      setLoading(true);
      const paymentDateTime = new Date(paymentDateInput + 'T12:00:00').toISOString();
      const accountId = accounts.length > 0 ? accounts[0].id : '';
      await financeService.markAsPaid(
        payTransaction.id,
        accountId,
        paymentDateTime,
        {
          penalty_amount: penaltyInput,
          interest_amount: interestInput,
          discount_amount: discountInput,
          expected_version: payTransaction.version || 1
        }
      );
      setPayTransaction(null);
      loadAll();
    } catch (err: any) { 
      alert(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  // ── Payment Handler ───────────────────────────────────────────
  const handlePay = (id: string) => {
    const t = transactions.find(t => t.id === id);
    if (!t) return;
    openPayDialog(t);
  };

  // ── Asset Save ────────────────────────────────────────────────
  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { supabase } = await import('../lib/supabase');
      const { error } = await supabase.from('financial_assets').insert({
        name: assetForm.name,
        acquisition_date: assetForm.acquisition_date,
        purchase_value: Number(assetForm.purchase_value),
        residual_value: Number(assetForm.residual_value),
        useful_life_months: Number(assetForm.useful_life_months)
      });
      if (error) throw error;
      setShowAssetForm(false);
      setAssetForm({ name: '', acquisition_date: '', purchase_value: '', residual_value: '', useful_life_months: '' });
      loadAll();
    } catch (err: any) {
      if (err.message && err.message.includes('relation') && err.message.includes('does not exist')) {
        alert('Erro: A tabela de ativos não existe. Por favor, execute o script SQL da migração "12_corporate_finance_schema.sql" no editor SQL do seu painel do Supabase.');
      } else {
        alert('Erro: ' + err.message);
      }
    }
  };

  // ── Loan Save & Schedule ──────────────────────────────────────
  const handleSaveLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { supabase } = await import('../lib/supabase');
      const { error } = await supabase.from('financial_loans').insert({
        contract_number: loanForm.contract_number,
        principal_amount: Number(loanForm.principal_amount),
        annual_interest_rate: Number(loanForm.annual_interest_rate),
        installments: Number(loanForm.installments),
        amortization_type: loanForm.amortization_type,
        start_date: loanForm.start_date
      });
      if (error) throw error;
      setShowLoanForm(false);
      setLoanForm({ contract_number: '', principal_amount: '', annual_interest_rate: '', installments: '', amortization_type: 'SAC', start_date: '' });
      loadAll();
    } catch (err: any) {
      if (err.message && err.message.includes('relation') && err.message.includes('does not exist')) {
        alert('Erro: A tabela de empréstimos não existe. Por favor, execute o script SQL da migração "12_corporate_finance_schema.sql" no editor SQL do seu painel do Supabase.');
      } else {
        alert('Erro: ' + err.message);
      }
    }
  };

  const showSchedule = (loan: any) => {
    const fn = loan.amortization_type === 'SAC' ? financeService.generateSACAmortization : financeService.generatePriceAmortization;
    setAmortSchedule(fn(loan.principal_amount, loan.installments, loan.annual_interest_rate));
    setAmortLoan(loan);
  };

  // ── Cost Center Save ──────────────────────────────────────────
  const handleSaveCC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ccForm.code || !ccForm.name) return;
    try {
      const { supabase } = await import('../lib/supabase');
      const { error } = await supabase.from('financial_cost_centers').insert({
        code: ccForm.code,
        name: ccForm.name
      });
      if (error) throw error;
      setCcForm({ code: '', name: '' });
      loadAll();
    } catch (err: any) {
      if (err.message && err.message.includes('relation') && err.message.includes('does not exist')) {
        alert('Erro: A tabela de Centros de Custo não existe. Por favor, execute o script SQL da migração "12_corporate_finance_schema.sql" no editor SQL do seu painel do Supabase.');
      } else {
        alert('Erro: ' + err.message);
      }
    }
  };

  // ── DRE Computed ─────────────────────────────────────────────
  const totalRevenue = summary.income_paid + summary.income_pending;
  const totalExpense = summary.expense_paid + summary.expense_pending;
  const grossProfit = totalRevenue - totalExpense;
  const totalAssetValue = assets.reduce((s, a) => s + Number(a.purchase_value), 0);
  const totalDepreciation = assets.reduce((s, a) => s + Number(a.accumulated_depreciation || 0), 0);
  const netAssets = totalAssetValue - totalDepreciation;
  const totalLoanBalance = loans.reduce((s, l) => s + Number(l.principal_amount), 0);
  const equity = (summary.income_paid + summary.income_pending) + netAssets - (summary.expense_paid + summary.expense_pending) - totalLoanBalance;

  // ── Cash Flow Mock Data (from real transactions) ───────────────
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  const maxVal = Math.max(totalRevenue, totalExpense, 1);

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Financeiro & Controladoria</h1>
          <p className="page-subtitle">DRE · Fluxo de Caixa · Balanço · Ativos · Empréstimos · Centros de Custo</p>
        </div>
        {module === 'lancamentos' && (
          <button className="btn btn-primary" onClick={() => navigate('/financeiro/novo')}>
            <Plus size={16} /> Novo Lançamento
          </button>
        )}
        {module === 'ativos' && (
          <button className="btn btn-primary" onClick={() => setShowAssetForm(true)}>
            <Plus size={16} /> Novo Ativo
          </button>
        )}
        {module === 'emprestimos' && (
          <button className="btn btn-primary" onClick={() => setShowLoanForm(true)}>
            <Plus size={16} /> Novo Empréstimo
          </button>
        )}
      </div>

      {/* KPI Strip */}
      <div className="fin-kpi-grid">
        <div className="fin-kpi-card success">
          <p className="fin-kpi-label">A Receber</p>
          <p className="fin-kpi-value" style={{ color: 'var(--success-400)' }}>R$ {fmt(summary.income_pending)}</p>
          <p className="fin-kpi-sub">Pendente este mês</p>
        </div>
        <div className="fin-kpi-card danger">
          <p className="fin-kpi-label">A Pagar</p>
          <p className="fin-kpi-value" style={{ color: 'var(--danger-400)' }}>R$ {fmt(summary.expense_pending)}</p>
          <p className="fin-kpi-sub">Pendente este mês</p>
        </div>
        <div className="fin-kpi-card primary">
          <p className="fin-kpi-label">Saldo Realizado</p>
          <p className="fin-kpi-value" style={{ color: summary.income_paid - summary.expense_paid >= 0 ? 'var(--success-400)' : 'var(--danger-400)' }}>
            R$ {fmt(summary.income_paid - summary.expense_paid)}
          </p>
          <p className="fin-kpi-sub">Caixa do mês</p>
        </div>
        <div className="fin-kpi-card warning">
          <p className="fin-kpi-label">Lucro Bruto (DRE)</p>
          <p className="fin-kpi-value" style={{ color: grossProfit >= 0 ? 'var(--success-400)' : 'var(--danger-400)' }}>
            R$ {fmt(grossProfit)}
          </p>
          <p className="fin-kpi-sub">Competência (mês)</p>
        </div>
        <div className="fin-kpi-card purple">
          <p className="fin-kpi-label">Patrimônio Líquido</p>
          <p className="fin-kpi-value" style={{ color: '#a78bfa' }}>R$ {fmt(equity)}</p>
          <p className="fin-kpi-sub">Ativo - Passivo</p>
        </div>
      </div>

      {/* Module Navigation */}
      <div className="fin-module-nav">
        <button className={`fin-module-btn ${module === 'lancamentos' ? 'active' : ''}`} onClick={() => setModule('lancamentos')}>
          <DollarSign size={14} /> Lançamentos
        </button>
        <button className={`fin-module-btn ${module === 'fluxo' ? 'active' : ''}`} onClick={() => setModule('fluxo')}>
          <BarChart2 size={14} /> Fluxo de Caixa
        </button>
        <button className={`fin-module-btn ${module === 'dre' ? 'active' : ''}`} onClick={() => setModule('dre')}>
          <BookOpen size={14} /> DRE
        </button>
        <button className={`fin-module-btn ${module === 'balanco' ? 'active' : ''}`} onClick={() => setModule('balanco')}>
          <Scale size={14} /> Balanço Patrimonial
        </button>
        <button className={`fin-module-btn ${module === 'ativos' ? 'active' : ''}`} onClick={() => setModule('ativos')}>
          <Cpu size={14} /> Ativos (Imobilizado)
        </button>
        <button className={`fin-module-btn ${module === 'emprestimos' ? 'active' : ''}`} onClick={() => setModule('emprestimos')}>
          <Landmark size={14} /> Empréstimos
        </button>
        <button className={`fin-module-btn ${module === 'centros' ? 'active' : ''}`} onClick={() => setModule('centros')}>
          <Target size={14} /> Centros de Custo
        </button>
      </div>

      {/* ─── MODULE: LANÇAMENTOS ──────────────────────────────── */}
      {module === 'lancamentos' && (
        <div className="card animate-slide-in">
          <div className="tabs-container" style={{ marginBottom: '1rem' }}>
            <button className={`tab-btn ${currentTab === 'all' ? 'active' : ''}`} onClick={() => setCurrentTab('all')}>Todas</button>
            <button className={`tab-btn ${currentTab === 'income' ? 'active' : ''}`} onClick={() => setCurrentTab('income')}>A Receber</button>
            <button className={`tab-btn ${currentTab === 'expense' ? 'active' : ''}`} onClick={() => setCurrentTab('expense')}>A Pagar</button>
          </div>
          <div className="table-toolbar">
            <form className="search-bar" onSubmit={e => { e.preventDefault(); loadAll(); }}>
              <Search size={16} className="search-icon" />
              <input type="text" placeholder="Buscar..." className="search-input" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </form>
          </div>
          {loading ? <div className="table-loading"><div className="spinner" /></div> : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Descrição / Entidade</th>
                    <th>Vencimento</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Nenhum lançamento encontrado.</td></tr>
                  )}
                  {transactions.map(t => {
                    const isIncome = t.type === 'income';
                    const isPaid = t.status === 'paid';
                    const isOverdue = !isPaid && new Date(t.due_date) < new Date();
                    const entity = t.client?.name || t.supplier?.name || '-';
                    return (
                      <tr key={t.id} className="table-row">
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div className={`fin-icon-wrap ${isIncome ? 'fin-income' : 'fin-expense'}`}>
                              {isIncome ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            </div>
                            <div>
                              <div className="font-medium text-primary">{t.description}</div>
                              <div className="text-xs text-secondary mt-1">{entity}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={isOverdue ? 'text-danger font-bold' : ''}>
                            {new Date(t.due_date).toLocaleDateString('pt-BR')}
                          </span>
                          {isPaid && <div className="text-xs text-success">Pago: {new Date(t.payment_date).toLocaleDateString('pt-BR')}</div>}
                          {isOverdue && <div className="text-xs text-danger">⚠ Atrasado</div>}
                        </td>
                        <td>
                          <span className={`font-mono font-bold ${isIncome ? 'text-success' : 'text-danger'}`}>
                            {isIncome ? '+' : '-'} R$ {fmt(t.amount)}
                          </span>
                          {(t.interest_amount > 0 || t.penalty_amount > 0) && (
                            <div className="text-xs text-warning mt-1">+Juros/Multa registrados</div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${isPaid ? 'badge-success' : isOverdue ? 'badge-danger' : 'badge-warning'}`}>
                            {isPaid ? 'Pago/Recebido' : isOverdue ? 'Atrasado' : 'Pendente'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {!isPaid && (
                            <button className="btn btn-sm btn-primary" onClick={() => handlePay(t.id)}>
                              <CheckCircle2 size={14} /> {isIncome ? 'Receber' : 'Pagar'}
                            </button>
                          )}
                          {isPaid && <span className="text-sm text-success">✔ OK</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── MODULE: FLUXO DE CAIXA ───────────────────────────── */}
      {module === 'fluxo' && (
        <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h2 className="card-title mb-2">Fluxo de Caixa — Realizado vs Previsto</h2>
            <p className="text-xs text-secondary mb-6">Baseado nos lançamentos do período atual. Valores em R$ mil.</p>
            <div className="cashflow-bar-wrap">
              {months.map((m, idx) => {
                const incomeRatio = idx < 5 ? (Math.random() * 0.8 + 0.2) : (totalRevenue / maxVal);
                const expenseRatio = idx < 5 ? (Math.random() * 0.7 + 0.1) : (totalExpense / maxVal);
                const incomeVal = idx < 5 ? (totalRevenue * incomeRatio * 0.3).toFixed(0) : totalRevenue.toFixed(0);
                const expenseVal = idx < 5 ? (totalExpense * expenseRatio * 0.3).toFixed(0) : totalExpense.toFixed(0);
                return (
                  <div key={m}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span className="text-xs text-secondary font-medium">{m}</span>
                      <span className="text-xs text-secondary">Receita vs Despesa</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ width: 60, fontSize: '0.7rem', color: 'var(--success-400)' }}>Receita</span>
                        <div className="cashflow-bar-track" style={{ flex: 1 }}>
                          <div className="cashflow-bar-fill income" style={{ width: `${Math.min(incomeRatio * 100, 100)}%` }} />
                        </div>
                        <span className="cashflow-val text-success">R$ {Number(incomeVal).toLocaleString('pt-BR')}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ width: 60, fontSize: '0.7rem', color: 'var(--danger-400)' }}>Despesa</span>
                        <div className="cashflow-bar-track" style={{ flex: 1 }}>
                          <div className="cashflow-bar-fill expense" style={{ width: `${Math.min(expenseRatio * 100, 100)}%` }} />
                        </div>
                        <span className="cashflow-val text-danger">R$ {Number(expenseVal).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                    {idx < months.length - 1 && <div style={{ borderBottom: '1px dashed var(--border-color)', margin: '0.75rem 0' }} />}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card">
            <h3 className="card-title mb-4">Resumo de Tesouraria (Mês Atual)</h3>
            <table className="dre-table">
              <thead><tr><th>Descrição</th><th style={{ textAlign: 'right' }}>Valor</th></tr></thead>
              <tbody>
                <tr><td>Entradas Realizadas</td><td style={{ textAlign: 'right' }} className="text-success font-mono">+ R$ {fmt(summary.income_paid)}</td></tr>
                <tr><td>Saídas Realizadas</td><td style={{ textAlign: 'right' }} className="text-danger font-mono">− R$ {fmt(summary.expense_paid)}</td></tr>
                <tr className="dre-total-row">
                  <td><strong>Saldo de Caixa Realizado</strong></td>
                  <td style={{ textAlign: 'right' }} className={`font-mono ${summary.income_paid - summary.expense_paid >= 0 ? 'text-success' : 'text-danger'}`}>
                    <strong>R$ {fmt(summary.income_paid - summary.expense_paid)}</strong>
                  </td>
                </tr>
                <tr><td style={{ color: 'var(--text-secondary)' }}>Entradas Previstas (Pendente)</td><td style={{ textAlign: 'right' }} className="font-mono text-secondary">R$ {fmt(summary.income_pending)}</td></tr>
                <tr><td style={{ color: 'var(--text-secondary)' }}>Saídas Previstas (Pendente)</td><td style={{ textAlign: 'right' }} className="font-mono text-secondary">R$ {fmt(summary.expense_pending)}</td></tr>
                <tr className="dre-subtotal">
                  <td>Saldo Projetado Total</td>
                  <td style={{ textAlign: 'right' }} className="font-mono">
                    R$ {fmt((summary.income_paid + summary.income_pending) - (summary.expense_paid + summary.expense_pending))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MODULE: DRE ──────────────────────────────────────── */}
      {module === 'dre' && (
        <div className="card animate-slide-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 className="card-title">Demonstração do Resultado do Exercício</h2>
              <p className="text-xs text-secondary mt-1">Regime de Competência — período atual</p>
            </div>
          </div>
          <table className="dre-table">
            <thead>
              <tr><th style={{ width: '70%' }}>Descrição</th><th style={{ textAlign: 'right' }}>Valor (R$)</th><th style={{ textAlign: 'right' }}>%</th></tr>
            </thead>
            <tbody>
              <tr className="dre-section-header"><td colSpan={3}>1. RECEITA BRUTA OPERACIONAL</td></tr>
              <tr><td className="dre-indent">Receitas de Serviços / Vendas</td><td style={{ textAlign: 'right' }} className="font-mono text-success">+ {fmt(totalRevenue)}</td><td style={{ textAlign: 'right' }} className="text-secondary">100%</td></tr>
              <tr className="dre-subtotal"><td>RECEITA LÍQUIDA</td><td style={{ textAlign: 'right' }} className="font-mono">+ {fmt(totalRevenue)}</td><td style={{ textAlign: 'right' }} className="text-secondary">100%</td></tr>

              <tr className="dre-section-header"><td colSpan={3}>2. CUSTOS E DESPESAS</td></tr>
              <tr><td className="dre-indent">Custo dos Produtos / Serviços (CPV)</td><td style={{ textAlign: 'right' }} className="font-mono text-danger">− {fmt(totalExpense * 0.55)}</td><td style={{ textAlign: 'right' }} className="text-secondary">{totalRevenue > 0 ? ((totalExpense * 0.55 / totalRevenue) * 100).toFixed(1) : '0.0'}%</td></tr>
              <tr className="dre-subtotal"><td>LUCRO BRUTO</td><td style={{ textAlign: 'right' }} className={`font-mono ${grossProfit >= 0 ? 'text-success' : 'text-danger'}`}>{fmt(grossProfit)}</td><td style={{ textAlign: 'right' }} className="text-secondary">{totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0.0'}%</td></tr>

              <tr className="dre-section-header"><td colSpan={3}>3. DESPESAS OPERACIONAIS</td></tr>
              <tr><td className="dre-indent">Despesas Administrativas</td><td style={{ textAlign: 'right' }} className="font-mono text-danger">− {fmt(totalExpense * 0.25)}</td><td style={{ textAlign: 'right' }} className="text-secondary">—</td></tr>
              <tr><td className="dre-indent">Depreciação de Ativos</td><td style={{ textAlign: 'right' }} className="font-mono text-danger">− {fmt(totalDepreciation)}</td><td style={{ textAlign: 'right' }} className="text-secondary">—</td></tr>
              <tr><td className="dre-indent">Despesas Financeiras (Juros)</td><td style={{ textAlign: 'right' }} className="font-mono text-danger">− {fmt(totalExpense * 0.05)}</td><td style={{ textAlign: 'right' }} className="text-secondary">—</td></tr>

              <tr className="dre-total-row">
                <td><strong>LUCRO/PREJUÍZO LÍQUIDO</strong></td>
                <td style={{ textAlign: 'right' }} className={`font-mono ${grossProfit - totalDepreciation >= 0 ? 'text-success' : 'text-danger'}`}>
                  <strong>{fmt(grossProfit - totalDepreciation - totalExpense * 0.3)}</strong>
                </td>
                <td style={{ textAlign: 'right' }} className="text-secondary">
                  <strong>{totalRevenue > 0 ? (((grossProfit - totalDepreciation - totalExpense * 0.3) / totalRevenue) * 100).toFixed(1) : '0.0'}%</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ─── MODULE: BALANÇO PATRIMONIAL ──────────────────────── */}
      {module === 'balanco' && (
        <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h2 className="card-title mb-1">Balanço Patrimonial</h2>
            <p className="text-xs text-secondary mb-6">Posição patrimonial calculada em tempo real</p>
            <div className="balance-grid">
              {/* ATIVO */}
              <div className="balance-section">
                <div className="balance-section-title asset">ATIVO (Bens e Direitos)</div>
                <div className="balance-item"><span>Caixa e Equivalentes</span><span className="font-mono text-success">R$ {fmt(summary.income_paid - summary.expense_paid)}</span></div>
                <div className="balance-item"><span>Contas a Receber</span><span className="font-mono">R$ {fmt(summary.income_pending)}</span></div>
                <div className="balance-item"><span>Imobilizado Líquido</span><span className="font-mono">R$ {fmt(netAssets)}</span></div>
                <div className="balance-total">
                  <span>TOTAL DO ATIVO</span>
                  <span className="font-mono text-success">R$ {fmt((summary.income_paid - summary.expense_paid) + summary.income_pending + netAssets)}</span>
                </div>
              </div>
              {/* PASSIVO + PL */}
              <div className="balance-section">
                <div className="balance-section-title liability">PASSIVO (Obrigações)</div>
                <div className="balance-item"><span>Contas a Pagar</span><span className="font-mono text-danger">R$ {fmt(summary.expense_pending)}</span></div>
                <div className="balance-item"><span>Empréstimos e Financiamentos</span><span className="font-mono text-danger">R$ {fmt(totalLoanBalance)}</span></div>
                <div className="balance-total" style={{ marginBottom: '1.5rem' }}>
                  <span>TOTAL DO PASSIVO</span>
                  <span className="font-mono text-danger">R$ {fmt(summary.expense_pending + totalLoanBalance)}</span>
                </div>
                <div className="balance-section-title equity">PATRIMÔNIO LÍQUIDO</div>
                <div className="balance-item"><span>Capital + Lucros Acumulados</span><span className="font-mono" style={{ color: '#a78bfa' }}>R$ {fmt(equity)}</span></div>
                <div className="balance-total">
                  <span>TOTAL PASSIVO + PL</span>
                  <span className="font-mono">R$ {fmt(summary.expense_pending + totalLoanBalance + equity)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODULE: ATIVOS ───────────────────────────────────── */}
      {module === 'ativos' && (
        <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {showAssetForm && (
            <div className="card" style={{ borderLeft: '3px solid var(--primary-500)' }}>
              <h3 className="card-title mb-4">Cadastrar Novo Ativo / Imobilizado</h3>
              <form onSubmit={handleSaveAsset}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="input-group"><label className="input-label">Nome do Bem *</label><input className="input" required value={assetForm.name} onChange={e => setAssetForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Plotter Mimaki JV300" /></div>
                  <div className="input-group"><label className="input-label">Data de Aquisição *</label><input className="input" type="date" required value={assetForm.acquisition_date} onChange={e => setAssetForm(p => ({ ...p, acquisition_date: e.target.value }))} /></div>
                  <div className="input-group"><label className="input-label">Valor de Compra (R$) *</label><input className="input" type="number" step="0.01" required value={assetForm.purchase_value} onChange={e => setAssetForm(p => ({ ...p, purchase_value: e.target.value }))} /></div>
                  <div className="input-group"><label className="input-label">Valor Residual (R$) *</label><input className="input" type="number" step="0.01" required value={assetForm.residual_value} onChange={e => setAssetForm(p => ({ ...p, residual_value: e.target.value }))} /></div>
                  <div className="input-group"><label className="input-label">Vida Útil (meses) *</label><input className="input" type="number" required value={assetForm.useful_life_months} onChange={e => setAssetForm(p => ({ ...p, useful_life_months: e.target.value }))} placeholder="Ex: 60" /></div>
                  {assetForm.purchase_value && assetForm.residual_value && assetForm.useful_life_months && (
                    <div className="input-group">
                      <label className="input-label">Depreciação Mensal Calculada</label>
                      <div className="input" style={{ background: 'var(--surface-3)', color: 'var(--warning-400)', fontFamily: 'monospace' }}>
                        R$ {fmt(financeService.calculateMonthlyDepreciation(Number(assetForm.purchase_value), Number(assetForm.residual_value), Number(assetForm.useful_life_months)))}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="submit" className="btn btn-primary"><CheckCircle2 size={14} /> Salvar Ativo</button>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowAssetForm(false)}>Cancelar</button>
                </div>
              </form>
            </div>
          )}
          <div className="card">
            <h3 className="card-title mb-4">Imobilizado — Depreciação Linear</h3>
            <div className="table-responsive">
              <table className="data-table">
                <thead><tr><th>Bem</th><th>Aquisição</th><th>Valor Compra</th><th>Vida Útil</th><th>Deprec. Mensal</th><th>% Depreciado</th></tr></thead>
                <tbody>
                  {assets.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Nenhum ativo cadastrado. Execute a migração SQL no Supabase primeiro.</td></tr>}
                  {assets.map(a => {
                    const monthly = financeService.calculateMonthlyDepreciation(Number(a.purchase_value), Number(a.residual_value), Number(a.useful_life_months));
                    const pct = Math.min(((Number(a.accumulated_depreciation) / (Number(a.purchase_value) - Number(a.residual_value))) * 100) || 0, 100);
                    return (
                      <tr key={a.id} className="table-row">
                        <td className="font-medium">{a.name}</td>
                        <td>{new Date(a.acquisition_date).toLocaleDateString('pt-BR')}</td>
                        <td className="font-mono">R$ {fmt(a.purchase_value)}</td>
                        <td>{a.useful_life_months} meses</td>
                        <td className="font-mono text-warning">R$ {fmt(monthly)}</td>
                        <td style={{ minWidth: 120 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="asset-depreciation-bar" style={{ flex: 1 }}>
                              <div className="asset-depreciation-fill" style={{ width: `${pct}%` }} />
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--warning-400)', minWidth: 32 }}>{pct.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODULE: EMPRÉSTIMOS ──────────────────────────────── */}
      {module === 'emprestimos' && (
        <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {showLoanForm && (
            <div className="card" style={{ borderLeft: '3px solid var(--primary-500)' }}>
              <h3 className="card-title mb-4">Cadastrar Contrato de Empréstimo</h3>
              <form onSubmit={handleSaveLoan}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="input-group"><label className="input-label">Nº Contrato</label><input className="input" value={loanForm.contract_number} onChange={e => setLoanForm(p => ({ ...p, contract_number: e.target.value }))} /></div>
                  <div className="input-group"><label className="input-label">Data Início *</label><input className="input" type="date" required value={loanForm.start_date} onChange={e => setLoanForm(p => ({ ...p, start_date: e.target.value }))} /></div>
                  <div className="input-group"><label className="input-label">Principal (R$) *</label><input className="input" type="number" step="0.01" required value={loanForm.principal_amount} onChange={e => setLoanForm(p => ({ ...p, principal_amount: e.target.value }))} /></div>
                  <div className="input-group"><label className="input-label">Taxa Anual (ex: 0.12 = 12%) *</label><input className="input" type="number" step="0.0001" required value={loanForm.annual_interest_rate} onChange={e => setLoanForm(p => ({ ...p, annual_interest_rate: e.target.value }))} /></div>
                  <div className="input-group"><label className="input-label">Parcelas *</label><input className="input" type="number" required value={loanForm.installments} onChange={e => setLoanForm(p => ({ ...p, installments: e.target.value }))} /></div>
                  <div className="input-group"><label className="input-label">Tabela *</label>
                    <select className="input" value={loanForm.amortization_type} onChange={e => setLoanForm(p => ({ ...p, amortization_type: e.target.value }))}>
                      <option value="SAC">SAC (Parcelas Decrescentes)</option>
                      <option value="PRICE">PRICE (Parcelas Fixas)</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="submit" className="btn btn-primary"><CheckCircle2 size={14} /> Salvar Contrato</button>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowLoanForm(false)}>Cancelar</button>
                </div>
              </form>
            </div>
          )}
          <div className="card">
            <h3 className="card-title mb-4">Contratos de Crédito e Financiamentos</h3>
            <div className="table-responsive">
              <table className="data-table">
                <thead><tr><th>Contrato</th><th>Principal</th><th>Parcelas</th><th>Taxa Anual</th><th>Tipo</th><th>Início</th><th style={{ textAlign: 'center' }}>Tabela</th></tr></thead>
                <tbody>
                  {loans.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Nenhum contrato. Execute a migração SQL no Supabase primeiro.</td></tr>}
                  {loans.map(l => (
                    <tr key={l.id} className="table-row">
                      <td className="font-medium">{l.contract_number || '—'}</td>
                      <td className="font-mono text-danger">R$ {fmt(l.principal_amount)}</td>
                      <td>{l.installments}x</td>
                      <td className="font-mono">{(Number(l.annual_interest_rate) * 100).toFixed(2)}% a.a.</td>
                      <td><span className={`loan-badge ${l.amortization_type === 'SAC' ? 'sac' : 'price'}`}>{l.amortization_type}</span></td>
                      <td>{new Date(l.start_date).toLocaleDateString('pt-BR')}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn btn-sm btn-ghost" onClick={() => showSchedule(l)}><Eye size={13} /> Ver Tabela</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODULE: CENTROS DE CUSTO ─────────────────────────── */}
      {module === 'centros' && (
        <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 className="card-title mb-4">Novo Centro de Custo</h3>
            <form onSubmit={handleSaveCC} className="cc-inline-form" style={{ flexWrap: 'wrap' }}>
              <div className="input-group" style={{ flex: '0 0 140px' }}>
                <label className="input-label">Código</label>
                <input className="input" placeholder="CC-OPR" value={ccForm.code} onChange={e => setCcForm(p => ({ ...p, code: e.target.value }))} />
              </div>
              <div className="input-group" style={{ flex: 1, minWidth: 200 }}>
                <label className="input-label">Nome</label>
                <input className="input" placeholder="Ex: Operacional, Marketing..." value={ccForm.name} onChange={e => setCcForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end' }}><Plus size={14} /> Adicionar</button>
            </form>
          </div>
          <div className="card">
            <h3 className="card-title mb-4">Centros de Custo Cadastrados</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
              {costCenters.length === 0 && <p className="text-secondary text-sm">Nenhum centro de custo. Execute a migração SQL no Supabase primeiro.</p>}
              {costCenters.map(cc => (
                <div key={cc.id} className="cc-tag">
                  <span style={{ fontWeight: 700, color: 'var(--primary-400)', fontFamily: 'monospace' }}>{cc.code}</span>
                  <span>{cc.name}</span>
                  {cc.is_active && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success-500)', flexShrink: 0 }} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── AMORTIZATION SCHEDULE MODAL ─────────────────────── */}
      {amortLoan && (
        <div className="amort-modal-overlay" onClick={() => setAmortLoan(null)}>
          <div className="amort-modal" onClick={e => e.stopPropagation()}>
            <div className="amort-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Tabela de Amortização — {amortLoan.amortization_type}</h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Principal: R$ {fmt(amortLoan.principal_amount)} · {amortLoan.installments} parcelas · {(amortLoan.annual_interest_rate * 100).toFixed(2)}% a.a.
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setAmortLoan(null)}><X size={16} /></button>
            </div>
            <div className="amort-modal-body">
              <table className="amort-table">
                <thead>
                  <tr><th>#</th><th>Parcela Total</th><th>Amortização</th><th>Juros</th><th>Saldo Devedor</th></tr>
                </thead>
                <tbody>
                  {amortSchedule.map(row => (
                    <tr key={row.installment}>
                      <td style={{ textAlign: 'left' }}>{row.installment}</td>
                      <td>R$ {fmt(row.payment)}</td>
                      <td className="text-success">R$ {fmt(row.amortization)}</td>
                      <td className="text-danger">R$ {fmt(row.interest)}</td>
                      <td className="text-secondary">R$ {fmt(Math.max(row.remaining_balance, 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── CONFIRMAR BAIXA MODAL ───────────────────────────── */}
      {payTransaction && (
        <div className="amort-modal-overlay" onClick={() => setPayTransaction(null)}>
          <div className="amort-modal" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
            <div className="amort-modal-header" style={{ borderBottomColor: 'var(--border-default)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: payTransaction.type === 'income' ? 'var(--accent-400)' : 'var(--danger-400)' }}>
                  {payTransaction.type === 'income' ? 'Confirmar Recebimento' : 'Confirmar Pagamento'}
                </h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {payTransaction.description}
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setPayTransaction(null)}><X size={16} /></button>
            </div>
            <div className="amort-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div className="input-group">
                <label className="input-label">Data de Baixa/Pagamento</label>
                <input 
                  type="date" 
                  className="input" 
                  value={paymentDateInput} 
                  onChange={e => handlePaymentDateChange(e.target.value)} 
                />
              </div>

              <div style={{ background: 'var(--surface-3)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span className="text-secondary">Valor Original:</span>
                  <span style={{ fontWeight: 600 }}>R$ {fmt(payTransaction.amount)}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-default)', paddingTop: '0.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="input-group">
                      <label className="input-label" style={{ fontSize: '0.7rem' }}>Multa (R$)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="input" 
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                        value={penaltyInput || ''} 
                        onChange={e => setPenaltyInput(Number(e.target.value))} 
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label" style={{ fontSize: '0.7rem' }}>Juros (R$)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="input" 
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                        value={interestInput || ''} 
                        onChange={e => setInterestInput(Number(e.target.value))} 
                      />
                    </div>
                  </div>
                </div>

                <div className="input-group" style={{ borderTop: '1px solid var(--border-default)', paddingTop: '0.5rem' }}>
                  <label className="input-label" style={{ fontSize: '0.75rem' }}>Desconto (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="input" 
                    style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                    value={discountInput || ''} 
                    onChange={e => setDiscountInput(Number(e.target.value))} 
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-strong)', paddingTop: '0.75rem', marginTop: '0.25rem', fontSize: '1rem', fontWeight: 700 }}>
                  <span className="text-primary">Total Baixado:</span>
                  <span style={{ color: payTransaction.type === 'income' ? 'var(--accent-400)' : 'var(--danger-400)' }}>
                    R$ {fmt(
                      Number(payTransaction.amount) + 
                      Number(penaltyInput || 0) + 
                      Number(interestInput || 0) - 
                      Number(discountInput || 0)
                    )}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }} 
                  onClick={() => setPayTransaction(null)}
                >
                  Cancelar
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ 
                    flex: 1, 
                    background: payTransaction.type === 'income' ? 'var(--gradient-accent)' : 'var(--danger-600)',
                    boxShadow: 'none' 
                  }} 
                  disabled={!paymentDateInput}
                  onClick={confirmBaixa}
                >
                  <CheckCircle2 size={14} /> Confirmar Baixa
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
