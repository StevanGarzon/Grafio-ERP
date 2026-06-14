import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Image as ImageIcon } from 'lucide-react';
import { artApprovalService } from '../services/artApprovalService';
import { clientService } from '../services/clientService';

export default function NovaAprovacaoPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // AI Audit State
  const [imgPixels, setImgPixels] = useState({ w: 0, h: 0 });
  const [targetW, setTargetW] = useState(100); // cm
  const [targetH, setTargetH] = useState(100); // cm
  const [dpi, setDpi] = useState(0);

  useEffect(() => {
    if (imgPixels.w > 0 && targetW > 0) {
      const widthInches = targetW / 2.54;
      const calculatedDpi = imgPixels.w / widthInches;
      setDpi(calculatedDpi);
    }
  }, [imgPixels, targetW, targetH]);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await clientService.getClients();
        console.log('Clientes carregados para aprovação:', data.length);
        setClients(data);
        if (data.length === 0) {
          console.warn('Nenhum cliente encontrado no banco de dados.');
        }
      } catch (err) {
        console.error('Erro ao carregar clientes:', err);
      }
    };
    loadClients();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) { alert('Selecione uma imagem da arte.'); return; }
    if (!clientId) { alert('Selecione o cliente.'); return; }
    if (!title) { alert('Informe o título da arte.'); return; }
    
    setLoading(true);
    try {
      // Deixamos o banco de dados gerar o token UUID automaticamente
      const newApproval = await artApprovalService.createApproval({
        title,
        client_id: clientId,
        description,
        status: 'pending'
      }, selectedFile);

      alert('Arte enviada com sucesso! O link foi gerado.');
      navigate('/aprovacoes');
    } catch (err: any) {
      console.error('Erro detalhado:', err);
      if (err.message?.includes('bucket')) {
        alert('Erro: A pasta "artworks" não existe no seu Storage do Supabase. Crie-a como "Public" no menu Storage.');
      } else {
        alert('Erro ao criar aprovação: ' + (err.message || 'Verifique sua conexão.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-ghost btn-icon" onClick={() => navigate('/aprovacoes')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">Nova Arte para Aprovação</h1>
            <p className="page-subtitle">Suba a imagem e gere o link para enviar ao cliente</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/aprovacoes')} disabled={loading}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <div className="spinner spinner-sm"></div> : <Save size={16} />} 
            Criar e Gerar Link
          </button>
        </div>
      </div>

      <div className="form-grid" style={{ gridTemplateColumns: '1fr 450px' }}>
        <div className="card">
          <h2 className="card-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
            <ImageIcon size={18} color="var(--primary-400)" /> Detalhes da Arte
          </h2>
          
          <div className="input-group mb-4">
            <label className="input-label">Título da Arte *</label>
            <input type="text" className="input" placeholder="Ex: Banner 3x1m Fachada" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>

          <div className="input-group mb-4">
            <label className="input-label">Cliente *</label>
            <select className="input" value={clientId} onChange={e => setClientId(e.target.value)} required>
              <option value="">Selecione o cliente</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Observações / Instruções para o Cliente</label>
            <textarea className="input" rows={6} placeholder="Ex: Por favor, confira os textos e telefones antes de aprovar." value={description} onChange={e => setDescription(e.target.value)}></textarea>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 400 }}>
          {previewUrl ? (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <img 
                id="art-preview-img"
                src={previewUrl} 
                alt="Preview" 
                style={{ width: '100%', borderRadius: 'var(--radius-md)', objectFit: 'contain', maxHeight: 300 }} 
                onLoad={(e) => {
                  const img = e.target as HTMLImageElement;
                  setImgPixels({ w: img.naturalWidth, h: img.naturalHeight });
                }}
              />
              
              <div className="audit-card mt-4" style={{ textAlign: 'left', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary-400)' }}>
                  <ImageIcon size={14} /> AUDITORIA DE IA - QUALIDADE TÉCNICA
                </div>
                
                <div className="form-row mb-3">
                  <div className="input-group">
                    <label className="text-xs text-secondary">Largura Final (cm)</label>
                    <input type="number" className="input input-sm" value={targetW} onChange={e => setTargetW(Number(e.target.value))} />
                  </div>
                  <div className="input-group">
                    <label className="text-xs text-secondary">Altura Final (cm)</label>
                    <input type="number" className="input input-sm" value={targetH} onChange={e => setTargetH(Number(e.target.value))} />
                  </div>
                </div>

                {dpi > 0 && (
                  <div className={`dpi-alert ${dpi < 72 ? 'critical' : dpi < 150 ? 'warning' : 'safe'}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600 }}>{dpi.toFixed(0)} DPI</span>
                      <span className="badge">{dpi < 72 ? 'Risco Alto' : dpi < 150 ? 'Qualidade Média' : 'Qualidade Pro'}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', margin: 0, opacity: 0.8 }}>
                      {dpi < 72 ? 'A imagem ficará muito pixelada. Recomenda-se um arquivo maior.' : 
                       dpi < 150 ? 'Qualidade aceitável para banners de longe, mas pode não ser nítida de perto.' : 
                       'Excelente resolução para impressão de alta qualidade.'}
                    </p>
                  </div>
                )}
                
                <div className="text-xs text-secondary mt-2" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Resolução: {imgPixels.w} x {imgPixels.h} px</span>
                  <button className="text-danger" onClick={() => { setSelectedFile(null); setPreviewUrl(null); setDpi(0); }}>Remover</button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '2rem' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(51,102,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--primary-400)' }}>
                <Upload size={32} style={{ margin: 'auto' }} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Upload da Arte</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Arraste ou clique para selecionar o arquivo (JPG, PNG)</p>
              <input type="file" id="art-upload" hidden accept="image/*" onChange={handleFileChange} />
              <label htmlFor="art-upload" className="btn btn-secondary">Selecionar Arquivo</label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
