import * as SQLite from 'expo-sqlite';

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

const db = SQLite.openDatabaseSync('fstrack.db');

export async function initDB(): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS submissions (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      form_type     TEXT NOT NULL,
      payload       TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'PENDING',
      company_label TEXT,
      created_at    TEXT NOT NULL,
      sent_at       TEXT,
      error_detail  TEXT
    );
  `);
}

export async function addSubmission(
  form_type: FormType,
  payload: string,
  company_label: string | null
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO submissions (form_type, payload, status, company_label, created_at)
     VALUES (?, ?, 'PENDING', ?, ?)`,
    [form_type, payload, company_label, new Date().toISOString()]
  );
  return result.lastInsertRowId;
}

export async function updateSubmissionPayload(id: number, payload: string): Promise<void> {
  await db.runAsync(`UPDATE submissions SET payload = ? WHERE id = ?`, [payload, id]);
}

export async function markSent(id: number): Promise<void> {
  await db.runAsync(
    `UPDATE submissions SET status = 'SENT', sent_at = ? WHERE id = ?`,
    [new Date().toISOString(), id]
  );
}

export async function markError(id: number, error_detail: string): Promise<void> {
  await db.runAsync(
    `UPDATE submissions SET status = 'ERROR', error_detail = ? WHERE id = ?`,
    [error_detail, id]
  );
}

export async function getPending(): Promise<Submission[]> {
  return db.getAllAsync<Submission>(
    `SELECT * FROM submissions WHERE status = 'PENDING' ORDER BY created_at ASC`
  );
}

export async function getAll(): Promise<Submission[]> {
  return db.getAllAsync<Submission>(
    `SELECT * FROM submissions ORDER BY created_at DESC LIMIT 100`
  );
}
