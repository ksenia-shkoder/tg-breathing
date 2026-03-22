const STORAGE_KEY = "breathe-flow-state-v1";
const WEEKLY_GOAL_MINUTES = 25;
const TODAY = new Date();

const defaultSessions = [
  { date: daysAgoAt(0, 21, 10), mode: "calm", duration: 180, moodBefore: 2, moodAfter: 4 },
  { date: daysAgoAt(1, 22, 0), mode: "sleep", duration: 300, moodBefore: 2, moodAfter: 5 },
  { date: daysAgoAt(2, 9, 30), mode: "focus", duration: 180, moodBefore: 3, moodAfter: 4 },
  { date: daysAgoAt(4, 20, 45), mode: "calm", duration: 60, moodBefore: 2, moodAfter: 3 },
  { date: daysAgoAt(5, 13, 15), mode: "reset", duration: 60, moodBefore: 2, moodAfter: 3 },
  { date: daysAgoAt(7, 21, 20), mode: "calm", duration: 180, moodBefore: 3, moodAfter: 4 },
  { date: daysAgoAt(10, 22, 10), mode: "sleep", duration: 300, moodBefore: 2, moodAfter: 5 },
];

const defaultCheckins = [
  { date: daysAgoAt(0, 21, 5), value: 3, type: "before" },
  { date: daysAgoAt(1, 21, 55), value: 2, type: "before" },
];

const modes = {
  calm: {
    name: "Антистресс",
    pattern: [4, 4, 6],
    labels: ["Вдох", "Задержка", "Выдох"],
    pace: "Мягкий темп",
    recommendation:
      "Короткий цикл с длинным выдохом снижает порог входа и помогает вернуть телу ощущение опоры.",
  },
  focus: {
    name: "Фокус",
    pattern: [4, 2, 4],
    labels: ["Вдох", "Пауза", "Выдох"],
    pace: "Ровный темп",
    recommendation:
      "Ровный ритм хорошо работает утром и перед задачами, где нужно удерживать внимание без перегрева.",
  },
  sleep: {
    name: "Сон",
    pattern: [4, 7, 8],
    labels: ["Вдох", "Задержка", "Выдох"],
    pace: "Замедление",
    recommendation:
      "Длинный выдох и пауза мягко снижают возбуждение и помогают переключиться в вечерний режим.",
  },
  reset: {
    name: "Перезагрузка",
    pattern: [5, 0, 5],
    labels: ["Вдох", "Переход", "Выдох"],
    pace: "Сбалансированный темп",
    recommendation:
      "Симметричный паттерн подходит для коротких пауз в течение дня, когда нужно быстро вернуться в себя.",
  },
};

const programs = [
  {
    tag: "7 дней",
    title: "Тихие вечера",
    duration: "3 мин",
    copy: "Серия для снижения вечернего напряжения и мягкого завершения дня без жесткой дисциплины.",
    mode: "sleep",
    sessionDuration: 180,
  },
  {
    tag: "Антистресс",
    title: "Возврат в ритм",
    duration: "1 мин",
    copy: "Если было несколько пропусков, эта программа помогает вернуться без вины и без длинных обязательств.",
    mode: "calm",
    sessionDuration: 60,
  },
  {
    tag: "Фокус",
    title: "Ясное утро",
    duration: "3 мин",
    copy: "Ровный цикл перед первой задачей дня, чтобы быстрее собрать внимание и начать без раскачки.",
    mode: "focus",
    sessionDuration: 180,
  },
  {
    tag: "Перерыв",
    title: "Осознанная пауза",
    duration: "1 мин",
    copy: "Быстрое восстановление в середине дня, когда голова шумит и хочется чуть больше пространства.",
    mode: "reset",
    sessionDuration: 60,
  },
];

const state = {
  currentScreen: "today",
  selectedDuration: 180,
  selectedMode: "calm",
  running: false,
  secondsLeft: 180,
  stageIndex: 0,
  stageTick: 0,
  timerId: null,
  activeCheckin: "before",
  selectedMood: null,
  data: loadData(),
  telegram: {
    ready: false,
    userName: "гость",
  },
};

