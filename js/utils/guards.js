// page protection and redirects
import { getAuth, clearAuth } from './storage.js';

export function isLoggedIn() {
  const auth = getAuth();
  return !!auth?.accessToken;
}

export function getAuthToken() {
  return getAuth()?.accessToken || null;
}

export function getAuthUser() {
  return getAuth()?.user || null;
}

// pages that require auth (profile, create-listing, edit.. etc)
export function requireAuth() {
  if (!isLoggedIn()) {
    const current = encodeURIComponent(
      window.location.pathname + window.location.search
    );
    window.location.href = `login.html?redirect=${current}`;
  }
}

// pages that shoud be hidden when logged in
export function redirectIfAuthenticated() {
  if (isLoggedIn()) {
    window.location.href = 'index.html';
  }
}

// logout
export function logoutAndRedirect(to = 'login.html') {
  clearAuth();
  window.location.href = to;
}

// nav helpers
export function updateNavAuthState() {
  // nav.js
}

export function initLogout(to = 'login.html') {
  document.querySelectorAll('[data-logout]').forEach((btn) => {
    btn.addEventListener('click', () => {
      clearAuth();
      window.location.href = to;
    });
  });
}
