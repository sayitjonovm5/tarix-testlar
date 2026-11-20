/**
 * Tarix Testlari - 11-sinf (O'zbekiston tarixi & Jahon tarixi)
 * Modern, Client-Side SPA Engine
 */

// =====================================================
// AUDIO SYNTHESIZER (No external files needed)
// =====================================================
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem("tarix11-muted") === "true";
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  toggle() {
    this.muted = !this.muted;
    localStorage.setItem("tarix11-muted", this.muted ? "true" : "false");
    return !this.muted;
  }

  playTone(freq, type, duration, gainVal = 0.08) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") this.ctx.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  click() {
    this.playTone(600, "sine", 0.05, 0.04);
  }

  correct() {
    if (this.muted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((f, idx) => {
        setTimeout(() => this.playTone(f, "triangle", 0.18, 0.08), idx * 70);
      });
    } catch (e) {}
  }

  wrong() {
    if (this.muted) return;
    this.init();
    try {
      [280, 220].forEach((f, idx) => {
        setTimeout(() => this.playTone(f, "sawtooth", 0.16, 0.06), idx * 90);
      });
    } catch (e) {}
  }
}

const sounds = new SoundEffects();

// =====================================================
// LOCAL STORAGE STORE
// =====================================================
const STORAGE_KEY = "tarix11_userdata_v2";

const Storage = {
  load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error("Storage load error:", e);
    }
    return {
      bestScores: {},      // topicId -> percentage
      mistakes: {},        // questionId -> question object with user choice
      stats: {
        testsCompleted: 0,
        totalQuestionsAnswered: 0,
        totalCorrect: 0
      }
    };
  },

  save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Storage save error:", e);
    }
  },

  getBest(topicId) {
    const data = this.load();
    return data.bestScores[topicId] ?? null;
  },

  setBest(topicId, score) {
    const data = this.load();
    const current = data.bestScores[topicId] ?? 0;
    if (score > current) {
      data.bestScores[topicId] = score;
      this.save(data);
    }
  },

  addMistake(q, userChoice) {
    const data = this.load();
    data.mistakes[q.id] = {
      id: q.id,
      q: q.q,
      opts: q.opts,
      ans: q.ans,
      difficulty: q.difficulty,
      userChoice,
      timestamp: Date.now()
    };
    this.save(data);
  },

  removeMistake(qid) {
    const data = this.load();
    if (data.mistakes[qid]) {
      delete data.mistakes[qid];
      this.save(data);
    }
  },

  getMistakes() {
    const data = this.load();
    return Object.values(data.mistakes || {});
  },

  clearMistakes() {
    const data = this.load();
    data.mistakes = {};
    this.save(data);
  },

  recordTestCompleted(totalQuestions, correctCount) {
    const data = this.load();
    data.stats.testsCompleted = (data.stats.testsCompleted || 0) + 1;
    data.stats.totalQuestionsAnswered = (data.stats.totalQuestionsAnswered || 0) + totalQuestions;
    data.stats.totalCorrect = (data.stats.totalCorrect || 0) + correctCount;
    this.save(data);
  },

  getStats() {
    const data = this.load();
    return data.stats || { testsCompleted: 0, totalQuestionsAnswered: 0, totalCorrect: 0 };
  },

  resetAll() {
    localStorage.removeItem(STORAGE_KEY);
  }
};

// =====================================================
// APPLICATION STATE
// =====================================================
const DIFFICULTY_LABELS = { all: "Barcha darajalar", easy: "Oson", medium: "O‘rta", hard: "Qiyin" };

function questionCount(scope = "all") {
  const sections = scope === "all" ? Object.values(HISTORY_DATA) : [HISTORY_DATA[scope]];
  return sections.reduce((sum, section) => sum + section.topics.reduce((n, topic) => n + topic.questions.length, 0), 0);
}

const AppState = {
  activeSection: "uzbekiston", // "uzbekiston" or "jahon"
  searchQuery: "",
  quiz: null,                  // active quiz instance
  reviewFilter: "all"          // "all", "wrong", "correct"
};

