import { useState, useEffect } from 'react';
import { Kanban, Sparkles, MessageSquare, Mail, Phone, Calendar, ArrowRight, TrendingUp, DollarSign, Target, Plus, Send } from 'lucide-react';
import './CrmPipelinePage.css';

interface Opportunity {
  id: string;
  client_name: string;
  title: string;
  value: number;
  stage: 'lead' | 'contacted' | 'quote_sent' | 'negotiating' | 'pending_approval' | 'production' | 'delivered' | 'won' | 'lost';
  email?: string;
  phone?: string;
  inactive_days: number;
}

const STAGES = [
  { id: 'lead', label: 'Novo Lead', color: 'var(--primary-400)' },
  { id: 'contacted', label: 'Contato Realizado', color: '#8b5cf6' },
  { id: 'quote_sent', label: 'Orçamento Enviado', color: '#06b6d4' },
  { id: 'negotiating', label: 'Em Negociação', color: '#f59e0b' },
  { id: 'pending_approval', label: 'Aguardando Aprovação', color: '#a78bfa' },
  { id: 'production', label: 'Produção', color: '#10b981' },
  { id: 'delivered', label: 'Entregue', color: '#22c55e' },
  { id: 'won', label: 'Fechado Ganho', color: 'var(--success-400)' },
  { id: 'lost', label: 'Fechado Perdido', color: 'var(--danger-400)' },
] as const;

export default function CrmPipelinePage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([
    { id: 'opp-1', client_name: 'Supermercado Solar', title: 'Letreiro ACM Luminoso', value: 8500, stage: 'negotiating', email: 'solar@mercado.com', phone: '11999999999', inactive_days: 5 },
    { id: 'opp-2', client_name: 'Tech Office S/A', title: 'Adesivação de Vidros', value: 2400, stage: 'lead', email: 'contato@tech.com', phone: '1188888888', inactive_days: 0 },
    { id: 'opp-3', client_name: 'Pizzaria Napolitana', title: 'Banner Lona 440g', value: 350, stage: 'quote_sent', email: 'pizza@napo.com', phone: '1177777777', inactive_days: 4 },
  ]);

  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);

  const moveOpportunity = (id: string, newStage: Opportunity['stage']) => {
    setOpportunities(prev => prev.map(o => o.id === id ? { ...o, stage: newStage, inactive_days: 0 } : o));
  };

  const handleTriggerAiAction = (opp: Opportunity) => {
    setAiAnalysis(`[IA Comercial]: O negócio com ${opp.client_name} (R$ ${opp.value}) está parado há ${opp.inactive_days} dias.
• Whatsapp sugerido: "Olá, vimos que seu orçamento para o Letreiro ACM está pronto! Conseguimos condições especiais de parcelamento se fecharmos essa semana. Vamos avançar?"
• Email automático gerado com sucesso.
• Tarefa criada: Vendedor deve ligar em 24h.`);
    setSelectedOpp(opp);
  };

  const totalWon = opportunities.filter(o => o.stage === 'won').reduce((sum, o) => sum + o.value, 0);
  const forecasted = opportunities.filter(o => o.stage !== 'lost' && o.stage !== 'won').reduce((sum, o) => sum + o.value, 0);
  const conversionRate = opportunities.length > 0 ? (opportunities.filter(o => o.stage === 'won').length / opportunities.length) * 100 : 0;

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">CRM & Funil de Vendas</h1>
          <p className="page-subtitle">Gestão comercial inteligente e pipeline configurável</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="fin-kpi-grid mb-6">
        <div className="fin-kpi-card success">
          <p className="fin-kpi-label">Receita Realizada</p>
          <p className="fin-kpi-value" style={{ color: 'var(--success-400)' }}>R$ {totalWon.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="fin-kpi-sub">Fechados ganhos</p>
        </div>
        <div className="fin-kpi-card primary">
          <p className="fin-kpi-label">Receita Prevista</p>
          <p className="fin-kpi-value" style={{ color: 'var(--primary-400)' }}>R$ {forecasted.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="fin-kpi-sub">Negócios em aberto</p>
        </div>
        <div className="fin-kpi-card warning">
          <p className="fin-kpi-label">Taxa de Conversão</p>
          <p className="fin-kpi-value" style={{ color: 'var(--warning-400)' }}>{conversionRate.toFixed(1)}%</p>
          <p className="fin-kpi-sub">Eficiência do funil</p>
        </div>
        <div className="fin-kpi-card purple">
          <p className="fin-kpi-label">Meta Comercial</p>
          <p className="fin-kpi-value" style={{ color: '#a78bfa' }}>R$ 50.000,00</p>
          <p className="fin-kpi-sub">Faturamento planejado</p>
        </div>
      </div>

      {/* Pipeline Board */}
      <div className="crm-kanban-board">
        {STAGES.map(stage => {
          const stageOpps = opportunities.filter(o => o.stage === stage.id);
          return (
            <div key={stage.id} className="crm-kanban-column">
              <div className="crm-column-header" style={{ borderTop: `3px solid ${stage.color}` }}>
                <span>{stage.label}</span>
                <span className="badge badge-secondary">{stageOpps.length}</span>
              </div>
              <div className="crm-column-cards">
                {stageOpps.map(opp => (
                  <div key={opp.id} className="crm-opp-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 className="opp-title">{opp.title}</h4>
                      {opp.inactive_days >= 4 && (
                        <span className="badge badge-danger animate-pulse" title="Parado há mais de 4 dias">⚠️ {opp.inactive_days}d</span>
                      )}
                    </div>
                    <p className="opp-client">{opp.client_name}</p>
                    <p className="opp-value">R$ {opp.value.toLocaleString('pt-BR')}</p>
                    
                    <div className="opp-card-actions">
                      <button className="btn-icon-xs" title="Acionar IA Comercial" onClick={() => handleTriggerAiAction(opp)}>
                        <Sparkles size={12} color="var(--warning-400)" />
                      </button>
                      <select 
                        className="input input-sm" 
                        style={{ fontSize: '0.75rem', padding: '0.125rem', width: 'auto' }}
                        value={opp.stage} 
                        onChange={(e) => moveOpportunity(opp.id, e.target.value as any)}
                      >
                        {STAGES.map(st => (
                          <option key={st.id} value={st.id}>{st.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* IA Recommendation Section */}
      {aiAnalysis && (
        <div className="card mt-6 border-left-warning animate-slide-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Sparkles size={18} color="var(--warning-400)" />
            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>IA Recomendação Comercial - {selectedOpp?.client_name}</h3>
          </div>
          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
            {aiAnalysis}
          </pre>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button 
              className="btn btn-primary btn-sm" 
              style={{ gap: '0.25rem' }}
              onClick={() => {
                const message = "Olá, vimos que seu orçamento para o Letreiro ACM está pronto! Conseguimos condições especiais de parcelamento se fecharmos essa semana. Vamos avançar?";
                window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
              }}
            >
              <Send size={12} /> Enviar WhatsApp
            </button>
            <button className="btn btn-secondary btn-sm" style={{ gap: '0.25rem' }}>
              <Mail size={12} /> Enviar E-mail
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
