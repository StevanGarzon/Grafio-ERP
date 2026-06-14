import { useState } from 'react';
import { Layers, Scissors, Grid, AlertTriangle, Play, Sparkles, RefreshCw } from 'lucide-react';
import './SimuladorIndustrialPage.css';

export default function SimuladorIndustrialPage() {
  const [substrate, setSubstrate] = useState<'MDF' | 'Lona' | 'ACM' | 'Adesivo'>('ACM');
  const [chapaW, setChapaW] = useState(3000); // mm
  const [chapaH, setChapaH] = useState(2000); // mm
  
  const [itemW, setItemW] = useState(900); // mm
  const [itemH, setItemH] = useState(600); // mm
  const [itemQty, setItemQty] = useState(8);

  const calculateNesting = () => {
    // Basic linear grid nesting simulation
    const cols = Math.floor(chapaW / itemW);
    const rows = Math.floor(chapaH / itemH);
    const fitPerChapa = cols * rows;
    
    if (fitPerChapa === 0) {
      return { chapasNeeded: 0, fitPerChapa: 0, utilizationPct: 0, wastedAreaPct: 100 };
    }

    const chapasNeeded = Math.ceil(itemQty / fitPerChapa);
    const usedArea = (itemW * itemH) * itemQty;
    const totalArea = (chapaW * chapaH) * chapasNeeded;
    
    const utilizationPct = Math.min((usedArea / totalArea) * 100, 100);
    const wastedAreaPct = 100 - utilizationPct;

    return {
      chapasNeeded,
      fitPerChapa,
      utilizationPct,
      wastedAreaPct,
      cols,
      rows
    };
  };

  const results = calculateNesting();

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Simulador Industrial & Plano de Corte</h1>
          <p className="page-subtitle">Otimização de aproveitamento de substratos, chapas e bobinas</p>
        </div>
      </div>

      <div className="form-grid" style={{ gridTemplateColumns: '1fr 1.5fr' }}>
        {/* Nesting inputs */}
        <div className="card">
          <h3 className="card-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Scissors size={18} color="var(--primary-400)" /> Dimensões de Corte
          </h3>
          
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Substrato</label>
              <select className="input" value={substrate} onChange={e => setSubstrate(e.target.value as any)}>
                <option value="ACM">ACM (Chapa Alumínio)</option>
                <option value="MDF">MDF (Madeira)</option>
                <option value="Lona">Lona Frontlight (Bobina)</option>
                <option value="Adesivo">Adesivo Autocolante</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="input-group">
                <label className="input-label">Chapa - Largura (mm)</label>
                <input type="number" className="input" value={chapaW} onChange={e => setChapaW(Number(e.target.value))} />
              </div>
              <div className="input-group">
                <label className="input-label">Chapa - Altura (mm)</label>
                <input type="number" className="input" value={chapaH} onChange={e => setChapaH(Number(e.target.value))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="input-group">
                <label className="input-label">Item - Largura (mm)</label>
                <input type="number" className="input" value={itemW} onChange={e => setItemW(Number(e.target.value))} />
              </div>
              <div className="input-group">
                <label className="input-label">Item - Altura (mm)</label>
                <input type="number" className="input" value={itemH} onChange={e => setItemH(Number(e.target.value))} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Quantidade Requerida</label>
              <input type="number" className="input" value={itemQty} onChange={e => setItemQty(Number(e.target.value))} />
            </div>
          </form>
        </div>

        {/* Visual Mock Grid of Nesting */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card">
            <h3 className="card-title mb-4">Aproveitamento do Plano de Corte</h3>
            <div className="fin-kpi-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="fin-kpi-card success" style={{ padding: '0.75rem' }}>
                <span className="fin-kpi-label">Aproveitamento</span>
                <span className="fin-kpi-value" style={{ fontSize: '1.25rem', color: 'var(--success-400)' }}>{results.utilizationPct.toFixed(1)}%</span>
              </div>
              <div className="fin-kpi-card danger" style={{ padding: '0.75rem' }}>
                <span className="fin-kpi-label">Desperdício</span>
                <span className="fin-kpi-value" style={{ fontSize: '1.25rem', color: 'var(--danger-400)' }}>{results.wastedAreaPct.toFixed(1)}%</span>
              </div>
              <div className="fin-kpi-card primary" style={{ padding: '0.75rem' }}>
                <span className="fin-kpi-label">Chapas Necessárias</span>
                <span className="fin-kpi-value" style={{ fontSize: '1.25rem' }}>{results.chapasNeeded} un</span>
              </div>
            </div>

            {/* Simulated Nesting Sheet */}
            <div className="nesting-visual-sheet mt-4" style={{ position: 'relative', width: '100%', height: '240px', background: 'var(--surface-3)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <span className="sheet-dims text-xs" style={{ position: 'absolute', right: '5px', bottom: '5px', color: 'var(--text-tertiary)' }}>{chapaW}x{chapaH} mm</span>
              
              {/* Items nesting layout inside the sheet */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${results.cols || 1}, 1fr)`,
                gap: '4px',
                padding: '10px',
                height: '80%',
                width: '100%'
              }}>
                {Array.from({ length: Math.min(results.fitPerChapa, itemQty) }).map((_, idx) => (
                  <div key={idx} className="nesting-item-box" style={{
                    background: 'rgba(51,102,255,0.15)',
                    border: '1px solid var(--primary-400)',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    color: 'var(--primary-400)'
                  }}>
                    {itemW}x{itemH}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
