import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, MapPin, Calendar, Clock, ChevronRight, User, Phone } from 'lucide-react';
import { visitService, type Visit } from '../services/visitService';
import './VisitasPage.css';

export default function VisitasPage() {
  const [visitas, setVisitas] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadVisits();
  }, []);

  const loadVisits = async () => {
    try {
      setLoading(true);
      const data = await visitService.getVisits();
      setVisitas(data);
    } catch (error) {
      console.error('Erro ao carregar visitas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container animate-fade-in mobile-optimized">
      <div className="page-header">
        <div>
          <h1 className="page-title">Visitas Técnicas</h1>
          <p className="page-subtitle">Agenda de medições e vistorias em campo</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/visitas/nova')}>
          <Plus size={16} /> Nova Visita
        </button>
      </div>

      <div className="visits-list">
        {loading ? (
          <div className="spinner-container"><div className="spinner"></div></div>
        ) : visitas.length > 0 ? (
          visitas.map(visita => (
            <div key={visita.id} className="visit-card card" onClick={() => navigate(`/visitas/${visita.id}/executar`)}>
              <div className={`visit-status-indicator ${visita.status}`}></div>
              <div className="visit-info">
                <h3 className="visit-client">{visita.client_name}</h3>
                <div className="visit-detail"><MapPin size={14} /> {visita.address}</div>
                <div className="visit-footer">
                  <div className="visit-detail"><Calendar size={14} /> {new Date(visita.visit_date).toLocaleDateString('pt-BR')}</div>
                  <div className="visit-detail"><Clock size={14} /> {visita.visit_time}</div>
                </div>
                {visita.contact_info && <div className="visit-detail contact-info"><Phone size={14} /> {visita.contact_info}</div>}
              </div>
              <ChevronRight size={20} className="visit-arrow" />
            </div>
          ))
        ) : (
          <div className="empty-state">Nenhuma visita agendada para hoje.</div>
        )}
      </div>
    </div>
  );
}
