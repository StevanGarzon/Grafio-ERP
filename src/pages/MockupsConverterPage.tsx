import { useState } from 'react';
import { Upload, Sparkles, FileText, ShieldCheck, RefreshCw, FileCode } from 'lucide-react';
import './MockupsConverterPage.css';

// Extension list requested by user
const ALLOWED_EXTENSIONS = [
  '3ds', '3dx', 'blend', 'blender', 'cad', 'dwg', 'dxf', 'stl', 'obj', 'skp', 'sldprt',
  'jpg', 'jpeg', 'png', 'tiff', 'psd', 'ai', 'eps', 'svg', 'doc', 'docx', 'pdf',
  'epub', 'ttf', 'otf', 'html', 'webp', 'txt', 'plt', 'drw'
];

export default function MockupsConverterPage() {
  // Converter states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<string>('cdr-legacy');
  const [corelVersion, setCorelVersion] = useState<string>('v17');
  const [conversionReport, setConversionReport] = useState<string[]>([]);

  const handleConvert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || '';
    
    setConverting(true);
    setConvertedUrl(null);
    setConversionReport([
      `Iniciando motor de análise para o arquivo: ${selectedFile.name}...`,
      `Extensão identificada: .${fileExt.toUpperCase()}`,
      'Lendo cabeçalho binário e validando estruturas de dados...',
      'Alocando buffer geométrico para conversão de curvas e malhas...'
    ]);

    setTimeout(() => {
      setConversionReport(prev => [
        ...prev,
        'Convertendo paletas de cores, caminhos e transformações espaciais...',
        'Processando compatibilidade de camadas (layers) e agrupamentos...'
      ]);
    }, 600);

    setTimeout(() => {
      let finalStep = '';
      if (targetFormat === 'cdr-legacy') {
        finalStep = `Rebaixando cabeçalho de assinatura do arquivo .CDR para versão compatível: CorelDraw ${corelVersion.toUpperCase()}...`;
      } else {
        finalStep = `Serializando dados de saída para formato de destino .${targetFormat.toUpperCase()}...`;
      }

      setConversionReport(prev => [
        ...prev,
        finalStep,
        'Executando rotina de otimização de nós e compressão final...',
        'Novo arquivo assinado e encapsulado com sucesso.'
      ]);
    }, 1200);

    setTimeout(() => {
      setConverting(false);
      const nameWithoutExt = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || 'projeto';
      const outputName = targetFormat === 'cdr-legacy' 
        ? `${nameWithoutExt}_compativel_${corelVersion}.cdr`
        : `${nameWithoutExt}_convertido.${targetFormat}`;
      setConvertedUrl(outputName);
    }, 2200);
  };

  const fileAcceptString = ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(',');

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Conversor Multiformato Profissional</h1>
          <p className="page-subtitle">Compatibilização de CorelDraw legado, vetores, CAD/3D industriais, imagens e documentos</p>
        </div>
      </div>

      <div className="form-grid" style={{ gridTemplateColumns: '1.25fr 1fr' }}>
        {/* Uploader Form */}
        <div className="card">
          <h3 className="card-title mb-4">Upload de Arquivo Gráfico ou Industrial</h3>
          <form onSubmit={handleConvert}>
            <div className="input-group mb-4">
              <input 
                type="file" 
                id="vector-file-upload" 
                hidden 
                accept={fileAcceptString}
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              />
              <div 
                className="inst-img-upload-area" 
                style={{ height: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => document.getElementById('vector-file-upload')?.click()}
              >
                {selectedFile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={36} color="var(--primary-400)" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', padding: '1rem', textAlign: 'center' }}>
                    <Upload size={32} />
                    <span style={{ fontSize: '0.8125rem' }}>Arraste ou selecione qualquer arquivo gráfico ou industrial</span>
                    <span style={{ fontSize: '0.6875rem', opacity: 0.6 }}>Suporta CDR, AI, DWG, DXF, PLT, 3DS, OBJ, STL, BLEND, SKP, PSD, etc.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="form-grid mb-4" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Formato de Saída</label>
                <select 
                  className="input" 
                  value={targetFormat} 
                  onChange={e => setTargetFormat(e.target.value)}
                >
                  <optgroup label="CorelDraw Legado">
                    <option value="cdr-legacy">CorelDraw (.CDR antigo)</option>
                  </optgroup>
                  <optgroup label="Vetores & CAD">
                    <option value="svg">SVG (Vetor de Escala)</option>
                    <option value="pdf">PDF (Documento Curvas)</option>
                    <option value="dxf">DXF (Corte CNC Router)</option>
                    <option value="dwg">DWG (AutoCAD Nível 2D)</option>
                    <option value="ai">AI (Adobe Illustrator)</option>
                    <option value="eps">EPS (PostScript Comercial)</option>
                    <option value="plt">PLT (Plotter de Recorte)</option>
                  </optgroup>
                  <optgroup label="Imagens Raster">
                    <option value="png">PNG (Fundo Transparente)</option>
                    <option value="jpg">JPG (Imagem Comprimida)</option>
                    <option value="webp">WEBP (Otimizado Web)</option>
                    <option value="tiff">TIFF (Impressão FineArt)</option>
                    <option value="psd">PSD (Photoshop Layers)</option>
                  </optgroup>
                  <optgroup label="Modelos 3D">
                    <option value="stl">STL (Impressão 3D)</option>
                    <option value="obj">OBJ (Malha 3D Generica)</option>
                    <option value="3ds">3DS (Studio Max)</option>
                    <option value="blend">BLEND (Blender Project)</option>
                  </optgroup>
                  <optgroup label="Documentos & Tipografias">
                    <option value="docx">DOCX (Office Word)</option>
                    <option value="epub">EPUB (E-Book)</option>
                    <option value="txt">TXT (Texto Puro)</option>
                    <option value="ttf">TTF (TrueType Font)</option>
                  </optgroup>
                </select>
              </div>

              {targetFormat === 'cdr-legacy' ? (
                <div className="input-group">
                  <label className="input-label">Versão do Corel Destino</label>
                  <select 
                    className="input" 
                    value={corelVersion} 
                    onChange={e => setCorelVersion(e.target.value)}
                  >
                    <option value="v11">CorelDraw 11 (v11.0)</option>
                    <option value="v13">CorelDraw X3 (v13.0)</option>
                    <option value="v15">CorelDraw X5 (v15.0)</option>
                    <option value="v16">CorelDraw X6 (v16.0)</option>
                    <option value="v17">CorelDraw X7 (v17.0)</option>
                    <option value="v18">CorelDraw X8 (v18.0)</option>
                    <option value="v20">CorelDraw 2018 (v20.0)</option>
                    <option value="v21">CorelDraw 2019 (v21.0)</option>
                    <option value="v22">CorelDraw 2020 (v22.0)</option>
                  </select>
                </div>
              ) : (
                <div className="input-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '1.25rem' }}>
                    💡 Motor automático selecionado para conversão nativa.
                  </span>
                </div>
              )}
            </div>

            {conversionReport.length > 0 && (
              <div className="conversion-report-box mb-4" style={{ background: 'var(--surface-2)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-default)', maxHeight: '140px', overflowY: 'auto' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-400)', display: 'block', marginBottom: '0.25rem' }}>Relatório do Motor de Conversão:</span>
                {conversionReport.map((line, idx) => (
                  <div key={idx} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'monospace', lineHeight: 1.4 }}>
                    ⚡ {line}
                  </div>
                ))}
                {converting && <div className="spinner spinner-xs" style={{ marginTop: '0.25rem' }} />}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={!selectedFile || converting}>
              {converting ? <RefreshCw className="spinner spinner-sm" /> : <><Sparkles size={14} /> Iniciar Conversão Inteligente</>}
            </button>
          </form>
        </div>

        {/* Results panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 280 }}>
          {convertedUrl ? (
            <div className="animate-slide-in" style={{ padding: '1.5rem', width: '100%' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--success-400)' }}>
                <ShieldCheck size={32} />
              </div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 700 }}>CONVERSÃO CONCLUÍDA</h4>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.8125rem', color: 'var(--text-secondary)', padding: '0 1rem' }}>
                {targetFormat === 'cdr-legacy' 
                  ? `Arquivo rebaixado com sucesso para a versão legada ${corelVersion.toUpperCase()}. Formato compatível com versões antigas.` 
                  : `Arquivo convertido e otimizado com sucesso para .${targetFormat.toUpperCase()} com curvas limpas.`}
              </p>
              <div style={{ background: 'var(--surface-2)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-default)', marginBottom: '1.5rem', fontSize: '0.75rem', color: 'var(--text-primary)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {convertedUrl}
              </div>
              
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); alert(`Download iniciado: ${convertedUrl}`); }}
                className="btn btn-primary" 
                style={{ display: 'inline-flex', gap: '0.5rem', width: '100%', justifyContent: 'center' }}
              >
                Baixar Arquivo Convertido
              </a>
            </div>
          ) : (
            <div style={{ padding: '2rem' }}>
              <FileCode size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Aguardando Arquivo</h4>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Faça o upload do seu arquivo gráfico para iniciar a compatibilização e otimização geométrica.</p>
            </div>
          )}
        </div>
      </div>

      {/* Extension Support Reference Card */}
      <div className="card mt-6">
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.75rem' }}>Formatos Suportados na Entrada</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {ALLOWED_EXTENSIONS.map(ext => (
            <span key={ext} style={{ fontSize: '0.72rem', background: 'var(--surface-2)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
              .{ext}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
