import { registerUser } from '../api/auth.js';

const form = document.querySelector('#register-form');
const usernameInput = document.querySelector('#username');
const emailInput = document.querySelector('#email');
const passwordInput = document.querySelector('#password');
const emailError = document.querySelector('#email-error');
const togglePassword = document.querySelector('#toggle-password');
const eyeIcon = document.querySelector('#eye-icon');

// password show or hide
if (togglePassword && eyeIcon && passwordInput) {
  togglePassword.addEventListener('click', () => {
    const show = passwordInput.type === 'password';
    passwordInput.type = show ? 'text' : 'password';

    eyeIcon.src = show
      ? './assets/icons/eye.svg'
      : './assets/icons/eye-off.svg';
  });
}

// form submit
function showToast(message) {
  const toast = document.getElementById('register-toast');
  toast.textContent = message;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email.endsWith('@stud.noroff.no')) {
    emailError.classList.remove('hidden');
    return;
  } else {
    emailError.classList.add('hidden');
  }

  const submitBtn = form.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.textContent = 'Registering...';

  try {
    await registerUser({ username, email, password });

    showToast('Registration successful! Redirecting to login...');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
  } catch (error) {
    showToast('Registration failed: ' + error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Register';
  }
});
