import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Variáveis de ambiente do Supabase não configuradas. ' +
    'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env'
  );
}

const rawSupabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

function getLocalTimestamp() {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().replace('T', ' ').substring(0, 19);
}

// Logging utility to save system audit logs
function logChangeLocally(table: string, action: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) {
  try {
    const savedLogsStr = localStorage.getItem('grafio_security_change_logs');
    let storedLogs = [];
    if (savedLogsStr) {
      storedLogs = JSON.parse(savedLogsStr);
    }
    
    // Get current user email from supabase session
    let userEmail = 'admin@grafio.com.br';
    try {
      const sessionStr = localStorage.getItem('sb-dupzvhagirtgivyhxpfh-auth-token');
      if (sessionStr) {
        const parsed = JSON.parse(sessionStr);
        if (parsed?.user?.email) userEmail = parsed.user.email;
      }
    } catch (e) {}

    // Get a friendly record description
    let recordDescription = 'Registro';
    if (payload) {
      if (Array.isArray(payload)) {
        recordDescription = payload.map(p => p.name || p.title || p.id || 'Item').join(', ');
      } else {
        recordDescription = payload.name || payload.title || payload.id || 'Registro';
      }
    }

    const newLog = {
      id: Math.random().toString(),
      timestamp: getLocalTimestamp(),
      user: userEmail,
      table: table,
      action: action,
      record: String(recordDescription).substring(0, 50),
      details: `${action} realizado na tabela ${table}.`
    };

    storedLogs.unshift(newLog);
    localStorage.setItem('grafio_security_change_logs', JSON.stringify(storedLogs.slice(0, 200)));
    window.dispatchEvent(new Event('security-logs-updated'));
  } catch (err) {
    console.error('Erro ao registrar log de alteração:', err);
  }
}

// Helper to log access (success or failure)
export function logAccessLocally(user: string, action: string, status: 'success' | 'failure') {
  try {
    const saved = localStorage.getItem('grafio_security_access_logs');
    const logs = saved ? JSON.parse(saved) : [];
    const newLog = {
      id: Math.random().toString(),
      timestamp: getLocalTimestamp(),
      user,
      action,
      ip: '127.0.0.1',
      agent: navigator.userAgent.substring(0, 50),
      status
    };
    logs.unshift(newLog);
    localStorage.setItem('grafio_security_access_logs', JSON.stringify(logs.slice(0, 200)));
    window.dispatchEvent(new Event('security-logs-updated'));
  } catch (e) {
    console.error('Error logging access:', e);
  }
}

// Proxied supabase instance to intercept mutations
export const supabase = new Proxy(rawSupabase, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver);
    if (prop === 'from' && typeof value === 'function') {
      return function (tableName: string) {
        const queryBuilder = value.apply(target, [tableName]);
        
        // Wrap the query builder to intercept insert, update, delete
        return new Proxy(queryBuilder, {
          get(qbTarget, qbProp, qbReceiver) {
            const qbValue = Reflect.get(qbTarget, qbProp, qbReceiver);
            if (typeof qbValue === 'function') {
              if (qbProp === 'insert') {
                return function (values: any, options: any) {
                  logChangeLocally(tableName, 'INSERT', values);
                  return qbValue.apply(qbTarget, [values, options]);
                };
              }
              if (qbProp === 'update') {
                return function (values: any, options: any) {
                  logChangeLocally(tableName, 'UPDATE', values);
                  return qbValue.apply(qbTarget, [values, options]);
                };
              }
              if (qbProp === 'delete') {
                return function (options: any) {
                  logChangeLocally(tableName, 'DELETE', { id: 'Registro removido' });
                  return qbValue.apply(qbTarget, [options]);
                };
              }
            }
            return qbValue;
          }
        });
      };
    }
    return value;
  }
});