const elements = {
  screens: [...document.querySelectorAll(".screen")],
  navButtons: [...document.querySelectorAll("[data-nav]")],
  durationButtons: [...document.querySelectorAll("[data-duration]")],
  modeButtons: [...document.querySelectorAll("[data-mode]")],
  recommendationsList: document.getElementById("recommendations-list"),
  recommendationTemplate: document.getElementById("recommendation-template"),
  programGrid: document.getElementById("program-grid"),
  programTemplate: document.getElementById("program-template"),
  heatmap: document.getElementById("heatmap"),
  welcomeTitle: document.getElementById("welcome-title"),
  welcomeText: document.getElementById("welcome-text"),
  appModeLabel: document.getElementById("app-mode-label"),
  streakPill: document.getElementById("streak-pill"),
  heroTitle: document.getElementById("hero-title"),
  heroDescription: document.getElementById("hero-description"),
  goalValue: document.getElementById("goal-value"),
  bestTimeValue: document.getElementById("best-time-value"),
  impactValue: document.getElementById("impact-value"),
  practiceModePill: document.getElementById("practice-mode-pill"),
  modeRecommendation: document.getElementById("mode-recommendation"),
  timerLabel: document.getElementById("timer-label"),
  stageLabel: document.getElementById("stage-label"),
  patternLabel: document.getElementById("pattern-label"),
  paceLabel: document.getElementById("pace-label"),
  orbCore: document.getElementById("orb-core"),
  sessionStateLabel: document.getElementById("session-state-label"),
  startButton: document.getElementById("start-session"),
  completeNowButton: document.getElementById("complete-now"),
  goalRing: document.getElementById("goal-ring"),
  goalPercent: document.getElementById("goal-percent"),
  goalSummary: document.getElementById("goal-summary"),
  totalSessionsPill: document.getElementById("total-sessions-pill"),
  stressDelta: document.getElementById("stress-delta"),
  favoriteMode: document.getElementById("favorite-mode"),
  bestTimeInsight: document.getElementById("best-time-insight"),
  reminderValue: document.getElementById("reminder-value"),
  profileStyle: document.getElementById("profile-style"),
  telegramStatus: document.getElementById("telegram-status"),
  telegramAction: document.getElementById("telegram-action"),
  checkinModal: document.getElementById("checkin-modal"),
  openCheckin: document.getElementById("open-checkin"),
  closeCheckinButtons: [...document.querySelectorAll("[data-close-checkin]")],
  moodButtons: [...document.querySelectorAll("[data-mood]")],
  saveCheckin: document.getElementById("save-checkin"),
  checkinTitle: document.getElementById("checkin-title"),
  shareProgress: document.getElementById("share-progress"),
};

function daysAgo(count) {
  const value = new Date(TODAY);
  value.setDate(value.getDate() - count);
  return value.toISOString();
}

function daysAgoAt(count, hours, minutes) {
  const value = new Date(TODAY);
  value.setDate(value.getDate() - count);
  value.setHours(hours, minutes, 0, 0);
  return value.toISOString();
}

function loadData() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        sessions: defaultSessions,
        checkins: defaultCheckins,
        reminder: "Каждый день в 21:00",
      };
    }
    const parsed = JSON.parse(raw);
    return {
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : defaultSessions,
      checkins: Array.isArray(parsed.checkins) ? parsed.checkins : defaultCheckins,
      reminder: parsed.reminder || "Каждый день в 21:00",
    };
  } catch (error) {
    return {
      sessions: defaultSessions,
      checkins: defaultCheckins,
      reminder: "Каждый день в 21:00",
    };
  }
}

