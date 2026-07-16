import api from './services/api.js';

// Clean Scroll Animation Logic & Intersection Observers for Reveal Animations

const TOTAL_FRAMES = 240;
const images = [];
let loadedCount = 0;

// DOM elements
const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d');
const loader = document.getElementById('loader');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const scrollWrapper = document.getElementById('scroll-wrapper');

// Animation state
let targetFrame = 0;
let currentFrame = 0;

// 1. Preload frame images
function preloadImages() {
  return new Promise((resolve) => {
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(3, '0');
      img.src = `/Frame/ezgif-frame-${frameNum}.jpg`;
      
      img.onload = () => {
        loadedCount++;
        const percent = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
        progressBar.style.width = `${percent}%`;
        progressText.innerText = `${percent}% Loaded`;
        
        if (loadedCount === TOTAL_FRAMES) {
          onLoadingComplete();
          resolve();
        }
      };
      
      img.onerror = () => {
        console.error(`Error loading frame: ${frameNum}`);
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) {
          onLoadingComplete();
          resolve();
        }
      };
      
      images.push(img);
    }
  });
}

function onLoadingComplete() {
  loader.classList.add('loaded');
  
  // Set initial canvas size & draw first frame
  resizeCanvas();
  drawFrame(0);
  
  // Initialize scroll position check
  handleScroll();
  
  // Start the tick rendering loop
  requestAnimationFrame(tick);
  
  // Initialize Intersection Observer for reveal sections
  initRevealObserver();
}

// 2. Responsive Canvas drawing (Cover aspect ratio)
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.scale(dpr, dpr);
  
  // Redraw current frame
  drawFrame(Math.floor(currentFrame));
}

function drawFrame(index) {
  const img = images[index];
  if (!img || !img.complete) return;
  
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  
  const canvasRatio = window.innerWidth / window.innerHeight;
  const imageRatio = img.width / img.height;
  
  let drawWidth, drawHeight, x, y;
  
  // Fit viewport and crop extra width/height (cover behavior)
  if (canvasRatio > imageRatio) {
    drawWidth = window.innerWidth;
    drawHeight = window.innerWidth / imageRatio;
    x = 0;
    y = (window.innerHeight - drawHeight) / 2;
  } else {
    drawWidth = window.innerHeight * imageRatio;
    drawHeight = window.innerHeight;
    x = (window.innerWidth - drawWidth) / 2;
    y = 0;
  }
  
  ctx.drawImage(img, x, y, drawWidth, drawHeight);
}

// 3. Tick Rendering loop (RequestAnimationFrame with Smooth Lerp)
function tick() {
  const diff = targetFrame - currentFrame;
  
  if (Math.abs(diff) > 0.01) {
    currentFrame += diff * 0.07; // Smooth catchup speed
    const frameIndex = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.floor(currentFrame)));
    drawFrame(frameIndex);
  }
  
  requestAnimationFrame(tick);
}

// 4. Scroll Tracking Logic
function handleScroll() {
  if (!scrollWrapper) return;
  
  const rect = scrollWrapper.getBoundingClientRect();
  const scrollWrapperTop = window.scrollY + rect.top; // normally 0
  const scrollRange = scrollWrapper.scrollHeight - window.innerHeight;
  
  if (scrollRange <= 0) return;
  
  // Calculate relative progress inside Section 1 (scroll-wrapper)
  const relativeScroll = window.scrollY - scrollWrapperTop;
  let scrollFraction = relativeScroll / scrollRange;
  
  // Clamp progress from 0.0 to 1.0
  scrollFraction = Math.max(0, Math.min(1, scrollFraction));
  
  // Map progress to target frame index
  targetFrame = scrollFraction * (TOTAL_FRAMES - 1);

  revealVisibleSections();
}

// 5. Intersection Observer for Smooth Reveal Animations
function initRevealObserver() {
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -5% 0px',
    threshold: 0.01
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-active');
      }
    });
  }, observerOptions);
  
  document.querySelectorAll('.reveal-section').forEach(section => {
    observer.observe(section);
  });

  revealVisibleSections();
}

function revealVisibleSections() {
  document.querySelectorAll('.reveal-section:not(.reveal-active)').forEach(section => {
    const rect = section.getBoundingClientRect();
    const triggerLine = window.innerHeight * 0.9;

    if (rect.top < triggerLine) {
      section.classList.add('reveal-active');
    }
  });
}

