import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, ArrowLeft, CheckCircle2, Play, Settings, ClipboardList, Camera } from 'lucide-react';
import './ScannerProducaoPage.css';

export default function ScannerProducaoPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'scan' | 'action'>('scan');
  const [scannedOS, setScannedOS] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const simulateScan = () => {
    setLoading(true);
    setTimeout(() => {
      setScannedOS({
        id: '1025',
        client: 'Academia Corpo & Saúde',
        service: 'Banner 3x1m Lona 440g',
        currentStatus: 'Aguardando'
      });
      setStep('action');
      setLoading(false);
    }, 1500);
  };

  const updateStatus = (newStatus: string) => {
    setLoading(true);
    setTimeout(() => {
      alert(`OS #${scannedOS.id} atualizada para: ${newStatus}`);
      navigate('/producao');
    }, 1000);
  };

  return (
    <div className="page-container scanner-mobile-container">
      <div className="scanner-header">
        <button className="btn-ghost btn-icon" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
        </button>
        <h2 className="scanner-title">Produção Inteligente</h2>
        <div style={{ width: 40 }}></div>
      </div>

      <div className="scanner-content">
        {step === 'scan' ? (
          <div className="scan-view animate-fade-in">
            <div className="scan-window">
              <div className="scan-overlay">
                <div className="scan-corner tl"></div>
                <div className="scan-corner tr"></div>
                <div className="scan-corner bl"></div>
                <div className="scan-corner br"></div>
                <div className="scan-line"></div>
              </div>
              <Camera size={48} className="scan-bg-icon" />
            </div>
            
            <div className="scan-instructions">
              <QrCode size={24} />
              <p>Aponte a câmera para o QR Code na Ordem de Serviço impressa.</p>
            </div>

            <button className="btn btn-primary w-full mt-8" onClick={simulateScan} disabled={loading}>
              {loading ? 'Identificando...' : 'Simular Leitura QR'}
            </button>
          </div>
        ) : (
          <div className="action-view animate-slide-in">
            <div className="scanned-os-card card">
              <div className="os-badge">OS #{scannedOS.id}</div>
              <h3 className="os-client">{scannedOS.client}</h3>
              <p className="os-service">{scannedOS.service}</p>
              <div className="os-status-curr">Status Atual: <span>{scannedOS.currentStatus}</span></div>
            </div>

            <h4 className="action-title">Atualizar para:</h4>
            <div className="status-actions-grid">
              <button className="status-btn prod" onClick={() => updateStatus('Produção')}>
                <Play size={24} />
                <span>Iniciar Produção</span>
              </button>
              <button className="status-btn finish" onClick={() => updateStatus('Acabamento')}>
                <Settings size={24} />
                <span>Ir p/ Acabamento</span>
              </button>
              <button className="status-btn done" onClick={() => updateStatus('Pronto')}>
                <CheckCircle2 size={24} />
                <span>Marcar como Pronto</span>
              </button>
            </div>

            <button className="btn btn-ghost w-full mt-6" onClick={() => setStep('scan')}>Cancelar / Escanear Outro</button>
          </div>
        )}
      </div>
    </div>
  );
}
