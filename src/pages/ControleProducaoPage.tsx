import { useState } from 'react';
import { Play, CheckCircle, FileText, QrCode, ClipboardList, Sparkles, Printer, User, ArrowRight } from 'lucide-react';
import './ControleProducaoPage.css';

interface Order {
  id: string;
  client: string;
  project: string;
  material: string;
  qty: number;
  width: number;
  height: number;
  finishing: string;
  step: 'comercial' | 'criacao' | 'pre_impressao' | 'impressao' | 'acabamento' | 'expedicao' | 'instalacao' | 'entrega';
}

const PRODUCTION_STEPS = [
  { id: 'comercial', label: 'Comercial' },
  { id: 'criacao', label: 'Criação' },
  { id: 'pre_impressao', label: 'Pré-impressão' },
  { id: 'impressao', label: 'Impressão' },
  { id: 'acabamento', label: 'Acabamento' },
  { id: 'expedicao', label: 'Expedição' },
  { id: 'instalacao', label: 'Instalação' },
  { id: 'entrega', label: 'Entrega' },
] as const;

export default function ControleProducaoPage() {
  const [orders, setOrders] = useState<Order[]>([
    { id: 'ord-101', client: 'Academia FitLife', project: 'Banner Lona Frontlight', material: 'Lona 440g Glos', qty: 2, width: 3.0, height: 1.0, finishing: 'Bastão e Corda', step: 'impressao' },
    { id: 'ord-102', client: 'Clínica Sorriso', project: 'Letreiro Acrílico Recortado', material: 'Acrílico Cristal 5mm', qty: 1, width: 1.5, height: 0.8, finishing: 'Fita Dupla Face 3M', step: 'criacao' },
    { id: 'ord-103', client: 'Supermercado Solar', project: 'Envelopamento de Caminhão', material: 'Adesivo Polimérico Brilho', qty: 1, width: 8.0, height: 2.5, finishing: 'Sem acabamento adicional', step: 'pre_impressao' },
  ]);

  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  const handleNextStep = (id: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const curIdx = PRODUCTION_STEPS.findIndex(st => st.id === o.step);
      if (curIdx === -1 || curIdx === PRODUCTION_STEPS.length - 1) return o;
      return { ...o, step: PRODUCTION_STEPS[curIdx + 1].id };
    }));
  };

  const handlePrintRomaneio = (order: Order) => {
    setActiveOrder(order);
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Controle de Produção & PCP</h1>
          <p className="page-subtitle">Fluxo operacional do comercial à entrega final</p>
        </div>
      </div>

      {/* Grid containing orders lists */}
      <div className="form-grid" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        
        {/* Active Production List */}
        <div className="card">
          <h3 className="card-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardList size={18} color="var(--primary-400)" /> Fila de Ordens de Produção
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map(order => (
              <div key={order.id} className="production-order-item" style={{ background: 'var(--surface-3)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary-400)' }}>#{order.id}</span>
                  <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                    {PRODUCTION_STEPS.find(s => s.id === order.step)?.label}
                  </span>
                </div>
                
                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9375rem' }}>{order.project}</h4>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cliente: {order.client}</p>
                
                {/* Horizontal steps flow */}
                <div className="steps-flow-timeline">
                  {PRODUCTION_STEPS.map((st, idx) => {
                    const activeIdx = PRODUCTION_STEPS.findIndex(s => s.id === order.step);
                    const isPassed = idx <= activeIdx;
                    return (
                      <div key={st.id} className={`step-dot-item ${isPassed ? 'passed' : ''}`} title={st.label} />
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => handlePrintRomaneio(order)} style={{ gap: '0.25rem' }}>
                    <FileText size={12} /> Romaneio
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => handleNextStep(order.id)} style={{ gap: '0.25rem' }}>
                    <Play size={12} /> Avançar Etapa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Romaneio / Ficha Técnica Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {activeOrder ? (
            <div className="card animate-slide-in" id="printable-romaneio-card" style={{ border: '2px dashed var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-default)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>ROMANEIO DE PRODUÇÃO</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID da Ordem: {activeOrder.id}</span>
                </div>
                <div className="qr-sim-block">
                  <QrCode size={40} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                <div><strong>Cliente:</strong> {activeOrder.client}</div>
                <div><strong>Projeto:</strong> {activeOrder.project}</div>
                <div><strong>Material:</strong> {activeOrder.material}</div>
                <div><strong>Quantidade:</strong> {activeOrder.qty} un</div>
                <div><strong>Medidas:</strong> {activeOrder.width}m x {activeOrder.height}m</div>
                <div><strong>Acabamentos:</strong> {activeOrder.finishing}</div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '0.75rem', marginTop: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--warning-400)', display: 'block', marginBottom: '0.5rem' }}>
                  <Sparkles size={12} style={{ display: 'inline', marginRight: '0.25rem' }} /> Descritivo Técnico Automático:
                </span>
                <div style={{ background: 'var(--surface-2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div>• <strong>Materiais:</strong> 1x {activeOrder.material} ({activeOrder.width * activeOrder.height} m²)</div>
                  <div>• <strong>Processos:</strong> Impressão solvente Mimaki + Acabamento manual</div>
                  <div>• <strong>Checklist Instalação:</strong> Conferir pontos de solda e fixadores na parede.</div>
                </div>
              </div>

              <button className="btn btn-primary w-full mt-4" style={{ gap: '0.5rem' }} onClick={() => window.print()}>
                <Printer size={14} /> Imprimir Romaneio
              </button>
            </div>
          ) : (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 300 }}>
              <span style={{ fontSize: '2rem' }}>📋</span>
              <h4 style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Selecione "Romaneio" para gerar ficha técnica e código QR de produção.</h4>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
