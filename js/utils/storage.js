// localStorage helpers
const STORAGE_KEY = "nauth";

// save token + user object
export function saveAuth({ accessToken, user }) {
  const value = JSON.stringify({
    accessToken,
    user,
  });
  localStorage.setItem(STORAGE_KEY, value);
}

// load auth session
export function getAuth() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// clear login session
export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
}