// 6. Event Listeners
if (window.location.pathname === '/') {
  window.addEventListener('scroll', handleScroll);
  window.addEventListener('resize', resizeCanvas);
  preloadImages();
}

const route = window.location.pathname.replace(/\/$/, '') || '/';
const apiError = (error, fallback) => error.response?.data?.message || error.message || fallback;
let activeChatId = null;

function showError(message = '') { document.getElementById('app-error').textContent = message; }
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
  container.replaceChildren();
  if (!messages.length) container.innerHTML = '<div class="empty-state">What would you like to explore?</div>';
  messages.forEach(({ role, text }) => {
    const item = document.createElement('article'); item.className = `message ${role}`;
    item.textContent = role === 'model' ? cleanAiText(text) : text; container.append(item);
  });
  container.scrollTop = container.scrollHeight;
}
function renderChatList(chats) {
  const list = document.getElementById('chat-list'); list.replaceChildren();
  chats.forEach((chat) => {
    const item = document.createElement('div'); item.className = `chat-item${chat._id === activeChatId ? ' active' : ''}`;
    const title = document.createElement('button'); title.className = 'chat-item-title'; title.textContent = chat.title; title.onclick = () => loadChat(chat._id);
    const actions = document.createElement('div'); actions.className = 'chat-actions';
    actions.append(
      actionButton(chat.pinned ? 'keep' : 'push_pin', chat.pinned ? 'Unpin chat' : 'Pin chat', () => togglePin(chat._id)),
      actionButton('edit', 'Rename chat', () => renameChat(chat)),
      actionButton('delete', 'Delete chat', () => deleteChat(chat)),
    );
    item.append(title, actions); list.append(item);
  });
}
function actionButton(icon, label, onClick) {
  const button = document.createElement('button'); button.className = 'chat-action material-symbols-outlined'; button.textContent = icon; button.title = label; button.setAttribute('aria-label', label); button.onclick = onClick; return button;
}
async function loadChats() {
  const { data } = await api.get('/chats'); renderChatList(data);
}
async function loadChat(id) {
  try {
    const { data } = await api.get(`/chats/${id}`); activeChatId = id;
    document.getElementById('chat-title').textContent = data.title;
    renderMessages(data.messages); await loadChats();
  } catch (error) { showError(apiError(error, 'Could not load this chat.')); }
}
async function createChat() {
  try { const { data } = await api.post('/chats'); await loadChat(data._id); }
  catch (error) { showError(apiError(error, 'Could not create a chat.')); }
}
async function renameChat(chat) {
  const title = window.prompt('Rename conversation', chat.title)?.trim();
  if (!title || title === chat.title) return;
  try { await api.patch(`/chats/${chat._id}`, { title }); if (activeChatId === chat._id) document.getElementById('chat-title').textContent = title; await loadChats(); }
  catch (error) { showError(apiError(error, 'Could not rename this chat.')); }
}
async function togglePin(id) {
  try { await api.patch(`/chats/${id}/pin`); await loadChats(); }
  catch (error) { showError(apiError(error, 'Could not update this pin.')); }
}
async function deleteChat(chat) {
  if (!window.confirm(`Delete “${chat.title}”? This cannot be undone.`)) return;
  try {
    await api.delete(`/chats/${chat._id}`);
    if (activeChatId === chat._id) { activeChatId = null; document.getElementById('chat-title').textContent = 'New conversation'; renderMessages(); await createChat(); }
    else await loadChats();
  } catch (error) { showError(apiError(error, 'Could not delete this chat.')); }
}
function replaceWithPage(html) {
  document.getElementById('loader').hidden = true;
  document.querySelector('main').hidden = true;
  const page = document.createElement('div'); page.id = 'app-shell'; page.innerHTML = html; document.body.append(page);
}
function renderAuthPage(mode) {
  const signup = mode === 'signup';
  replaceWithPage(`<main class="auth-page"><a class="wordmark" href="/">NEUROVERSE AI</a><section class="auth-card"><p class="eyebrow">${signup ? 'CREATE ACCOUNT' : 'WELCOME BACK'}</p><h1>${signup ? 'Start your AI journey' : 'Sign in to NeuroVerse'}</h1><p class="auth-intro">${signup ? 'Create an account to save and continue your conversations.' : 'Enter your details to continue your conversations.'}</p><p id="app-error" class="app-error" role="alert"></p><form id="auth-form">${signup ? '<label>Name<input name="name" autocomplete="name" required /></label>' : ''}<label>Email<input name="email" type="email" autocomplete="off" autocapitalize="none" spellcheck="false" required /></label><label>Password<span class="password-control"><input id="password" name="password" type="password" autocomplete="${signup ? 'new-password' : 'current-password'}" minlength="6" required /><button id="toggle-password" class="password-toggle material-symbols-outlined" type="button" aria-label="Show password" title="Show password">visibility</button></span></label><button class="primary-button" id="auth-submit" type="submit">${signup ? 'Create account' : 'Sign in'}</button></form><p class="auth-switch">${signup ? 'Already have an account? <a href="/login">Sign in</a>' : 'New to NeuroVerse? <a href="/signup">Create an account</a>'}</p></section></main>`);
  document.getElementById('toggle-password').addEventListener('click', () => {
    const input = document.getElementById('password'); const show = input.type === 'password'; input.type = show ? 'text' : 'password';
    const button = document.getElementById('toggle-password'); button.textContent = show ? 'visibility_off' : 'visibility'; button.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); button.title = button.getAttribute('aria-label');
  });
  document.getElementById('auth-form').addEventListener('submit', async (event) => {
    event.preventDefault(); showError(); const button = document.getElementById('auth-submit'); button.disabled = true;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try { const { data } = await api.post(`/auth/${mode}`, values); localStorage.setItem('token', data.token); window.location.assign('/chat'); }
    catch (error) { showError(apiError(error, 'Could not authenticate.')); }
    finally { button.disabled = false; }
  });
}
function renderChatPage() {
  if (!localStorage.getItem('token')) { window.location.replace('/login'); return; }
  replaceWithPage(`<main class="chat-page"><aside class="chat-sidebar"><div class="sidebar-brand"><a class="wordmark" href="/">NEUROVERSE</a><button id="close-sidebar" class="sidebar-toggle material-symbols-outlined" aria-label="Close sidebar" title="Close sidebar">left_panel_close</button></div><button id="new-chat" class="primary-button">+ New conversation</button><p class="sidebar-label">RECENT CHATS</p><div id="chat-list" class="chat-list"></div><button id="logout" class="text-button">Sign out</button></aside><section class="chat-main"><header class="chat-header"><button id="open-sidebar" class="sidebar-toggle material-symbols-outlined" aria-label="Open sidebar" title="Open sidebar">left_panel_open</button><div><p class="eyebrow">AI ASSISTANT</p><h1 id="chat-title">New conversation</h1></div><p id="app-error" class="app-error" role="alert"></p></header><div id="messages" class="messages"><div class="empty-state"><span class="material-symbols-outlined">auto_awesome</span><h2>How can I help today?</h2><p>Ask anything, brainstorm ideas, or explore a new subject.</p></div></div><form id="message-form" class="message-form"><input id="message-input" placeholder="Message NeuroVerse AI" autocomplete="off" required /><button class="primary-button" type="submit">Send <span aria-hidden="true">→</span></button></form></section></main>`);
  document.getElementById('new-chat').addEventListener('click', createChat);
  document.getElementById('logout').addEventListener('click', () => { localStorage.removeItem('token'); window.location.assign('/'); });
  document.getElementById('close-sidebar').addEventListener('click', () => document.querySelector('.chat-page').classList.add('sidebar-collapsed'));
  document.getElementById('open-sidebar').addEventListener('click', () => document.querySelector('.chat-page').classList.remove('sidebar-collapsed'));
  document.getElementById('message-form').addEventListener('submit', sendMessage);
  loadChats().then(createChat).catch((error) => showError(apiError(error, 'Could not connect to the server.')));
}

async function sendMessage(event) {
  event.preventDefault(); const input = document.getElementById('message-input'); const text = input.value.trim(); if (!text || !activeChatId) return;
  input.value = ''; input.disabled = true;
  const messages = document.getElementById('messages'); const pending = document.createElement('article'); pending.className = 'message user'; pending.textContent = text; messages.append(pending); messages.scrollTop = messages.scrollHeight;
  try {
    const { data } = await api.post(`/chats/${activeChatId}/messages`, { text }); document.getElementById('chat-title').textContent = data.title; renderMessages(data.messages); await loadChats();
  }
  catch (error) { pending.remove(); showError(apiError(error, 'Message could not be sent.')); }
  finally { input.disabled = false; input.focus(); }
}

if (route === '/login') renderAuthPage('login');
else if (route === '/signup') renderAuthPage('signup');
else if (route === '/chat') renderChatPage();
