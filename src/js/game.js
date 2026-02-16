import { icon, iconText, setIcon } from "./icons.js";
import {
  state,
  getHintQuota,
  syncLevelAndDifficulty,
  saveProgress,
  activateModeData,
} from "./state.js";
import { createBubble, createConfetti, createSmoke } from "./effects.js";
import {
  startTimer,
  pauseTimer,
  resumeTimer,
  clearTimer,
  isTimerPaused,
} from "./timer.js";
import {
  playPour,
  playSuccess,
  playFail,
  playTimerLow,
  playAchievement,
  playDecrement,
} from "./audio.js";

const q = (sel) => document.querySelector(sel);
let pourInterval = null;
let decInterval = null;
let timerLowPlayed = false;

// ── Game Initialization ──────────────────────────────────────────

export function initRound() {
  syncLevelAndDifficulty();
  const settings = state.levelSettings[state.currentLevel];

  if (state.currentLevel === "easy") {
    const dominant = Math.floor(Math.random() * 3);
    const keys = ["r", "g", "b"];
    state.targetRGB = { r: 0, g: 0, b: 0 };
    state.targetRGB[keys[dominant]] = 128 + Math.floor(Math.random() * 128);
    keys
      .filter((_, i) => i !== dominant)
      .forEach((k) => {
        state.targetRGB[k] = Math.floor(Math.random() * 80);
      });
  } else {
    state.targetRGB = {
      r: Math.floor(Math.random() * settings.colorRange),
      g: Math.floor(Math.random() * settings.colorRange),
      b: Math.floor(Math.random() * settings.colorRange),
    };
  }

  q("#target-box").style.backgroundColor =
    `rgb(${state.targetRGB.r}, ${state.targetRGB.g}, ${state.targetRGB.b})`;
  state.hintQuota = getHintQuota();
  state.hintUsed = 0;
  state.hintRevealed = { r: false, g: false, b: false };

  const hintBtn = q("#btn-hint");
  hintBtn.disabled = state.hintQuota <= 0;
  hintBtn.innerHTML =
    state.hintQuota > 0
      ? iconText("lightbulb", `Hint (${state.hintQuota})`, "w-4 h-4")
      : iconText("lightbulb", "0", "w-4 h-4");

  q("#target-r").innerText = "?";
  q("#target-g").innerText = "?";
  q("#target-b").innerText = "?";
  q("#target-rgb-hint").classList.add("hidden");
  q("#target-rgb-hint").classList.remove("grid");

  const cauldron = q(".cauldron");
  if (cauldron) {
    cauldron.classList.remove("level-easy", "level-medium", "level-hard");
    cauldron.classList.add(`level-${state.currentLevel}`);
  }

  timerLowPlayed = false;
}

// ── Customer Flow ────────────────────────────────────────────────

export function nextCustomer() {
  state.hasActiveOrder = true;
  state.isPaused = false;
  const randomEmoji =
    state.emojis[Math.floor(Math.random() * state.emojis.length)];
  q("#customer-emoji").innerText = randomEmoji;
  const randomRequest =
    state.customerRequests[
      Math.floor(Math.random() * state.customerRequests.length)
    ];
  q("#customer-request").innerText = randomRequest;
  state.currentRGB = { r: 0, g: 0, b: 0 };
  q("#bubbles-container").innerHTML = "";
  updateUI();
  initRound();
  startCustomerTimer();
}

function startCustomerTimer() {
  const settings = state.levelSettings[state.currentLevel];
  const totalMs = settings.timerDuration * 1000;

  startTimer(
    totalMs,
    (pct, remainingMs) => {
      const fill = q("#timer-fill");
      fill.style.width = `${pct}%`;

      if (pct < 30) {
        fill.className =
          "h-full w-full bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_10px_rgba(244,63,94,0.5)] transition-[width] duration-100 ease-linear";
        if (!timerLowPlayed) {
          playTimerLow();
          timerLowPlayed = true;
        }
      } else {
        fill.className =
          "h-full w-full bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_0_10px_rgba(52,211,153,0.5)] transition-[width] duration-100 ease-linear";
      }
    },
    () => customerLeaves(),
  );
}

export function customerLeaves() {
  state.hasActiveOrder = false;
  state.combo = 0;
  state.stats.fail++;
  state.stats.total++;
  state.score = Math.max(0, state.score - 10);
  syncLevelAndDifficulty();
  updateUI();

  const resultTitle = q("#result-title");
  resultTitle.innerText = "⏰ Time's Up!";
  resultTitle.className = "text-2xl font-bold text-rose-500";

  q("#result-score").innerText = "Customer Left!";
  q("#result-bonus").innerText = "-10 Points";
  q("#combo-display").innerText = "Combo Reset!";

  createSmoke(q(".cauldron"));
  playFail();
  q("#result-modal").classList.remove("hidden");

  const c = q(".cauldron");
  if (c) {
    c.classList.add("glow-fail");
    setTimeout(() => c.classList.remove("glow-fail"), 500);
  }

  saveProgress();
  checkAchievements();
}

// ── Pouring ──────────────────────────────────────────────────────

let pourTick = 0;

