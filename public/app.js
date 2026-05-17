// ╔══════════════════════════════════════════════════════════════╗
// ║     SAVOIRÉ AI v2.1 - FRONTEND APPLICATION LOGIC             ║
// ║              Think Less, Know More                            ║
// ╚══════════════════════════════════════════════════════════════╝

// === Global State ===
const APP_STATE = {
  userName: '',
  selectedTool: null,
  selectedDepth: 3,
  selectedLanguage: 'English',
  topic: '',
  currentStep: 1,
  isStreaming: false,
  currentContent: '',
  streak: 0,
  sessions: [],
  settings: {
    streamEnabled: true,
    fontSize: 'medium',
    animationsEnabled: true
  },
  quizState: { currentQuestion: 0, score: 0, answers: [] },
  flashcardState: { currentCard: 0, cards: [] }
};

// === DOM Element References ===
const DOM = {
  app: () => document.getElementById('savoire-app'),
  cursor: () => document.getElementById('savoire-cursor'),
  cursorDot: () => document.getElementById('savoire-cursor-dot'),
  header: () => document.getElementById('savoire-header'),
  logo: () => document.getElementById('savoire-logo'),
  brand: () => document.getElementById('savoire-brand'),
  profileBtn: () => document.getElementById('savoire-profile-btn'),
  profileName: () => document.getElementById('savoire-profile-name'),
  profileAvatar: () => document.getElementById('savoire-profile-avatar'),
  
  // Wizard
  wizardContainer: () => document.getElementById('wizard-container'),
  step1: () => document.getElementById('wizard-step-1'),
  step2: () => document.getElementById('wizard-step-2'),
  step3: () => document.getElementById('wizard-step-3'),
  step4: () => document.getElementById('wizard-step-4'),
  step5: () => document.getElementById('wizard-step-5'),
  stepDots: () => document.querySelectorAll('.wizard-step-dot'),
  stepLabel: () => document.getElementById('wizard-step-label'),
  
  // Tool Selection
  toolCards: () => document.querySelectorAll('.tool-card'),
  
  // Topic Input
  topicInput: () => document.getElementById('topic-input'),
  topicSubmitBtn: () => document.getElementById('topic-submit-btn'),
  
  // Depth Selection
  depthOptions: () => document.querySelectorAll('.depth-option'),
  
  // Language
  languageSearch: () => document.getElementById('language-search'),
  languageGrid: () => document.getElementById('language-grid'),
  
  // Confirm
  confirmSummary: () => document.getElementById('confirm-summary'),
  generateBtn: () => document.getElementById('generate-btn'),
  
  // Output
  outputContainer: () => document.getElementById('output-container'),
  outputTopicDisplay: () => document.getElementById('output-topic-display'),
  outputMeta: () => document.getElementById('output-meta'),
  streamingContent: () => document.getElementById('streaming-content'),
  streamingOutputBox: () => document.getElementById('streaming-output-box'),
  progressBarInner: () => document.getElementById('progress-bar-inner'),
  progressStats: () => document.getElementById('progress-stats'),
  
  // Actions
  copyBtn: () => document.getElementById('copy-btn'),
  downloadPdfBtn: () => document.getElementById('download-pdf-btn'),
  newSearchBtn: () => document.getElementById('new-search-btn'),
  
  // Panels
  settingsPanel: () => document.getElementById('settings-panel'),
  settingsOverlay: () => document.getElementById('settings-overlay'),
  settingsCloseBtn: () => document.getElementById('settings-close-btn'),
  historyPanel: () => document.getElementById('history-panel'),
  historyOverlay: () => document.getElementById('history-overlay'),
  
  // Welcome
  welcomeOverlay: () => document.getElementById('welcome-popup-overlay'),
  welcomeNameInput: () => document.getElementById('welcome-name-input'),
  welcomeContinueBtn: () => document.getElementById('welcome-continue-btn'),
  
  // Streak
  streakCount: () => document.getElementById('streak-count'),
  
  // Special tool containers
  flashcardContainer: () => document.getElementById('flashcard-container'),
  quizContainer: () => document.getElementById('quiz-container'),
  mindmapContainer: () => document.getElementById('mindmap-container'),
  
  // Toast
  toastContainer: () => document.getElementById('toast-container')
};

