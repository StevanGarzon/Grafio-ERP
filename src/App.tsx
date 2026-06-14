import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientesPage from './pages/ClientesPage';
import ClienteFormPage from './pages/ClienteFormPage';
import ClientePerfilPage from './pages/ClientePerfilPage';
import OrcamentosPage from './pages/OrcamentosPage';
import OrcamentoFormPage from './pages/OrcamentoFormPage';
import OrcamentoViewPage from './pages/OrcamentoViewPage';
import OrdensServicoPage from './pages/OrdensServicoPage';
import OrdemServicoFormPage from './pages/OrdemServicoFormPage';
import OrdemServicoViewPage from './pages/OrdemServicoViewPage';
import ProducaoPage from './pages/ProducaoPage';
import EstoquePage from './pages/EstoquePage';
import FornecedoresPage from './pages/FornecedoresPage';
import FornecedorFormPage from './pages/FornecedorFormPage';
import FinanceiroPage from './pages/FinanceiroPage';
import TransacaoFormPage from './pages/TransacaoFormPage';
import AprovacoesPage from './pages/AprovacoesPage';
import NovaAprovacaoPage from './pages/NovaAprovacaoPage';
import ClienteAprovacaoPage from './pages/ClienteAprovacaoPage';
import CalculadorasPage from './pages/CalculadorasPage';
import VisitasPage from './pages/VisitasPage';
import VisitaFormPage from './pages/VisitaFormPage';
import DocumentosPage from './pages/DocumentosPage';
import NotasPage from './pages/NotasPage';
import ContratosPage from './pages/ContratosPage';
import ComparadorPrecosPage from './pages/ComparadorPrecosPage';
import ModelosPage from './pages/ModelosPage';
import LinksPage from './pages/LinksPage';
import MaquinasPage from './pages/MaquinasPage';
import ScannerProducaoPage from './pages/ScannerProducaoPage';
import ConfiguracoesPage from './pages/ConfiguracoesPage';
import CalendarioPage from './pages/CalendarioPage';
import InstalacoesPage from './pages/InstalacoesPage';
import CrmPipelinePage from './pages/CrmPipelinePage';
import PrecificacaoPage from './pages/PrecificacaoPage';
import ControleProducaoPage from './pages/ControleProducaoPage';
import SimuladorIndustrialPage from './pages/SimuladorIndustrialPage';
import MockupsConverterPage from './pages/MockupsConverterPage';
import ExecutiveDashboardPage from './pages/ExecutiveDashboardPage';

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="page-loading">
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
        </div>
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/aprovacao/:token" element={<ClienteAprovacaoPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            
            {/* Clientes (CRM) */}
            <Route path="clientes" element={<ClientesPage />} />
            <Route path="clientes/novo" element={<ClienteFormPage />} />
            <Route path="clientes/:id" element={<ClientePerfilPage />} />
            <Route path="clientes/:id/editar" element={<ClienteFormPage />} />
            
            {/* Orçamentos */}
            <Route path="orcamentos" element={<OrcamentosPage />} />
            <Route path="orcamentos/novo" element={<OrcamentoFormPage />} />
            <Route path="orcamentos/:id" element={<OrcamentoViewPage />} />
            <Route path="orcamentos/:id/editar" element={<OrcamentoFormPage />} />
            
            {/* Ordem de Serviço e PCP */}
            <Route path="ordens-servico" element={<OrdensServicoPage />} />
            <Route path="ordens-servico/nova" element={<OrdemServicoFormPage />} />
            <Route path="ordens-servico/:id" element={<OrdemServicoViewPage />} />
            <Route path="ordens-servico/:id/editar" element={<OrdemServicoFormPage />} />
            <Route path="producao" element={<ProducaoPage />} />
            
            {/* Suprimentos e Estoque */}
            <Route path="estoque" element={<EstoquePage />} />
            <Route path="fornecedores" element={<FornecedoresPage />} />
            <Route path="fornecedores/novo" element={<FornecedorFormPage />} />
            <Route path="fornecedores/:id/editar" element={<FornecedorFormPage />} />
            
            {/* Financeiro */}
            <Route path="financeiro" element={<FinanceiroPage />} />
            <Route path="financeiro/novo" element={<TransacaoFormPage />} />
            <Route path="financeiro/:id/editar" element={<TransacaoFormPage />} />
            <Route path="contratos" element={<ContratosPage />} />
            
            {/* Aprovações de Arte */}
            <Route path="aprovacoes" element={<AprovacoesPage />} />
            <Route path="aprovacoes/nova" element={<NovaAprovacaoPage />} />
            <Route path="calculadoras" element={<CalculadorasPage />} />
            <Route path="comparador" element={<ComparadorPrecosPage />} />
            <Route path="maquinas" element={<MaquinasPage />} />
            <Route path="scanner" element={<ScannerProducaoPage />} />
            
            <Route path="visitas" element={<VisitasPage />} />
            <Route path="visitas/nova" element={<VisitaFormPage />} />
            <Route path="visitas/:id/executar" element={<VisitaFormPage />} />
            
            <Route path="documentos" element={<DocumentosPage />} />
            <Route path="modelos" element={<ModelosPage />} />
            <Route path="links" element={<LinksPage />} />
            <Route path="notas" element={<NotasPage />} />
            <Route path="instalacoes" element={<InstalacoesPage />} />
            <Route path="calendario" element={<CalendarioPage />} />
            <Route path="crm" element={<CrmPipelinePage />} />
            <Route path="precificacao" element={<PrecificacaoPage />} />
            <Route path="controle-producao" element={<ControleProducaoPage />} />
            <Route path="simulador-industrial" element={<SimuladorIndustrialPage />} />
            <Route path="mockups-converter" element={<MockupsConverterPage />} />
            <Route path="executive-dashboard" element={<ExecutiveDashboardPage />} />
            <Route path="notificacoes" element={<ConfiguracoesPage />} />
            <Route path="configuracoes" element={<ConfiguracoesPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