export function startPour(color) {
  if (pourInterval) return;
  if (!state.hasActiveOrder || state.isPaused) return;
  pourTick = 0;
  pourInterval = setInterval(() => {
    if (state.currentRGB[color] < 255) {
      state.currentRGB[color] = Math.min(255, state.currentRGB[color] + 4);
      updateUI();
      pourTick++;
      if (pourTick % 5 === 0) createBubble(q("#bubbles-container"));
      playPour();
    }
  }, 40);
}

export function stopPour() {
  clearInterval(pourInterval);
  pourInterval = null;
}

// ── Decrement (hold-to-decrease) ─────────────────────────────────

export function startDecrement(color) {
  if (decInterval) return;
  if (!state.hasActiveOrder || state.isPaused) return;
  decInterval = setInterval(() => {
    if (state.currentRGB[color] > 0) {
      state.currentRGB[color] = Math.max(0, state.currentRGB[color] - 4);
      updateUI();
      playDecrement();
    }
  }, 40);
}

export function stopDecrement() {
  clearInterval(decInterval);
  decInterval = null;
}

export function resetCauldron() {
  if (!state.hasActiveOrder) return;
  state.currentRGB = { r: 0, g: 0, b: 0 };
  q("#bubbles-container").innerHTML = "";
  updateUI();
}

// ── Submit / Result ──────────────────────────────────────────────

export function checkResult() {
  if (!state.hasActiveOrder) return;
  clearTimer();
  state.hasActiveOrder = false;
  const distance = Math.sqrt(
    Math.pow(state.targetRGB.r - state.currentRGB.r, 2) +
      Math.pow(state.targetRGB.g - state.currentRGB.g, 2) +
      Math.pow(state.targetRGB.b - state.currentRGB.b, 2),
  );
  const maxDistance = Math.sqrt(Math.pow(255, 2) * 3);
  const accuracy = Math.max(0, 100 - (distance / maxDistance) * 100).toFixed(1);
  if (accuracy >= 95) state.stats.perfectCount++;
  const settings = state.levelSettings[state.currentLevel];

  const resultTitle = q("#result-title");
  const resultBonus = q("#result-bonus");
  const comboDisplay = q("#combo-display");

  if (accuracy >= 70) {
    state.combo++;
    state.stats.success++;
    state.stats.total++;
    if (state.combo > state.stats.maxCombo) state.stats.maxCombo = state.combo;
    const baseScore = Math.round(accuracy * settings.bonusMultiplier);
    const comboBonus =
      state.combo > 1 ? Math.round(baseScore * (state.combo * 0.1)) : 0;
    const totalGained = baseScore + comboBonus;
    state.score += totalGained;
    // Fix: highScore = max, not cumulative
    state.highScore = Math.max(state.highScore, state.score);

    resultTitle.innerText = "🎉 Perfect Mix!";
    resultTitle.className =
      "text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-sky-300";

    resultBonus.innerText = `+${baseScore} Points`;
    comboDisplay.innerText =
      state.combo > 1 ? `🔥 Combo x${state.combo}! (+${comboBonus})` : "";
    createConfetti(q("#confetti-container"));
    playSuccess();

    const c = q(".cauldron");
    if (c) c.classList.add("glow-success");
  } else {
    state.combo = 0;
    state.stats.fail++;
    state.stats.total++;

    resultTitle.innerText = "😞 Failed Mix";
    resultTitle.className = "text-2xl font-bold text-rose-400";

    resultBonus.innerText = "0 Points";
    comboDisplay.innerText = "Combo Lost";
    createSmoke(q(".cauldron"));
    playFail();

    const c = q(".cauldron");
    if (c) c.classList.add("glow-fail");
  }

  syncLevelAndDifficulty();
  updateUI();
  q("#result-score").innerText = `${accuracy}% Accuracy`;
  q("#result-modal").classList.remove("hidden");
  saveProgress();
  checkAchievements();

  setTimeout(() => {
    const c = q(".cauldron");
    if (c) c.classList.remove("glow-success", "glow-fail");
  }, 2000);
}

// ── Hints ────────────────────────────────────────────────────────

export function handleHint() {
  if (state.hintUsed >= state.hintQuota || !state.hasActiveOrder) return;
  const unrevealed = Object.keys(state.hintRevealed).filter(
    (k) => !state.hintRevealed[k],
  );
  if (!unrevealed.length) return;

  const hintContainer = q("#target-rgb-hint");
  hintContainer.classList.remove("hidden");
  hintContainer.classList.add("grid");

  const randomKey = unrevealed[Math.floor(Math.random() * unrevealed.length)];
  state.hintRevealed[randomKey] = true;
  state.hintUsed++;

  const colorNames = { r: "target-r", g: "target-g", b: "target-b" };
  q(`#${colorNames[randomKey]}`).innerText = state.targetRGB[randomKey];

  const remaining = state.hintQuota - state.hintUsed;
  const btn = q("#btn-hint");
  if (remaining > 0)
    btn.innerHTML = iconText("lightbulb", `Hint (${remaining})`, "w-4 h-4");
  else {
    btn.disabled = true;
    btn.innerHTML = iconText("lightbulb", "Empty", "w-4 h-4");
  }
}

