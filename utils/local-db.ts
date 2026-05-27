// Web stub — Metro uses local-db.native.ts on iOS/Android.
// expo-sqlite requires native APIs and cannot run in a browser.

export type FormType = 'PRODUCCION' | 'NACIMIENTOS' | 'MUERTES' | 'TRASLADOS' | 'PEDIDO_COMPRA' | 'PEDIDO_VENTA';
export type SubmissionStatus = 'PENDING' | 'SENT' | 'ERROR';

export type Submission = {
  id: number;
  form_type: FormType;
  payload: string;
  status: SubmissionStatus;
  company_label: string | null;
  created_at: string;
  sent_at: string | null;
  error_detail: string | null;
};

export async function initDB(): Promise<void> {}

export async function addSubmission(
  _form_type: FormType,
  _payload: string,
  _company_label: string | null
): Promise<number> {
  return -1;
}

export async function updateSubmissionPayload(_id: number, _payload: string): Promise<void> {}
export async function markSent(_id: number): Promise<void> {}
export async function markError(_id: number, _error_detail: string): Promise<void> {}
export async function getPending(): Promise<Submission[]> { return []; }
export async function getAll(): Promise<Submission[]> { return []; }