function saveData() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function formatTime(totalSeconds) {
  const safe = Math.max(totalSeconds, 0);
  const minutes = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (safe % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function sameDay(dateA, dateB) {
  return new Date(dateA).toDateString() === new Date(dateB).toDateString();
}

function getSessionsWithin(days) {
  const threshold = new Date(TODAY);
  threshold.setDate(threshold.getDate() - days + 1);
  return state.data.sessions.filter((session) => new Date(session.date) >= threshold);
}

function getWeeklyMinutes() {
  return Math.round(getSessionsWithin(7).reduce((sum, session) => sum + session.duration / 60, 0));
}

function getTotalSessions() {
  return state.data.sessions.length;
}

function getStreak() {
  const uniqueDays = [...new Set(state.data.sessions.map((item) => new Date(item.date).toDateString()))];
  let streak = 0;
  const cursor = new Date(TODAY);

  while (uniqueDays.includes(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getFavoriteMode() {
  const counts = {};
  state.data.sessions.forEach((session) => {
    counts[session.mode] = (counts[session.mode] || 0) + 1;
  });
  const [modeKey] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || ["calm"];
  return modes[modeKey].name;
}

function getBestPracticeHour() {
  const hours = {};
  state.data.sessions.forEach((session) => {
    const hour = new Date(session.date).getHours();
    hours[hour] = (hours[hour] || 0) + 1;
  });
  const winner = Object.entries(hours).sort((a, b) => b[1] - a[1])[0];
  if (!winner) {
    return "21:00";
  }
  return `${winner[0].padStart(2, "0")}:00`;
}

function getMoodDelta() {
  const sessionsWithMood = state.data.sessions.filter(
    (session) => typeof session.moodBefore === "number" && typeof session.moodAfter === "number"
  );
  if (!sessionsWithMood.length) {
    return 0;
  }
  const avgDelta =
    sessionsWithMood.reduce((sum, session) => sum + (session.moodAfter - session.moodBefore), 0) /
    sessionsWithMood.length;
  return Math.round((avgDelta / 5) * 100);
}

function getTodayRecommendation() {
  const streak = getStreak();
  const weeklyMinutes = getWeeklyMinutes();
  const hour = TODAY.getHours();

  if (streak < 2) {
    return {
      title: "Мягкий возврат после паузы",
      description:
        "Лучше не требовать от себя длинную сессию. Сегодня приложение предлагает 1 минуту и спокойный старт.",
    };
  }

  if (hour >= 20) {
    return {
      title: "Вечерний антистресс",
      description:
        "После 20:00 твои практики чаще снижают напряжение, поэтому рекомендация дня собрана под замедление.",
    };
  }

  if (weeklyMinutes >= 18) {
    return {
      title: "Можно чуть глубже",
      description:
        "Ритм уже держится уверенно, так что сегодня приложение предлагает 5 минут вместо короткой паузы.",
    };
  }

  return {
    title: "Практика для устойчивого ритма",
    description:
      "Держим ритм без перегруза: короткая практика даст движение и поддержит привычку на этой неделе.",
  };
}

function getDynamicRecommendations() {
  const weeklyMinutes = getWeeklyMinutes();
  const recommendations = [
    {
      tag: "Персональный инсайт",
      title: `Лучшее время для тебя: ${getBestPracticeHour()}`,
      text: "Приложение замечает, когда практика дается тебе легче, и подстраивает рекомендации по времени дня.",
    },
    {
      tag: "Регулярность",
      title:
        weeklyMinutes < 10
          ? "Сделай ставку на 1 минуту, чтобы не ломать ритм"
          : "Ритм держится, можно иногда переходить на 5 минут",
      text: "Логика рекомендаций не пушит на максимум, а ищет длину сессии, в которую реально вернуться сегодня.",
    },
    {
      tag: "Состояние",
      title: "Check-in до и после показывает реальный эффект",
      text: "Так прогресс измеряется не только streak, но и изменением самочувствия после дыхательной практики.",
    },
  ];

  return recommendations;
}

function renderRecommendations() {
  elements.recommendationsList.innerHTML = "";
  getDynamicRecommendations().forEach((item) => {
    const fragment = elements.recommendationTemplate.content.cloneNode(true);
    fragment.querySelector(".recommendation-tag").textContent = item.tag;
    fragment.querySelector("h3").textContent = item.title;
    fragment.querySelector(".recommendation-text").textContent = item.text;
    elements.recommendationsList.appendChild(fragment);
  });
}

function renderPrograms() {
  elements.programGrid.innerHTML = "";
  programs.forEach((program) => {
    const fragment = elements.programTemplate.content.cloneNode(true);
    fragment.querySelector(".recommendation-tag").textContent = program.tag;
    fragment.querySelector(".pill").textContent = program.duration;
    fragment.querySelector("h3").textContent = program.title;
    fragment.querySelector(".program-copy").textContent = program.copy;
    fragment.querySelector(".primary-btn").addEventListener("click", () => {
      state.selectedMode = program.mode;
      state.selectedDuration = program.sessionDuration;
      syncSelectionUI();
      switchScreen("today");
    });
    elements.programGrid.appendChild(fragment);
  });
}

function renderHeatmap() {
  elements.heatmap.innerHTML = "";
  const days = 28;
  const sessionsByDay = {};

  state.data.sessions.forEach((session) => {
    const key = new Date(session.date).toDateString();
    sessionsByDay[key] = (sessionsByDay[key] || 0) + 1;
  });

  for (let index = days - 1; index >= 0; index -= 1) {
    const day = new Date(TODAY);
    day.setDate(day.getDate() - index);
    const key = day.toDateString();
    const count = sessionsByDay[key] || 0;
    const cell = document.createElement("div");
    const level = Math.min(count, 3);
    cell.className = `heat-cell ${level ? `level-${level}` : ""}`;
    cell.title = `${day.toLocaleDateString("ru-RU")}: ${count} практик`;
    elements.heatmap.appendChild(cell);
  }
}

function syncSelectionUI() {
  elements.durationButtons.forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.duration) === state.selectedDuration);
  });
  elements.modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.selectedMode);
  });
  const currentMode = modes[state.selectedMode];
  elements.practiceModePill.textContent = currentMode.name;
  elements.modeRecommendation.textContent = currentMode.recommendation;
  elements.patternLabel.textContent = `Паттерн ${currentMode.pattern.join(" · ")}`;
  elements.paceLabel.textContent = currentMode.pace;
  if (!state.running) {
    state.secondsLeft = state.selectedDuration;
    elements.timerLabel.textContent = formatTime(state.secondsLeft);
    elements.stageLabel.textContent = currentMode.labels[0];
  }
}

