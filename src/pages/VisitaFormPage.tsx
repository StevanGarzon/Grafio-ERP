import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, Ruler, CheckCircle2, Save, X, Edit3, Zap, Truck, Shield, AlertTriangle, Hammer, MapPin, User, FileText, Calendar, Clock, Settings } from 'lucide-react';
import { visitService } from '../services/visitService';
import './VisitaFormPage.css';

export default function VisitaFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 7; // Sempre liberar os 7 passos para vistoria completa

  // Unified Form State
  const [formData, setFormData] = useState({
    // Section 0: Agendamento
    visit_date: new Date().toISOString().split('T')[0],
    visit_time: '09:00',
    // Section 1: Cliente
    cliente: { nome: '', cnpj: '', tel: '', email: '', endereco: '', cidade: '' },
    // Section 2: Serviço
    servico: { tipo: [], outro: '', desc: '', prazo: '', urgencia: 'Média' },
    // Section 3: Comercial
    comercial: { orcamentoAprovado: 'Não', idVisual: false, arquivos: [], respArte: '', envio: 'WhatsApp', exigeART: false },
    // Section 4: Dimensões e Local
    local: { h: '', l: '', p: '', tipo: 'Fachada', outroLocal: '', hPiso: '', materialBase: '', condicao: 'Acesso livre' },
    // Section 5: Estrutural
    estrutural: { tipoSuperficie: 'Alvenaria', condicaoSuperficie: [], reforco: false, fiaçãoOculta: false, pontoFixacao: false, estruturaMetalica: false, ventoExposto: false },
    // Section 6: Elétrica e LED
    eletrica: { disponivel: 'Sim', tensao: '220V', fotocelula: false, obs: '', tipoIluminacao: 'Módulos de LED', controle: 'Automático' },
    // Section 7: Acesso e Logística
    acesso: { metodo: 'Escada', transitoVeiculos: false, circulacaoPedestres: false, isolamento: false, trabalhoAltura: false, epi: '', horario: '', restricoes: '' },
    logistica: { acessoCaminhao: true, estacionamento: true, restricaoH: '', munique: false, distEstacionamento: '', elevador: false },
    // Section 9: Adesivação
    adesivacao: { limpa: true, original: true, repintura: false, ferrugem: false, removido: false, remocaoNecessaria: false, curvas: false, sol: true },
    // Section 10: Fachadas/Totens
    fachada: { fundacao: false, projeto: false, vento: true, prefeitura: false, hTotem: '', pFundacao: '', subterranea: false, distRede: '' },
    // Section 11: Fotos
    fotos: {} as Record<string, string>,
    // Status
    problemas: [],
    finalCheck: { medidas: false, fotos: false, clienteAlinhado: false, aptoProducao: false },
    tecnico: { margemErro: '', conferidoPor: '', retorno: false, dificuldade: 'Média', equipeEst: '', tempoEst: '' },
    responsavel: { nome: '', data: new Date().toISOString().split('T')[0], hora: '', assinado: false }
  });

  const handlePhotoUpload = async (slot: string, file: File) => {
    if (isNew) {
      alert('Por favor, agende a visita (Passo 1) antes de enviar fotos para gerar um registro no sistema.');
      return;
    }
    try {
      setLoading(true);
      const url = await visitService.uploadVisitFile(file, id!);
      setFormData(prev => ({
        ...prev,
        fotos: { ...prev.fotos, [slot]: url }
      }));
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar foto.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadVisit(id);
    }
  }, [id]);

  const loadVisit = async (visitId: string) => {
    try {
      setLoading(true);
      const data = await visitService.getVisitById(visitId);
      setFormData(prev => ({
        ...prev,
        visit_date: data.visit_date,
        visit_time: data.visit_time,
        cliente: { ...prev.cliente, nome: data.client_name, endereco: data.address, tel: data.contact_info || '' },
        ...data.technical_form
      }));
    } catch (error) {
      console.error(error);
      alert('Erro ao carregar visita.');
    } finally {
      setLoading(false);
    }
  };

  const updateNested = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...(prev[section as keyof typeof prev] as Record<string, any>), [field]: value }
    }));
  };

  const handleToggleArray = (section: string, field: string, value: any) => {
    const sectionData = formData[section as keyof typeof formData];
    const currentArray = (sectionData as any)[field] as any[];
    const newArray = currentArray.includes(value) 
      ? currentArray.filter(v => v !== value)
      : [...currentArray, value];
    updateNested(section, field, newArray);
  };

  const saveVisit = async () => {
    try {
      setLoading(true);
      if (isNew) {
        await visitService.createVisit({
          client_name: formData.cliente.nome,
          address: formData.cliente.endereco,
          visit_date: formData.visit_date,
          visit_time: formData.visit_time,
          contact_info: formData.cliente.tel,
          technical_form: formData
        });
        alert('Visita agendada com sucesso!');
      } else {
        await visitService.updateVisit(id, {
          client_name: formData.cliente.nome,
          address: formData.cliente.endereco,
          visit_date: formData.visit_date,
          visit_time: formData.visit_time,
          contact_info: formData.cliente.tel,
          technical_form: formData
        });
        alert('Vistoria técnica atualizada!');
      }
      navigate('/visitas');
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Erro ao salvar visita.');
      setLoading(false);
    }
  };

  const finalizeVisit = async () => {
    try {
      setLoading(true);
      const updatedData = {
        ...formData,
        status: 'completed'
      };
      
      await visitService.updateVisit(id!, {
        technical_form: updatedData,
        status: 'completed'
      });
      
      alert('Vistoria técnica finalizada com sucesso!');
      setLoading(false);
      setTimeout(() => navigate('/visitas'), 100);
    } catch (error: any) {
      console.error(error);
      alert('Erro ao finalizar visita.');
      setLoading(false);
    }
  };

  return (
    <div className="page-container mobile-form-container">
      <div className="mobile-form-header">
        <button className="btn-ghost btn-icon" onClick={() => navigate('/visitas')}>
          <ArrowLeft size={20} />
        </button>
        <h2 className="mobile-form-title">{isNew ? 'Agendar Nova Visita' : `Vistoria Técnica #${id?.slice(0, 5)}`}</h2>
        <div className="step-count">{step}/{totalSteps}</div>
      </div>

      <div className="step-progress-bar">
        <div className="progress-fill" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
      </div>

      <div className="form-content">
        {/* PASSO 1: DADOS BÁSICOS */}
        {step === 1 && (
          <div className="step-content animate-slide-in">
            <h3 className="section-title"><Calendar size={18}/> Agendamento</h3>
            <div className="card mb-6">
              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Data da Visita</label>
                  <input 
                    type="date" 
                    className="input" 
                    value={formData.visit_date} 
                    onChange={e => setFormData({...formData, visit_date: e.target.value})} 
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Horário</label>
                  <input 
                    type="time" 
                    className="input" 
                    value={formData.visit_time} 
                    onChange={e => setFormData({...formData, visit_time: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            <h3 className="section-title"><User size={18}/> 1. Dados do Cliente e Serviço</h3>
            <div className="card mb-4">
              <div className="input-group mb-4">
                <label className="input-label">Nome / Razão Social</label>
                <input type="text" className="input" value={formData.cliente.nome} onChange={e => updateNested('cliente', 'nome', e.target.value)} />
              </div>
              <div className="form-row mb-4">
                <div className="input-group"><label className="input-label">CNPJ/CPF</label><input type="text" className="input" value={formData.cliente.cnpj} onChange={e => updateNested('cliente', 'cnpj', e.target.value)} /></div>
                <div className="input-group"><label className="input-label">Telefone</label><input type="text" className="input" value={formData.cliente.tel} onChange={e => updateNested('cliente', 'tel', e.target.value)} /></div>
              </div>
              <div className="input-group mb-4"><label className="input-label">Endereço Completo</label><input type="text" className="input" value={formData.cliente.endereco} onChange={e => updateNested('cliente', 'endereco', e.target.value)} /></div>
            </div>

            <h3 className="section-title"><FileText size={18}/> Tipo de Serviço</h3>
            <div className="card grid-checkboxes">
              {['Fachada', 'Letreiro', 'Totem', 'Plotagem', 'Adesivação', 'Luminoso', 'Comunicação Interna'].map(tipo => (
                <label key={tipo} className="checkbox-item">
                  <input type="checkbox" checked={formData.servico.tipo.includes(tipo as never)} onChange={() => handleToggleArray('servico', 'tipo', tipo)} />
                  <span>{tipo}</span>
                </label>
              ))}
            </div>
            <div className="input-group mt-4">
              <label className="input-label">Urgência</label>
              <div className="radio-group">
                {['Baixa', 'Média', 'Alta'].map(u => (
                  <button key={u} className={`radio-btn ${formData.servico.urgencia === u ? 'active' : ''}`} onClick={() => updateNested('servico', 'urgencia', u)}>{u}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PASSO 2: DIMENSÕES E ESTRUTURA */}
        {step === 2 && (
          <div className="step-content animate-slide-in">
            <h3 className="section-title"><Ruler size={18}/> 4. Dimensões e Local</h3>
            <div className="card mb-4">
              <div className="form-row">
                <div className="input-group"><label className="input-label">Altura (m)</label><input type="number" step="0.01" className="input" value={formData.local.h} onChange={e => updateNested('local', 'h', e.target.value)} /></div>
                <div className="input-group"><label className="input-label">Largura (m)</label><input type="number" step="0.01" className="input" value={formData.local.l} onChange={e => updateNested('local', 'l', e.target.value)} /></div>
                <div className="input-group"><label className="input-label">Prof. (cm)</label><input type="number" className="input" value={formData.local.p} onChange={e => updateNested('local', 'p', e.target.value)} /></div>
              </div>
              <div className="input-group mt-4">
                <label className="input-label">Local de Instalação</label>
                <select className="input" value={formData.local.tipo} onChange={e => updateNested('local', 'tipo', e.target.value)}>
                  {['Fachada', 'Interno', 'Externo', 'Cobertura'].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <h3 className="section-title"><Hammer size={18}/> 5. Levantamento Estrutural</h3>
            <div className="card">
              <div className="input-group mb-4">
                <label className="input-label">Tipo de Superfície</label>
                <select className="input" value={formData.estrutural.tipoSuperficie} onChange={e => updateNested('estrutural', 'tipoSuperficie', e.target.value)}>
                  {['Alvenaria', 'Concreto', 'ACM', 'Drywall', 'Vidro', 'Estrutura metálica', 'Madeira'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid-checkboxes">
                {['Reforço necessário', 'Fiação oculta', 'Ponto fixação ok', 'Estrutura metálica ok', 'Vento/Exposto'].map(label => (
                  <label key={label} className="checkbox-item">
                    <input type="checkbox" />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PASSO 3: ELÉTRICA E ESPECÍFICOS */}
        {step === 3 && (
          <div className="step-content animate-slide-in">
            <h3 className="section-title"><Zap size={18}/> 6. Parte Elétrica e Iluminação</h3>
            <div className="card mb-4">
              <div className="input-group mb-4">
                <label className="input-label">Ponto de Energia</label>
                <select className="input" value={formData.eletrica.disponivel} onChange={e => updateNested('eletrica', 'disponivel', e.target.value)}>
                  <option>Sim</option><option>Não</option><option>A ser instalado</option>
                </select>
              </div>
              <div className="form-row mb-4">
                <div className="input-group"><label className="input-label">Tensão</label><select className="input"><option>110V</option><option>220V</option><option>Bivolt</option></select></div>
                <label className="checkbox-item mt-6">
                  <input type="checkbox" /> <span>Relé Fotocélula</span>
                </label>
              </div>
              <div className="input-group">
                <label className="input-label">Tipo de Iluminação</label>
                <select className="input" value={formData.eletrica.tipoIluminacao} onChange={e => updateNested('eletrica', 'tipoIluminacao', e.target.value)}>
                  {['Sem iluminação', 'Refletor', 'Módulos de LED', 'Perfil de LED', 'Neon flex'].map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>

            <h3 className="section-title"><MapPin size={18}/> 9/10. Especificidades</h3>
            <div className="card">
              <p className="text-xs text-secondary mb-2">Adesivação / Fachadas / Totens</p>
              <div className="grid-checkboxes">
                {['Superfície limpa', 'Pintura original', 'Fundação necessária', 'Projeto estrutural ok', 'Curvas complexas'].map(label => (
                  <label key={label} className="checkbox-item">
                    <input type="checkbox" />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PASSO 4: LOGÍSTICA E ACESSO */}
        {step === 4 && (
          <div className="step-content animate-slide-in">
            <h3 className="section-title"><Shield size={18}/> 7. Métodos de Acesso e Segurança</h3>
            <div className="card mb-4">
              <div className="input-group mb-4">
                <label className="input-label">Método de Acesso</label>
                <select className="input">
                  {['Escada', 'Andaime', 'Plataforma elevatória', 'Balancim', 'Corda'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="grid-checkboxes">
                {['Trânsito de veículos', 'Circulação pedestres', 'Isolamento necessário', 'Trabalho em altura', 'Risco elétrico próximo'].map(label => (
                  <label key={label} className="checkbox-item">
                    <input type="checkbox" />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <h3 className="section-title"><Truck size={18}/> 8. Logística e Transporte</h3>
            <div className="card">
              <div className="grid-checkboxes">
                {['Acesso caminhão ok', 'Estacionamento ok', 'Necessita Içamento', 'Local possui elevador'].map(label => (
                  <label key={label} className="checkbox-item">
                    <input type="checkbox" />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <div className="input-group mt-4">
                <label className="input-label">Horário Permitido para Instalação</label>
                <input type="text" className="input" placeholder="Ex: 08:00 às 18:00" />
              </div>
            </div>
          </div>
        )}

        {/* PASSO 5: REGISTRO FOTOGRÁFICO E PROBLEMAS */}
        {step === 5 && (
          <div className="step-content animate-slide-in">
            <h3 className="section-title"><Camera size={18}/> 11. Registro Fotográfico</h3>
            <div className="photo-capture-grid mb-6">
              {['Fachada Completa', 'Aproximações', 'Elétrica', 'Estrutura', 'Acesso', 'Obstáculos'].map(label => (
                <div key={label} className="photo-slot">
                  <input 
                    type="file" 
                    id={`photo-${label}`} 
                    style={{ display: 'none' }} 
                    accept="image/*,video/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(label, file);
                    }}
                  />
                  <div 
                    className={`slot-btn ${formData.fotos[label] ? 'has-photo' : ''}`}
                    onClick={() => document.getElementById(`photo-${label}`)?.click()}
                    style={formData.fotos[label] ? { backgroundImage: `url(${formData.fotos[label]})`, backgroundSize: 'cover' } : {}}
                  >
                    {!formData.fotos[label] && (
                      <>
                        <Camera size={24} />
                        <span>{label}</span>
                      </>
                    )}
                    {formData.fotos[label] && <div className="photo-badge"><CheckCircle2 size={12}/></div>}
                  </div>
                </div>
              ))}
            </div>

            <h3 className="section-title"><AlertTriangle size={18}/> 13. Problemas Identificados</h3>
            <div className="card grid-checkboxes">
              {['Infiltração', 'Estrutura fraca', 'Parede desnivelada', 'Acesso difícil', 'Necessidade obra civil', 'Necessidade solda'].map(p => (
                <label key={p} className="checkbox-item">
                  <input type="checkbox" />
                  <span>{p}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* PASSO 6: CONFERÊNCIA E TÉCNICO */}
        {step === 6 && (
          <div className="step-content animate-slide-in">
            <h3 className="section-title"><CheckCircle2 size={18}/> 14. Checklist de Conferência Final</h3>
            <div className="card grid-checkboxes mb-6">
              {['Medidas conferidas', 'Fotos realizadas', 'Elétrica validada', 'Acesso validado', 'Estrutura validada', 'Croqui realizado', 'Produção apta'].map(item => (
                <label key={item} className="checkbox-item">
                  <input type="checkbox" />
                  <span>{item}</span>
                </label>
              ))}
            </div>

            <h3 className="section-title"><Settings size={18}/> 15. Campo Técnico</h3>
            <div className="card">
              <div className="form-row mb-4">
                <div className="input-group"><label className="input-label">Nível Dificuldade</label>
                  <select className="input"><option>Baixa</option><option>Média</option><option>Alta</option><option>Crítica</option></select>
                </div>
                <div className="input-group"><label className="input-label">Equipe (Qtd)</label><input type="number" className="input" /></div>
              </div>
              <div className="input-group">
                <label className="input-label">Tempo Estimado (Horas)</label>
                <input type="number" className="input" placeholder="Ex: 4" />
              </div>
            </div>
          </div>
        )}

        {/* PASSO 7: VALIDAÇÃO E ASSINATURAS */}
        {step === 7 && (
          <div className="step-content animate-slide-in">
            <h3 className="section-title"><Edit3 size={18}/> 16/17. Assinatura e Validação</h3>
            
            <div className="card mb-4">
              <label className="checkbox-item mb-2">
                <input type="checkbox" /> <span>Ciência das medidas pelo cliente</span>
              </label>
              <label className="checkbox-item">
                <input type="checkbox" /> <span>Autorização para fotos</span>
              </label>
            </div>

            <div className="signature-area card mb-4">
              <label className="input-label">Assinatura do Cliente</label>
              <div className="signature-pad">
                <p className="text-secondary text-xs">Assine aqui</p>
              </div>
            </div>

            <div className="card">
              <div className="input-group mb-4">
                <label className="input-label">Responsável Técnico</label>
                <input type="text" className="input" value={formData.responsavel.nome} onChange={e => updateNested('responsavel', 'nome', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Próxima Etapa</label>
                <select className="input">
                  <option>Orçamento</option><option>Criação de arte</option><option>Produção</option><option>Instalação</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mobile-form-footer">
        {step > 1 && (
          <button className="btn btn-secondary" onClick={() => setStep(step - 1)}>Anterior</button>
        )}
        {step < totalSteps ? (
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setStep(step + 1)}>Próximo Passo</button>
        ) : (
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={isNew ? saveVisit : finalizeVisit} disabled={loading}>
            {loading ? <div className="spinner spinner-sm"></div> : <><Save size={18}/> {isNew ? 'Finalizar Visita' : 'Finalizar e Enviar'}</>}
          </button>
        )}
      </div>
    </div>
  );
}