// === 50+ Languages ===
const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
  { code: 'da', name: 'Danish', flag: '🇩🇰' },
  { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
  { code: 'el', name: 'Greek', flag: '🇬🇷' },
  { code: 'cs', name: 'Czech', flag: '🇨🇿' },
  { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
  { code: 'hu', name: 'Hungarian', flag: '🇭🇺' },
  { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'ms', name: 'Malay', flag: '🇲🇾' },
  { code: 'sw', name: 'Swahili', flag: '🇹🇿' },
  { code: 'tl', name: 'Tagalog', flag: '🇵🇭' },
  { code: 'fa', name: 'Persian', flag: '🇮🇷' },
  { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
  { code: 'hr', name: 'Croatian', flag: '🇭🇷' },
  { code: 'sr', name: 'Serbian', flag: '🇷🇸' },
  { code: 'sk', name: 'Slovak', flag: '🇸🇰' },
  { code: 'sl', name: 'Slovenian', flag: '🇸🇮' },
  { code: 'et', name: 'Estonian', flag: '🇪🇪' },
  { code: 'lv', name: 'Latvian', flag: '🇱🇻' },
  { code: 'lt', name: 'Lithuanian', flag: '🇱🇹' },
  { code: 'bg', name: 'Bulgarian', flag: '🇧🇬' },
  { code: 'sq', name: 'Albanian', flag: '🇦🇱' },
  { code: 'ka', name: 'Georgian', flag: '🇬🇪' },
  { code: 'hy', name: 'Armenian', flag: '🇦🇲' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
  { code: 'ne', name: 'Nepali', flag: '🇳🇵' },
  { code: 'si', name: 'Sinhala', flag: '🇱🇰' }
];

// === Tool Definitions ===
const TOOLS = [
  { id: 'notes', name: 'Notes', icon: '📖', desc: 'Structured notes' },
  { id: 'flash', name: 'Flash', icon: '🃏', desc: '3D flip cards' },
  { id: 'quiz', name: 'Quiz', icon: '❓', desc: 'MCQ with scoring' },
  { id: 'summ', name: 'Summ', icon: '📋', desc: 'TL;DR summary' },
  { id: 'mind', name: 'Mind', icon: '🗺️', desc: 'Mind map' },
  { id: 'prac', name: 'Prac', icon: '🎯', desc: 'Practice Q&A' },
  { id: 'tips', name: 'Tips', icon: '💡', desc: 'Study strategies' },
  { id: 'pdf', name: 'PDF', icon: '📄', desc: 'Download PDF' }
];

// === Initialization ===
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  loadUserData();
  initCustomCursor();
  initToolSelection();
  initDepthSelection();
  initLanguageGrid();
  initEventListeners();
  renderLanguageGrid();
  
  if (!APP_STATE.userName) {
    showWelcomePopup();
  } else {
    updateProfileDisplay();
    updateStreakDisplay();
    loadHistory();
  }
  
  // Show step 1
  showStep(1);
}

// === User Data Management ===
function loadUserData() {
  const stored = localStorage.getItem('savoire_user');
  if (stored) {
    const data = JSON.parse(stored);
    APP_STATE.userName = data.name || '';
    APP_STATE.streak = data.streak || 0;
    APP_STATE.sessions = data.sessions || [];
    APP_STATE.settings = { ...APP_STATE.settings, ...data.settings };
  }
}

function saveUserData() {
  localStorage.setItem('savoire_user', JSON.stringify({
    name: APP_STATE.userName,
    streak: APP_STATE.streak,
    sessions: APP_STATE.sessions.slice(-50),
    settings: APP_STATE.settings
  }));
}

function updateStreak() {
  const today = new Date().toDateString();
  const lastLogin = localStorage.getItem('savoire_last_login');
  
  if (lastLogin === today) return;
  
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (lastLogin === yesterday) {
    APP_STATE.streak++;
  } else {
    APP_STATE.streak = 1;
  }
  
  localStorage.setItem('savoire_last_login', today);
  saveUserData();
  updateStreakDisplay();
}

function updateStreakDisplay() {
  const el = DOM.streakCount();
  if (el) el.textContent = APP_STATE.streak;
}

function updateProfileDisplay() {
  const nameEl = DOM.profileName();
  const avatarEl = DOM.profileAvatar();
  if (nameEl) nameEl.textContent = APP_STATE.userName;
  if (avatarEl) avatarEl.textContent = APP_STATE.userName.charAt(0).toUpperCase();
}

// === Welcome Popup ===
function showWelcomePopup() {
  const overlay = DOM.welcomeOverlay();
  if (overlay) overlay.style.display = 'flex';
}

function hideWelcomePopup() {
  const overlay = DOM.welcomeOverlay();
  if (overlay) overlay.style.display = 'none';
}

function handleWelcomeContinue() {
  const input = DOM.welcomeNameInput();
  const name = input?.value.trim();
  if (!name) return showToast('Please enter your name', 'error');
  
  APP_STATE.userName = name;
  saveUserData();
  updateProfileDisplay();
  updateStreak();
  hideWelcomePopup();
  showToast(`Welcome, ${name}! 🎉`, 'success');
}

// === Custom Cursor ===
function initCustomCursor() {
  const cursor = DOM.cursor();
  const cursorDot = DOM.cursorDot();
  if (!cursor || !cursorDot) return;
  
  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX - 10 + 'px';
    cursor.style.top = e.clientY - 10 + 'px';
    cursorDot.style.left = e.clientX - 3 + 'px';
    cursorDot.style.top = e.clientY - 3 + 'px';
  });
  
  document.querySelectorAll('button, a, input, .tool-card, .depth-option, .language-option, .quiz-option, .flashcard, .history-item').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('hover');
      cursorDot.classList.add('hover');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('hover');
      cursorDot.classList.remove('hover');
    });
  });
}

