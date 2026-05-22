/* =========================================================
   Coach AI — chat module
   Streaming SSE da /api/chat, persistenza localStorage,
   markdown leggero, scroll smart, anti-spam.
   ========================================================= */

const STORAGE_KEY = 'apex.chat.history.v1';
const API_KEY = 'apex.chat.apikey.v1';
const MAX_HISTORY = 20;

const els = {
  root:        document.getElementById('chat'),
  fab:         document.getElementById('chatFab'),
  panel:       document.getElementById('chatPanel'),
  close:       document.getElementById('chatClose'),
  clear:       document.getElementById('chatClear'),
  keyBtn:      document.getElementById('chatKey'),
  msgs:        document.getElementById('chatMsgs'),
  form:        document.getElementById('chatForm'),
  input:       document.getElementById('chatInput'),
  send:        document.getElementById('chatSend'),
  status:      document.getElementById('chatStatus'),
  suggestions: document.getElementById('chatSuggestions'),
  // key modal
  keyModal:    document.getElementById('keyModal'),
  keyInput:    document.getElementById('keyInput'),
  keyToggle:   document.getElementById('keyToggle'),
  keySave:     document.getElementById('keySave'),
  keyForget:   document.getElementById('keyForget'),
};

let history = loadHistory();
let isStreaming = false;
let aborter = null;
let serverHasKey = false;

