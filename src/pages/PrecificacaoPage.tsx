import { useState } from 'react';
import { DollarSign, Percent, ShieldAlert, Sparkles, FileText, CheckCircle, Calculator, ChevronRight } from 'lucide-react';
import './PrecificacaoPage.css';

interface PricingSimulation {
  material: string;
  width: number;
  height: number;
  qty: number;
  inkCost: number;
  manCost: number;
  machineCost: number;
  indirectCost: number;
  commission: number;
  taxes: number;
  desiredMargin: number;
}

export default function PrecificacaoPage() {
  const [sim, setSim] = useState<PricingSimulation>({
    material: 'ACM',
    width: 2.0,
    height: 1.0,
    qty: 1,
    inkCost: 45,
    manCost: 65,
    machineCost: 80,
    indirectCost: 200,
    commission: 5,
    taxes: 8,
    desiredMargin: 25
  });

  const [aiSuggestions, setAiSuggestions] = useState<any | null>(null);

  const calculatePricing = () => {
    const area = sim.width * sim.height * sim.qty;
    const directMaterials = (sim.material === 'ACM' ? 220 : sim.material === 'Lona' ? 35 : 75) * area;
    const labourHours = (sim.material === 'ACM' ? 6 : sim.material === 'Lona' ? 1 : 2) * sim.qty;
    const machineryHours = (sim.material === 'ACM' ? 3 : sim.material === 'Lona' ? 0.5 : 1) * sim.qty;
    
    const totalMaterialsCost = directMaterials + (sim.inkCost * area);
    const totalLabourCost = sim.manCost * labourHours;
    const totalMachineryCost = sim.machineCost * machineryHours;
    
    const directCosts = totalMaterialsCost + totalLabourCost + totalMachineryCost;
    const totalCosts = directCosts + sim.indirectCost;

    // Markup suggestion logic
    const marginRatio = sim.desiredMargin / 100;
    const taxRatio = sim.taxes / 100;
    const commissionRatio = sim.commission / 100;
    const markupFactor = 1 / (1 - (marginRatio + taxRatio + commissionRatio));

    const finalPrice = totalCosts * markupFactor;
    const profit = finalPrice - totalCosts - (finalPrice * taxRatio) - (finalPrice * commissionRatio);

    return {
      area,
      totalMaterialsCost,
      totalLabourCost,
      totalMachineryCost,
      totalCosts,
      finalPrice,
      profit,
      markupFactor
    };
  };

  const results = calculatePricing();

  const handleRunAiAssistant = () => {
    setAiSuggestions({
      suggestedPrice: results.finalPrice * 0.95,
      margin: 22.4,
      risks: [
        'Instalação de ACM em grande altura necessita de equipe de 3 pessoas extra.',
        'Flutuação de preço de metalon na última semana pode reduzir a margem em até 3.5%.'
      ],
      justification: 'Baseado no histórico de vendas e conversão do cliente (taxa de conversão de 75%), sugerimos desconto de 5% sobre a margem ideal para garantir a venda.'
    });
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Assistente de Precificação com IA</h1>
          <p className="page-subtitle">Cálculo de custos diretos, indiretos, markup e margem líquida</p>
        </div>
      </div>

      <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Costing Inputs */}
        <div className="card">
          <h3 className="card-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calculator size={18} color="var(--primary-400)" /> Variáveis do Orçamento
          </h3>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="grid grid-cols-2 gap-4">
              <div className="input-group">
                <label className="input-label">Insumo Base</label>
                <select className="input" value={sim.material} onChange={e => setSim({...sim, material: e.target.value})}>
                  <option value="ACM">ACM (Chapa)</option>
                  <option value="Lona">Lona Frontlight</option>
                  <option value="Adesivo">Adesivo Vinilico</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Quantidade</label>
                <input type="number" className="input" value={sim.qty} onChange={e => setSim({...sim, qty: Number(e.target.value)})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="input-group">
                <label className="input-label">Largura (m)</label>
                <input type="number" step="0.1" className="input" value={sim.width} onChange={e => setSim({...sim, width: Number(e.target.value)})} />
              </div>
              <div className="input-group">
                <label className="input-label">Altura (m)</label>
                <input type="number" step="0.1" className="input" value={sim.height} onChange={e => setSim({...sim, height: Number(e.target.value)})} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="input-group">
                <label className="input-label">Hora-Homem (R$)</label>
                <input type="number" className="input" value={sim.manCost} onChange={e => setSim({...sim, manCost: Number(e.target.value)})} />
              </div>
              <div className="input-group">
                <label className="input-label">Hora-Máquina (R$)</label>
                <input type="number" className="input" value={sim.machineCost} onChange={e => setSim({...sim, machineCost: Number(e.target.value)})} />
              </div>
              <div className="input-group">
                <label className="input-label">Custo Indireto (R$)</label>
                <input type="number" className="input" value={sim.indirectCost} onChange={e => setSim({...sim, indirectCost: Number(e.target.value)})} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="input-group">
                <label className="input-label">Comissão (%)</label>
                <input type="number" className="input" value={sim.commission} onChange={e => setSim({...sim, commission: Number(e.target.value)})} />
              </div>
              <div className="input-group">
                <label className="input-label">Impostos (%)</label>
                <input type="number" className="input" value={sim.taxes} onChange={e => setSim({...sim, taxes: Number(e.target.value)})} />
              </div>
              <div className="input-group">
                <label className="input-label">Margem Desejada (%)</label>
                <input type="number" className="input" value={sim.desiredMargin} onChange={e => setSim({...sim, desiredMargin: Number(e.target.value)})} />
              </div>
            </div>

            <button type="button" className="btn btn-secondary w-full" style={{ gap: '0.5rem', marginTop: '0.5rem' }} onClick={handleRunAiAssistant}>
              <Sparkles size={14} color="var(--warning-400)" /> Consultar IA de Precificação
            </button>
          </form>
        </div>

        {/* Pricing Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 className="card-title mb-4">Estrutura de Custos & Markup</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: '0.5rem' }}>
                <span className="text-secondary">Área Total Calculada:</span>
                <span style={{ fontWeight: 600 }}>{results.area.toFixed(2)} m²</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: '0.5rem' }}>
                <span className="text-secondary">Custo Matéria-prima:</span>
                <span>R$ {results.totalMaterialsCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: '0.5rem' }}>
                <span className="text-secondary">Custo Mão de Obra:</span>
                <span>R$ {results.totalLabourCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: '0.5rem' }}>
                <span className="text-secondary">Custo Hora-Máquina:</span>
                <span>R$ {results.totalMachineryCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: '0.5rem' }}>
                <span className="text-secondary">Fator Markup Sugerido:</span>
                <span style={{ fontWeight: 600, color: 'var(--primary-400)' }}>{results.markupFactor.toFixed(2)}x</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-strong)', paddingBottom: '0.5rem', fontSize: '1.1rem', fontWeight: 700 }}>
                <span className="text-primary">Preço Final Sugerido:</span>
                <span style={{ color: 'var(--success-400)' }}>R$ {results.finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <span>Lucro Líquido Previsto:</span>
                <span style={{ color: 'var(--success-400)', fontWeight: 600 }}>R$ {results.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* AI Panel */}
          {aiSuggestions && (
            <div className="card animate-slide-in" style={{ borderLeft: '3px solid var(--warning-500)', background: 'rgba(245,158,11,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Sparkles size={16} color="var(--warning-400)" />
                <h4 style={{ margin: 0, fontWeight: 700 }}>IA Diagnóstico de Riscos & Sugestões</h4>
              </div>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {aiSuggestions.justification}
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                <span style={{ fontWeight: 600 }}>Preço de Venda IA:</span>
                <span style={{ color: 'var(--warning-400)', fontWeight: 700 }}>R$ {aiSuggestions.suggestedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>

              <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--danger-400)', display: 'block', marginBottom: '0.25rem' }}>
                  <ShieldAlert size={12} style={{ display: 'inline', marginRight: '0.25rem' }} /> Riscos Identificados:
                </span>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {aiSuggestions.risks.map((r: string, idx: number) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
