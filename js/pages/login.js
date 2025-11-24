import { loginUser } from '../api/auth.js';
import { saveAuth } from '../utils/storage.js';
import {
  updateNavAuthState,
  redirectIfAuthenticated,
} from '../utils/guards.js';

redirectIfAuthenticated();
updateNavAuthState();

const form = document.querySelector('#login-form');
const emailInput = document.querySelector('#email');
const passwordInput = document.querySelector('#password');
const errorBox = document.querySelector('#login-error');

function showLoginToast(message) {
  const toast = document.getElementById('login-toast');
  toast.textContent = message;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

// password show or hide
const togglePassword = document.querySelector('#toggle-password');
const eyeIcon = document.querySelector('#eye-icon');

if (togglePassword && eyeIcon && passwordInput) {
  togglePassword.addEventListener('click', () => {
    const show = passwordInput.type === 'password';
    passwordInput.type = show ? 'text' : 'password';

    eyeIcon.src = show
      ? './assets/icons/eye.svg'
      : './assets/icons/eye-off.svg';
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  errorBox.classList.add('hidden');

  const submitBtn = form.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging in...';

  try {
    const result = await loginUser({ email, password });

    const { data, accessToken } = result;
    const token = accessToken || data?.accessToken;

    if (!token) {
      throw new Error('No access token returned from server.');
    }

    saveAuth({ accessToken: token, user: data });

    showLoginToast(`Welcome back, ${data?.name || 'user'}! Redirecting...`);

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1200);
  } catch (error) {
    console.error(error);
    errorBox.textContent =
      'Login failed: ' + (error.message || 'Please try again.');
    errorBox.classList.remove('hidden');
    showLoginToast('Login failed. Please check your details.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Login';
  }
});