// === Wizard Navigation ===
function showStep(step) {
  APP_STATE.currentStep = step;
  
  // Hide all steps
  [DOM.step1(), DOM.step2(), DOM.step3(), DOM.step4(), DOM.step5()].forEach(el => {
    if (el) el.style.display = 'none';
  });
  
  // Show current step
  const stepEl = document.getElementById(`wizard-step-${step}`);
  if (stepEl) stepEl.style.display = 'block';
  
  // Update dots
  DOM.stepDots().forEach((dot, i) => {
    dot.classList.remove('active', 'completed');
    if (i + 1 === step) dot.classList.add('active');
    if (i + 1 < step) dot.classList.add('completed');
  });
  
  // Update label
  const labels = ['', 'Select Tool', 'Enter Topic', 'Choose Depth', 'Select Language', 'Confirm & Generate'];
  const labelEl = DOM.stepLabel();
  if (labelEl) labelEl.textContent = `Step ${step}/5: ${labels[step]}`;
  
  // Scroll to wizard
  DOM.wizardContainer()?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// === Tool Selection ===
function initToolSelection() {
  DOM.toolCards().forEach(card => {
    card.addEventListener('click', () => {
      const toolId = card.dataset.tool;
      APP_STATE.selectedTool = toolId;
      
      DOM.toolCards().forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      
      setTimeout(() => showStep(2), 300);
    });
  });
}

// === Topic Input ===
function handleTopicSubmit() {
  const input = DOM.topicInput();
  const topic = input?.value.trim();
  if (!topic) return showToast('Please enter a topic', 'error');
  
  APP_STATE.topic = topic;
  showStep(3);
}

// === Depth Selection ===
function initDepthSelection() {
  DOM.depthOptions().forEach(option => {
    option.addEventListener('click', () => {
      APP_STATE.selectedDepth = parseInt(option.dataset.depth);
      
      DOM.depthOptions().forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
      
      setTimeout(() => showStep(4), 300);
    });
  });
}

// === Language Grid ===
function renderLanguageGrid(filter = '') {
  const grid = DOM.languageGrid();
  if (!grid) return;
  
  const filtered = LANGUAGES.filter(l => 
    l.name.toLowerCase().includes(filter.toLowerCase())
  );
  
  grid.innerHTML = filtered.map(lang => `
    <div class="language-option ${APP_STATE.selectedLanguage === lang.name ? 'selected' : ''}" 
         data-language="${lang.name}">
      ${lang.flag} ${lang.name}
    </div>
  `).join('');
  
  grid.querySelectorAll('.language-option').forEach(option => {
    option.addEventListener('click', () => {
      APP_STATE.selectedLanguage = option.dataset.language;
      grid.querySelectorAll('.language-option').forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
      setTimeout(() => showStep(5), 300);
    });
  });
}

function initLanguageGrid() {
  const search = DOM.languageSearch();
  if (search) {
    search.addEventListener('input', (e) => renderLanguageGrid(e.target.value));
  }
  renderLanguageGrid();
}

// === Confirm & Generate ===
function updateConfirmSummary() {
  const summary = DOM.confirmSummary();
  if (!summary) return;
  
  const toolName = TOOLS.find(t => t.id === APP_STATE.selectedTool)?.name || '-';
  const depthNames = ['', '📖 Overview', '📚 Basic', '🎯 Standard', '🔬 Advanced', '🏆 Expert'];
  
  summary.innerHTML = `
    <div class="confirm-row">
      <span class="confirm-label">Tool</span>
      <span class="confirm-value">${toolName}</span>
    </div>
    <div class="confirm-row">
      <span class="confirm-label">Topic</span>
      <span class="confirm-value">${APP_STATE.topic}</span>
    </div>
    <div class="confirm-row">
      <span class="confirm-label">Depth</span>
      <span class="confirm-value">${depthNames[APP_STATE.selectedDepth]}</span>
    </div>
    <div class="confirm-row">
      <span class="confirm-label">Language</span>
      <span class="confirm-value">${APP_STATE.selectedLanguage}</span>
    </div>
  `;
}

// Show step 5 with updated summary
const originalShowStep = showStep;
showStep = function(step) {
  originalShowStep(step);
  if (step === 5) updateConfirmSummary();
};

// === Generate Content ===
async function generateContent() {
  if (!APP_STATE.selectedTool || !APP_STATE.topic) {
    return showToast('Please complete all steps', 'error');
  }
  
  // Hide wizard, show output
  DOM.wizardContainer().style.display = 'none';
  DOM.outputContainer().style.display = 'block';
  DOM.outputTopicDisplay().textContent = `${APP_STATE.topic}`;
  DOM.outputMeta().innerHTML = `
    <span>Tool: ${TOOLS.find(t => t.id === APP_STATE.selectedTool)?.name}</span>
    <span>Depth: ${APP_STATE.selectedDepth}/5</span>
    <span>Lang: ${APP_STATE.selectedLanguage}</span>
  `;
  
  // Reset output
  DOM.streamingContent().innerHTML = '<span class="streaming-cursor"></span>';
  DOM.progressBarInner().style.width = '0%';
  DOM.progressStats().innerHTML = 'Words: 0 | Time: 0.0s | Progress: 0%';
  
  APP_STATE.isStreaming = true;
  DOM.generateBtn().disabled = true;
  
  // Reset tool-specific containers
  resetToolContainers();
  
  try {
    const response = await fetch('/api/study', {
        
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: APP_STATE.selectedTool,
        topic: APP_STATE.topic,
        depth: APP_STATE.selectedDepth,
        language: APP_STATE.selectedLanguage,
        stream: true
      })
    });
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';
    let wordCount = 0;
    const startTime = Date.now();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'word') {
              fullText += data.word;
              wordCount = data.wordCount;
              updateStreamingDisplay(fullText, wordCount, startTime);
            } else if (data.type === 'progress') {
              DOM.progressBarInner().style.width = data.progress + '%';
            } else if (data.type === 'complete') {
              fullText = data.fullText;
              wordCount = data.wordCount;
              finalizeContent(fullText, wordCount, startTime);
            } else if (data.type === 'error') {
              showToast('Generation error: ' + data.error, 'error');
            }
          } catch (e) {}
        }
      }
    }
  } catch (error) {
    showToast('Connection error. Please try again.', 'error');
  } finally {
    APP_STATE.isStreaming = false;
    DOM.generateBtn().disabled = false;
  }
}

