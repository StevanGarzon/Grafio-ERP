import { useState } from 'react';
import { Bot, Send, Sparkles, User, HelpCircle, Shield, FileText, Settings, Play } from 'lucide-react';
import './AiAgentsHubPage.css';

interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  systemPrompt: string;
}

const AGENTS: Agent[] = [
  { id: 'comercial', name: 'Comercial AI', role: 'Vendas & Follow-ups', avatar: '💼', color: 'var(--primary-400)', systemPrompt: 'Você é o Assistente Comercial AI especializado em recuperação de propostas paradas e sugestões de vendas.' },
  { id: 'financeiro', name: 'Financeiro AI', role: 'DRE & Auditoria Tributária', avatar: '📊', color: '#10b981', systemPrompt: 'Você é o Assistente Financeiro AI especializado em analisar rentabilidade, fluxo de caixa e cálculo tributário.' },
  { id: 'fiscal', name: 'Fiscal AI', role: 'NFe / Transmissão', avatar: '🧾', color: '#8b5cf6', systemPrompt: 'Você é o Assistente Fiscal AI especializado em emissão de notas fiscais, correção e cancelamento.' },
  { id: 'producao', name: 'Produção AI', role: 'PCP & Romaneios', avatar: '🏭', color: '#f59e0b', systemPrompt: 'Você é o Assistente de Produção AI especializado em controle de chão de fábrica e descritivos técnicos.' },
  { id: 'precificacao', name: 'Precificação AI', role: 'Markup & ACM Fachadas', avatar: '🧮', color: '#06b6d4', systemPrompt: 'Você é o Assistente de Precificação AI especializado em custeio direto e indireto.' },
  { id: 'estrategico', name: 'Estratégico AI', role: 'SWOT & OKRs', avatar: '🎯', color: '#ec4899', systemPrompt: 'Você é o Assistente Estratégico AI especializado em planos de ação de negócios.' },
  { id: 'compliance', name: 'Compliance AI', role: 'Riscos & Controles Internos', avatar: '🛡️', color: 'var(--danger-400)', systemPrompt: 'Você é o Assistente de Compliance AI especializado em matrizes de riscos.' },
  { id: 'atendimento', name: 'Atendimento AI', role: 'Pós-Venda & NPS', avatar: '💬', color: '#6366f1', systemPrompt: 'Você é o Assistente de Atendimento AI especializado em campanhas de recompra.' },
];

export default function AiAgentsHubPage() {
  const [activeAgent, setActiveAgent] = useState<Agent>(AGENTS[0]);
  const [messages, setMessages] = useState<Record<string, { sender: 'bot' | 'user'; text: string }[]>>({
    comercial: [
      { sender: 'bot', text: 'Olá! Sou o Assistente Comercial AI. Posso redigir mensagens de follow-up ou sugerir estratégias comerciais. Como posso ajudar?' }
    ],
    financeiro: [
      { sender: 'bot', text: 'Olá! Sou o Assistente Financeiro AI. Digite "Analisar DRE" ou "Saúde Financeira" para começarmos.' }
    ]
  });

  const [inputVal, setInputVal] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg = { sender: 'user' as const, text: inputVal };
    const agentId = activeAgent.id;
    
    // Add User Message
    const updatedMsgs = [...(messages[agentId] || []), userMsg];
    setMessages(prev => ({ ...prev, [agentId]: updatedMsgs }));
    setInputVal('');

    // Simulate AI response based on selected agent context
    setTimeout(() => {
      let responseText = `[${activeAgent.name}]: Entendi sua solicitação. Vamos analisar as métricas e consolidar a estratégia ideal no GRAFIO ERP.`;
      if (agentId === 'comercial' && inputVal.toLowerCase().includes('recuperar')) {
        responseText = `[Comercial AI]: Para recuperar essa proposta paralisada há 5 dias, recomendo enviar uma mensagem no WhatsApp oferecendo frete cortesia ou parcelamento especial em 4x. Quer que eu redija o texto?`;
      } else if (agentId === 'financeiro' && inputVal.toLowerCase().includes('dre')) {
        responseText = `[Financeiro AI]: Analisando o DRE do mês atual: Receita líquida de R$ 145.850,00 e EBITDA saudável de 24.5%. Alerta: O custo com insumo ACM subiu 12%. Recomendo repassar 4% no preço final.`;
      }
      
      setMessages(prev => ({
        ...prev,
        [agentId]: [...(prev[agentId] || []), { sender: 'bot', text: responseText }]
      }));
    }, 1000);
  };

  const currentChat = messages[activeAgent.id] || [{ sender: 'bot' as const, text: `Olá! Sou o ${activeAgent.name}. Como posso ajudar você hoje no ERP?` }];

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">IA & Agentes Especializados</h1>
          <p className="page-subtitle">Assistentes inteligentes integrados para cada área da sua empresa</p>
        </div>
      </div>

      <div className="form-grid" style={{ gridTemplateColumns: '260px 1fr' }}>
        
        {/* Left list of specialized agents */}
        <div className="card" style={{ padding: '0.75rem' }}>
          <span className="input-label" style={{ paddingLeft: '0.5rem', marginBottom: '0.75rem' }}>Agentes Disponíveis</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {AGENTS.map(agent => (
              <button 
                key={agent.id} 
                className={`agent-sidebar-btn ${activeAgent.id === agent.id ? 'active' : ''}`}
                onClick={() => setActiveAgent(agent)}
              >
                <span style={{ fontSize: '1.25rem' }}>{agent.avatar}</span>
                <div style={{ textAlign: 'left' }}>
                  <div className="font-medium" style={{ fontSize: '0.8125rem' }}>{agent.name}</div>
                  <div className="text-xs text-secondary">{agent.role}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat box container */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '520px', padding: 0, overflow: 'hidden' }}>
          {/* Active Agent header */}
          <div style={{ background: 'var(--surface-3)', borderBottom: '1px solid var(--border-default)', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{activeAgent.avatar}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>{activeAgent.name}</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{activeAgent.role}</span>
            </div>
          </div>

          {/* Messages display */}
          <div className="agent-chat-messages-area" style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {currentChat.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ 
                  maxWidth: '70%', 
                  background: msg.sender === 'user' ? 'var(--primary-500)' : 'var(--surface-3)', 
                  color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                  padding: '0.75rem 1rem', 
                  borderRadius: msg.sender === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                  border: msg.sender === 'user' ? 'none' : '1px solid var(--border-default)',
                  fontSize: '0.875rem',
                  lineHeight: 1.4
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Form input field */}
          <form onSubmit={handleSendMessage} style={{ borderTop: '1px solid var(--border-default)', padding: '1rem', display: 'flex', gap: '0.75rem', background: 'var(--surface-1)' }}>
            <input 
              type="text" 
              className="input" 
              placeholder={`Pergunte ao ${activeAgent.name}...`} 
              value={inputVal} 
              onChange={e => setInputVal(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
              <Send size={14} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
