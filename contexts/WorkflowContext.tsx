import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { API_BASE_URL } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

type WorkflowEntry = {
  codigo: string;
  nombre: string;
  // TipoDocumento assigned to this workflow — sent as TransaccionSubtipoCodigo on the Pedido payload.
  subtipoCodigo?: string | null;
  subtipoNombre?: string;
};

type WorkflowSet = {
  venta: WorkflowEntry | null;
  compra: WorkflowEntry | null;
};

type WorkflowContextType = {
  workflow: WorkflowSet;
  loadingWorkflow: boolean;
  refreshWorkflow: () => Promise<void>;
};

const EMPTY: WorkflowSet = { venta: null, compra: null };

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export function WorkflowProvider({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const [workflow, setWorkflow] = useState<WorkflowSet>(EMPTY);
  const [loadingWorkflow, setLoadingWorkflow] = useState(false);

  const refreshWorkflow = async () => {
    if (!user?.token) { setWorkflow(EMPTY); return; }
    setLoadingWorkflow(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/my-workflow`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWorkflow({ venta: data.venta ?? null, compra: data.compra ?? null });
      } else if (res.status === 401) {
        // Token expired — sign out so the user can re-authenticate
        await signOut();
      } else {
        console.error('Error loading workflow: HTTP', res.status);
      }
    } catch (err) {
      console.error('Error loading workflow:', err);
    } finally {
      setLoadingWorkflow(false);
    }
  };

  // Fetch on login
  useEffect(() => { refreshWorkflow(); }, [user?.token]);

  // Retry when the app comes back to the foreground (covers transient network failures)
  useEffect(() => {
    if (!user?.token) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshWorkflow();
    });
    return () => sub.remove();
  }, [user?.token]);

  return (
    <WorkflowContext.Provider value={{ workflow, loadingWorkflow, refreshWorkflow }}>
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) throw new Error('useWorkflow must be used inside WorkflowProvider');
  return context;
}