function updateStreamingDisplay(text, wordCount, startTime) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const progress = Math.min(Math.round((wordCount / 500) * 100), 95);
  
  DOM.streamingContent().innerHTML = formatContent(text) + '<span class="streaming-cursor"></span>';
  DOM.progressBarInner().style.width = progress + '%';
  DOM.progressStats().innerHTML = `Words: ${wordCount} | Time: ${elapsed}s | Progress: ${progress}%`;
  
  // Auto-scroll
  DOM.streamingOutputBox().scrollTop = DOM.streamingOutputBox().scrollHeight;
}

function formatContent(text) {
  // Convert markdown to HTML
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/\n/g, '<br>');
}

function finalizeContent(text, wordCount, startTime) {
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  
  APP_STATE.currentContent = text;
  DOM.streamingContent().innerHTML = formatContent(text);
  DOM.progressBarInner().style.width = '100%';
  DOM.progressStats().innerHTML = `Words: ${wordCount} | Time: ${totalTime}s | ✅ Complete`;
  
  // Process tool-specific content
  processToolContent(text);
  
  // Save session
  saveSession(wordCount, parseFloat(totalTime));
  
  showToast('Content generated successfully! ✨', 'success');
}

function processToolContent(text) {
  switch (APP_STATE.selectedTool) {
    case 'flash':
      try {
        const cards = JSON.parse(extractJSON(text));
        renderFlashcards(cards);
      } catch (e) {}
      break;
    case 'quiz':
      try {
        const questions = JSON.parse(extractJSON(text));
        renderQuiz(questions);
      } catch (e) {}
      break;
    case 'mind':
      try {
        const mindmap = JSON.parse(extractJSON(text));
        renderMindMap(mindmap);
      } catch (e) {}
      break;
    case 'prac':
      try {
        const questions = JSON.parse(extractJSON(text));
        renderPracticeQuestions(questions);
      } catch (e) {}
      break;
  }
}