// ---------- helpers ----------
function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.slice(-MAX_HISTORY);
  } catch { return []; }
}
function saveHistory() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-MAX_HISTORY))); }
  catch {}
}
function escapeHTML(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function renderMarkdownLight(raw) {
  let s = escapeHTML(raw);
  s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  const lines = s.split('\n');
  const out = [];
  let inList = false;
  let listType = null;

  for (const line of lines) {
    const bulletMatch = line.match(/^\s*[-*]\s+(.*)$/);
    const numMatch = line.match(/^\s*\d+\.\s+(.*)$/);
    if (bulletMatch || numMatch) {
      const t = bulletMatch ? 'ul' : 'ol';
      if (!inList || listType !== t) {
        if (inList) out.push(`</${listType}>`);
        out.push(`<${t}>`);
        inList = true;
        listType = t;
      }
      out.push(`<li>${(bulletMatch || numMatch)[1]}</li>`);
    } else {
      if (inList) { out.push(`</${listType}>`); inList = false; listType = null; }
      out.push(line);
    }
  }
  if (inList) out.push(`</${listType}>`);
  return out.join('\n').replace(/\n{2,}/g, '<br><br>').replace(/\n/g, '<br>');
}

// ---------- DOM build ----------
const ASSISTANT_AVATAR = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 L 21 20 L 3 20 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 9 L 17 18 L 7 18 Z" fill="currentColor"/></svg>`;
const USER_AVATAR      = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="9" r="4" fill="currentColor"/><path d="M4 21 q 8 -10 16 0" fill="currentColor"/></svg>`;

function mkMessageEl(role, html) {
  const el = document.createElement('div');
  el.className = `msg msg--${role}`;
  el.innerHTML = `
    <div class="msg__avatar">${role === 'user' ? USER_AVATAR : ASSISTANT_AVATAR}</div>
    <div class="msg__bubble">${html}</div>
  `;
  return el;
}

function appendMessage(role, content, opts = {}) {
  const html = opts.raw ? content : renderMarkdownLight(content);
  const el = mkMessageEl(role, html);
  els.msgs.appendChild(el);
  scrollToBottom();
  return el;
}

function appendTyping() {
  const el = mkMessageEl('assistant', `<span class="msg__typing"><span></span><span></span><span></span></span>`);
  el.dataset.typing = '1';
  els.msgs.appendChild(el);
  scrollToBottom();
  return el;
}

function scrollToBottom(force = false) {
  const distFromBottom = els.msgs.scrollHeight - els.msgs.scrollTop - els.msgs.clientHeight;
  if (force || distFromBottom < 120) {
    requestAnimationFrame(() => {
      els.msgs.scrollTop = els.msgs.scrollHeight;
    });
  }
}

function renderHistory() {
  els.msgs.innerHTML = '';
  if (history.length === 0) {
    appendMessage('assistant',
`Ciao! Sono **Coach AI** di APEX. Posso aiutarti con allenamento, nutrizione, scelta del programma o prenotazioni.

Da dove vuoi partire?`);
    return;
  }
  for (const m of history) appendMessage(m.role, m.content);
}

function updateSuggestions() {
  const empty = history.length === 0;
  els.suggestions.classList.toggle('is-hidden', !empty);
}

function setStreaming(on) {
  isStreaming = on;
  els.send.disabled = on;
  els.input.disabled = on;
  els.status.textContent = on
    ? 'sta scrivendo…'
    : 'online · risponde in tempo reale';
}

// ---------- open / close ----------
let isOpen = false;
function openChat() {
  if (isOpen) return;
  isOpen = true;
  els.root.classList.add('is-open');
  els.fab.setAttribute('aria-expanded', 'true');
  els.panel.setAttribute('aria-hidden', 'false');
  setTimeout(() => els.input.focus(), 250);
}
function closeChat() {
  if (!isOpen) return;
  isOpen = false;
  els.root.classList.remove('is-open');
  els.fab.setAttribute('aria-expanded', 'false');
  els.panel.setAttribute('aria-hidden', 'true');
  if (aborter) { aborter.abort(); aborter = null; setStreaming(false); }
}
export function toggleChat() { isOpen ? closeChat() : openChat(); }
export function openChatPublic() { openChat(); }

// ---------- send ----------
async function send(text) {
  if (!text || isStreaming) return;
  text = text.trim();
  if (!text) return;

  appendMessage('user', text);
  history.push({ role: 'user', content: text });
  saveHistory();
  updateSuggestions();

  els.input.value = '';
  autoResize();

  const typing = appendTyping();
  setStreaming(true);

  aborter = new AbortController();

  try {
    const headers = { 'Content-Type': 'application/json' };
    const userKey = getKey();
    if (userKey && !serverHasKey) headers['X-API-Key'] = userKey;

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages: history.slice(-MAX_HISTORY) }),
      signal: aborter.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      let msg = `Errore ${res.status}`;
      try { msg = JSON.parse(errText).error || msg; } catch {}
      typing.remove();
      if (res.status === 401) {
        appendMessage('assistant',
          `🔑 Per chattare con me serve una API key Anthropic.\n\nClicca l'icona 🔑 qui in alto e incollala — la salvo solo nel tuo browser.`);
        openKeyModal();
      } else {
        appendMessage('assistant', `⚠ **${msg}**`);
      }
      setStreaming(false);
      return;
    }

    typing.remove();
    const bubbleEl = mkMessageEl('assistant', '<span class="msg__cursor"></span>');
    const bubble = bubbleEl.querySelector('.msg__bubble');
    els.msgs.appendChild(bubbleEl);
    scrollToBottom(true);

    let acc = '';
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let done = false;
    let lastEvent = '';

    while (!done) {
      const { value, done: d } = await reader.read();
      done = d;
      if (value) {
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('event:')) {
            lastEvent = line.slice(6).trim();
            continue;
          }
          if (line.startsWith('data:')) {
            const payload = line.slice(5).trim();
            if (!payload) continue;
            try {
              const data = JSON.parse(payload);
              if (lastEvent === 'delta' && data.text) {
                acc += data.text;
                bubble.innerHTML = renderMarkdownLight(acc) + '<span class="msg__cursor"></span>';
                scrollToBottom();
              } else if (lastEvent === 'error') {
                bubble.innerHTML = `⚠ ${escapeHTML(data.message || 'Errore inatteso')}`;
              } else if (lastEvent === 'done') {
                bubble.innerHTML = renderMarkdownLight(acc);
              }
            } catch {}
          }
        }
      }
    }

    bubble.innerHTML = renderMarkdownLight(acc);
    history.push({ role: 'assistant', content: acc });
    saveHistory();
  } catch (err) {
    typing.remove();
    if (err.name !== 'AbortError') {
      appendMessage('assistant',
        `⚠ **Connessione interrotta.** Riprova tra un istante.

Se il problema persiste, controlla la connessione e l'API key del server.`);
    }
  } finally {
    aborter = null;
    setStreaming(false);
    els.input.focus();
  }
}

