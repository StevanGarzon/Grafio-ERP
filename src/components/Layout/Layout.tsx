import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import HelpChatbot from '../HelpChatbot/HelpChatbot';
import { AlertTriangle } from 'lucide-react';
import { detectSqlInjection, sanitizeSqlInput, detectXss, sanitizeXssInput } from '../../utils/security';
import './Layout.css';

interface SecurityAlertState {
  active: boolean;
  type: 'sql' | 'xss' | 'both' | null;
  payload: string;
}

export default function Layout() {
  const [securityAlert, setSecurityAlert] = useState<SecurityAlertState>({
    active: false,
    type: null,
    payload: '',
  });

  useEffect(() => {
    let isIntercepting = false;
    let timerId: any = null;

    const handleGlobalInput = (e: Event) => {
      if (isIntercepting) return;
      
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      if (!target || typeof target.value !== 'string') return;

      const rawValue = target.value;
      
      const isSqlThreat = detectSqlInjection(rawValue);
      const isXssThreat = detectXss(rawValue);

      if (isSqlThreat || isXssThreat) {
        isIntercepting = true;
        
        // 1. Sanitize the value immediately for both threats
        let cleanedValue = rawValue;
        if (isSqlThreat) cleanedValue = sanitizeSqlInput(cleanedValue);
        if (isXssThreat) cleanedValue = sanitizeXssInput(cleanedValue);
        
        target.value = cleanedValue;

        // 2. Dispatch synthetic event to let React models synchronize
        target.dispatchEvent(new Event('input', { bubbles: true }));
        isIntercepting = false;

        // 3. Display the floating warning WAF Toast
        setSecurityAlert({
          active: true,
          type: isSqlThreat && isXssThreat ? 'both' : isSqlThreat ? 'sql' : 'xss',
          payload: rawValue
        });

        // 4. Persist threat record in localStorage for Administrator Audit Logs
        try {
          const storedLogsStr = localStorage.getItem('grafio_security_sql_logs');
          let storedLogs = [];
          if (storedLogsStr) {
            storedLogs = JSON.parse(storedLogsStr);
          }
          const newThreatLog = {
            id: Math.random().toString(),
            timestamp: new Date().toLocaleString('pt-BR'),
            threat: isSqlThreat && isXssThreat ? 'SQL Injection & XSS Combo' : isSqlThreat ? 'Tentativa de SQL Injection' : 'Tentativa de Cross-Site Scripting (XSS)',
            source: `Barra de Entrada (${target.placeholder || target.name || 'Input do Sistema'})`,
            payload: rawValue,
            risk: 'CRITICAL',
            status: 'BLOCKED'
          };
          storedLogs.unshift(newThreatLog);
          localStorage.setItem('grafio_security_sql_logs', JSON.stringify(storedLogs));
          window.dispatchEvent(new Event('security-logs-updated'));
        } catch (err) {
          console.error('Erro ao salvar log de segurança:', err);
        }

        // Auto-close toast after 5 seconds
        if (timerId) clearTimeout(timerId);
        timerId = setTimeout(() => {
          setSecurityAlert({ active: false, type: null, payload: '' });
        }, 5000);
      }
    };

    document.addEventListener('input', handleGlobalInput);

    return () => {
      document.removeEventListener('input', handleGlobalInput);
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  return (
    <div className="app-layout">
      {/* Floating WAF Security Threat Toast */}
      {securityAlert.active && (
        <div className="security-toast-container">
          <div className="security-toast">
            <div className="security-toast-icon-wrap">
              <AlertTriangle size={24} />
            </div>
            <div className="security-toast-content">
              <div className="security-toast-title">
                {securityAlert.type === 'xss' && 'Ataque Cross-Site Scripting (XSS) Bloqueado!'}
                {securityAlert.type === 'sql' && 'Ataque SQL Injection Bloqueado!'}
                {securityAlert.type === 'both' && 'Ameaças de Segurança Detectadas e Bloqueadas!'}
              </div>
              <div className="security-toast-desc">
                {securityAlert.type === 'xss' && 'Identificamos tags HTML executáveis ou scripts inline perigosos. O sistema limpou a injeção preventivamente em tempo real.'}
                {securityAlert.type === 'sql' && 'Identificamos caracteres suspeitos de bancos de dados ou comandos estruturados. O sistema efetuou a limpeza preventiva dos campos.'}
                {securityAlert.type === 'both' && 'Identificamos múltiplos vetores de ataque (SQL Injection e XSS) neste texto. Todos os elementos nocivos foram neutralizados.'}
              </div>
              <div className="security-toast-badge">GRAFIO WAF Ativo</div>
            </div>
          </div>
        </div>
      )}

      <Sidebar />
      <main className="app-main">
        <div className="app-content">
          <Outlet />
        </div>
      </main>
      <HelpChatbot />
    </div>
  );
}
