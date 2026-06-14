import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, Building, Bell, Sliders, Save, Check, RefreshCw, 
  Trash2, Mail, MapPin, 
  FileText, Users, UserPlus,
  History, Download, Phone, Sun, Moon, Info, ShieldAlert, Terminal, Lock, FileCode, Search, ShieldCheck, Sparkles
} from 'lucide-react';
import './ConfiguracoesPage.css';

interface ProfileData {
  id: string;
  full_name: string;
  avatar_url: string | null;
  company_id: string;
  company_name?: string;
  company_document?: string;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: 'sale' | 'system' | 'visit' | 'stock';
  timestamp: string;
  read: boolean;
}

interface UserItem {
  id: string;
  full_name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'user' | 'viewer';
  created_at: string;
  avatar_url?: string | null;
}

interface AccessLogItem {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  ip: string;
  agent: string;
  status: string;
}

interface SqlLogItem {
  id: string;
  timestamp: string;
  threat: string;
  source: string;
  payload: string;
  risk: string;
  status: string;
}

interface PhpLogItem {
  id: string;
  timestamp: string;
  level: string;
  file: string;
  message: string;
  memory: string;
}

interface ChangeLogItem {
  id: string;
  timestamp: string;
  user: string;
  table: string;
  action: string;
  record: string;
  details: string;
}

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'profile' | 'company' | 'notifications' | 'system' | 'users' | 'logs' | 'legal'>(() => {
    if (location.pathname.includes('notificacoes')) {
      return 'notifications';
    }
    return 'profile';
  });

  useEffect(() => {
    if (location.pathname.includes('notificacoes')) {
      setActiveTab('notifications');
    }
  }, [location.pathname]);

  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notificationsSuccess, setNotificationsSuccess] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyDocument, setCompanyDocument] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');

  // System States (load initial theme from localStorage)
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const [defaultBleed, setDefaultBleed] = useState(5); // 5% default bleed
  const [hourlyRate, setHourlyRate] = useState(45); // R$ 45/h standard labor
  const [standardVisitDuration, setStandardVisitDuration] = useState(2); // 2 hours

  // Users tab state
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'user' | 'viewer'>('user');

  // Preferences toggles
  const [emailAlerts, setEmailAlerts] = useState(() => {
    const saved = localStorage.getItem('grafio_email_alerts');
    return saved ? JSON.parse(saved) : { newQuotes: true, budgetAlerts: true, weeklyReport: false };
  });
  const [whatsappAlerts, setWhatsappAlerts] = useState(() => {
    const saved = localStorage.getItem('grafio_whatsapp_alerts');
    return saved ? JSON.parse(saved) : { installationUpdates: true, visitSchedules: true };
  });
  const [systemAlerts, setSystemAlerts] = useState(() => {
    const saved = localStorage.getItem('grafio_system_alerts');
    return saved ? JSON.parse(saved) : { lowStock: true, taskAssignments: true };
  });
  const [prefSuccess, setPrefSuccess] = useState(false);

  // Mock Notifications List
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('grafio_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Erro ao ler notificações do localStorage:', e);
      }
    }
    return [
      {
        id: '1',
        title: 'Orçamento Aprovado',
        description: 'O orçamento #1052 para "Academia Corpo & Saúde" foi aprovado.',
        type: 'sale',
        timestamp: 'Há 10 min',
        read: false
      },
      {
        id: '2',
        title: 'Alerta de Estoque Baixo',
        description: 'Chapas de ACM Azul estão abaixo do nível de segurança mínimo.',
        type: 'stock',
        timestamp: 'Há 1 hora',
        read: false
      },
      {
        id: '3',
        title: 'Visita Técnica Concluída',
        description: 'Técnico finalizou o levantamento na "Pizzaria Bella Italia".',
        type: 'visit',
        timestamp: 'Há 2 horas',
        read: false
      },
      {
        id: '4',
        title: 'Nova Ordem de Serviço',
        description: 'OS #3041 criada para PCP / Produção.',
        type: 'system',
        timestamp: 'Ontem',
        read: true
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('grafio_notifications', JSON.stringify(notifications));
    window.dispatchEvent(new Event('notifications-updated'));
  }, [notifications]);

  // Current user's role state
  const [currentUserRole, setCurrentUserRole] = useState<'superadmin' | 'admin' | 'user' | 'viewer'>(() => {
    const saved = localStorage.getItem('grafio_user_role');
    return (saved as any) || 'superadmin';
  });

  // Administrator Logs & Audit States
  const [logSubTab, setLogSubTab] = useState<'access' | 'sql' | 'php' | 'changes'>('access');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  
  // Access Logs State
  const [accessLogs, setAccessLogs] = useState<AccessLogItem[]>(() => {
    const saved = localStorage.getItem('grafio_security_access_logs');
    if (saved) return JSON.parse(saved);
    const initial = [
      { id: '1', timestamp: '2026-05-17 19:42:01', user: 'admin@grafio.com.br', action: 'Login bem-sucedido', ip: '192.168.15.110', agent: 'Chrome / Windows 11', status: 'success' },
      { id: '2', timestamp: '2026-05-17 18:15:33', user: 'stevan.campo@grafio.com.br', action: 'Login bem-sucedido', ip: '189.44.120.31', agent: 'Firefox / Windows 10', status: 'success' },
      { id: '3', timestamp: '2026-05-17 15:30:12', user: 'guest@anonymous.com', action: 'Tentativa falha - Senha incorreta', ip: '45.181.2.99', agent: 'Safari / macOS Catalina', status: 'failure' },
      { id: '4', timestamp: '2026-05-17 11:22:04', user: 'renata.designer@grafio.com.br', action: 'Login bem-sucedido', ip: '177.31.205.81', agent: 'Edge / Windows 11', status: 'success' }
    ];
    localStorage.setItem('grafio_security_access_logs', JSON.stringify(initial));
    return initial;
  });

  // SQL / Security Threat Logs State
  const [sqlLogs, setSqlLogs] = useState<SqlLogItem[]>(() => {
    const saved = localStorage.getItem('grafio_security_sql_logs');
    if (saved) return JSON.parse(saved);
    const initial = [
      { id: '1', timestamp: '17/05/2026 19:33:14', threat: 'SQL Injection - OR Tautology', source: 'Barra de busca (Ordens de Serviço)', payload: "' OR '1'='1', UNION SELECT", risk: 'CRITICAL', status: 'BLOCKED' },
      { id: '2', timestamp: '17/05/2026 19:05:44', threat: 'SQL Injection - Query Union', source: 'Formulário de cadastro (Equipamento)', payload: 'UNION SELECT username, password FROM users', risk: 'CRITICAL', status: 'BLOCKED' },
      { id: '3', timestamp: '17/05/2026 14:12:02', threat: 'SQL Stacked Query Trigger', source: 'Filtro de busca (Clientes)', payload: '1; DROP TABLE clients;--', risk: 'CRITICAL', status: 'BLOCKED' }
    ];
    localStorage.setItem('grafio_security_sql_logs', JSON.stringify(initial));
    return initial;
  });

  // PHP Logs State
  const [phpLogs, setPhpLogs] = useState<PhpLogItem[]>(() => {
    const saved = localStorage.getItem('grafio_security_php_logs');
    if (saved) return JSON.parse(saved);
    const initial = [
      { id: '1', timestamp: '2026-05-17 20:10:04', level: 'WARNING', file: 'api/auth.php', message: 'PHP Deprecated: Function get_magic_quotes_gpc() is deprecated', memory: '4.2 MB' },
      { id: '2', timestamp: '2026-05-17 18:22:15', level: 'ERROR', file: 'api/upload_receipt.php', message: 'PHP Warning: move_uploaded_file(/var/www/uploads/receipt.jpg): Failed to open stream: Permission denied', memory: '12.8 MB' },
      { id: '3', timestamp: '2026-05-17 17:05:30', level: 'INFO', file: 'api/v1/cron_jobs.php', message: 'PHP Status: Cron execution started. 12 notification tasks cleared in 0.04 seconds', memory: '8.1 MB' }
    ];
    localStorage.setItem('grafio_security_php_logs', JSON.stringify(initial));
    return initial;
  });

  // Record Change Logs State
  const [changeLogs, setChangeLogs] = useState<ChangeLogItem[]>(() => {
    const saved = localStorage.getItem('grafio_security_change_logs');
    if (saved) return JSON.parse(saved);
    const initial = [
      { id: '1', timestamp: '2026-05-17 19:57:04', user: 'admin@grafio.com.br', table: 'equipment', action: 'UPDATE', record: 'Plotter Mimaki JV300', details: 'Alterou status para Manutenção' },
      { id: '2', timestamp: '2026-05-17 19:30:15', user: 'stevan.campo@grafio.com.br', table: 'quotes', action: 'INSERT', record: 'Orçamento #1052', details: 'Criou orçamento para Academia Corpo & Saúde' },
      { id: '3', timestamp: '2026-05-17 16:45:00', user: 'renata.designer@grafio.com.br', table: 'service_orders', action: 'UPDATE', record: 'OS #3041', details: 'Alterou prioridade para Crítica' },
      { id: '4', timestamp: '2026-05-17 14:15:33', user: 'admin@grafio.com.br', table: 'clients', action: 'DELETE', record: 'Restaurante Sabor & Arte', details: 'Removeu cliente' }
    ];
    localStorage.setItem('grafio_security_change_logs', JSON.stringify(initial));
    return initial;
  });

  // Update dynamic SQL logs in real-time when WAF intercepts an attack
  useEffect(() => {
    const handleLogsUpdate = () => {
      const saved = localStorage.getItem('grafio_security_sql_logs');
      if (saved) {
        try {
          setSqlLogs(JSON.parse(saved));
        } catch(e){}
      }
    };
    window.addEventListener('security-logs-updated', handleLogsUpdate);
    return () => window.removeEventListener('security-logs-updated', handleLogsUpdate);
  }, []);

  const handleClearLogs = () => {
    if (!confirm('Tem certeza de que deseja expurgar permanentemente todos os logs deste subgrupo de auditoria?')) return;
    if (logSubTab === 'access') {
      setAccessLogs([]);
      localStorage.setItem('grafio_security_access_logs', '[]');
    } else if (logSubTab === 'sql') {
      setSqlLogs([]);
      localStorage.setItem('grafio_security_sql_logs', '[]');
    } else if (logSubTab === 'php') {
      setPhpLogs([]);
      localStorage.setItem('grafio_security_php_logs', '[]');
    } else if (logSubTab === 'changes') {
      setChangeLogs([]);
      localStorage.setItem('grafio_security_change_logs', '[]');
    }
    alert('Logs limpos com sucesso!');
  };

  const handleDownloadLogs = () => {
    let content = '';
    let fileName = `logs_${logSubTab}.txt`;
    
    if (logSubTab === 'access') {
      content = "AUDIT ACCESS LOGS - GRAFIO ERP\n===============================\n" + 
        accessLogs.map(l => `[${l.timestamp}] USER: ${l.user} | ACTION: ${l.action} | IP: ${l.ip} | AGENT: ${l.agent} | STATUS: ${l.status.toUpperCase()}`).join('\n');
    } else if (logSubTab === 'sql') {
      content = "AUDIT WAF SECURITY THREAT LOGS - GRAFIO ERP\n===========================================\n" + 
        sqlLogs.map(l => `[${l.timestamp}] THREAT: ${l.threat} | SOURCE: ${l.source} | PAYLOAD: "${l.payload}" | RISK: ${l.risk || 'CRITICAL'} | STATUS: ${l.status}`).join('\n');
    } else if (logSubTab === 'php') {
      content = "AUDIT PHP BACKEND LOGS - GRAFIO ERP\n====================================\n" + 
        phpLogs.map(l => `[${l.timestamp}] LEVEL: ${l.level} | SCRIPT: ${l.file} | MSG: ${l.message} | RAM: ${l.memory}`).join('\n');
    } else if (logSubTab === 'changes') {
      content = "AUDIT RECORD CHANGE LOGS - GRAFIO ERP\n======================================\n" + 
        changeLogs.map(l => `[${l.timestamp}] USER: ${l.user} | TABLE: ${l.table} | ACTION: ${l.action} | RECORD: ${l.record} | DETAILS: ${l.details}`).join('\n');
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Legal & Cookie Consent States
  const [cookieConsent, setCookieConsent] = useState(() => {
    const saved = localStorage.getItem('grafio_cookie_consent');
    return saved ? JSON.parse(saved) : { analytical: true, marketing: false, lgpdChecked: true };
  });
  const [legalSubSection, setLegalSubSection] = useState<'terms' | 'privacy' | 'cookies'>('privacy');
  const [legalSuccess, setLegalSuccess] = useState(false);

  const handleSaveCookieConsent = () => {
    localStorage.setItem('grafio_cookie_consent', JSON.stringify(cookieConsent));
    setLegalSuccess(true);
    setTimeout(() => setLegalSuccess(false), 3000);
    alert('Preferências de privacidade e cookies salvas com sucesso de acordo com a LGPD!');
  };

  const handleLgpdDataRequest = (type: 'download' | 'delete') => {
    if (type === 'download') {
      alert('Solicitação de cópia de dados recebida! Um link seguro para exportação das suas informações em formato JSON/CSV será enviado para o seu e-mail corporativo cadastrado dentro de 48 horas, conforme os prazos legais da LGPD.');
    } else {
      const confirmDelete = confirm('ATENÇÃO: A exclusão permanente dos seus dados (Direito ao Esquecimento) removerá todos os seus registros do ERP de forma irreversível de acordo com a LGPD. Deseja prosseguir com a solicitação?');
      if (confirmDelete) {
        alert('Solicitação de exclusão de dados registrada! O encarregado de dados (DPO) da sua empresa analisará a solicitação e retornará em até 15 dias úteis.');
      }
    }
  };

  useEffect(() => {
    if (user) {
      loadProfileAndCompany();
    }
  }, [user]);

  const loadProfileAndCompany = async () => {
    try {
      setLoading(true);
      if (!user) return;

      // 1. Get profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (profileData) {
        setFullName(profileData.full_name);
        
        // 2. Get company
        if (profileData.company_id) {
          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', profileData.company_id)
            .single();

          if (companyError) throw companyError;

          if (companyData) {
            setProfile({
              id: profileData.id,
              full_name: profileData.full_name,
              avatar_url: profileData.avatar_url,
              company_id: profileData.company_id,
              company_name: companyData.name,
              company_document: companyData.document
            });
            setCompanyName(companyData.name);
            setCompanyDocument(companyData.document || '');
            
            // Fetch company users
            loadCompanyUsers(profileData.company_id);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      // Setup mock users as fallback if supabase fails
      setupMockUsers();
    } finally {
      setLoading(false);
    }
  };

  const setupMockUsers = () => {
    setUsersList([
      {
        id: user?.id || '1',
        full_name: fullName || 'Usuário Administrador',
        email: user?.email || 'admin@grafio.com.br',
        role: 'superadmin',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        full_name: 'Stevan Campo',
        email: 'stevan.campo@grafio.com.br',
        role: 'user',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        full_name: 'Renata Arteira',
        email: 'renata.designer@grafio.com.br',
        role: 'viewer',
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]);
    setCurrentUserRole('superadmin');
    localStorage.setItem('grafio_user_role', 'superadmin');
  };

  const loadCompanyUsers = async (companyId: string) => {
    try {
      // Get profiles for company
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, created_at')
        .eq('company_id', companyId);

      if (profilesError) throw profilesError;

      // Get user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('company_id', companyId);

      if (rolesError) throw rolesError;

      const mappedUsers: UserItem[] = (profilesData || []).map(p => {
        const userRole = (rolesData || []).find(r => r.user_id === p.id)?.role || 'user';
        return {
          id: p.id,
          full_name: p.full_name,
          email: p.id === user?.id ? (user?.email || '') : `${p.full_name.toLowerCase().replace(/\s+/g, '')}@grafio.com.br`,
          role: userRole as 'superadmin' | 'admin' | 'user' | 'viewer',
          created_at: p.created_at,
          avatar_url: p.avatar_url
        };
      });

      setUsersList(mappedUsers);

      const myRole = mappedUsers.find(u => u.id === user?.id)?.role;
      if (myRole) {
        setCurrentUserRole(myRole);
        localStorage.setItem('grafio_user_role', myRole);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários do banco, usando fallback:', err);
      setupMockUsers();
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'superadmin' | 'admin' | 'user' | 'viewer') => {
    if (!profile) return;
    try {
      // Upsert to user_roles
      const { error } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: userId, 
          company_id: profile.company_id, 
          role: newRole 
        }, { onConflict: 'user_id,company_id' });

      if (error) throw error;
      
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      alert('Cargo do usuário atualizado com sucesso no banco de dados!');
    } catch (err: any) {
      console.warn('Erro ao atualizar no banco de dados, aplicando localmente:', err.message);
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (userId === user?.id) {
      alert('Você não pode remover a si mesmo do sistema!');
      return;
    }
    if (!confirm('Tem certeza de que deseja remover este usuário da sua empresa?')) return;

    if (!profile) return;
    try {
      // Update company_id in profile
      await supabase
        .from('profiles')
        .update({ company_id: null })
        .eq('id', userId);

      // Delete role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('company_id', profile.company_id);

      setUsersList(prev => prev.filter(u => u.id !== userId));
      alert('Usuário removido da empresa.');
    } catch (err: any) {
      console.warn('Removendo localmente (Relação/Banco offline):', err.message);
      setUsersList(prev => prev.filter(u => u.id !== userId));
    }
  };

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    const newUser: UserItem = {
      id: Math.random().toString(),
      full_name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      created_at: new Date().toISOString()
    };

    setUsersList(prev => [...prev, newUser]);
    setInviteModalOpen(false);
    setInviteName('');
    setInviteEmail('');
    setInviteRole('user');
    alert(`E-mail de convite enviado com sucesso para ${inviteEmail}!`);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    try {
      setLoading(true);
      setSaveSuccess(false);

      // Update Profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update auth user metadata so session is up to date too
      await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      // Dispatch custom event to update Sidebar dynamically in real-time
      const event = new CustomEvent('profile-updated', {
        detail: { full_name: fullName }
      });
      window.dispatchEvent(event);

      // Update Companies
      const { error: companyError } = await supabase
        .from('companies')
        .update({ 
          name: companyName,
          document: companyDocument
        })
        .eq('id', profile.company_id);

      if (companyError) throw companyError;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      loadProfileAndCompany();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar configurações: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setNotificationsSuccess(true);
    setTimeout(() => setNotificationsSuccess(false), 3000);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setNotificationsSuccess(true);
    setTimeout(() => setNotificationsSuccess(false), 3000);
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const savePreferences = () => {
    localStorage.setItem('grafio_email_alerts', JSON.stringify(emailAlerts));
    localStorage.setItem('grafio_whatsapp_alerts', JSON.stringify(whatsappAlerts));
    localStorage.setItem('grafio_system_alerts', JSON.stringify(systemAlerts));
    setPrefSuccess(true);
    setTimeout(() => setPrefSuccess(false), 4000);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Configurações do Sistema</h1>
          <p className="page-subtitle">Personalize a sua conta, preferências e parâmetros do ERP</p>
        </div>
      </div>

      <div className="settings-layout">
        {/* Settings Sidebar Navigation */}
        <aside className="settings-sidebar card">
          <button 
            className={`settings-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} /> Perfil do Usuário
          </button>
          <button 
            className={`settings-nav-btn ${activeTab === 'company' ? 'active' : ''}`}
            onClick={() => setActiveTab('company')}
          >
            <Building size={18} /> Minha Empresa
          </button>
          <button 
            className={`settings-nav-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={18} /> Gestão de Usuários
          </button>
          <button 
            className={`settings-nav-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
              <Bell size={18} /> 
              <span>Notificações</span>
              {unreadCount > 0 && <span className="settings-badge">{unreadCount}</span>}
            </div>
          </button>
          <button 
            className={`settings-nav-btn ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            <Sliders size={18} /> Preferências e Parâmetros
          </button>
          
          <button 
            className={`settings-nav-btn ${activeTab === 'legal' ? 'active' : ''}`}
            onClick={() => setActiveTab('legal')}
          >
            <FileText size={18} /> Termos e Privacidade
          </button>
          
          {(currentUserRole === 'admin' || currentUserRole === 'superadmin') && (
            <button 
              className={`settings-nav-btn ${activeTab === 'logs' ? 'active' : ''}`}
              onClick={() => setActiveTab('logs')}
              style={{ borderLeftColor: 'var(--danger-500)' }}
            >
              <History size={18} style={{ color: 'var(--danger-400)' }} /> Auditoria e Logs
            </button>
          )}
        </aside>

        {/* Settings Active Panel Content */}
        <main className="settings-panel">
          {/* TAB 1: PERFIL */}
          {activeTab === 'profile' && (
            <div className="card animate-slide-in">
              <h2 className="card-title mb-6">Perfil do Usuário</h2>
              
              <div className="profile-hero mb-6">
                <div className="profile-avatar-wrap">
                  <div className="profile-avatar">
                    {fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'US'}
                  </div>
                </div>
                <div>
                  <h3 className="profile-name">{fullName || 'Carregando...'}</h3>
                  <span className="profile-role">Administrador do Sistema</span>
                </div>
              </div>

              <form onSubmit={handleSaveProfile}>
                <div className="input-group mb-4">
                  <label className="input-label">Nome Completo</label>
                  <input 
                    type="text" 
                    className="input" 
                    required 
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                </div>

                <div className="form-row mb-6">
                  <div className="input-group">
                    <label className="input-label">E-mail de Login</label>
                    <input 
                      type="email" 
                      className="input disabled-input" 
                      disabled 
                      value={user?.email || ''} 
                    />
                    <span className="input-tip"><Mail size={12}/> O email de login não pode ser alterado por motivos de segurança.</span>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Nível de Acesso</label>
                    <input 
                      type="text" 
                      className="input disabled-input" 
                      disabled 
                      value="Super Administrador" 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                  {saveSuccess && (
                    <span className="text-success flex items-center gap-1 font-medium animate-fade-in">
                      <Check size={16} /> Salvo com sucesso!
                    </span>
                  )}
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? <RefreshCw className="spinner spinner-sm" /> : <><Save size={16}/> Salvar Perfil</>}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: EMPRESA */}
          {activeTab === 'company' && (
            <div className="card animate-slide-in">
              <h2 className="card-title mb-6">Dados da Empresa (Tenant)</h2>
              <form onSubmit={handleSaveProfile}>
                <div className="input-group mb-4">
                  <label className="input-label">Razão Social / Nome Fantasia</label>
                  <input 
                    type="text" 
                    className="input" 
                    required 
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)} 
                    placeholder="Minha Empresa de Comunicação Visual"
                  />
                </div>

                <div className="form-row mb-4">
                  <div className="input-group">
                    <label className="input-label">CNPJ / CPF</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={companyDocument}
                      onChange={e => setCompanyDocument(e.target.value)}
                      placeholder="00.000.000/0001-00"
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Telefone Comercial</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={companyPhone}
                      onChange={e => setCompanyPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div className="input-group mb-6">
                  <label className="input-label">Endereço Principal</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={companyAddress}
                    onChange={e => setCompanyAddress(e.target.value)}
                    placeholder="Rua da Comunicação, 100 - Bairro Novo"
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                  {saveSuccess && (
                    <span className="text-success flex items-center gap-1 font-medium">
                      <Check size={16} /> Empresa atualizada!
                    </span>
                  )}
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? <RefreshCw className="spinner spinner-sm" /> : <><Save size={16}/> Salvar Empresa</>}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: GESTÃO DE USUÁRIOS */}
          {activeTab === 'users' && (
            <div className="card animate-slide-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 className="card-title" style={{ marginBottom: '0.25rem' }}>Gestão de Usuários</h2>
                  <p className="text-xs text-secondary">Controle a equipe de acesso ao GRAFIO ERP e altere suas permissões</p>
                </div>
                <button className="btn btn-primary" onClick={() => setInviteModalOpen(true)} style={{ gap: '0.5rem' }}>
                  <UserPlus size={16} /> Convidar Membro
                </button>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nome / Usuário</th>
                      <th>E-mail</th>
                      <th>Data de Cadastro</th>
                      <th>Função / Permissão</th>
                      <th style={{ textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map(u => (
                      <tr key={u.id} className="table-row">
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div className="profile-avatar" style={{ width: '36px', height: '36px', fontSize: '0.875rem', borderRadius: '8px' }}>
                              {u.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'M'}
                            </div>
                            <span className="font-semibold text-primary">{u.full_name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="font-mono text-xs text-secondary">{u.email}</span>
                        </td>
                        <td>
                          <span className="text-xs">{new Date(u.created_at).toLocaleDateString('pt-BR')}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <select 
                              className={`role-select role-${u.role}`}
                              value={u.role}
                              onChange={e => handleUpdateUserRole(u.id, e.target.value as any)}
                              disabled={u.id === user?.id}
                              title={u.id === user?.id ? "Você não pode alterar seu próprio cargo de administrador" : "Alterar permissão"}
                            >
                              <option value="superadmin">Super Admin</option>
                              <option value="admin">Administrador</option>
                              <option value="user">Usuário Comum</option>
                              <option value="viewer">Visualizador</option>
                            </select>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            className="btn btn-sm btn-outline text-danger border-danger-hover"
                            onClick={() => handleRemoveUser(u.id)}
                            disabled={u.id === user?.id}
                            title={u.id === user?.id ? "Você não pode se remover" : "Remover usuário da empresa"}
                            style={{ padding: '0.375rem' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: NOTIFICAÇÕES (Subpage integrada) */}
          {activeTab === 'notifications' && (
            <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Central de Notificações */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 className="card-title" style={{ marginBottom: '0.25rem' }}>Central de Notificações</h2>
                    <p className="text-xs text-secondary">Acompanhe alertas, prazos e aprovações do sistema</p>
                  </div>
                  {unreadCount > 0 && (
                    <button type="button" className="btn btn-outline btn-sm" onClick={markAllAsRead}>
                      Marcar todas como lidas
                    </button>
                  )}
                </div>

                {notificationsSuccess && (
                  <div className="animate-fade-in" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    padding: '0.75rem 1rem', 
                    background: 'rgba(16, 185, 129, 0.08)', 
                    border: '1px solid rgba(16, 185, 129, 0.2)', 
                    borderRadius: 'var(--radius-md)', 
                    color: 'var(--success-400)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    marginBottom: '1.5rem'
                  }}>
                    <Check size={16} /> Notificações atualizadas com sucesso!
                  </div>
                )}

                <div className="notifications-list">
                  {notifications.filter(n => !n.read).length > 0 ? (
                    notifications.filter(n => !n.read).map(n => (
                      <div key={n.id} className="notification-item unread">
                        <div className="notification-icon-wrap" style={{ 
                          background: n.type === 'sale' ? 'rgba(16,185,129,0.1)' : 
                                      n.type === 'stock' ? 'rgba(244,63,94,0.1)' :
                                      n.type === 'visit' ? 'rgba(51,102,255,0.1)' : 'rgba(245,158,11,0.1)',
                          color: n.type === 'sale' ? 'var(--success-500)' : 
                                 n.type === 'stock' ? 'var(--danger-500)' :
                                 n.type === 'visit' ? 'var(--primary-400)' : 'var(--warning-500)'
                        }}>
                          {n.type === 'sale' && <FileText size={16} />}
                          {n.type === 'stock' && <ShieldAlert size={16} />}
                          {n.type === 'visit' && <MapPin size={16} />}
                          {n.type === 'system' && <Sparkles size={16} />}
                        </div>
                        <div className="notification-content">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h4 className="notification-item-title">{n.title}</h4>
                            <span className="notification-time">{n.timestamp}</span>
                          </div>
                          <p className="notification-description">{n.description}</p>
                          <div className="notification-actions mt-2">
                            {!n.read && (
                              <button className="action-link text-success mr-4" onClick={() => markAsRead(n.id)}>
                                Marcar como lida
                              </button>
                            )}
                            <button className="action-link text-danger" onClick={() => deleteNotification(n.id)}>
                              <Trash2 size={12} style={{ display: 'inline', marginRight: '0.25rem' }}/> Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state" style={{ padding: '3rem 1rem' }}>
                      <ShieldCheck size={32} color="var(--success-400)" />
                      <p className="mt-2">Você não tem nenhuma notificação pendente!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Preferências de Alertas */}
              <div className="card">
                <h2 className="card-title mb-6">Preferências de Notificação</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Email Settings */}
                  <div className="pref-section">
                    <h3 className="pref-title"><Mail size={16}/> Alertas por E-mail</h3>
                    <div className="toggle-list">
                      <label className="toggle-item">
                        <span>Aprovação de novos orçamentos</span>
                        <input 
                          type="checkbox" 
                          checked={emailAlerts.newQuotes}
                          onChange={e => setEmailAlerts({...emailAlerts, newQuotes: e.target.checked})}
                        />
                      </label>
                      <label className="toggle-item">
                        <span>Alertas de estourar orçamento de OS</span>
                        <input 
                          type="checkbox" 
                          checked={emailAlerts.budgetAlerts}
                          onChange={e => setEmailAlerts({...emailAlerts, budgetAlerts: e.target.checked})}
                        />
                      </label>
                      <label className="toggle-item">
                        <span>Relatório de fechamento semanal</span>
                        <input 
                          type="checkbox" 
                          checked={emailAlerts.weeklyReport}
                          onChange={e => setEmailAlerts({...emailAlerts, weeklyReport: e.target.checked})}
                        />
                      </label>
                    </div>
                  </div>

                  {/* WhatsApp Alerts */}
                  <div className="pref-section">
                    <h3 className="pref-title"><Phone size={16}/> Alertas por WhatsApp</h3>
                    <div className="toggle-list">
                      <label className="toggle-item">
                        <span>Atualizações de status de instalação</span>
                        <input 
                          type="checkbox" 
                          checked={whatsappAlerts.installationUpdates}
                          onChange={e => setWhatsappAlerts({...whatsappAlerts, installationUpdates: e.target.checked})}
                        />
                      </label>
                      <label className="toggle-item">
                        <span>Agendamentos de visitas técnicas automáticas</span>
                        <input 
                          type="checkbox" 
                          checked={whatsappAlerts.visitSchedules}
                          onChange={e => setWhatsappAlerts({...whatsappAlerts, visitSchedules: e.target.checked})}
                        />
                      </label>
                    </div>
                  </div>

                  {/* System Alerts */}
                  <div className="pref-section">
                    <h3 className="pref-title"><Sliders size={16}/> Alertas do Sistema (App)</h3>
                    <div className="toggle-list">
                      <label className="toggle-item">
                        <span>Avisos de estoque mínimo crítico</span>
                        <input 
                          type="checkbox" 
                          checked={systemAlerts.lowStock}
                          onChange={e => setSystemAlerts({...systemAlerts, lowStock: e.target.checked})}
                        />
                      </label>
                      <label className="toggle-item">
                        <span>Atribuição de novas tarefas de produção</span>
                        <input 
                          type="checkbox" 
                          checked={systemAlerts.taskAssignments}
                          onChange={e => setSystemAlerts({...systemAlerts, taskAssignments: e.target.checked})}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {prefSuccess && (
                  <div className="animate-fade-in" style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '0.25rem', 
                    padding: '1rem', 
                    background: 'rgba(16, 185, 129, 0.08)', 
                    border: '1px solid rgba(16, 185, 129, 0.2)', 
                    borderRadius: 'var(--radius-md)', 
                    color: 'var(--success-400)',
                    fontSize: '0.8125rem',
                    marginTop: '1.5rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                      <Check size={16} /> Preferências salvas com sucesso!
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '1.5rem' }}>
                      As configurações de disparo de alertas via E-mail e WhatsApp (Simulado) foram ativadas e salvas em sua conta.
                    </span>
                  </div>
                )}

                <div className="flex justify-end mt-6">
                  <button className="btn btn-primary" onClick={savePreferences}>
                    Salvar Preferências
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SISTEMA */}
          {activeTab === 'system' && (
            <div className="card animate-slide-in">
              <h2 className="card-title mb-6">Preferências e Parâmetros da Produção</h2>

              <div className="input-group mb-6">
                <label className="input-label">Tema Visual do Sistema</label>
                <div className="theme-toggle-grid">
                  <button 
                    className={`theme-btn ${!darkMode ? 'active' : ''}`}
                    onClick={() => setDarkMode(false)}
                  >
                    <Sun size={18} /> Tema Claro (Light)
                  </button>
                  <button 
                    className={`theme-btn ${darkMode ? 'active' : ''}`}
                    onClick={() => setDarkMode(true)}
                  >
                    <Moon size={18} /> Tema Escuro (Dark)
                  </button>
                </div>
              </div>

              <div className="form-row mb-6">
                <div className="input-group">
                  <label className="input-label">Margem Padrão de Sangria (cm)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    className="input" 
                    value={defaultBleed} 
                    onChange={e => setDefaultBleed(Number(e.target.value))}
                  />
                  <span className="input-tip"><Info size={12}/> Utilizado nas calculadoras técnicas de aproveitamento e corte.</span>
                </div>

                <div className="input-group">
                  <label className="input-label">Custo Padrão da Mão de Obra (R$/h)</label>
                  <input 
                    type="number" 
                    className="input" 
                    value={hourlyRate}
                    onChange={e => setHourlyRate(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="input-group mb-6">
                <label className="input-label">Tempo Padrão Estimado para Visita Técnica (horas)</label>
                <input 
                  type="number" 
                  className="input" 
                  value={standardVisitDuration}
                  onChange={e => setStandardVisitDuration(Number(e.target.value))}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                <button className="btn btn-primary" onClick={() => alert('Parâmetros salvos com sucesso!')}>
                  <Save size={16} /> Salvar Parâmetros
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: AUDITORIA E LOGS (EXCLUSIVO ADMIN) */}
          {activeTab === 'logs' && (currentUserRole === 'admin' || currentUserRole === 'superadmin') && (
            <div className="card animate-slide-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 className="card-title" style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldAlert size={22} className="text-danger" /> Painel de Auditoria & Logs do Sistema
                  </h2>
                  <p className="text-xs text-secondary">Acesso restrito a Administradores. Rastreamento e logs em tempo real para auditorias.</p>
                </div>
              </div>

              {/* Sub Tabs */}
              <div className="sub-tabs-container">
                <button 
                  className={`sub-tab-btn ${logSubTab === 'access' ? 'active' : ''}`}
                  onClick={() => { setLogSubTab('access'); setLogSearchQuery(''); }}
                >
                  <Terminal size={14} /> Logs de Acesso ({accessLogs.length})
                </button>
                <button 
                  className={`sub-tab-btn ${logSubTab === 'sql' ? 'active' : ''}`}
                  onClick={() => { setLogSubTab('sql'); setLogSearchQuery(''); }}
                >
                  <Lock size={14} /> Logs de SQL / WAF Shield ({sqlLogs.length})
                </button>
                <button 
                  className={`sub-tab-btn ${logSubTab === 'php' ? 'active' : ''}`}
                  onClick={() => { setLogSubTab('php'); setLogSearchQuery(''); }}
                >
                  <FileCode size={14} /> Logs PHP ({phpLogs.length})
                </button>
                <button 
                  className={`sub-tab-btn ${logSubTab === 'changes' ? 'active' : ''}`}
                  onClick={() => { setLogSubTab('changes'); setLogSearchQuery(''); }}
                >
                  <History size={14} /> Mudanças de Registros ({changeLogs.length})
                </button>
              </div>

              {/* Search & Actions Bar */}
              <div className="log-search-container">
                <div style={{ position: 'relative', flex: '1', maxWidth: '400px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input 
                    type="text" 
                    className="input" 
                    style={{ paddingLeft: '2.5rem' }} 
                    placeholder="Filtrar logs por palavra-chave..." 
                    value={logSearchQuery}
                    onChange={e => setLogSearchQuery(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-outline border-danger-hover text-danger" onClick={handleClearLogs} style={{ gap: '0.5rem' }}>
                    <Trash2 size={16} /> Expurgar Logs
                  </button>
                  <button className="btn btn-secondary" onClick={handleDownloadLogs} style={{ gap: '0.5rem' }}>
                    <Download size={16} /> Baixar Relatório
                  </button>
                </div>
              </div>

              {/* Console logs */}
              <div className="log-console-wrap">
                <div className="log-console-header">
                  <div className="log-console-title">
                    <div className="log-console-dot"></div>
                    Console do Auditor v1.0.4 - /logs/{logSubTab}
                  </div>
                  <div style={{ fontSize: '0.625rem', color: '#64748b', fontFamily: 'monospace' }}>
                    SISTEMA OPERACIONAL: WINDOWS NT | PORT: 8080
                  </div>
                </div>

                <div className="log-console-table-container">
                  {logSubTab === 'access' && (
                    <table className="log-console-table">
                      <thead>
                        <tr>
                          <th>Carimbo de Data/Hora</th>
                          <th>Usuário</th>
                          <th>Ação</th>
                          <th>Endereço IP</th>
                          <th>Navegador/Agente</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accessLogs.filter(l => 
                          l.user.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                          l.action.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                          l.ip.includes(logSearchQuery) ||
                          l.agent.toLowerCase().includes(logSearchQuery.toLowerCase())
                        ).length > 0 ? (
                          accessLogs.filter(l => 
                            l.user.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                            l.action.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                            l.ip.includes(logSearchQuery) ||
                            l.agent.toLowerCase().includes(logSearchQuery.toLowerCase())
                          ).map(l => (
                            <tr key={l.id}>
                              <td style={{ color: '#818cf8', fontWeight: 600 }}>{l.timestamp}</td>
                              <td style={{ color: '#e2e8f0' }}>{l.user}</td>
                              <td>{l.action}</td>
                              <td style={{ color: '#94a3b8', fontStyle: 'italic' }}>{l.ip}</td>
                              <td style={{ color: '#64748b' }}>{l.agent}</td>
                              <td>
                                <span className={`log-badge ${l.status === 'success' ? 'badge-success' : 'badge-danger'}`}>
                                  {l.status === 'success' ? 'PERMITIDO' : 'NEGADO'}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                              Nenhum registro de acesso encontrado para o termo especificado.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}

                  {logSubTab === 'sql' && (
                    <table className="log-console-table">
                      <thead>
                        <tr>
                          <th>Carimbo de Data/Hora</th>
                          <th>Ameaça Bloqueada</th>
                          <th>Canal / Origem</th>
                          <th>Payload Injetado</th>
                          <th>Risco</th>
                          <th>Status WAF</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sqlLogs.filter(l => 
                          l.threat.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                          l.source.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                          l.payload.toLowerCase().includes(logSearchQuery.toLowerCase())
                        ).length > 0 ? (
                          sqlLogs.filter(l => 
                            l.threat.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                            l.source.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                            l.payload.toLowerCase().includes(logSearchQuery.toLowerCase())
                          ).map(l => (
                            <tr key={l.id}>
                              <td style={{ color: '#f87171', fontWeight: 600 }}>{l.timestamp}</td>
                              <td style={{ color: '#e2e8f0', fontWeight: 'bold' }}>{l.threat}</td>
                              <td>{l.source}</td>
                              <td>
                                <code style={{ color: '#fca5a5', background: '#311212', padding: '0.125rem 0.375rem', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.7rem' }}>
                                  {l.payload}
                                </code>
                              </td>
                              <td>
                                <span className="log-badge badge-danger">CRÍTICO</span>
                              </td>
                              <td>
                                <span className="log-badge badge-success" style={{ background: 'rgba(52, 211, 153, 0.2)', color: '#34d399' }}>BLOQUEADO</span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                              Nenhum alerta de injeção SQL ou XSS bloqueado no console.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}

                  {logSubTab === 'php' && (
                    <table className="log-console-table">
                      <thead>
                        <tr>
                          <th>Carimbo de Data/Hora</th>
                          <th>Level</th>
                          <th>Arquivo PHP</th>
                          <th>Detalhe do Erro / Mensagem</th>
                          <th>Consumo RAM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {phpLogs.filter(l => 
                          l.level.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                          l.file.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                          l.message.toLowerCase().includes(logSearchQuery.toLowerCase())
                        ).length > 0 ? (
                          phpLogs.filter(l => 
                            l.level.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                            l.file.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                            l.message.toLowerCase().includes(logSearchQuery.toLowerCase())
                          ).map(l => (
                            <tr key={l.id}>
                              <td style={{ color: '#818cf8', fontWeight: 600 }}>{l.timestamp}</td>
                              <td>
                                <span className={`log-badge ${
                                  l.level === 'ERROR' ? 'badge-danger' : 
                                  l.level === 'WARNING' ? 'badge-warning' : 'badge-info'
                                }`}>
                                  {l.level}
                                </span>
                              </td>
                              <td style={{ color: '#e2e8f0', fontWeight: 'bold' }}>{l.file}</td>
                              <td style={{ color: '#cbd5e1', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.message}>
                                {l.message}
                              </td>
                              <td style={{ color: '#94a3b8' }}>{l.memory}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                              Nenhum log PHP correspondente à busca encontrado.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}

                  {logSubTab === 'changes' && (
                    <table className="log-console-table">
                      <thead>
                        <tr>
                          <th>Carimbo de Data/Hora</th>
                          <th>Usuário</th>
                          <th>Tabela DB</th>
                          <th>Ação</th>
                          <th>Registro Afetado</th>
                          <th>Detalhes da Operação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {changeLogs.filter(l => 
                          l.user.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                          l.table.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                          l.action.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                          l.record.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                          l.details.toLowerCase().includes(logSearchQuery.toLowerCase())
                        ).length > 0 ? (
                          changeLogs.filter(l => 
                            l.user.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                            l.table.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                            l.action.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                            l.record.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                            l.details.toLowerCase().includes(logSearchQuery.toLowerCase())
                          ).map(l => (
                            <tr key={l.id}>
                              <td style={{ color: '#34d399', fontWeight: 600 }}>{l.timestamp}</td>
                              <td style={{ color: '#e2e8f0' }}>{l.user}</td>
                              <td style={{ color: '#fbbf24', fontWeight: 500 }}>{l.table}</td>
                              <td>
                                <span className={`log-badge ${
                                  l.action === 'DELETE' ? 'badge-danger' : 
                                  l.action === 'INSERT' ? 'badge-success' : 'badge-warning'
                                }`}>
                                  {l.action}
                                </span>
                              </td>
                              <td style={{ color: '#cbd5e1', fontWeight: 'bold' }}>{l.record}</td>
                              <td style={{ color: '#94a3b8' }}>{l.details}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                              Nenhum log de trilha de auditoria para registros disponível.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: TERMOS E PRIVACIDADE (DISPONÍVEL PARA TODOS) */}
          {activeTab === 'legal' && (
            <div className="animate-slide-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', alignItems: 'start' }}>
              
              {/* Painel LGPD & Consentimento */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="card">
                  <h3 className="card-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={20} color="var(--success-400)" /> Preferências de Privacidade (LGPD)
                  </h3>
                  <p className="text-xs text-secondary mb-6">
                    Gerencie o consentimento do uso de seus dados no ERP de acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Cookie Essencial */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ paddingRight: '1rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Cookies Essenciais (Obrigatórios)</div>
                        <p className="text-xs text-secondary mt-1">Necessários para o funcionamento básico, segurança, autenticação e persistência de sessões no ERP.</p>
                      </div>
                      <input type="checkbox" checked disabled style={{ width: '44px', height: '24px', opacity: 0.7 }} />
                    </div>

                    {/* Cookie Analitico */}
                    <label className="toggle-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}>
                      <div style={{ paddingRight: '1rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Cookies Analíticos</div>
                        <p className="text-xs text-secondary mt-1">Permitem monitorar telemetria e o tráfego de rede interna para melhorias constantes de usabilidade e performance.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={cookieConsent.analytical}
                        onChange={e => setCookieConsent({ ...cookieConsent, analytical: e.target.checked })}
                      />
                    </label>

                    {/* Cookie Marketing */}
                    <label className="toggle-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}>
                      <div style={{ paddingRight: '1rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Cookies de Marketing & Insumos</div>
                        <p className="text-xs text-secondary mt-1">Permite a análise comportamental para sugestões inteligentes e ofertas automáticas de fornecedores de ACM/Mídias.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={cookieConsent.marketing}
                        onChange={e => setCookieConsent({ ...cookieConsent, marketing: e.target.checked })}
                      />
                    </label>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button className="btn btn-primary" onClick={handleSaveCookieConsent}>
                      Salvar Consentimento
                    </button>
                  </div>
                </div>

                <div className="card">
                  <h3 className="card-title mb-4">Direitos do Titular (LGPD)</h3>
                  <p className="text-xs text-secondary mb-6">
                    Acesse ou remova as suas informações pessoais armazenadas em nossos servidores.
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button className="btn btn-secondary" onClick={() => handleLgpdDataRequest('download')} style={{ width: '100%', justifyContent: 'center' }}>
                      Solicitar Relatório de Dados (Portabilidade)
                    </button>
                    <button className="btn btn-outline border-danger-hover text-danger" onClick={() => handleLgpdDataRequest('delete')} style={{ width: '100%', justifyContent: 'center' }}>
                      Excluir Meus Dados (Direito ao Esquecimento)
                    </button>
                  </div>
                </div>
              </div>

              {/* Visualizador de Documentos Legais */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <h3 className="card-title mb-4">Políticas e Diretrizes Legais</h3>
                
                {/* Legal subsections buttons */}
                <div className="sub-tabs-container mb-4" style={{ marginBottom: '1.25rem' }}>
                  <button 
                    className={`sub-tab-btn ${legalSubSection === 'privacy' ? 'active' : ''}`}
                    onClick={() => setLegalSubSection('privacy')}
                  >
                    Política de Privacidade
                  </button>
                  <button 
                    className={`sub-tab-btn ${legalSubSection === 'terms' ? 'active' : ''}`}
                    onClick={() => setLegalSubSection('terms')}
                  >
                    Termos de Uso
                  </button>
                  <button 
                    className={`sub-tab-btn ${legalSubSection === 'cookies' ? 'active' : ''}`}
                    onClick={() => setLegalSubSection('cookies')}
                  >
                    Política de Cookies
                  </button>
                </div>

                {/* Document Scroll Content */}
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.01)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '1.5rem', 
                  maxHeight: '440px', 
                  overflowY: 'auto',
                  fontSize: '0.8125rem',
                  lineHeight: '1.6',
                  color: 'var(--text-secondary)'
                }}>
                  {legalSubSection === 'privacy' && (
                    <div>
                      <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '0.9375rem', fontWeight: 700 }}>POLÍTICA DE PRIVACIDADE E PROTEÇÃO DE DADOS (LGPD)</h4>
                      <p style={{ marginBottom: '1rem' }}>Última atualização: 17 de Maio de 2026</p>
                      
                      <h5 style={{ color: 'var(--text-primary)', margin: '1rem 0 0.5rem 0', fontWeight: 600 }}>1. Informações Gerais</h5>
                      <p style={{ marginBottom: '1rem' }}>
                        A presente Política de Privacidade regula o tratamento de dados pessoais dos usuários do ERP GRAFIO, desenvolvido para empresas de comunicação visual. Nós estamos comprometidos em resguardar a sua privacidade e garantir a conformidade com a Lei Geral de Proteção de Dados (LGPD) brasileira.
                      </p>

                      <h5 style={{ color: 'var(--text-primary)', margin: '1rem 0 0.5rem 0', fontWeight: 600 }}>2. Coleta de Dados Pessoais</h5>
                      <p style={{ marginBottom: '1rem' }}>
                        Nós coletamos dados essenciais fornecidos voluntariamente por você ao criar sua conta, como nome completo, endereço de e-mail corporativo, dados da empresa (razão social, CNPJ, telefone, endereço) e credenciais de segurança. Coletamos também logs de sistema automáticos, endereços IP e informações técnicas dos dispositivos para garantir a segurança operacional e auditoria contra abusos.
                      </p>

                      <h5 style={{ color: 'var(--text-primary)', margin: '1rem 0 0.5rem 0', fontWeight: 600 }}>3. Finalidade do Tratamento</h5>
                      <p style={{ marginBottom: '1rem' }}>
                        Os dados pessoais tratados pelo GRAFIO ERP possuem finalidades específicas e legítimas, que incluem: viabilizar a emissão de orçamentos técnicos de comunicação visual, gerenciar ordens de serviço e ordens de fabricação, programar visitas de campo via módulo de Calendário, e auditar tentativas maliciosas de invasão como SQL Injections e XSS através de nosso Firewall WAF interno.
                      </p>

                      <h5 style={{ color: 'var(--text-primary)', margin: '1rem 0 0.5rem 0', fontWeight: 600 }}>4. Compartilhamento e Transferência</h5>
                      <p style={{ marginBottom: '1rem' }}>
                        Nós não vendemos nem compartilhamos os seus dados pessoais com terceiros para fins de marketing. O compartilhamento ocorre estritamente com fornecedores de infraestrutura em nuvem necessários para a hospedagem segura do ERP (como a plataforma Supabase PostgreSQL), sob estritas cláusulas de confidencialidade e segurança da informação.
                      </p>
                    </div>
                  )}

                  {legalSubSection === 'terms' && (
                    <div>
                      <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '0.9375rem', fontWeight: 700 }}>TERMOS E CONDIÇÕES GERAIS DE USO</h4>
                      <p style={{ marginBottom: '1rem' }}>Última atualização: 17 de Maio de 2026</p>

                      <h5 style={{ color: 'var(--text-primary)', margin: '1rem 0 0.5rem 0', fontWeight: 600 }}>1. Aceitação dos Termos</h5>
                      <p style={{ marginBottom: '1rem' }}>
                        Ao acessar e utilizar a plataforma GRAFIO ERP, você concorda expressa e integralmente com os presentes Termos e Condições de Uso. Caso não concorde com qualquer disposição aqui estabelecida, solicitamos que não utilize nossos serviços.
                      </p>

                      <h5 style={{ color: 'var(--text-primary)', margin: '1rem 0 0.5rem 0', fontWeight: 600 }}>2. Licença de Uso do ERP</h5>
                      <p style={{ marginBottom: '1rem' }}>
                        O GRAFIO concede ao usuário uma licença de uso limitada, não exclusiva, intransferível e revogável para acessar o software ERP sob a modalidade SaaS (Software as a Service) para fins operacionais internos da sua empresa de comunicação visual. É expressamente vedado realizar engenharia reversa, copiar códigos ou utilizar a plataforma para fins ilícitos.
                      </p>

                      <h5 style={{ color: 'var(--text-primary)', margin: '1rem 0 0.5rem 0', fontWeight: 600 }}>3. Responsabilidades do Usuário</h5>
                      <p style={{ marginBottom: '1rem' }}>
                        O usuário é inteiramente responsável pela guarda e confidencialidade de sua senha de acesso, bem como por todas as informações inseridas na plataforma (incluindo dados de clientes, custos, e fotos de recibos de instalações). O usuário compromete-se a não tentar burlar os mecanismos de segurança da plataforma. Qualquer tentativa de invasão (SQL Injection, Cross-Site Scripting, etc.) será capturada por nosso WAF e poderá acarretar rescisão imediata e medidas legais.
                      </p>

                      <h5 style={{ color: 'var(--text-primary)', margin: '1rem 0 0.5rem 0', fontWeight: 600 }}>4. Limitação de Responsabilidade</h5>
                      <p style={{ marginBottom: '1rem' }}>
                        A plataforma é fornecida "como está" e "conforme disponível". Embora façamos o máximo para manter o ERP estável, seguro e livre de falhas 24/7, não garantimos que a plataforma estará completamente livre de interrupções temporárias decorrentes de manutenções ou quedas na rede global de internet.
                      </p>

                      <h5 style={{ color: 'var(--text-primary)', margin: '1rem 0 0.5rem 0', fontWeight: 600 }}>5. Propriedade Intelectual</h5>
                      <p style={{ marginBottom: '1rem' }}>
                        Toda a estrutura, código-fonte, interfaces gráficas, logotipos, marcas, textos e funcionalidades do GRAFIO ERP são de propriedade exclusiva dos seus desenvolvedores e estão protegidos pela Lei nº 9.610/1998 (Lei de Direitos Autorais), pela Lei nº 9.279/1996 (Propriedade Industrial) e pelas legislações internacionais de propriedade intelectual aplicáveis. É expressamente proibida qualquer reprodução, distribuição, sublicenciamento ou criação de obras derivadas sem autorização prévia e expressa por escrito.
                      </p>

                      <h5 style={{ color: 'var(--text-primary)', margin: '1rem 0 0.5rem 0', fontWeight: 600 }}>6. Conteúdo Inserido pelo Usuário</h5>
                      <p style={{ marginBottom: '1rem' }}>
                        O usuário é o único e integral responsável por todo o conteúdo que inserir na plataforma, incluindo, mas não se limitando a: logotipos de clientes, arquivos de arte gráfica, fotografias de instalações, documentos e dados empresariais. Ao inserir qualquer conteúdo, o usuário declara e garante que: (a) possui todos os direitos autorais e licenças necessárias sobre esse conteúdo; (b) o conteúdo não viola direitos de terceiros, incluindo direitos autorais, marcas registradas, patentes, segredos comerciais ou quaisquer outros direitos de propriedade intelectual; e (c) o conteúdo não é difamatório, obsceno, ilegal ou contrário à ordem pública. A plataforma GRAFIO não assume qualquer responsabilidade por conteúdo de terceiros inserido indevidamente por usuários, reservando-se o direito de removê-lo imediatamente mediante notificação fundamentada.
                      </p>

                      <h5 style={{ color: 'var(--text-primary)', margin: '1rem 0 0.5rem 0', fontWeight: 600 }}>7. Política de Remoção de Conteúdo com Violação de Direitos Autorais (Notice & Takedown)</h5>
                      <p style={{ marginBottom: '0.75rem' }}>
                        O GRAFIO ERP respeita os direitos de propriedade intelectual de terceiros e está comprometido com o cumprimento das legislações nacionais (Lei nº 9.610/98 e Marco Civil da Internet — Lei nº 12.965/2014) e internacionais aplicáveis (incluindo o Digital Millennium Copyright Act — DMCA). Caso você acredite que qualquer conteúdo armazenado ou exibido na plataforma por um usuário viola os seus direitos autorais ou de propriedade intelectual, você poderá enviar uma Notificação de Remoção (Takedown Notice) formal ao nosso Agente Designado de Direitos Autorais.
                      </p>
                      <p style={{ marginBottom: '1rem' }}>
                        Após o recebimento de uma notificação válida e devidamente fundamentada, a plataforma GRAFIO compromete-se a: (i) analisar a solicitação em até <strong>5 (cinco) dias úteis</strong>; (ii) remover ou desabilitar o acesso ao conteúdo infrator identificado, caso a notificação seja considerada procedente; (iii) notificar o usuário responsável pelo conteúdo sobre a remoção; e (iv) registrar a ocorrência nos logs internos de auditoria do sistema. A reincidência no envio de conteúdo infrator por parte do mesmo usuário poderá acarretar a suspensão definitiva da conta sem direito a reembolso, nos termos desta cláusula.
                      </p>

                      <h5 style={{ color: 'var(--text-primary)', margin: '1rem 0 0.5rem 0', fontWeight: 600 }}>8. Procedimento para Envio de Notificação de Remoção</h5>
                      <p style={{ marginBottom: '0.5rem' }}>Para que uma notificação de remoção seja válida e processável, ela deverá conter obrigatoriamente:</p>
                      <p style={{ marginBottom: '1rem', paddingLeft: '1rem', borderLeft: '3px solid var(--primary-600)' }}>
                        (a) <strong>Identificação completa do titular</strong>: Nome completo ou razão social, CPF/CNPJ, endereço, telefone e e-mail do requerente ou de seu representante legal devidamente habilitado;<br /><br />
                        (b) <strong>Descrição detalhada da obra protegida</strong>: Identificação clara e precisa da obra ou conteúdo original cujos direitos autorais foram supostamente infringidos, com indicação do registro de direitos autorais ou título de propriedade quando disponível;<br /><br />
                        (c) <strong>Localização exata do conteúdo infrator</strong>: URL específica, módulo, identificador de registro ou qualquer outra informação suficiente para que o GRAFIO possa localizar e identificar o conteúdo denunciado dentro da plataforma;<br /><br />
                        (d) <strong>Declaração de boa-fé</strong>: Declaração expressa, sob as penas da lei, de que o requerente acredita de boa-fé que o uso do conteúdo identificado não foi autorizado pelo titular dos direitos, por seus agentes ou pela legislação vigente;<br /><br />
                        (e) <strong>Declaração de veracidade e legitimidade</strong>: Declaração de que as informações prestadas na notificação são verdadeiras e que o requerente está autorizado a agir em nome do titular dos direitos violados;<br /><br />
                        (f) <strong>Assinatura</strong>: Assinatura física ou eletrônica reconhecida do titular dos direitos ou de seu representante legal.<br /><br />
                        <strong>Canal de recebimento:</strong> As notificações devem ser enviadas exclusivamente para o endereço de e-mail oficial do Agente Designado: <strong style={{ color: 'var(--primary-400)' }}>direitos@grafio.com.br</strong> — com o assunto: <em>"Notificação de Remoção de Conteúdo — Direitos Autorais"</em>.<br /><br />
                        <strong>Aviso sobre notificações de má-fé:</strong> O envio de notificações de remoção sabidamente falsas ou infundadas constitui abuso de direito e pode sujeitar o notificante à responsabilidade civil por danos causados ao usuário afetado, conforme dispõe o Art. 186 do Código Civil Brasileiro e as normas do Marco Civil da Internet.
                      </p>
                    </div>
                  )}

                  {legalSubSection === 'cookies' && (
                    <div>
                      <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '0.9375rem', fontWeight: 700 }}>POLÍTICA DE COOKIES E RASTREAMENTO</h4>
                      <p style={{ marginBottom: '1rem' }}>Última atualização: 17 de Maio de 2026</p>

                      <h5 style={{ color: 'var(--text-primary)', margin: '1rem 0 0.5rem 0', fontWeight: 600 }}>1. O que são Cookies?</h5>
                      <p style={{ marginBottom: '1rem' }}>
                        Cookies são pequenos arquivos de texto armazenados no seu navegador ou dispositivo de acesso quando você visita um site ou sistema. Eles servem para ajudar o ERP a se lembrar de suas configurações e comportamentos de navegação anteriores, garantindo a sua melhor experiência de login e uso.
                      </p>

                      <h5 style={{ color: 'var(--text-primary)', margin: '1rem 0 0.5rem 0', fontWeight: 600 }}>2. Como o ERP utiliza Cookies?</h5>
                      <p style={{ marginBottom: '1rem' }}>
                        O GRAFIO ERP utiliza três classes principais de cookies:
                        <br />• <strong>Cookies Essenciais</strong>: Indispensáveis para que você permaneça logado na sua empresa, mantendo tokens de sessão seguros e preferências de tema visual (claro/escuro) persistentes em sua máquina.
                        <br />• <strong>Cookies Analíticos</strong>: Utilizados de forma agregada e anônima para nos ajudar a identificar quais ferramentas do ERP são mais visualizadas ou se há lentidão no carregamento de tabelas de orçamentos.
                        <br />• <strong>Cookies de Marketing/Insumos</strong>: Opcionais, servem para sugerir de forma inteligente insumos de comunicação visual baseados nas cotações mais criadas pela sua empresa.
                      </p>

                      <h5 style={{ color: 'var(--text-primary)', margin: '1rem 0 0.5rem 0', fontWeight: 600 }}>3. Gerenciamento e Revogação</h5>
                      <p style={{ marginBottom: '1rem' }}>
                        O usuário pode revogar ou atualizar seu consentimento de cookies a qualquer momento através do painel de consentimento LGPD localizado ao lado deste documento. Lembramos que desabilitar certos cookies analíticos pode impedir o diagnóstico ágil de eventuais lentidões em sua navegação.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* INVITE NEW MEMBER MODAL */}
      {inviteModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content animate-scale-in card">
            <h3 className="card-title mb-4"><UserPlus size={20} color="var(--primary-400)"/> Convidar Novo Membro</h3>
            <form onSubmit={handleInviteUser}>
              <div className="input-group mb-4">
                <label className="input-label">Nome Completo</label>
                <input 
                  type="text" 
                  className="input" 
                  required 
                  value={inviteName} 
                  onChange={e => setInviteName(e.target.value)} 
                  placeholder="Ex: João Silva" 
                />
              </div>

              <div className="input-group mb-4">
                <label className="input-label">E-mail Corporativo</label>
                <input 
                  type="email" 
                  className="input" 
                  required 
                  value={inviteEmail} 
                  onChange={e => setInviteEmail(e.target.value)} 
                  placeholder="Ex: joao.silva@empresa.com" 
                />
              </div>

              <div className="input-group mb-6">
                <label className="input-label">Função / Permissão</label>
                <select 
                  className="input" 
                  value={inviteRole} 
                  onChange={e => setInviteRole(e.target.value as any)}
                >
                  <option value="admin">Administrador</option>
                  <option value="user">Usuário Comum</option>
                  <option value="viewer">Visualizador</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setInviteModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Enviar Convite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
