const chatPanel = document.getElementById('chatPanel');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const voiceBtn = document.getElementById('voiceBtn');
const speakBtn = document.getElementById('speakBtn');
const clearBtn = document.getElementById('clearBtn');

const storageKey = 'pocket-ai-history';
let isListening = false;
let recognition = null;
let messages = loadMessages();

function loadMessages() {
  const saved = localStorage.getItem(storageKey);
  try {
    const parsed = JSON.parse(saved || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMessages() {
  localStorage.setItem(storageKey, JSON.stringify(messages));
}

function createMessage(role, content) {
  const row = document.createElement('div');
  row.className = `message ${role}`;

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = content;

  row.appendChild(bubble);
  chatPanel.appendChild(row);
}

function renderMessages() {
  chatPanel.innerHTML = '';
  messages.forEach(({ role, content }) => createMessage(role, content));
  chatPanel.scrollTop = chatPanel.scrollHeight;
}

function appendMessage(role, content) {
  messages.push({ role, content });
  saveMessages();
  renderMessages();
}

async function sendMessage(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  appendMessage('user', trimmed);
  userInput.value = '';
  autoResize();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.map(({ role, content }) => ({ role, content })),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Request failed');
    }

    const data = await response.json();
    const reply = data?.content || 'I did not get a useful response.';
    appendMessage('assistant', reply);
  } catch (error) {
    appendMessage('assistant', 'I could not reach the AI service. Please check your API key and server status.');
    console.error(error);
  }
}

chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = userInput.value;
  await sendMessage(text);
});

function autoResize() {
  userInput.style.height = 'auto';
  userInput.style.height = `${Math.min(userInput.scrollHeight, 160)}px`;
}

userInput.addEventListener('input', autoResize);

clearBtn.addEventListener('click', () => {
  messages = [];
  saveMessages();
  renderMessages();
});

function initVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    voiceBtn.disabled = true;
    voiceBtn.title = 'Voice input is not supported in this browser';
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onstart = () => {
    isListening = true;
    voiceBtn.textContent = '⏹️';
    voiceBtn.setAttribute('aria-label', 'Stop voice input');
  };

  recognition.onend = () => {
    isListening = false;
    voiceBtn.textContent = '🎙️';
    voiceBtn.setAttribute('aria-label', 'Start voice input');
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((result) => result[0].transcript)
      .join(' ');

    userInput.value = transcript;
    autoResize();
  };

  recognition.onerror = () => {
    isListening = false;
    voiceBtn.textContent = '🎙️';
  };

  voiceBtn.addEventListener('click', () => {
    if (isListening) {
      recognition.stop();
      return;
    }
    recognition.start();
  });
}

function speakLastResponse() {
  const lastAssistantMessage = [...messages].reverse().find((entry) => entry.role === 'assistant');
  if (!lastAssistantMessage || !('speechSynthesis' in window)) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(lastAssistantMessage.content);
  utterance.lang = 'en-US';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

speakBtn.addEventListener('click', speakLastResponse);

if (messages.length === 0) {
  messages.push({
    role: 'assistant',
    content: 'Hi! I am your Pocket AI. Ask me anything and I will answer in the browser.',
  });
  saveMessages();
}

renderMessages();
autoResize();
initVoiceInput();