function extractJSON(text) {
  const match = text.match(/\[[\s\S]*\]/);
  return match ? match[0] : '[]';
}

function resetToolContainers() {
  if (DOM.flashcardContainer()) DOM.flashcardContainer().innerHTML = '';
  if (DOM.quizContainer()) DOM.quizContainer().innerHTML = '';
  if (DOM.mindmapContainer()) DOM.mindmapContainer().innerHTML = '';
  APP_STATE.flashcardState = { currentCard: 0, cards: [] };
  APP_STATE.quizState = { currentQuestion: 0, score: 0, answers: [] };
}

// === Flashcards ===
function renderFlashcards(cards) {
  APP_STATE.flashcardState.cards = cards;
  APP_STATE.flashcardState.currentCard = 0;
  
  const container = DOM.flashcardContainer();
  if (!container || !cards.length) return;
  
  renderCurrentFlashcard();
  
  container.innerHTML += `
    <div id="flashcard-controls">
      <button class="flashcard-nav-btn" onclick="prevFlashcard()">⬅ Previous</button>
      <button class="flashcard-nav-btn" onclick="nextFlashcard()">Next ➡</button>
    </div>
    <div id="flashcard-counter">Card 1/${cards.length}</div>
  `;
}

function renderCurrentFlashcard() {
  const { cards, currentCard } = APP_STATE.flashcardState;
  const card = cards[currentCard];
  const container = DOM.flashcardContainer();
  if (!container || !card) return;
  
  container.innerHTML = `
    <div class="flashcard" onclick="flipFlashcard()" id="current-flashcard">
      <div class="flashcard-front">
        <div>${card.front}</div>
      </div>
      <div class="flashcard-back">
        <div>${card.back}</div>
      </div>
    </div>
    <div id="flashcard-controls">
      <button class="flashcard-nav-btn" onclick="prevFlashcard()">⬅ Previous</button>
      <button class="flashcard-nav-btn" onclick="nextFlashcard()">Next ➡</button>
    </div>
    <div id="flashcard-counter">Card ${currentCard + 1}/${cards.length}</div>
  `;
}

function flipFlashcard() {
  document.getElementById('current-flashcard')?.classList.toggle('flipped');
}

function nextFlashcard() {
  const { cards, currentCard } = APP_STATE.flashcardState;
  if (currentCard < cards.length - 1) {
    APP_STATE.flashcardState.currentCard++;
    renderCurrentFlashcard();
  }
}

function prevFlashcard() {
  if (APP_STATE.flashcardState.currentCard > 0) {
    APP_STATE.flashcardState.currentCard--;
    renderCurrentFlashcard();
  }
}