// ---------- input UX ----------
function autoResize() {
  els.input.style.height = 'auto';
  els.input.style.height = Math.min(140, els.input.scrollHeight) + 'px';
}

// ---------- API KEY MODAL ----------
function getKey() {
  try { return localStorage.getItem(API_KEY) || ''; } catch { return ''; }
}
function setKey(v) {
  try {
    if (v) localStorage.setItem(API_KEY, v);
    else   localStorage.removeItem(API_KEY);
  } catch {}
}
function openKeyModal() {
  if (!els.keyModal) return;
  els.keyInput.value = getKey();
  els.keyForget.hidden = !getKey();
  els.keyModal.classList.add('is-open');
  els.keyModal.setAttribute('aria-hidden', 'false');
  setTimeout(() => els.keyInput.focus(), 200);
}
function closeKeyModal() {
  els.keyModal.classList.remove('is-open');
  els.keyModal.setAttribute('aria-hidden', 'true');
}
function refreshKeyStatus() {
  const hasUser = !!getKey();
  if (serverHasKey || hasUser) {
    els.status.textContent = serverHasKey
      ? 'online · risponde in tempo reale'
      : 'pronto · usa la tua API key';
  } else {
    els.status.innerHTML = '🔑 imposta una API key per chattare';
  }
}

// ---------- wire up ----------
function init() {
  if (!els.root) return;

  renderHistory();
  updateSuggestions();

  els.fab.addEventListener('click', toggleChat);
  els.close.addEventListener('click', closeChat);

  els.keyBtn?.addEventListener('click', openKeyModal);
  els.keyModal?.querySelectorAll('[data-close]').forEach(b => {
    b.addEventListener('click', closeKeyModal);
  });
  els.keyToggle?.addEventListener('click', () => {
    els.keyInput.type = els.keyInput.type === 'password' ? 'text' : 'password';
  });
  els.keySave?.addEventListener('click', () => {
    const v = els.keyInput.value.trim();
    if (!v || !/^sk-ant-/.test(v)) {
      els.keyInput.style.borderColor = 'var(--danger)';
      els.keyInput.focus();
      setTimeout(() => { els.keyInput.style.borderColor = ''; }, 1200);
      return;
    }
    setKey(v);
    closeKeyModal();
    refreshKeyStatus();
    window.apex?.toast?.('🔑 Chiave salvata. Sono pronto.', { variant: 'success' });
  });
  els.keyForget?.addEventListener('click', () => {
    setKey('');
    els.keyInput.value = '';
    els.keyForget.hidden = true;
    refreshKeyStatus();
    window.apex?.toast?.('Chiave dimenticata', {});
  });

  els.clear.addEventListener('click', () => {
    if (history.length === 0) return;
    if (!confirm('Vuoi davvero iniziare una nuova conversazione?')) return;
    history = [];
    saveHistory();
    renderHistory();
    updateSuggestions();
  });

  els.form.addEventListener('submit', (e) => {
    e.preventDefault();
    send(els.input.value);
  });

  els.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(els.input.value);
    }
  });

  els.input.addEventListener('input', autoResize);

  els.suggestions.addEventListener('click', (e) => {
    const btn = e.target.closest('.suggestion');
    if (!btn) return;
    const prompt = btn.dataset.prompt;
    if (prompt) send(prompt);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeChat();
  });

  // Health check non bloccante: aggiorna stato in base a key server/client
  fetch('/api/health').then(r => r.json()).then((data) => {
    serverHasKey = !!data.aiReady;
    refreshKeyStatus();
  }).catch(() => { refreshKeyStatus(); });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

window.apexChat = { open: openChatPublic, close: closeChat, toggle: toggleChat, send };