// ── Achievements ─────────────────────────────────────────────────

export function checkAchievements() {
  state.achievements.forEach((ach) => {
    if (!state.unlockedAchievements.includes(ach.id) && ach.condition(state)) {
      unlockAchievement(ach);
    }
  });
}

function unlockAchievement(achievement) {
  state.unlockedAchievements.push(achievement.id);
  saveProgress();
  showAchievementPopup(achievement);
  playAchievement();
}

function showAchievementPopup(achievement) {
  const popup = q("#achievement-popup");
  q("#popup-achievement-name").innerText = `${achievement.name}`;
  setIcon(
    q("#popup-achievement-icon"),
    achievement.icon || "sparkles",
    "w-5 h-5 text-amber-300",
  );
  popup.classList.remove("hidden");
  popup.classList.add("show");
  setTimeout(() => {
    popup.classList.remove("show");
    popup.classList.add("hidden");
  }, 4000);
}

// ── Pause / Toggle ───────────────────────────────────────────────

export function togglePause() {
  if (state.isPaused) {
    state.isPaused = false;
    setIcon(q("#icon-pause"), "pause", "w-5 h-5");
    if (state.hasActiveOrder) resumeTimer();
  } else {
    state.isPaused = true;
    setIcon(q("#icon-pause"), "play", "w-5 h-5");
    pauseTimer();
  }
}

// ── UI Updates ───────────────────────────────────────────────────

export function updateUI() {
  q("#rgb-r").innerText = state.currentRGB.r;
  q("#rgb-g").innerText = state.currentRGB.g;
  q("#rgb-b").innerText = state.currentRGB.b;
  q("#score").innerText = state.score;
  q("#highscore").innerText = state.highScore;
  q("#stat-success").innerText = state.stats.success;
  q("#stat-fail").innerText = state.stats.fail;

  const liquid = q("#liquid");
  if (liquid) {
    liquid.style.backgroundColor = `rgb(${state.currentRGB.r}, ${state.currentRGB.g}, ${state.currentRGB.b})`;
    const fill = Math.min(
      (state.currentRGB.r + state.currentRGB.g + state.currentRGB.b) / 7.65,
      100,
    );
    liquid.style.height = `${fill}%`;
  }
}

// ── UI State Management ──────────────────────────────────────────

export function showWaitingState() {
  state.hasActiveOrder = false;
  q("#waiting-state").classList.remove("hidden");
  q(".customer-area").classList.add("hidden");
  q(".mission-card").classList.add("hidden");
  q(".cauldron-area").classList.add("opacity-50", "grayscale");
  setControlsEnabled(false);
}

export function hideWaitingState() {
  q("#waiting-state").classList.add("hidden");
  q(".customer-area").classList.remove("hidden");
  q(".mission-card").classList.remove("hidden");
  q(".cauldron-area").classList.remove("opacity-50", "grayscale");
  setControlsEnabled(true);
}

function setControlsEnabled(enabled) {
  document
    .querySelectorAll(".btn-pour, #btn-submit, .btn-decrement")
    .forEach((btn) => {
      btn.disabled = !enabled;
    });
}

export function takeNewOrder() {
  hideWaitingState();
  nextCustomer();
}

export function closeResultModal() {
  q("#result-modal").classList.add("hidden");
  showWaitingState();
}

// ── Mode / Menu ──────────────────────────────────────────────────

export function showModeMenu() {
  q("#mode-menu").classList.remove("hidden");
  q(".game-container").classList.add("hidden");
}

export function selectMode(mode) {
  state.gameMode = mode;
  localStorage.setItem("alchemistGameMode", state.gameMode);
  activateModeData();
  q("#mode-menu").classList.add("hidden");
  q(".game-container").classList.remove("hidden");
  syncLevelAndDifficulty();
  updateUI();
  showWaitingState();
}

export function backToMenu() {
  clearTimer();
  if (pourInterval) clearInterval(pourInterval);
  pourInterval = null;
  state.hasActiveOrder = false;
  state.isPaused = false;
  q("#result-modal").classList.add("hidden");
  q(".game-container").classList.add("hidden");
  q("#mode-menu").classList.remove("hidden");
  q("#waiting-state").classList.add("hidden");
}

// ── Achievement Modal ────────────────────────────────────────────

export function showAchievementModal() {
  const list = q("#achievement-list");
  list.innerHTML = "";
  state.achievements.forEach((ach) => {
    const unlocked = state.unlockedAchievements.includes(ach.id);
    const item = document.createElement("div");
    item.className = `achievement-item group ${unlocked ? "unlocked" : "locked"}`;
    item.innerHTML = `
      <span class="achievement-icon icon">${icon(ach.icon, "w-6 h-6")}</span>
      <div class="achievement-info">
        <h4>${ach.name}</h4>
        <p>${ach.desc}</p>
      </div>
    `;
    list.appendChild(item);
  });
  q("#achievement-modal").classList.remove("hidden");
}

export function closeAchievementModal() {
  q("#achievement-modal").classList.add("hidden");
}