function updateTopline() {
  const streak = getStreak();
  const weeklyMinutes = getWeeklyMinutes();
  const percent = Math.min(Math.round((weeklyMinutes / WEEKLY_GOAL_MINUTES) * 100), 100);
  const recommendation = getTodayRecommendation();

  elements.streakPill.textContent = `${streak} ${pluralizeDays(streak)}`;
  elements.heroTitle.textContent = recommendation.title;
  elements.heroDescription.textContent = recommendation.description;
  elements.goalValue.textContent = `${weeklyMinutes} / ${WEEKLY_GOAL_MINUTES} мин`;
  elements.bestTimeValue.textContent = getBestPracticeHour();
  elements.impactValue.textContent =
    getMoodDelta() > 0 ? `Спокойнее после практики на ${getMoodDelta()}%` : "Следим за эффектом после сессий";
  elements.goalRing.style.setProperty("--progress", percent);
  elements.goalPercent.textContent = `${percent}%`;
  elements.goalSummary.textContent =
    weeklyMinutes >= WEEKLY_GOAL_MINUTES
      ? "Недельная цель уже закрыта. Можно просто держать мягкий ритм и не давить на себя."
      : `Осталось ${Math.max(WEEKLY_GOAL_MINUTES - weeklyMinutes, 0)} мин до недельной цели.`;
  elements.totalSessionsPill.textContent = `${getTotalSessions()} ${pluralizeSessions(getTotalSessions())}`;
  elements.stressDelta.textContent =
    getMoodDelta() > 0 ? `+${getMoodDelta()}%` : `${getMoodDelta()}%`;
  elements.favoriteMode.textContent = getFavoriteMode();
  elements.bestTimeInsight.textContent = getBestPracticeHour();
  elements.reminderValue.textContent = state.data.reminder;
  elements.profileStyle.textContent = `${getFavoriteMode()} и ${modes.sleep.name.toLowerCase()}`;
}

