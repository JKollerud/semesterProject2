// API base here + fetch
export const API_BASE = 'https://v2.api.noroff.dev';

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await res.json();

  if (!res.ok) {
    const msg = payload?.errors?.[0]?.message || 'Something went wrong';
    throw new Error(msg);
  }

  return payload;
}
