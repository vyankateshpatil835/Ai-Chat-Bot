import api from '../../services/api.js';

const apiError = (error, fallback) => error.response?.data?.message || error.message || fallback;

function showError(message = '') {
  const errorEl = document.getElementById('app-error');
  if (errorEl) errorEl.textContent = message;
}

document.getElementById('toggle-password').addEventListener('click', () => {
  const input = document.getElementById('password');
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  const button = document.getElementById('toggle-password');
  button.textContent = show ? 'visibility_off' : 'visibility';
  button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  button.title = button.getAttribute('aria-label');
});

document.getElementById('auth-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  showError();
  const button = document.getElementById('auth-submit');
  button.disabled = true;
  const values = Object.fromEntries(new FormData(event.currentTarget));
  try {
    const { data } = await api.post('/auth/login', values);
    localStorage.setItem('token', data.token);
    window.location.assign('/pages/chat/chat.html');
  } catch (error) {
    showError(apiError(error, 'Could not authenticate.'));
  } finally {
    button.disabled = false;
  }
});