function pluralizeDays(value) {
  if (value % 10 === 1 && value % 100 !== 11) {
    return "день подряд";
  }
  if ([2, 3, 4].includes(value % 10) && ![12, 13, 14].includes(value % 100)) {
    return "дня подряд";
  }
  return "дней подряд";
}

function pluralizeSessions(value) {
  if (value % 10 === 1 && value % 100 !== 11) {
    return "сессия";
  }
  if ([2, 3, 4].includes(value % 10) && ![12, 13, 14].includes(value % 100)) {
    return "сессии";
  }
  return "сессий";
}

function switchScreen(screenName) {
  state.currentScreen = screenName;
  elements.screens.forEach((screen) => {
    screen.classList.toggle("active", screen.dataset.screen === screenName);
  });
  elements.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.nav === screenName);
  });
}

function syncStage() {
  const mode = modes[state.selectedMode];
  const stageDuration = mode.pattern[state.stageIndex] || 1;
  elements.stageLabel.textContent = mode.labels[state.stageIndex];
  state.stageTick += 1;

  if (state.stageTick >= stageDuration) {
    state.stageTick = 0;
    state.stageIndex = (state.stageIndex + 1) % mode.labels.length;
  }
}

function tickSession() {
  state.secondsLeft -= 1;
  elements.timerLabel.textContent = formatTime(state.secondsLeft);
  syncStage();

  if (state.secondsLeft <= 0) {
    finishSession();
  }
}

function startSession() {
  if (state.running) {
    stopSession(true);
    return;
  }

  state.running = true;
  state.stageIndex = 0;
  state.stageTick = 0;
  state.secondsLeft = state.selectedDuration;
  elements.sessionStateLabel.textContent = "Практика идет";
  elements.startButton.textContent = "Остановить";
  elements.orbCore.classList.remove("paused");
  elements.orbCore.classList.add("running");
  state.timerId = window.setInterval(tickSession, 1000);
  openCheckin("before");
}

function stopSession(resetTimer) {
  window.clearInterval(state.timerId);
  state.running = false;
  state.timerId = null;
  elements.startButton.textContent = "Начать практику";
  elements.orbCore.classList.remove("running");
  elements.orbCore.classList.add("paused");
  elements.sessionStateLabel.textContent = "Практика остановлена";
  state.stageIndex = 0;
  state.stageTick = 0;
  if (resetTimer) {
    state.secondsLeft = state.selectedDuration;
    elements.timerLabel.textContent = formatTime(state.secondsLeft);
    elements.stageLabel.textContent = modes[state.selectedMode].labels[0];
  }
}

function finishSession() {
  if (!state.running) {
    elements.sessionStateLabel.textContent = "Сначала запусти практику";
    return;
  }

  window.clearInterval(state.timerId);
  state.running = false;
  state.timerId = null;
  elements.startButton.textContent = "Начать практику";
  elements.orbCore.classList.remove("running");
  elements.orbCore.classList.add("paused");
  elements.stageLabel.textContent = "Практика завершена";
  elements.timerLabel.textContent = "Готово";
  elements.sessionStateLabel.textContent = "Сессия сохранена";

  const moodBefore =
    [...state.data.checkins]
      .reverse()
      .find((item) => item.type === "before" && sameDay(item.date, TODAY))?.value || 3;
  const moodAfter = state.selectedMood || Math.min(moodBefore + 1, 5);

  state.data.sessions.push({
    date: new Date().toISOString(),
    mode: state.selectedMode,
    duration: state.selectedDuration,
    moodBefore,
    moodAfter,
  });
  saveData();
  refreshDashboard();
  openCheckin("after");
}

