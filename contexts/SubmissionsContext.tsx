import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { getFriendlyError } from '@/utils/api-error';
import { getFinnegansToken } from '@/utils/get-finnegans-token';
import {
  addSubmission,
  FormType,
  getAll,
  getPending,
  initDB,
  markError,
  markSent,
  updateSubmissionPayload,
  Submission,
} from '@/utils/local-db';
import { sendLog } from '@/utils/send-log';

const ENDPOINTS: Record<FormType, string> = {
  PRODUCCION:    'https://api.finneg.com/api/produccionLeche',
  NACIMIENTOS:   'https://api.finneg.com/api/NacimientosHacienda',
  MUERTES:       'https://api.finneg.com/api/MuerteHacienda',
  TRASLADOS:     'https://api.finneg.com/api/TrasladosHacienda',
  PEDIDO_COMPRA: 'https://api.finneg.com/api/pedidoCompra',
  PEDIDO_VENTA:  'https://api.finneg.com/api/pedidoVenta',
  NOVEDADES_SUELDO: 'https://api.finneg.com/api/novedadLiquidacionSueldo',
};

export type AddParams = {
  formType: FormType;
  payload: object;
  companyLabel: string | null;
  lote?: string | null;
  categoria?: string | null;
  cantidad?: number | null;
  deposito?: string | null;
};

export type AddResult =
  | { status: 'sent' }
  | { status: 'queued' }
  | { status: 'error'; title: string; detail?: string };

type SubmissionsContextType = {
  submissions: Submission[];
  syncing: boolean;
  addAndSubmit: (params: AddParams) => Promise<AddResult>;
  syncPending: () => Promise<void>;
  syncOne: (id: number, updatedPayload?: object) => Promise<void>;
  refresh: () => Promise<void>;
};

const SubmissionsContext = createContext<SubmissionsContextType | undefined>(undefined);

type AttemptResult =
  | { result: 'sent' }
  | { result: 'pending' }
  | { result: 'error'; detail: string };

async function attemptSend(
  userToken: string,
  id: number,
  formType: FormType,
  payload: object,
  companyLabel: string | null,
  meta?: Omit<AddParams, 'formType' | 'payload' | 'companyLabel'>
): Promise<AttemptResult> {
  try {
    const finnegansToken = await getFinnegansToken(userToken);
    const res = await fetch(`${ENDPOINTS[formType]}?ACCESS_TOKEN=${finnegansToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      await markSent(id);
      sendLog(userToken, {
        form_type: formType,
        lote: meta?.lote,
        categoria: meta?.categoria,
        cantidad: meta?.cantidad,
        deposito: meta?.deposito,
        company_label: companyLabel,
        status: 'SUCCESS',
      });
      return { result: 'sent' };
    }

    const text = await res.text();
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch { /* not JSON */ }
    const { title } = getFriendlyError(res.status, parsed ?? text);
    const rawBody = parsed !== null ? JSON.stringify(parsed) : text.trim();
    const detailStr = (rawBody ? `${title}\n${rawBody}` : title).slice(0, 1000);
    await markError(id, detailStr);
    sendLog(userToken, {
      form_type: formType,
      lote: meta?.lote,
      categoria: meta?.categoria,
      cantidad: meta?.cantidad,
      deposito: meta?.deposito,
      company_label: companyLabel,
      status: 'ERROR',
      error_detail: detailStr,
    });
    return { result: 'error', detail: detailStr };
  } catch {
    // Network unreachable — leave as PENDING for later sync
    return { result: 'pending' };
  }
}

export function SubmissionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initDB().then(() => {
      setReady(true);
      reload();
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncPending();
    });
    return () => sub.remove();
  }, [ready, user?.token]);

  async function reload() {
    const all = await getAll();
    setSubmissions(all);
  }

  async function addAndSubmit(params: AddParams): Promise<AddResult> {
    const id = await addSubmission(
      params.formType,
      JSON.stringify(params.payload),
      params.companyLabel
    );
    await reload();

    if (!user?.token) {
      return { status: 'queued' };
    }

    const outcome = await attemptSend(user.token, id, params.formType, params.payload, params.companyLabel, params);
    await reload();

    if (outcome.result === 'sent') return { status: 'sent' };
    if (outcome.result === 'pending') return { status: 'queued' };

    // error — use the detail returned by attemptSend (works on web too, where the DB is a stub)
    const stored = outcome.detail || 'Error al enviar.';
    const nl = stored.indexOf('\n');
    return nl >= 0
      ? { status: 'error', title: stored.slice(0, nl), detail: stored.slice(nl + 1) }
      : { status: 'error', title: stored };
  }

  async function syncPending() {
    if (!user?.token || syncing) return;
    const pending = await getPending();
    if (pending.length === 0) return;
    setSyncing(true);
    for (const sub of pending) {
      try {
        const payload = JSON.parse(sub.payload);
        await attemptSend(user.token, sub.id, sub.form_type, payload, sub.company_label);
      } catch {}
    }
    await reload();
    setSyncing(false);
  }

  async function syncOne(id: number, updatedPayload?: object): Promise<void> {
    if (!user?.token) return;
    if (updatedPayload !== undefined) {
      await updateSubmissionPayload(id, JSON.stringify(updatedPayload));
    }
    const all = await getAll();
    const sub = all.find((s) => s.id === id);
    if (!sub) return;
    try {
      const payload = JSON.parse(sub.payload);
      await attemptSend(user.token, sub.id, sub.form_type, payload, sub.company_label);
    } catch {}
    await reload();
  }

  const value = useMemo<SubmissionsContextType>(
    () => ({ submissions, syncing, addAndSubmit, syncPending, syncOne, refresh: reload }),
    [submissions, syncing, user?.token]
  );

  return (
    <SubmissionsContext.Provider value={value}>
      {children}
    </SubmissionsContext.Provider>
  );
}

export function useSubmissions() {
  const ctx = useContext(SubmissionsContext);
  if (!ctx) throw new Error('useSubmissions must be used inside SubmissionsProvider');
  return ctx;
}
