import { useState, useEffect } from 'react';
import { Search, Filter, TrendingDown, TrendingUp, Truck, Info, Star, RefreshCcw } from 'lucide-react';
import './ComparadorPrecosPage.css';

export default function ComparadorPrecosPage() {
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Carregar dados (Mock para exemplo, mas com estrutura funcional)
    setLoading(true);
    setTimeout(() => {
      setPrices([
        { item: 'Vinil Adesivo Branco Brilho', unit: 'rolo (50m)', category: 'Vinil', supplier: 'Suprimentos Brasil', price: 850.00, lastPrice: 890.00, best: true },
        { item: 'Vinil Adesivo Branco Brilho', unit: 'rolo (50m)', category: 'Vinil', supplier: 'Mídias Express', price: 910.00, lastPrice: 880.00, best: false },
        { item: 'Lona 440g Fosca', unit: 'm²', category: 'Lona', supplier: 'Mídias Express', price: 12.50, lastPrice: 12.50, best: true },
        { item: 'Lona 440g Fosca', unit: 'm²', category: 'Lona', supplier: 'Suprimentos Brasil', price: 13.90, lastPrice: 13.50, best: false },
        { item: 'Chapa ACM 3mm 1.22x5m', unit: 'chapa', category: 'ACM', supplier: 'ACM Distribuidora', price: 420.00, lastPrice: 450.00, best: true },
        { item: 'Módulo LED 1.5W 12V', unit: 'cento', category: 'LED', supplier: 'Luz & Cia', price: 180.00, lastPrice: 175.00, best: true },
        { item: 'Tinta Eco-Solvente 1L', unit: 'litro', category: 'Tintas', supplier: 'Tintas Pro', price: 145.00, lastPrice: 155.00, best: true },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const categories = ['Todos', 'Vinil', 'Lona', 'ACM', 'LED', 'Tintas'];

  const filteredPrices = prices.filter(p => {
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesSearch = p.item.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Comparador de Preços</h1>
          <p className="page-subtitle">Inteligência de compras: encontre o melhor fornecedor para cada insumo</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="search-bar" style={{ maxWidth: '250px' }}>
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar insumo..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary" onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 800); }}>
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            Atualizar Preços
          </button>
        </div>
      </div>

      <div className="category-tabs mb-6">
        {categories.map(cat => (
          <button 
            key={cat} 
            className={`tab-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="spinner-container"><div className="spinner"></div></div>
      ) : (
        <div className="prices-grid">
          {filteredPrices.length > 0 ? filteredPrices.map((p, i) => (
            <div key={i} className={`price-card card ${p.best ? 'best-price' : ''}`}>
              {p.best && <div className="best-tag"><Star size={12} /> MELHOR PREÇO</div>}
              <div className="price-header">
                <span className="price-category">{p.category}</span>
                <span className="price-date">Atu. hoje</span>
              </div>
              <h3 className="price-item-name">{p.item}</h3>
              <p className="price-unit">{p.unit}</p>
              
              <div className="price-main">
                <span className="price-value">R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                <div className={`price-trend ${p.price <= p.lastPrice ? 'down' : 'up'}`}>
                  {p.price <= p.lastPrice ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                  {Math.abs(((p.price - p.lastPrice) / p.lastPrice) * 100).toFixed(1)}%
                </div>
              </div>

              <div className="price-supplier">
                <Truck size={14} />
                <span>{p.supplier}</span>
              </div>
            </div>
          )) : (
            <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
              <p className="text-secondary">Nenhum preço encontrado para esta busca ou categoria.</p>
            </div>
          )}
        </div>
      )}
      
      <div className="info-box mt-8">
        <Info size={16} />
        <span>Os preços acima são baseados nas últimas notas fiscais de entrada e atualizações manuais dos fornecedores parceiros.</span>
      </div>
    </div>
  );
}
