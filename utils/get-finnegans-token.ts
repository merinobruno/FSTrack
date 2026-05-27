import { API_BASE_URL } from '@/constants/api';

export async function getFinnegansToken(appToken: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/finnegans/token`, {
    headers: { Authorization: `Bearer ${appToken}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Finnegans token request failed: ${res.status}`);
  }

  const data = await res.json();
  return data.token;
}
