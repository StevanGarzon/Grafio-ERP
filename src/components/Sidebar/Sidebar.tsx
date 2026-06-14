import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import './Sidebar.css';
import {
  LayoutDashboard, Users, FileText, ClipboardList, Kanban, Warehouse,
  Truck, DollarSign, FolderOpen, Link2, StickyNote, MapPin, Wrench,
  UsersRound, Upload, Bot, BarChart3, Bell, Settings, LogOut,
  ChevronLeft, ChevronRight, Search, Palette, Calculator as CalcIcon,
  ShieldCheck, ShoppingCart, BookOpen,
  Cpu, Scan, Calendar, TrendingUp, Sparkles, Layers, Image, LineChart
} from 'lucide-react';

const navSections = [
  {
    title: 'Principal',
    items: [
      { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/crm', icon: TrendingUp, label: 'CRM / Funil' },
      { path: '/clientes', icon: Users, label: 'Clientes' },
      { path: '/orcamentos', icon: FileText, label: 'Orçamentos' },
      { path: '/ordens-servico', icon: ClipboardList, label: 'Ordens de Serviço' },
      { path: '/aprovacoes', icon: Palette, label: 'Aprovações de Arte' },
    ],
  },
  {
    title: 'Produção',
    items: [
      { path: '/producao', icon: Kanban, label: 'PCP / Kanban' },
      { path: '/precificacao', icon: Sparkles, label: 'Precificação Inteligente' },
      { path: '/simulador-industrial', icon: Layers, label: 'Simulador Industrial' },
      { path: '/estoque', icon: Warehouse, label: 'Estoque' },
      { path: '/fornecedores', icon: Truck, label: 'Fornecedores' },
      { path: '/calculadoras', icon: CalcIcon, label: 'Calculadoras' },
      { path: '/comparador', icon: ShoppingCart, label: 'Comparador de Preços' },
      { path: '/maquinas', icon: Cpu, label: 'Máquinas & Ativos' },
      { path: '/scanner', icon: Scan, label: 'Leitor QR Produção' },
    ],
  },
  {
    title: 'Financeiro',
    items: [
      { path: '/financeiro', icon: DollarSign, label: 'Financeiro' },
      { path: '/contratos', icon: ShieldCheck, label: 'Contratos / Recorrência' },
    ],
  },
  {
    title: 'Ferramentas',
    items: [
      { path: '/mockups-converter', icon: Image, label: 'Conversor de Arquivos' },
      { path: '/documentos', icon: FolderOpen, label: 'Documentos' },
      { path: '/modelos', icon: BookOpen, label: 'Modelos / POPs' },
      { path: '/links', icon: Link2, label: 'Links Úteis' },
      { path: '/notas', icon: StickyNote, label: 'Notas' },
      { path: '/visitas', icon: MapPin, label: 'Visitas Técnicas' },
      { path: '/instalacoes', icon: Wrench, label: 'Instalações' },
      { path: '/calendario', icon: Calendar, label: 'Calendário' },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { path: '/relatorios', icon: BarChart3, label: 'Relatórios' },
      { path: '/executive-dashboard', icon: LineChart, label: 'BI Executivo' },
      { path: '/configuracoes', icon: Settings, label: 'Configurações' },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário');
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const updateUnreadCount = () => {
      const saved = localStorage.getItem('grafio_notifications');
      if (saved) {
        try {
          const list = JSON.parse(saved);
          const count = list.filter((n: any) => !n.read).length;
          setUnreadCount(count);
        } catch (e) {
          console.error('Erro ao ler notificações no Sidebar:', e);
        }
      } else {
        setUnreadCount(3);
      }
    };

    updateUnreadCount();

    const handleNotificationsUpdate = () => {
      updateUnreadCount();
    };

    window.addEventListener('notifications-updated', handleNotificationsUpdate);
    window.addEventListener('storage', handleNotificationsUpdate);

    return () => {
      window.removeEventListener('notifications-updated', handleNotificationsUpdate);
      window.removeEventListener('storage', handleNotificationsUpdate);
    };
  }, []);

  useEffect(() => {
    if (user) {
      const initialName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
      setDisplayName(initialName);

      // Load profile name from database
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.full_name) {
            setDisplayName(data.full_name);
          }
        });
    }
  }, [user]);

  useEffect(() => {
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.full_name) {
        setDisplayName(customEvent.detail.full_name);
      }
    };
    window.addEventListener('profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('profile-updated', handleProfileUpdate);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <svg viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#sb-grad)" />
              <path d="M9 11h14v2.5H9zM9 16h8v2.5H9zM9 21h11v2.5H9z" fill="white" fillOpacity="0.9"/>
              <defs>
                <linearGradient id="sb-grad" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#3366ff" /><stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          {!collapsed && <span className="sidebar-brand-text">GRAFIO</span>}
        </div>
        <button
          className="sidebar-toggle btn-ghost btn-icon"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="sidebar-search">
          <Search size={14} className="sidebar-search-icon" />
          <input type="text" placeholder="Buscar..." className="sidebar-search-input" />
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.title} className="sidebar-section">
            {!collapsed && <span className="sidebar-section-title">{section.title}</span>}
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={18} className="sidebar-link-icon" />
                {!collapsed && <span className="sidebar-link-text">{item.label}</span>}
                {item.path === '/notificacoes' && unreadCount > 0 && (
                  <span className="sidebar-badge">{unreadCount}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user" title={displayName}>
          <div className="avatar" style={{ background: 'var(--gradient-primary)', width: 32, height: 32, fontSize: '0.7rem' }}>
            {avatarUrl ? <img src={avatarUrl} alt={displayName} /> : initials}
          </div>
          {!collapsed && (
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{displayName}</span>
              <span className="sidebar-user-role">Administrador</span>
            </div>
          )}
        </div>
        <button className="btn-ghost btn-icon sidebar-logout" onClick={handleSignOut} title="Sair">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
