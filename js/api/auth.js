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

// login user
export async function loginUser({ email, password }) {
  const body = JSON.stringify({ email, password });

  return await apiFetch('/auth/login', {
    method: 'POST',
    body,
  });
}
