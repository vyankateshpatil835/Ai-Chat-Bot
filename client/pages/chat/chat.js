import api from '../../services/api.js';
import './chat.css';

const apiError = (error, fallback) => error.response?.data?.message || error.message || fallback;
let activeChatId = null;

function showError(message = '') {
  const errorEl = document.getElementById('app-error');
  if (errorEl) errorEl.textContent = message;
}

function cleanAiText(text) {
  return text
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`{1,3}/g, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .trim();
}

function renderMessages(messages = []) {
  const container = document.getElementById('messages');
  if (!container) return;

  container.replaceChildren();
  if (!messages.length) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-outlined">auto_awesome</span>
        <h2>How can I help today?</h2>
        <p>Ask anything, brainstorm ideas, or explore a new subject.</p>
      </div>`;
  }

  messages.forEach(({ role, text }) => {
    const item = document.createElement('article');
    item.className = `message ${role}`;
    item.textContent = role === 'model' ? cleanAiText(text) : text;
    container.append(item);
  });
  container.scrollTop = container.scrollHeight;
}

function renderChatList(chats) {
  const list = document.getElementById('chat-list');
  if (!list) return;

  list.replaceChildren();
  chats.forEach((chat) => {
    const item = document.createElement('div');
    item.className = `chat-item${chat._id === activeChatId ? ' active' : ''}${chat.pinned ? ' pinned' : ''}`;

    const title = document.createElement('button');
    title.className = 'chat-item-title';
    title.textContent = chat.title;
    title.onclick = () => loadChat(chat._id);

    const actions = document.createElement('div');
    actions.className = 'chat-actions';
    actions.append(
      actionButton(chat.pinned ? 'keep' : 'push_pin', chat.pinned ? 'Unpin chat' : 'Pin chat', () => togglePin(chat._id)),
      actionButton('edit', 'Rename chat', () => renameChat(chat)),
      actionButton('delete', 'Delete chat', () => deleteChat(chat)),
    );

    item.append(title, actions);
    list.append(item);
  });
}

function actionButton(icon, label, onClick) {
  const button = document.createElement('button');
  button.className = 'chat-action material-symbols-outlined';
  button.textContent = icon;
  button.title = label;
  button.setAttribute('aria-label', label);
  button.onclick = onClick;
  return button;
}


async function loadChats() {
  const { data } = await api.get('/chats');
  renderChatList(data);
}

async function loadChat(id) {
  try {
    const { data } = await api.get(`/chats/${id}`);
    activeChatId = id;
    document.getElementById('chat-title').textContent = data.title;
    renderMessages(data.messages);
    await loadChats();
  } catch (error) {
    showError(apiError(error, 'Could not load this chat.'));
  }
}

async function createChat() {
  try {
    const { data } = await api.post('/chats');
    await loadChat(data._id);
  } catch (error) {
    showError(apiError(error, 'Could not create a chat.'));
  }
}

async function renameChat(chat) {
  const title = window.prompt('Rename conversation', chat.title)?.trim();
  if (!title || title === chat.title) return;
  try {
    await api.patch(`/chats/${chat._id}`, { title });
    if (activeChatId === chat._id) {
      document.getElementById('chat-title').textContent = title;
    }
    await loadChats();
  } catch (error) {
    showError(apiError(error, 'Could not rename this chat.'));
  }
}

async function togglePin(id) {
  try {
    await api.patch(`/chats/${id}/pin`);
    await loadChats();
  } catch (error) {
    showError(apiError(error, 'Could not update this pin.'));
  }
}

async function deleteChat(chat) {
  if (!window.confirm(`Delete “${chat.title}”? This cannot be undone.`)) return;
  try {
    await api.delete(`/chats/${chat._id}`);
    if (activeChatId === chat._id) {
      activeChatId = null;
      document.getElementById('chat-title').textContent = 'New conversation';
      renderMessages();
      // await createChat();
    } else {
      await loadChats();
    }
  } catch (error) {
    showError(apiError(error, 'Could not delete this chat.'));
  }
}

async function sendMessage(event) {
  event.preventDefault();
  const input = document.getElementById('message-input');
  const text = input.value.trim();
  if (!text || !activeChatId) return;

  input.value = '';
  input.disabled = true;

  const messagesContainer = document.getElementById('messages');
  const pending = document.createElement('article');
  pending.className = 'message user';
  pending.textContent = text;
  messagesContainer.append(pending);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  try {
    const { data } = await api.post(`/chats/${activeChatId}/messages`, { text });
    document.getElementById('chat-title').textContent = data.title;
    renderMessages(data.messages);
    await loadChats();
  } catch (error) {
    pending.remove();
    showError(apiError(error, 'Message could not be sent.'));
  } finally {
    input.disabled = false;
    input.focus();
  }
}

// Initialization Logic
function init() {
  if (!localStorage.getItem('token')) {
    window.location.replace('/pages/auth/login.html');
    return;
  }

  document.getElementById('new-chat').addEventListener('click', createChat);

  document.getElementById('logout').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.assign('/');
  });

  document.getElementById('close-sidebar').addEventListener('click', () => {
    document.querySelector('.chat-page').classList.add('sidebar-collapsed');
    document.getElementById('open-sidebar').toggleAttribute('hidden')
  });

  document.getElementById('open-sidebar').addEventListener('click', () => {
    document.querySelector('.chat-page').classList.remove('sidebar-collapsed');
    document.getElementById('open-sidebar').toggleAttribute('hidden')
  });

  document.getElementById('message-form').addEventListener('submit', sendMessage);

  loadChats().catch((error) => showError(apiError(error, 'Could not connect to the server.')));
}

// Run on page load
init();