// === Quiz ===
function renderQuiz(questions) {
  APP_STATE.quizState = { currentQuestion: 0, score: 0, answers: [], questions };
  
  const container = DOM.quizContainer();
  if (!container || !questions.length) return;
  
  renderCurrentQuestion();
}

function renderCurrentQuestion() {
  const { questions, currentQuestion, score } = APP_STATE.quizState;
  const q = questions[currentQuestion];
  const container = DOM.quizContainer();
  if (!container || !q) return;
  
  container.innerHTML = `
    <div class="quiz-question-card">
      <div class="quiz-question-text">Q${currentQuestion + 1}: ${q.question}</div>
      ${q.options.map((opt, i) => `
        <button class="quiz-option" onclick="selectQuizAnswer('${String.fromCharCode(65 + i)}', this)" data-answer="${String.fromCharCode(65 + i)}">
          ${opt}
        </button>
      `).join('')}
      <div class="quiz-explanation" id="quiz-explanation">${q.explanation || ''}</div>
    </div>
    <div id="quiz-score-display">Score: ${score}/${questions.length}</div>
  `;
}

function selectQuizAnswer(answer, btn) {
  const { questions, currentQuestion } = APP_STATE.quizState;
  const q = questions[currentQuestion];
  const correct = q.correct === answer;
  
  // Disable all options
  document.querySelectorAll('.quiz-option').forEach(o => o.disabled = true);
  
  if (correct) {
    btn.classList.add('correct');
    APP_STATE.quizState.score++;
  } else {
    btn.classList.add('incorrect');
    document.querySelector(`[data-answer="${q.correct}"]`)?.classList.add('correct');
  }
  
  // Show explanation
  document.getElementById('quiz-explanation')?.classList.add('show');
  
  // Auto-advance
  setTimeout(() => {
    if (currentQuestion < questions.length - 1) {
      APP_STATE.quizState.currentQuestion++;
      renderCurrentQuestion();
    } else {
      showQuizResults();
    }
  }, 2000);
}

function showQuizResults() {
  const { score, questions } = APP_STATE.quizState;
  const container = DOM.quizContainer();
  if (!container) return;
  
  container.innerHTML = `
    <div class="glass-card" style="text-align:center; padding:40px;">
      <h2>🎉 Quiz Complete!</h2>
      <div id="quiz-score-display">${score}/${questions.length}</div>
      <p>${score === questions.length ? 'Perfect score! 🏆' : score >= questions.length/2 ? 'Good job! 👍' : 'Keep practicing! 💪'}</p>
      <button class="output-action-btn" onclick="resetSearch()">Try Another Topic</button>
    </div>
  `;
}

// === Mind Map ===
function renderMindMap(data) {
  const container = DOM.mindmapContainer();
  if (!container || !data) return;
  
  const svg = createMindMapSVG(data);
  container.innerHTML = svg;
}