function openCheckin(type) {
  state.activeCheckin = type;
  state.selectedMood = null;
  elements.checkinTitle.textContent =
    type === "before" ? "Как ты себя чувствуешь сейчас?" : "Как ты себя чувствуешь после практики?";
  elements.moodButtons.forEach((button) => button.classList.remove("active"));
  elements.checkinModal.classList.remove("hidden");
  elements.checkinModal.setAttribute("aria-hidden", "false");
}

function closeCheckin() {
  elements.checkinModal.classList.add("hidden");
  elements.checkinModal.setAttribute("aria-hidden", "true");
}

function saveCheckin() {
  if (state.selectedMood === null) {
    closeCheckin();
    return;
  }

  state.data.checkins.push({
    date: new Date().toISOString(),
    value: state.selectedMood,
    type: state.activeCheckin,
  });
  saveData();
  closeCheckin();
}

function shareProgress() {
  const message = `Breathe Flow: ${getStreak()} ${pluralizeDays(getStreak())}, ${getWeeklyMinutes()} из ${WEEKLY_GOAL_MINUTES} мин за неделю.`;

  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.sendData(
      JSON.stringify({
        type: "progress_share",
        streak: getStreak(),
        weeklyMinutes: getWeeklyMinutes(),
        message,
      })
    );
    elements.telegramStatus.textContent =
      "Данные отправлены в Telegram через WebApp.sendData. Следующий шаг - принять их на стороне бота.";
    return;
  }

  window.navigator.clipboard?.writeText(message);
  elements.telegramStatus.textContent =
    "Ты не в Telegram, поэтому текст прогресса просто скопирован в буфер обмена.";
}

function setupTelegram() {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (!tg) {
    document.body.classList.remove("telegram-theme");
    elements.appModeLabel.textContent = "Web demo";
    elements.welcomeTitle.textContent = "Breathe Flow в веб-режиме";
    elements.welcomeText.textContent =
      "Внутри Telegram Mini App здесь появятся имя пользователя, тема приложения и отправка данных боту.";
    return;
  }

  tg.ready();
  tg.expand();
  state.telegram.ready = true;
  state.telegram.userName = tg.initDataUnsafe?.user?.first_name || "друг";
  document.body.classList.add("telegram-theme");
  elements.appModeLabel.textContent = "Telegram Mini App";
  elements.welcomeTitle.textContent = `Привет, ${state.telegram.userName}`;
  elements.welcomeText.textContent =
    "Мини-приложение уже понимает, что открыто внутри Telegram, и готово обмениваться данными с ботом.";
  elements.telegramStatus.textContent =
    "Telegram WebApp API подключен. Бот может принимать `sendData`, а интерфейс наследует тему Telegram.";
}

function refreshDashboard() {
  syncSelectionUI();
  renderRecommendations();
  renderPrograms();
  renderHeatmap();
  updateTopline();
}

function bindEvents() {
  elements.navButtons.forEach((button) => {
    button.addEventListener("click", () => switchScreen(button.dataset.nav));
  });

  elements.durationButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedDuration = Number(button.dataset.duration);
      syncSelectionUI();
    });
  });

  elements.modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedMode = button.dataset.mode;
      syncSelectionUI();
    });
  });

  elements.startButton.addEventListener("click", startSession);
  elements.completeNowButton.addEventListener("click", finishSession);
  elements.openCheckin.addEventListener("click", () => openCheckin("before"));
  elements.closeCheckinButtons.forEach((button) => button.addEventListener("click", closeCheckin));
  elements.saveCheckin.addEventListener("click", saveCheckin);
  elements.telegramAction.addEventListener("click", shareProgress);
  elements.shareProgress.addEventListener("click", shareProgress);

  elements.moodButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedMood = Number(button.dataset.mood);
      elements.moodButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
  });
}

function init() {
  setupTelegram();
  bindEvents();
  refreshDashboard();
}

init();
