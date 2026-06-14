import { useState } from 'react';
import { Calculator, Maximize, Layout, Zap, Ruler, RefreshCcw, Info } from 'lucide-react';
import './CalculadorasPage.css';

export default function CalculadorasPage() {
  const [activeTab, setActiveTab] = useState<'nesting' | 'acm' | 'led'>('nesting');

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Calculadoras Técnicas</h1>
          <p className="page-subtitle">Ferramentas de precisão para produção e orçamentos</p>
        </div>
      </div>

      <div className="calc-tabs">
        <button 
          className={`calc-tab-btn ${activeTab === 'nesting' ? 'active' : ''}`}
          onClick={() => setActiveTab('nesting')}
        >
          <Layout size={18} /> Aproveitamento de Mídia (Nesting)
        </button>
        <button 
          className={`calc-tab-btn ${activeTab === 'acm' ? 'active' : ''}`}
          onClick={() => setActiveTab('acm')}
        >
          <Maximize size={18} /> Calculadora de ACM / Fachadas
        </button>
        <button 
          className={`calc-tab-btn ${activeTab === 'led' ? 'active' : ''}`}
          onClick={() => setActiveTab('led')}
        >
          <Zap size={18} /> Dimensionamento de LEDs
        </button>
      </div>

      <div className="calc-content">
        {activeTab === 'nesting' && <NestingCalculator />}
        {activeTab === 'acm' && <ACMCalculator />}
        {activeTab === 'led' && <LEDCalculator />}
      </div>
    </div>
  );
}

function NestingCalculator() {
  const [rollWidth, setRollWidth] = useState(106);
  const [artWidth, setArtWidth] = useState(10);
  const [artHeight, setArtHeight] = useState(10);
  const [quantity, setQuantity] = useState(100);
  const [bleeding, setBleeding] = useState(0.5);

  const itemsPerRow = Math.floor(rollWidth / (artWidth + bleeding));
  const rowsNeeded = Math.ceil(quantity / itemsPerRow);
  const linearMeters = (rowsNeeded * (artHeight + bleeding)) / 100;
  const totalArea = (quantity * artWidth * artHeight) / 10000;
  const rollArea = (linearMeters * rollWidth) / 100;
  const wastePercent = rollArea > 0 ? ((rollArea - totalArea) / rollArea) * 100 : 0;

  return (
    <div className="calc-card-grid">
      <div className="card">
        <h3 className="card-title mb-4"><Ruler size={18} color="var(--primary-400)"/> Parâmetros de Entrada</h3>
        <div className="input-group mb-4">
          <label className="input-label">Largura da Bobina (cm)</label>
          <input type="number" className="input" value={rollWidth} onChange={e => setRollWidth(Number(e.target.value))} />
        </div>
        <div className="form-row mb-4">
          <div className="input-group">
            <label className="input-label">Largura Arte (cm)</label>
            <input type="number" className="input" value={artWidth} onChange={e => setArtWidth(Number(e.target.value))} />
          </div>
          <div className="input-group">
            <label className="input-label">Altura Arte (cm)</label>
            <input type="number" className="input" value={artHeight} onChange={e => setArtHeight(Number(e.target.value))} />
          </div>
        </div>
        <div className="form-row">
          <div className="input-group">
            <label className="input-label">Quantidade</label>
            <input type="number" className="input" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
          </div>
          <div className="input-group">
            <label className="input-label">Sangria/Espaço (cm)</label>
            <input type="number" className="input" value={bleeding} onChange={e => setBleeding(Number(e.target.value))} />
          </div>
        </div>
      </div>

      <div className="card results-card">
        <h3 className="card-title mb-4"><Calculator size={18} color="var(--success-400)"/> Resultado Estimado</h3>
        <div className="result-main">
          <span className="result-label">Metros Lineares Necessários</span>
          <span className="result-value text-success">{linearMeters.toFixed(2)}m</span>
        </div>
        <div className="result-stats">
          <div className="stat-item">
            <span className="stat-label">Itens por Linha</span>
            <span className="stat-value">{itemsPerRow}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total de Linhas</span>
            <span className="stat-value">{rowsNeeded}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Aproveitamento</span>
            <span className="stat-value">{(100 - wastePercent).toFixed(1)}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Refugo (Desperdício)</span>
            <span className="stat-value text-danger">{wastePercent.toFixed(1)}%</span>
          </div>
        </div>
        <div className="info-box mt-4">
          <Info size={14} />
          <span>Considerando encaixe simples sem rotação de arte.</span>
        </div>
      </div>
    </div>
  );
}