function createMindMapSVG(data) {
  const width = 800, height = 600;
  const cx = width / 2, cy = height / 2;
  const branches = data.branches || [];
  const angleStep = (2 * Math.PI) / branches.length;
  
  let svg = `<svg id="mindmap-svg" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  
  // Central node
  svg += `<circle cx="${cx}" cy="${cy}" r="50" fill="url(#centralGrad)" stroke="#00e5ff" stroke-width="2"/>
          <text x="${cx}" y="${cy}" text-anchor="middle" dy="5" fill="white" font-size="14" font-weight="bold">${data.central}</text>`;
  
  // Branches
  branches.forEach((branch, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const bx = cx + Math.cos(angle) * 200;
    const by = cy + Math.sin(angle) * 200;
    
    svg += `<line x1="${cx}" y1="${cy}" x2="${bx}" y2="${by}" stroke="${branch.color || '#00e5ff'}" stroke-width="2" opacity="0.6"/>`;
    svg += `<circle cx="${bx}" cy="${by}" r="40" fill="${branch.color || '#00e5ff'}22" stroke="${branch.color || '#00e5ff'}" stroke-width="1.5"/>
            <text x="${bx}" y="${by}" text-anchor="middle" dy="5" fill="white" font-size="12">${branch.name}</text>`;
    
    // Subtopics
    (branch.subtopics || []).forEach((sub, j) => {
      const subAngle = angle + (j - (branch.subtopics.length - 1) / 2) * 0.3;
      const sx = bx + Math.cos(subAngle) * 100;
      const sy = by + Math.sin(subAngle) * 100;
      
      svg += `<line x1="${bx}" y1="${by}" x2="${sx}" y2="${sy}" stroke="${branch.color || '#00e5ff'}" stroke-width="1" opacity="0.4"/>`;
      svg += `<rect x="${sx - 50}" y="${sy - 15}" width="100" height="30" rx="8" fill="${branch.color || '#00e5ff'}11" stroke="${branch.color || '#00e5ff'}" stroke-width="1" opacity="0.8"/>
              <text x="${sx}" y="${sy}" text-anchor="middle" dy="5" fill="white" font-size="10">${sub}</text>`;
    });
  });
  
  svg += `<defs><radialGradient id="centralGrad"><stop offset="0%" stop-color="#00e5ff"/><stop offset="100%" stop-color="#8b5cf6"/></radialGradient></defs>`;
  svg += '</svg>';
  
  return svg;
}

// === Practice Questions ===
function renderPracticeQuestions(questions) {
  const container = DOM.quizContainer();
  if (!container || !questions.length) return;
  
  container.innerHTML = questions.map((q, i) => `
    <div class="quiz-question-card">
      <div class="quiz-question-text">Q${i + 1}: ${q.question}</div>
      <div style="margin-top:15px; padding:15px; background:rgba(0,229,255,0.05); border-radius:12px;">
        <strong style="color:#00e5ff;">Model Answer:</strong>
        <p style="margin-top:8px; color:#F5F0FF;">${q.modelAnswer}</p>
      </div>
      ${q.tips ? `<div style="margin-top:10px; color:rgba(245,240,255,0.6); font-size:0.85rem;">💡 ${q.tips}</div>` : ''}
    </div>
  `).join('');
}

// === Session Management ===
function saveSession(wordCount, duration) {
  const session = {
    tool: APP_STATE.selectedTool,
    topic: APP_STATE.topic,
    depth: APP_STATE.selectedDepth,
    language: APP_STATE.selectedLanguage,
    timestamp: new Date().toISOString(),
    wordCount,
    duration
  };
  
  APP_STATE.sessions.unshift(session);
  APP_STATE.sessions = APP_STATE.sessions.slice(0, 50);
  saveUserData();
  
  // Try cloud save
  try {
    fetch('/api/sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'saveSession',
        data: { ...session, userName: APP_STATE.userName }
      })
    });
  } catch (e) {}
}

function loadHistory() {
  const panel = DOM.historyPanel();
  if (!panel) return;
  
  const historyList = panel.querySelector('#history-list') || document.createElement('div');
  historyList.id = 'history-list';
  
  if (!APP_STATE.sessions.length) {
    historyList.innerHTML = '<p style="color:rgba(245,240,255,0.5); text-align:center;">No sessions yet</p>';
  } else {
    historyList.innerHTML = APP_STATE.sessions.map(s => `
      <div class="history-item" onclick="replaySession('${s.tool}','${s.topic}','${s.depth}','${s.language}')">
        <div class="history-tool">${TOOLS.find(t => t.id === s.tool)?.icon || ''} ${s.tool}</div>
        <div class="history-topic">${s.topic}</div>
        <div class="history-meta">${new Date(s.timestamp).toLocaleDateString()} · ${s.wordCount} words</div>
      </div>
    `).join('');
  }
  
  if (!panel.contains(historyList)) panel.appendChild(historyList);
}

function replaySession(tool, topic, depth, language) {
  APP_STATE.selectedTool = tool;
  APP_STATE.topic = topic;
  APP_STATE.selectedDepth = parseInt(depth);
  APP_STATE.selectedLanguage = language;
  
  toggleHistoryPanel();
  generateContent();
}

// === Copy & Download ===
function copyContent() {
  if (!APP_STATE.currentContent) return showToast('No content to copy', 'error');
  
  navigator.clipboard.writeText(APP_STATE.currentContent).then(() => {
    showToast('Copied to clipboard! 📋', 'success');
  }).catch(() => {
    showToast('Failed to copy', 'error');
  });
}

function downloadPDF() {
  if (!APP_STATE.currentContent) return showToast('No content to download', 'error');
  
  const element = document.createElement('div');
  element.innerHTML = `
    <div style="font-family:Arial; padding:40px; color:#000;">
      <h1>${APP_STATE.topic}</h1>
      <p><em>Generated by Savoiré AI</em></p>
      <hr>
      ${formatContent(APP_STATE.currentContent)}
    </div>
  `;
  
  if (typeof html2pdf !== 'undefined') {
    html2pdf().from(element).save(`${APP_STATE.topic.replace(/\s+/g, '_')}_SavoireAI.pdf`);
  } else {
    // Fallback: print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(element.innerHTML);
    printWindow.document.close();
    printWindow.print();
  }
}

// === Reset ===
function resetSearch() {
  DOM.outputContainer().style.display = 'none';
  DOM.wizardContainer().style.display = 'block';
  APP_STATE.currentContent = '';
  APP_STATE.selectedTool = null;
  APP_STATE.topic = '';
  DOM.toolCards().forEach(c => c.classList.remove('selected'));
  showStep(1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// === Panels ===
function toggleSettingsPanel() {
  DOM.settingsPanel()?.classList.toggle('open');
  DOM.settingsOverlay()?.classList.toggle('open');
}

function toggleHistoryPanel() {
  DOM.historyPanel()?.classList.toggle('open');
  DOM.historyOverlay()?.classList.toggle('open');
  if (DOM.historyPanel()?.classList.contains('open')) loadHistory();
}

// === Toast Notifications ===
function showToast(message, type = 'info') {
  const container = DOM.toastContainer();
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// === Event Listeners ===
function initEventListeners() {
  // Topic submit
  DOM.topicSubmitBtn()?.addEventListener('click', handleTopicSubmit);
  DOM.topicInput()?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleTopicSubmit();
  });
  
  // Generate
  DOM.generateBtn()?.addEventListener('click', generateContent);
  
  // Actions
  DOM.copyBtn()?.addEventListener('click', copyContent);
  DOM.downloadPdfBtn()?.addEventListener('click', downloadPDF);
  DOM.newSearchBtn()?.addEventListener('click', resetSearch);
  
  // Welcome
  DOM.welcomeContinueBtn()?.addEventListener('click', handleWelcomeContinue);
  DOM.welcomeNameInput()?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleWelcomeContinue();
  });
  
  // Settings
  document.getElementById('settings-btn')?.addEventListener('click', toggleSettingsPanel);
  DOM.settingsCloseBtn()?.addEventListener('click', toggleSettingsPanel);
  DOM.settingsOverlay()?.addEventListener('click', toggleSettingsPanel);
  
  // History
  document.getElementById('history-btn')?.addEventListener('click', toggleHistoryPanel);
  DOM.historyOverlay()?.addEventListener('click', toggleHistoryPanel);
  
  // Profile
  DOM.profileBtn()?.addEventListener('click', toggleSettingsPanel);
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') generateContent();
    if (e.ctrlKey && e.key === 'c' && APP_STATE.currentContent) copyContent();
    if (e.key === 'Escape') {
      if (DOM.settingsPanel()?.classList.contains('open')) toggleSettingsPanel();
      if (DOM.historyPanel()?.classList.contains('open')) toggleHistoryPanel();
    }
  });
}

// === Initialize Background Effects ===
function initBackgroundEffects() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const particles = Array.from({ length: 50 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 0.5,
    speedX: (Math.random() - 0.5) * 0.5,
    speedY: (Math.random() - 0.5) * 0.5,
    opacity: Math.random() * 0.3 + 0.05
  }));
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 229, 255, ${p.opacity})`;
      ctx.fill();
    });
    
    requestAnimationFrame(animate);
  }
  
  animate();
  
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// Initialize background on load
document.addEventListener('DOMContentLoaded', initBackgroundEffects);

// Make functions globally accessible
window.flipFlashcard = flipFlashcard;
window.nextFlashcard = nextFlashcard;
window.prevFlashcard = prevFlashcard;
window.selectQuizAnswer = selectQuizAnswer;
window.replaySession = replaySession;
window.resetSearch = resetSearch;