// =====================================================
// THEME CONTROLLER
// =====================================================
function initTheme() {
  const saved = localStorage.getItem("tarix11-theme");
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  const theme = saved || (prefersLight ? "light" : "dark");
  applyTheme(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const target = current === "dark" ? "light" : "dark";
  applyTheme(target);
  localStorage.setItem("tarix11-theme", target);
  sounds.click();
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const icon = document.getElementById("themeIcon");
  const label = document.getElementById("themeLabel");
  if (theme === "dark") {
    if (icon) icon.textContent = "🌙";
    if (label) label.textContent = "Yorug'";
  } else {
    if (icon) icon.textContent = "☀️";
    if (label) label.textContent = "Qorong'u";
  }
}

// =====================================================
// ROUTING / VIEW CONTROLLER
// =====================================================
function setView(html) {
  const main = document.getElementById("appMain");
  main.innerHTML = html;
  main.classList.remove("view-enter");
  void main.offsetWidth; // Trigger reflow for CSS animation
  main.classList.add("view-enter");
  window.scrollTo({ top: 0, behavior: "instant" });
  updateHeaderBadges();
}

function updateHeaderBadges() {
  // Mistakes Badge
  const mistakes = Storage.getMistakes();
  const badge = document.getElementById("mistakesBadge");
  if (badge) {
    if (mistakes.length > 0) {
      badge.textContent = mistakes.length;
      badge.style.display = "inline-flex";
    } else {
      badge.style.display = "none";
    }
  }

  // Audio button state
  const audioBtn = document.getElementById("audioToggleBtn");
  if (audioBtn) {
    audioBtn.innerHTML = sounds.muted ? "🔇 <span>Ovoz: O'chirilgan</span>" : "🔊 <span>Ovoz: Yoqilgan</span>";
  }
}

function confirmLeaveQuiz() {
  if (AppState.quiz && !AppState.quiz.isCompleted) {
    return confirm("Diqqat! Test hali yakunlanmadi. Chiqib ketsangiz, natijalaringiz saqlanmaydi. Chiqishni xohlaysizmi?");
  }
  return true;
}

// Window beforeunload guard
window.addEventListener("beforeunload", (e) => {
  if (AppState.quiz && !AppState.quiz.isCompleted) {
    e.preventDefault();
    e.returnValue = "";
  }
});

// =====================================================
// VIEW: HOME (Topic Catalog)
// =====================================================
function renderHome() {
  if (!confirmLeaveQuiz()) return;
  AppState.quiz = null;

  const sec = HISTORY_DATA[AppState.activeSection];
  const totalQuestions = sec.topics.reduce((acc, t) => acc + t.questions.length, 0);

  // Search filter
  const q = AppState.searchQuery.toLowerCase().trim();
  const filteredTopics = sec.topics.filter(t => {
    if (!q) return true;
    return t.name.toLowerCase().includes(q) || `${t.num}`.includes(q);
  });

  const topicsHtml = filteredTopics.map(t => {
    const bestScore = Storage.getBest(t.id);
    let badgeClass = "";
    let badgeText = "—";
    if (bestScore !== null) {
      badgeText = `${bestScore}%`;
      if (bestScore >= 80) badgeClass = "mastered";
      else if (bestScore >= 50) badgeClass = "learning";
    }

    return `
      <div class="topic-row" onclick="openTopicMode('${t.id}')">
        <div class="topic-index">${t.num}</div>
        <div class="topic-content">
          <div class="topic-title">${t.name}</div>
          <div class="topic-meta">
            <span>📚 ${t.questions.length} ta savol</span>
            <span>📖 ${t.pages}</span>
          </div>
        </div>
        <div class="topic-score-badge ${badgeClass}" title="Eng yaxshi natija">${badgeText}</div>
        <div class="topic-chevron">›</div>
      </div>
    `;
  }).join("");

  const emptyHtml = filteredTopics.length === 0 ? `
    <div class="empty-placeholder">
      <div class="empty-placeholder-icon">🔍</div>
      <h3>Mavzu topilmadi</h3>
      <p>"${AppState.searchQuery}" bo'yicha hech qanday mavzu chiqmadi.</p>
    </div>
  ` : "";

  const html = `
    <!-- Tabs: O'zbekiston / Jahon -->
    <div class="section-tabs">
      <button class="tab-btn ${AppState.activeSection === 'uzbekiston' ? 'active' : ''}" onclick="switchSection('uzbekiston')">
        <span class="tab-icon"><img src="uzb-flag.png" class="uz-flag" alt="O‘zbekiston"></span>
        <span>O‘zbekiston tarixi</span>
      </button>
      <button class="tab-btn ${AppState.activeSection === 'jahon' ? 'active' : ''}" onclick="switchSection('jahon')">
        <span class="tab-icon">🌍</span>
        <span>Jahon tarixi</span>
      </button>
    </div>

    <!-- Section Banner Card -->
    <div class="section-banner">
      <div class="section-banner-text">
        <h2>${sec.icon} ${sec.name}</h2>
        <p>${sec.topics.length} ta mavzu &middot; ${totalQuestions} ta savol (11-sinf darsligi)</p>
      </div>
      <button class="btn-aralash" onclick="openAralashModal()">
        <span>🔀</span>
        <span>Aralash test</span>
      </button>
    </div>

    <!-- Search Box -->
    <div class="search-box-wrapper">
      <span class="search-icon">🔍</span>
      <input 
        type="text" 
        class="search-input" 
        placeholder="Mavzular bo'yicha qidirish..." 
        value="${escapeHtml(AppState.searchQuery)}"
        oninput="handleSearch(this.value)"
      >
    </div>

    <!-- Topics List -->
    <div class="topics-list">
      ${topicsHtml}
      ${emptyHtml}
    </div>
  `;

  setView(html);
}

function switchSection(secKey) {
  if (AppState.activeSection === secKey) return;
  sounds.click();
  AppState.activeSection = secKey;
  AppState.searchQuery = "";
  renderHome();
}

function handleSearch(val) {
  AppState.searchQuery = val;
  const sec = HISTORY_DATA[AppState.activeSection];
  const q = val.toLowerCase().trim();
  const filteredTopics = sec.topics.filter(t => {
    if (!q) return true;
    return t.name.toLowerCase().includes(q) || `${t.num}`.includes(q);
  });

  const listEl = document.querySelector(".topics-list");
  if (!listEl) return;

  if (filteredTopics.length === 0) {
    listEl.innerHTML = `
      <div class="empty-placeholder">
        <div class="empty-placeholder-icon">🔍</div>
        <h3>Mavzu topilmadi</h3>
        <p>"${escapeHtml(val)}" bo'yicha hech qanday mavzu topilmadi.</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = filteredTopics.map(t => {
    const bestScore = Storage.getBest(t.id);
    let badgeClass = "";
    let badgeText = "—";
    if (bestScore !== null) {
      badgeText = `${bestScore}%`;
      if (bestScore >= 80) badgeClass = "mastered";
      else if (bestScore >= 50) badgeClass = "learning";
    }

    return `
      <div class="topic-row" onclick="openTopicMode('${t.id}')">
        <div class="topic-index">${t.num}</div>
        <div class="topic-content">
          <div class="topic-title">${t.name}</div>
          <div class="topic-meta">
            <span>📚 ${t.questions.length} ta savol</span>
            <span>📖 ${t.pages}</span>
          </div>
        </div>
        <div class="topic-score-badge ${badgeClass}" title="Eng yaxshi natija">${badgeText}</div>
        <div class="topic-chevron">›</div>
      </div>
    `;
  }).join("");
}

// =====================================================
// VIEW: TOPIC MODE SELECTION (Mashq / Imtihon)
// =====================================================
function openTopicMode(topicId, difficulty = "all") {
  sounds.click();
  let foundTopic = null;
  let sectionKey = "";
  for (const sKey of ["uzbekiston", "jahon"]) {
    const t = HISTORY_DATA[sKey].topics.find(item => item.id === topicId);
    if (t) {
      foundTopic = t;
      sectionKey = sKey;
      break;
    }
  }

  if (!foundTopic) return;
  if (!Object.hasOwn(DIFFICULTY_LABELS, difficulty)) difficulty = "all";
  const count = foundTopic.questions.filter(q => difficulty === "all" || q.difficulty === difficulty).length;
  const difficultyOptions = Object.entries(DIFFICULTY_LABELS).map(([value, label]) => {
    const size = foundTopic.questions.filter(q => value === "all" || q.difficulty === value).length;
    return `<option value="${value}" ${value === difficulty ? "selected" : ""}>${label} (${size} ta)</option>`;
  }).join("");

  const html = `
    <div class="back-link" onclick="renderHome()">
      <span>← Bosh sahifaga qaytish</span>
    </div>

    <div class="mode-header">
      <h2>${foundTopic.num}-mavzu. ${foundTopic.name}</h2>
      <p>${count} ta savol &middot; ${foundTopic.pages} (${HISTORY_DATA[sectionKey].name})</p>
      <div class="difficulty-picker">
        <label for="topicDifficulty">Qiyinlik darajasi</label>
        <select id="topicDifficulty" onchange="openTopicMode('${topicId}', this.value)">${difficultyOptions}</select>
      </div>
    </div>

    <div class="mode-cards-grid">
      <!-- MASHQ REJIMI -->
      <div class="mode-card">
        <div class="mode-card-icon">📖</div>
        <h3>Mashq rejimi</h3>
        <p>Savollarni shoshmasdan o'rganing. Har bir tanlangan javobdan keyin to'g'ri/noto'g'ri darhol ko'rsatiladi. Vaqt chegaralanmagan.</p>
        <div class="count-selector-group">
          <button class="count-btn primary" onclick="startTopicQuiz('${topicId}', 'practice', ${count}, '${difficulty}')">
            Barcha ${count} ta savol
          </button>
        </div>
      </div>

      <!-- IMTIHON REJIMI -->
      <div class="mode-card">
        <div class="mode-card-icon">⏱️</div>
        <h3>Imtihon rejimi</h3>
        <p>Haqiqiy bilimingizni sinab ko'ring! Har bir savolga 60 soniya. Natijalar va batafsil xatolar tahlili test oxirida taqdim etiladi.</p>
        <div class="count-selector-group">
          <button class="count-btn" onclick="startTopicQuiz('${topicId}', 'exam', 5, '${difficulty}')">5 ta savol</button>
          <button class="count-btn primary" onclick="startTopicQuiz('${topicId}', 'exam', ${count}, '${difficulty}')">Barcha ${count} ta</button>
        </div>
      </div>
    </div>
  `;

  setView(html);
}

// =====================================================
// MODAL: ARALASH TEST (Mixed Test Config)
// =====================================================
function openAralashModal() {
  sounds.click();
  const sec = HISTORY_DATA[AppState.activeSection];
  const secTotal = sec.topics.reduce((acc, t) => acc + t.questions.length, 0);

  const html = `
    <div class="back-link" onclick="renderHome()">
      <span>← Bosh sahifaga qaytish</span>
    </div>

    <div class="mode-header">
      <h2>🔀 Aralash test tanlash</h2>
      <p>Bir nechta mavzulardan tasodifiy aralashtirilgan savollar to'plami.</p>
    </div>

    <div class="mode-cards-grid">
      <!-- Section Mixed -->
      <div class="mode-card">
        <div class="mode-card-icon">${sec.id === 'uzbekiston' ? '<img src="uzb-flag.png" class="uz-flag-lg" alt="O‘zbekiston">' : sec.icon}</div>
        <h3>${sec.name} bo'yicha</h3>
        <p>Ushbu bo'limdagi barcha ${sec.topics.length} ta mavzudan aralashtirilgan savollar (${secTotal} ta savol zaxirasi).</p>
        <div class="count-selector-group">
          <button class="count-btn" onclick="startAralashQuiz('${AppState.activeSection}', 10)">10 ta</button>
          <button class="count-btn" onclick="startAralashQuiz('${AppState.activeSection}', 20)">20 ta</button>
          <button class="count-btn primary" onclick="startAralashQuiz('${AppState.activeSection}', 30)">30 ta</button>
          <button class="count-btn" onclick="startAralashQuiz('${AppState.activeSection}', ${secTotal})">Hammasi (${secTotal})</button>
        </div>
      </div>

      <!-- Full Combined Mixed -->
      <div class="mode-card">
        <div class="mode-card-icon">🏛️</div>
        <h3>Umumiy Tarix (Ikkala fan)</h3>
        <p>Ham O'zbekiston, ham Jahon tarixidan barcha ${questionCount()} ta savoldan tasodifiy tuzilgan test.</p>
        <div class="count-selector-group">
          <button class="count-btn" onclick="startAralashQuiz('all', 15)">15 ta</button>
          <button class="count-btn" onclick="startAralashQuiz('all', 30)">30 ta</button>
          <button class="count-btn primary" onclick="startAralashQuiz('all', 50)">50 ta</button>
          <button class="count-btn" onclick="startAralashQuiz('all', ${questionCount()})">Hammasi (${questionCount()})</button>
        </div>
      </div>
    </div>
  `;

  setView(html);
}

// =====================================================
// QUIZ ENGINE
// =====================================================
class QuizSession {
  constructor(options) {
    this.title = options.title;
    this.subtitle = options.subtitle || "";
    this.topicId = options.topicId || null;
    this.difficulty = options.difficulty || "all";
    this.scope = options.scope || null;
    this.mode = options.mode; // 'practice' or 'exam'
    this.questions = options.questions; // array of questions
    this.currentIndex = 0;
    this.userAnswers = Array(this.questions.length).fill(null);
    this.isRevealed = Array(this.questions.length).fill(false); // for practice mode
    this.startTime = Date.now();
    this.endTime = null;
    this.isCompleted = false;

    // Timer settings (Exam mode: 60s per question)
    this.totalSeconds = this.mode === "exam" ? this.questions.length * 60 : 0;
    this.remainingSeconds = this.totalSeconds;
    this.timerId = null;
  }

  start() {
    if (this.mode === "exam") {
      this.timerId = setInterval(() => {
        this.remainingSeconds--;
        this.updateTimerUI();
        if (this.remainingSeconds <= 0) {
          clearInterval(this.timerId);
          this.finish();
        }
      }, 1000);
    }
    this.render();
  }

  stopTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  updateTimerUI() {
    const timerEl = document.getElementById("quizTimer");
    if (!timerEl) return;

    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    timerEl.innerHTML = `⏱️ ${mins}:${secs.toString().padStart(2, "0")}`;

    if (this.remainingSeconds <= 30) {
      timerEl.className = "quiz-timer danger";
    } else if (this.remainingSeconds <= 90) {
      timerEl.className = "quiz-timer warning";
    } else {
      timerEl.className = "quiz-timer";
    }
  }

  selectOption(optKey) {
    const qIndex = this.currentIndex;
    const currentQ = this.questions[qIndex];

    if (this.mode === "practice") {
      if (this.isRevealed[qIndex]) return; // locked once revealed
      this.userAnswers[qIndex] = optKey;
      this.isRevealed[qIndex] = true;

      const isCorrect = optKey === currentQ.ans;
      if (isCorrect) {
        sounds.correct();
        // If this was in mistakes, remove it
        Storage.removeMistake(currentQ.id);
      } else {
        sounds.wrong();
        // Add to mistakes
        Storage.addMistake(currentQ, optKey);
      }
      this.render();
    } else {
      // Exam mode
      sounds.click();
      this.userAnswers[qIndex] = optKey;
      this.render();
    }
  }

  next() {
    if (this.currentIndex < this.questions.length - 1) {
      sounds.click();
      this.currentIndex++;
      this.render();
    } else {
      this.promptFinish();
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      sounds.click();
      this.currentIndex--;
      this.render();
    }
  }

  jumpTo(index) {
    if (index >= 0 && index < this.questions.length) {
      sounds.click();
      this.currentIndex = index;
      this.render();
    }
  }

  promptFinish() {
    const unanswered = this.userAnswers.filter(a => a === null).length;
    let msg = "Testni yakunlashni xohlaysizmi?";
    if (unanswered > 0) {
      msg = `Sizda hali ${unanswered} ta javob berilmagan savol bor!\nTestni yakunlaysizmi?`;
    }
    if (confirm(msg)) {
      this.finish();
    }
  }

  finish() {
    this.stopTimer();
    this.endTime = Date.now();
    this.isCompleted = true;

    // Calculate score
    let correctCount = 0;
    this.questions.forEach((q, idx) => {
      const userChoice = this.userAnswers[idx];
      if (userChoice === q.ans) {
        correctCount++;
        Storage.removeMistake(q.id);
      } else {
        Storage.addMistake(q, userChoice);
      }
    });

    const totalCount = this.questions.length;
    const percentage = Math.round((correctCount / totalCount) * 100);

    // Save statistics & best score
    Storage.recordTestCompleted(totalCount, correctCount);
    if (this.topicId && this.difficulty === "all") {
      Storage.setBest(this.topicId, percentage);
    }

    if (percentage >= 80) sounds.correct();
    else sounds.wrong();

    renderResults(this, correctCount, percentage);
  }

  render() {
    const qIndex = this.currentIndex;
    const total = this.questions.length;
    const currentQ = this.questions[qIndex];
    const userChoice = this.userAnswers[qIndex];
    const isRev = this.isRevealed[qIndex];
    const progressPct = ((qIndex + 1) / total) * 100;

    // Quick Question Palette (Exam mode)
    let paletteHtml = "";
    if (this.mode === "exam") {
      const items = this.questions.map((_, i) => {
        let cls = "palette-item";
        if (i === qIndex) cls += " current";
        if (this.userAnswers[i] !== null) cls += " answered";
        return `<div class="${cls}" onclick="AppState.quiz.jumpTo(${i})">${i + 1}</div>`;
      }).join("");
      paletteHtml = `<div class="palette-grid">${items}</div>`;
    }

    // Top status indicator
    let statusIndicator = "";
    if (this.mode === "exam") {
      const mins = Math.floor(this.remainingSeconds / 60);
      const secs = this.remainingSeconds % 60;
      statusIndicator = `<div class="quiz-timer" id="quizTimer">⏱️ ${mins}:${secs.toString().padStart(2, "0")}</div>`;
    } else {
      // Practice running score
      const answeredSoFar = this.userAnswers.filter((a, i) => this.isRevealed[i]);
      const correctSoFar = answeredSoFar.filter((a, i) => a === this.questions[i].ans).length;
      statusIndicator = `<div class="badge-grade">To'g'ri: ${correctSoFar} ta</div>`;
    }

    // Options rendering
    const optionsHtml = Object.entries(currentQ.opts).map(([key, text]) => {
      let optCls = "option-btn";
      let disabled = "";

      if (this.mode === "practice" && isRev) {
        disabled = "disabled";
        if (key === currentQ.ans) {
          optCls += " correct-reveal";
        } else if (key === userChoice) {
          optCls += " wrong-reveal";
        }
      } else if (this.mode === "exam") {
        if (userChoice === key) {
          optCls += " selected";
        }
      }

      return `
        <button class="${optCls}" ${disabled} onclick="AppState.quiz.selectOption('${key}')">
          <span class="option-key">${key}</span>
          <span class="option-text">${escapeHtml(text)}</span>
        </button>
      `;
    }).join("");

    // Feedback box for practice mode
    let feedbackHtml = "";
    if (this.mode === "practice" && isRev) {
      const isCorrect = userChoice === currentQ.ans;
      feedbackHtml = `
        <div class="feedback-box ${isCorrect ? 'correct' : 'wrong'}">
          <span>${isCorrect ? '✅ Barakalla! Javobingiz to‘g‘ri.' : `❌ Noto‘g‘ri. To‘g‘ri javob: <strong>${currentQ.ans}) ${escapeHtml(currentQ.opts[currentQ.ans])}</strong>`}</span>
        </div>
      `;
    }

    // Navigation buttons
    const prevBtn = (this.mode === "exam" && qIndex > 0) ? `
      <button class="btn-nav prev" onclick="AppState.quiz.prev()">
        ← Oldingi
      </button>
    ` : `<div></div>`;

    const isLast = qIndex === total - 1;
    const nextText = isLast ? "Yakunlash ✓" : "Keyingi →";
    let nextDisabled = "";
    if (this.mode === "practice" && !isRev) {
      nextDisabled = "disabled";
    }

    const nextBtn = `
      <button class="btn-nav next" ${nextDisabled} onclick="AppState.quiz.next()">
        ${nextText}
      </button>
    `;

    const html = `
      <div class="quiz-top-bar">
        <div class="quiz-title-tag">${escapeHtml(this.title)}</div>
        ${statusIndicator}
      </div>

      <div class="quiz-progress-track">
        <div class="quiz-progress-bar" style="width: ${progressPct}%;"></div>
      </div>

      <div class="quiz-controls-row">
        <div class="quiz-question-num">Savol ${qIndex + 1} / ${total}${currentQ.difficulty ? ` · ${DIFFICULTY_LABELS[currentQ.difficulty]}` : ""}</div>
        <button class="btn-quit" onclick="if(confirmLeaveQuiz()) renderHome();">Chiqish ✕</button>
      </div>

      ${paletteHtml}

      <div class="quiz-card">
        <div class="quiz-question-text">${qIndex + 1}. ${escapeHtml(currentQ.q)}</div>
        <div class="options-container">
          ${optionsHtml}
        </div>
        ${feedbackHtml}
      </div>

      <div class="quiz-nav-row">
        ${prevBtn}
        ${nextBtn}
      </div>
    `;

    setView(html);
  }
}

// =====================================================
// QUIZ LAUNCHERS
// =====================================================
function startTopicQuiz(topicId, mode, questionCount, difficulty = "all") {
  let targetTopic = null;
  for (const sKey of ["uzbekiston", "jahon"]) {
    const t = HISTORY_DATA[sKey].topics.find(item => item.id === topicId);
    if (t) {
      targetTopic = t;
      break;
    }
  }
  if (!targetTopic) return;

  const pool = targetTopic.questions.filter(q => difficulty === "all" || q.difficulty === difficulty);
  const shuffled = shuffleArray(pool).slice(0, questionCount);
  if (!shuffled.length) return;

  AppState.quiz = new QuizSession({
    title: targetTopic.name,
    subtitle: `${shuffled.length} ta savol`,
    topicId,
    difficulty,
    mode,
    questions: shuffled
  });

  AppState.quiz.start();
}

function startAralashQuiz(scope, questionCount) {
  let pool = [];
  let title = "Aralash test";

  if (scope === "all") {
    title = "Umumiy tarix aralash test";
    for (const sKey of ["uzbekiston", "jahon"]) {
      HISTORY_DATA[sKey].topics.forEach(t => pool.push(...t.questions));
    }
  } else {
    const sec = HISTORY_DATA[scope];
    title = `${sec.name} aralash test`;
    sec.topics.forEach(t => pool.push(...t.questions));
  }

  const selectedQuestions = shuffleArray([...pool]).slice(0, questionCount);

  AppState.quiz = new QuizSession({
    title,
    subtitle: `${selectedQuestions.length} ta savol`,
    topicId: null,
    mode: "exam",
    scope,
    questions: selectedQuestions
  });

  AppState.quiz.start();
}

function startMistakesQuiz() {
  const mistakes = Storage.getMistakes();
  if (mistakes.length === 0) return;

  const questions = shuffleArray([...mistakes]).map(m => ({
    id: m.id,
    q: m.q,
    opts: m.opts,
    ans: m.ans,
    difficulty: m.difficulty
  }));

  AppState.quiz = new QuizSession({
    title: "Xatolar ustida ishlash",
    subtitle: `${questions.length} ta savol`,
    topicId: null,
    mode: "practice",
    questions
  });

  AppState.quiz.start();
}

// =====================================================
// VIEW: RESULTS
// =====================================================
function renderResults(quiz, correctCount, percentage) {
  const total = quiz.questions.length;
  const wrongCount = total - correctCount;

  // Rating and celebratory icon
  let scoreClass = "needs-work";
  let titleBadge = "Takrorlash lozim 📖";
  if (percentage >= 80) {
    scoreClass = "mastered";
    titleBadge = "Ajoyib natija! 🎉";
  } else if (percentage >= 50) {
    scoreClass = "good";
    titleBadge = "Yaxshi natija! 👍";
  }

  // Time spent
  const durationSec = Math.round(((quiz.endTime || Date.now()) - quiz.startTime) / 1000);
  const durMins = Math.floor(durationSec / 60);
  const durSecs = durationSec % 60;
  const timeFormatted = `${durMins}:${durSecs.toString().padStart(2, "0")}`;

  // Filter questions for review
  const questionsReview = quiz.questions.map((q, idx) => {
    const userAns = quiz.userAnswers[idx];
    const isCorrect = userAns === q.ans;
    return {
      index: idx + 1,
      q: q.q,
      opts: q.opts,
      ans: q.ans,
      difficulty: q.difficulty,
      userAns,
      isCorrect
    };
  });

  const filter = AppState.reviewFilter;
  const filteredQuestions = questionsReview.filter(item => {
    if (filter === "wrong") return !item.isCorrect;
    if (filter === "correct") return item.isCorrect;
    return true;
  });

  const reviewItemsHtml = filteredQuestions.map(item => {
    const userText = item.userAns ? `${item.userAns}) ${item.opts[item.userAns]}` : "Javob berilmagan ⏱️";
    const correctText = `${item.ans}) ${item.opts[item.ans]}`;

    return `
      <div class="review-item ${item.isCorrect ? 'is-correct' : 'is-wrong'}">
        <div class="review-q-text">${item.index}. ${escapeHtml(item.q)}</div>
        <div class="review-answer-row ${item.isCorrect ? 'correct-ans' : 'user-wrong'}">
          <span>${item.isCorrect ? '✅ Sizning to‘g‘ri javobingiz:' : '❌ Sizning javobingiz:'}</span>
          <span>${escapeHtml(userText)}</span>
        </div>
        ${!item.isCorrect ? `
          <div class="review-answer-row correct-ans">
            <span>✅ To‘g‘ri javob:</span>
            <span>${escapeHtml(correctText)}</span>
          </div>
        ` : ''}
      </div>
    `;
  }).join("");

  const html = `
    <!-- Main Result Card -->
    <div class="result-card-main">
      <div class="result-subtitle">${escapeHtml(quiz.title)} &middot; ${titleBadge}</div>
      <div class="result-percentage-display ${scoreClass}">${percentage}%</div>
      <div class="result-fraction-text">${correctCount} / ${total} ta to‘g‘ri javob</div>

      <!-- GREEN & RED STATISTIC BARS -->
      <div class="stats-bars-container">
        <div class="stats-legend">
          <span class="legend-green">🟢 To‘g‘ri: ${correctCount} ta (${percentage}%)</span>
          <span class="legend-red">🔴 Noto‘g‘ri: ${wrongCount} ta (${100 - percentage}%)</span>
        </div>
        <div class="dual-stat-bar">
          <div class="dual-stat-fill-green" id="statFillGreen" style="width: 0%;"></div>
        </div>
      </div>

      <!-- Quick Stats Tiles -->
      <div class="stats-tiles-grid">
        <div class="stat-tile">
          <div class="stat-tile-val ok">${correctCount}</div>
          <div class="stat-tile-lbl">To‘g‘ri</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile-val bad">${wrongCount}</div>
          <div class="stat-tile-lbl">Xato</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile-val">${timeFormatted}</div>
          <div class="stat-tile-lbl">Sarflangan vaqt</div>
        </div>
      </div>

      <!-- Result Buttons -->
      <div class="result-buttons-group">
        <button class="btn-result primary" onclick="retryCurrentQuiz()">
          <span>🔄</span>
          <span>Yana ishlash</span>
        </button>
        ${wrongCount > 0 ? `
          <button class="btn-result secondary" onclick="startMistakesQuiz()">
            <span>⚠️</span>
            <span>Xatolarni ishlash (${wrongCount})</span>
          </button>
        ` : ''}
        <button class="btn-result secondary" onclick="renderHome()">
          <span>🏠</span>
          <span>Bosh sahifa</span>
        </button>
      </div>
    </div>

    <!-- Question-by-Question Review -->
    <div class="review-section">
      <div class="review-header">
        <h3>Savollar tahlili (${total})</h3>
        <div class="review-filter-tabs">
          <button class="filter-btn ${filter === 'all' ? 'active' : ''}" onclick="setReviewFilter('all')">Barchasi (${total})</button>
          <button class="filter-btn ${filter === 'wrong' ? 'active' : ''}" onclick="setReviewFilter('wrong')">Xatolar (${wrongCount})</button>
          <button class="filter-btn ${filter === 'correct' ? 'active' : ''}" onclick="setReviewFilter('correct')">To‘g‘ri (${correctCount})</button>
        </div>
      </div>
      <div class="review-items-container">
        ${reviewItemsHtml || '<div class="empty-placeholder"><p>Ushbu filtr bo‘yicha savollar mavjud emas.</p></div>'}
      </div>
    </div>
  `;

  setView(html);

  // Smooth animation for green statistic bar
  setTimeout(() => {
    const el = document.getElementById("statFillGreen");
    if (el) el.style.width = `${percentage}%`;
  }, 100);
}

function setReviewFilter(filterName) {
  AppState.reviewFilter = filterName;
  sounds.click();
  if (AppState.quiz) {
    const total = AppState.quiz.questions.length;
    let correct = 0;
    AppState.quiz.questions.forEach((q, i) => {
      if (AppState.quiz.userAnswers[i] === q.ans) correct++;
    });
    const pct = Math.round((correct / total) * 100);
    renderResults(AppState.quiz, correct, pct);
  }
}

function retryCurrentQuiz() {
  if (!AppState.quiz) {
    renderHome();
    return;
  }
  const q = AppState.quiz;
  if (q.topicId) {
    startTopicQuiz(q.topicId, q.mode, q.questions.length, q.difficulty);
  } else if (q.scope) {
    startAralashQuiz(q.scope, q.questions.length);
  } else {
    startMistakesQuiz();
  }
}

// =====================================================
// VIEW: MISTAKES (Xatolarim)
// =====================================================
function renderMistakes() {
  if (!confirmLeaveQuiz()) return;
  AppState.quiz = null;

  const mistakes = Storage.getMistakes();

  if (mistakes.length === 0) {
    const html = `
      <div class="back-link" onclick="renderHome()">
        <span>← Bosh sahifaga qaytish</span>
      </div>
      <div class="empty-placeholder">
        <div class="empty-placeholder-icon">🌟</div>
        <h3>Hech qanday xatolar yo‘q!</h3>
        <p>Ajoyib natija! Siz barcha ishlagan testlaringizni to‘g‘ri yechgansiz yoki barcha xatolarni o‘rganib chiqqansiz.</p>
      </div>
    `;
    setView(html);
    return;
  }

  const itemsHtml = mistakes.map((m, idx) => `
    <div class="review-item is-wrong">
      <div class="review-q-text">${idx + 1}. ${escapeHtml(m.q)}</div>
      <div class="review-answer-row user-wrong">
        <span>❌ Sizning javobingiz:</span>
        <span>${m.userChoice ? escapeHtml(m.opts[m.userChoice]) : "Javob berilmagan"}</span>
      </div>
      <div class="review-answer-row correct-ans">
        <span>✅ To‘g‘ri javob:</span>
        <span>${escapeHtml(m.opts[m.ans])} (${m.ans})</span>
      </div>
    </div>
  `).join("");

  const html = `
    <div class="back-link" onclick="renderHome()">
      <span>← Bosh sahifaga qaytish</span>
    </div>

    <div class="section-banner">
      <div class="section-banner-text">
        <h2>⚠️ Xatolarim banki</h2>
        <p>Siz avvalgi testlarda adashgan ${mistakes.length} ta savol jamlangan.</p>
      </div>
      <button class="btn-aralash" onclick="startMistakesQuiz()">
        <span>📝</span>
        <span>Xatolarni ishlash</span>
      </button>
    </div>

    <div class="review-items-container">
      ${itemsHtml}
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <button class="btn-result secondary" onclick="if(confirm('Rostdan ham barcha xatolarni tozalashni xohlaysizmi?')) { Storage.clearMistakes(); renderMistakes(); }">
        <span>🗑️</span>
        <span>Xatolar ro‘yxatini tozalash</span>
      </button>
    </div>
  `;

  setView(html);
}

// =====================================================
// MODAL: STATISTIKA
// =====================================================
function openStatsModal() {
  sounds.click();
  const stats = Storage.getStats();
  const uzTopics = HISTORY_DATA.uzbekiston.topics;
  const jhTopics = HISTORY_DATA.jahon.topics;
  const allTopics = [...uzTopics, ...jhTopics];

  let masteredCount = 0;
  allTopics.forEach(t => {
    const best = Storage.getBest(t.id);
    if (best !== null && best >= 80) masteredCount++;
  });

  const totalAnswered = stats.totalQuestionsAnswered || 0;
  const totalCorrect = stats.totalCorrect || 0;
  const overallPct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.id = "statsModal";
  modal.onclick = (e) => {
    if (e.target === modal) closeStatsModal();
  };

  modal.innerHTML = `
    <div class="modal-content" onclick="event.stopPropagation()">
      <div class="modal-header">
        <h3>📊 Mening umumiy natijalarim</h3>
        <button class="modal-close-btn" onclick="closeStatsModal()">✕</button>
      </div>

      <div class="stats-tiles-grid" style="margin-bottom: 20px;">
        <div class="stat-tile">
          <div class="stat-tile-val ok">${overallPct}%</div>
          <div class="stat-tile-lbl">O'rtacha aniqlik</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile-val">${stats.testsCompleted || 0}</div>
          <div class="stat-tile-lbl">Yechilgan testlar</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile-val ok">${masteredCount} / ${allTopics.length}</div>
          <div class="stat-tile-lbl">O'zlashtirilgan mavzular</div>
        </div>
      </div>

      <div style="background: var(--card-alt); padding: 14px 18px; border-radius: var(--radius-md); font-size: 0.88rem; margin-bottom: 20px; line-height: 1.6;">
        <div>📚 <strong>Jami savollar bazasi:</strong> ${questionCount()} ta (11-sinf darsligi)</div>
        <div><img src="uzb-flag.png" class="uz-flag" alt="O‘zbekiston"> <strong>O‘zbekiston tarixi:</strong> ${uzTopics.length} ta mavzu (${questionCount("uzbekiston")} savol)</div>
        <div>🌍 <strong>Jahon tarixi:</strong> ${jhTopics.length} ta mavzu (${questionCount("jahon")} savol)</div>
        <div>💾 <strong>Xotira:</strong> Barcha ma'lumotlar qurilmangiz brauzerida saqlanmoqda.</div>
      </div>

      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button class="btn-result secondary" style="font-size: 0.8rem; color: var(--bad);" onclick="resetAllData()">
          🗑️ Barchasini tozalash
        </button>
        <button class="btn-result primary" onclick="closeStatsModal()">
          Yopish
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function closeStatsModal() {
  const modal = document.getElementById("statsModal");
  if (modal) modal.remove();
}

function resetAllData() {
  if (confirm("Diqqat! Barcha test natijalari, xatolar va ko'rsatkichlar o'chib ketadi. Davom etasizmi?")) {
    Storage.resetAll();
    closeStatsModal();
    renderHome();
  }
}

// =====================================================
// KEYBOARD SHORTCUTS
// =====================================================
window.addEventListener("keydown", (e) => {
  // If user is typing in search input, do nothing
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

  if (AppState.quiz && !AppState.quiz.isCompleted) {
    const key = e.key.toUpperCase();
    if (["A", "B", "C", "D"].includes(key)) {
      AppState.quiz.selectOption(key);
    } else if (e.key === "ArrowRight" || e.key === "Enter") {
      e.preventDefault();
      AppState.quiz.next();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      AppState.quiz.prev();
    }
  }
});

// =====================================================
// UTILITIES
// =====================================================
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =====================================================
// INITIALIZATION
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  renderHome();
});
