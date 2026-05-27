import { API_BASE_URL } from '@/constants/api';

export type LogPayload = {
  form_type: 'PRODUCCION' | 'NACIMIENTOS' | 'MUERTES' | 'TRASLADOS';
  lote?: string | null;
  categoria?: string | null;
  cantidad?: number | null;
  deposito?: string | null;
  company_label?: string | null;
  status: 'SUCCESS' | 'ERROR';
  error_detail?: string | null;
};

export async function sendLog(token: string, payload: LogPayload): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Non-critical — silently ignore log failures so they never affect UX
  }
}
