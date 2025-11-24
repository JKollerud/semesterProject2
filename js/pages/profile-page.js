import {
  requireAuth,
  updateNavAuthState,
  initLogout,
} from '../utils/guards.js';

requireAuth();
updateNavAuthState();
initLogout();
