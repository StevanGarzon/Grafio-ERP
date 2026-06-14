import { Navigate } from 'react-router-dom';
import { type ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loading">
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Carregando...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
