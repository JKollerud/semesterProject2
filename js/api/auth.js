// login / register
import { apiFetch } from './config.js';

// register new user
export async function registerUser({ username, email, password }) {
  const body = JSON.stringify({
    name: username,
    email,
    password,
  });

  const result = await apiFetch('/auth/register', {
    method: 'POST',
    body,
  });

  return result;
}