function ACMCalculator() {
  const [width, setWidth] = useState(300);
  const [height, setHeight] = useState(100);
  const [fold, setFold] = useState(3); // dobra lateral em cm
  const [plateWidth, setPlateWidth] = useState(122); // largura da chapa em cm

  const totalWidth = width + (fold * 2);
  const totalHeight = height + (fold * 2);
  const totalArea = (totalWidth * totalHeight) / 10000;
  
  // Área da chapa selecionada (Largura x 5.00m de comprimento padrão)
  const plateArea = (plateWidth / 100) * 5;
  const numPlates = Math.ceil(totalArea / plateArea);

  return (
    <div className="calc-card-grid">
      <div className="card">
        <h3 className="card-title mb-4"><Ruler size={18} color="var(--primary-400)"/> Dimensões da Fachada</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="input-group">
            <label className="input-label">Largura Visível (cm)</label>
            <input type="number" className="input" value={width} onChange={e => setWidth(Number(e.target.value))} />
          </div>
          <div className="input-group">
            <label className="input-label">Altura Visível (cm)</label>
            <input type="number" className="input" value={height} onChange={e => setHeight(Number(e.target.value))} />
          </div>
        </div>
        
        <div className="input-group mb-4">
          <label className="input-label">Largura da Chapa ACM</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className={`btn btn-sm ${plateWidth === 122 ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setPlateWidth(122)}
              style={{ flex: 1 }}
            >
              1.22m
            </button>
            <button 
              className={`btn btn-sm ${plateWidth === 150 ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setPlateWidth(150)}
              style={{ flex: 1 }}
            >
              1.50m
            </button>
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Margem de Dobra (cm)</label>
          <input type="number" className="input" value={fold} onChange={e => setFold(Number(e.target.value))} />
        </div>
      </div>

      <div className="card results-card">
        <h3 className="card-title mb-4"><Calculator size={18} color="var(--success-400)"/> Necessidade de Material</h3>
        <div className="result-main">
          <span className="result-label">Área Total (com dobras)</span>
          <span className="result-value text-primary">{totalArea.toFixed(2)} m²</span>
        </div>
        <div className="result-stats">
          <div className="stat-item">
            <span className="stat-label">Medida p/ Corte (L)</span>
            <span className="stat-value">{totalWidth} cm</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Medida p/ Corte (A)</span>
            <span className="stat-value">{totalHeight} cm</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Chapas Estimadas</span>
            <span className="stat-value">{numPlates} un.</span>
          </div>
        </div>
        <p className="text-xs text-secondary mt-4">
          * Estimativa baseada em chapas de {plateWidth / 100}m x 5.00m ({plateArea.toFixed(1)}m²).
        </p>
      </div>
    </div>
  );
}

function LEDCalculator() {
  const [area, setArea] = useState(1);
  const [ledsPerM2, setLedsPerM2] = useState(50);
  const [wattsPerLed, setWattsPerLed] = useState(1.5);

  const totalLeds = Math.ceil(area * ledsPerM2);
  const totalWatts = totalLeds * wattsPerLed;
  const recommendedSource = totalWatts * 1.2; // 20% folga

  return (
    <div className="calc-card-grid">
      <div className="card">
        <h3 className="card-title mb-4"><Ruler size={18} color="var(--primary-400)"/> Especificações da Iluminação</h3>
        <div className="input-group mb-4">
          <label className="input-label">Área a Iluminar (m²)</label>
          <input type="number" step="0.1" className="input" value={area} onChange={e => setArea(Number(e.target.value))} />
        </div>
        <div className="input-group mb-4">
          <label className="input-label">Módulos LED por m²</label>
          <input type="number" className="input" value={ledsPerM2} onChange={e => setLedsPerM2(Number(e.target.value))} />
        </div>
        <div className="input-group">
          <label className="input-label">Potência por Módulo (W)</label>
          <input type="number" step="0.1" className="input" value={wattsPerLed} onChange={e => setWattsPerLed(Number(e.target.value))} />
        </div>
      </div>

      <div className="card results-card">
        <h3 className="card-title mb-4"><Zap size={18} color="var(--warning-400)"/> Dimensionamento Elétrico</h3>
        <div className="result-main">
          <span className="result-label">Potência Total Consumida</span>
          <span className="result-value text-warning">{totalWatts.toFixed(0)}W</span>
        </div>
        <div className="result-stats">
          <div className="stat-item">
            <span className="stat-label">Total de Módulos LED</span>
            <span className="stat-value">{totalLeds} un.</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Fonte Recomendada</span>
            <span className="stat-value">{recommendedSource.toFixed(0)}W</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Corrente (em 12V)</span>
            <span className="stat-value">{(recommendedSource / 12).toFixed(1)}A</span>
          </div>
        </div>
        <div className="info-box mt-4" style={{ borderColor: 'var(--warning-500)', background: 'rgba(245,158,11,0.05)' }}>
          <Info size={14} color="var(--warning-500)"/>
          <span style={{ color: 'var(--warning-200)' }}>Fonte sugerida com 20% de margem de segurança.</span>
        </div>
      </div>
    </div>
  );
}
