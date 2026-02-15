import './src/tailwind.css';
import { icon, iconText, setIcon } from './icons.js';
import { state, getHintQuota, syncLevelAndDifficulty, saveProgress } from './state.js';
import { createBubble, createConfetti, createSmoke } from './effects.js';

const q = (sel) => document.querySelector(sel);
const TUTORIAL_HIDE_KEY = 'alchemistHideTutorial';

function hydrateIcons() {
  setIcon(q('#icon-score'), 'star', 'w-4 h-4 text-amber-300');
  setIcon(q('#icon-highscore'), 'trophy', 'w-4 h-4 text-amber-200');
  setIcon(q('#icon-level'), 'swatch', 'w-4 h-4 text-sky-300');
  setIcon(q('#icon-header-hint'), 'lightbulb', 'w-4 h-4');
  setIcon(q('#icon-pause'), 'pause', 'w-4 h-4');
  setIcon(q('#icon-back'), 'home', 'w-4 h-4');
  setIcon(q('#icon-success'), 'check', 'w-4 h-4 text-emerald-400');
  setIcon(q('#icon-fail'), 'x', 'w-4 h-4 text-rose-400');
  setIcon(q('#icon-total'), 'chart', 'w-4 h-4 text-sky-400');
  setIcon(q('#icon-achievements'), 'sparkles', 'w-5 h-5 text-amber-300');
  setIcon(q('#icon-achievement-title'), 'sparkles', 'w-5 h-5 text-amber-300');
  setIcon(q('#icon-waiting'), 'clock', 'w-5 h-5 text-slate-300');
  setIcon(q('#icon-next'), 'clipboard', 'w-5 h-5');
  setIcon(q('#icon-hint'), 'lightbulb', 'w-4 h-4');
  setIcon(q('#tutorial-icon-target'), 'swatch', 'w-5 h-5');
  setIcon(q('#tutorial-icon-pour'), 'beaker', 'w-5 h-5');
  setIcon(q('#tutorial-icon-vision'), 'eye', 'w-5 h-5');
  setIcon(q('#tutorial-icon-timer'), 'clock', 'w-5 h-5');
  setIcon(q('#popup-achievement-icon'), 'sparkles', 'w-5 h-5 text-slate-900');
}

function openTutorial(force = false) {
  const modal = q('#tutorial-modal');
  if (!modal) return;
  const dontShow = localStorage.getItem(TUTORIAL_HIDE_KEY) === 'true';
  if (dontShow && !force) return;
  const checkbox = q('#dont-show-tutorial');
  if (checkbox) checkbox.checked = false;
  modal.classList.remove('hidden');
}

function closeTutorial() {
  const modal = q('#tutorial-modal');
  if (!modal) return;
  const checkbox = q('#dont-show-tutorial');
  if (checkbox && checkbox.checked) localStorage.setItem(TUTORIAL_HIDE_KEY, 'true');
  modal.classList.add('hidden');
}

function updateUI() {
  q('#rgb-r').innerText = state.currentRGB.r;
  q('#rgb-g').innerText = state.currentRGB.g;
  q('#rgb-b').innerText = state.currentRGB.b;
  q('#score').innerText = state.score;
  q('#highscore').innerText = state.highScore;
  q('#stat-success').innerText = state.stats.success;
  q('#stat-fail').innerText = state.stats.fail;
  q('#stat-total').innerText = state.stats.total;
  const liquid = q('#liquid');
  if (liquid) {
    liquid.style.backgroundColor = `rgb(${state.currentRGB.r}, ${state.currentRGB.g}, ${state.currentRGB.b})`;
    const fill = Math.min((state.currentRGB.r + state.currentRGB.g + state.currentRGB.b) / 7.65, 100);
    liquid.style.height = `${fill}%`;
  }
}

function initGame() {
  syncLevelAndDifficulty();
  const settings = state.levelSettings[state.currentLevel];
  if (state.currentLevel === 'easy') {
    const dominant = Math.floor(Math.random() * 3);
    const keys = ['r', 'g', 'b'];
    state.targetRGB = { r: 0, g: 0, b: 0 };
    state.targetRGB[keys[dominant]] = 128 + Math.floor(Math.random() * 128);
    keys.filter((_, i) => i !== dominant).forEach((k) => {
      state.targetRGB[k] = Math.floor(Math.random() * 80);
    });
  } else {
    state.targetRGB = {
      r: Math.floor(Math.random() * settings.colorRange),
      g: Math.floor(Math.random() * settings.colorRange),
      b: Math.floor(Math.random() * settings.colorRange),
    };
  }
  q('#target-box').style.backgroundColor = `rgb(${state.targetRGB.r}, ${state.targetRGB.g}, ${state.targetRGB.b})`;
  state.hintQuota = getHintQuota();
  state.hintUsed = 0;
  state.hintRevealed = { r: false, g: false, b: false };
  const hintBtn = q('#btn-hint');
  hintBtn.disabled = state.hintQuota <= 0;
  hintBtn.innerHTML = state.hintQuota > 0 ? iconText('lightbulb', `Hint (${state.hintQuota}x)`, 'w-4 h-4') : iconText('lightbulb', 'Hint (0)', 'w-4 h-4');
  q('#target-r').innerText = '?';
  q('#target-g').innerText = '?';
  q('#target-b').innerText = '?';
  q('#target-rgb-hint').classList.add('hidden');
  const cauldron = q('.cauldron');
  if (cauldron) cauldron.className = `cauldron level-${state.currentLevel}`;
}

function showWaitingState() {
  state.hasActiveOrder = false;
  q('#waiting-state').classList.remove('hidden');
  q('.customer-area').classList.add('hidden');
  q('.mission-card').classList.add('hidden');
  setControlsEnabled(false);
}

function hideWaitingState() {
  q('#waiting-state').classList.add('hidden');
  q('.customer-area').classList.remove('hidden');
  q('.mission-card').classList.remove('hidden');
  setControlsEnabled(true);
}

function setControlsEnabled(enabled) {
  document.querySelectorAll('.btn-pour, #btn-submit').forEach((btn) => {
    btn.disabled = !enabled;
    btn.style.opacity = enabled ? '1' : '0.5';
  });
}

function takeNewOrder() {
  hideWaitingState();
  nextCustomer();
}

function startPour(color) {
  if (state.interval) return;
  if (!state.hasActiveOrder || state.isPaused) return;
  document.body.classList.add('no-scroll');
  state.interval = setInterval(() => {
    if (state.currentRGB[color] < 255) {
      state.currentRGB[color] = Math.min(255, state.currentRGB[color] + 3);
      updateUI();
      createBubble(q('#bubbles-container'));
    }
  }, 50);
}

function stopPour() {
  clearInterval(state.interval);
  state.interval = null;
  document.body.classList.remove('no-scroll');
}

function startCustomerTimer(remainingMs) {
  clearInterval(state.timerInterval);
  const settings = state.levelSettings[state.currentLevel];
  const total = typeof remainingMs === 'number' ? remainingMs : settings.timerDuration * 1000;
  state.remainingTimeMs = total;
  const startTime = Date.now();
  state.timerInterval = setInterval(() => {
    if (state.isPaused || !state.hasActiveOrder) return;
    const elapsed = Date.now() - startTime;
    state.remainingTimeMs = Math.max(0, total - elapsed);
    const pct = (state.remainingTimeMs / total) * 100;
    const fill = q('#timer-fill');
    fill.style.width = `${pct}%`;
    fill.style.backgroundColor = pct < 30 ? '#e94560' : '#2ecc71';
    if (state.remainingTimeMs <= 0) {
      clearInterval(state.timerInterval);
      customerLeaves();
    }
  }, 100);
}

function customerLeaves() {
  state.hasActiveOrder = false;
  state.combo = 0;
  state.stats.fail++;
  state.stats.total++;
  state.score = Math.max(0, state.score - 10);
  state.highScore = Math.max(0, state.highScore - 10);
  syncLevelAndDifficulty();
  updateUI();
  q('#result-title').innerText = '⏰ Waktu Habis!';
  q('#result-score').innerText = 'Pelanggan pergi!';
  q('#result-bonus').innerText = '-10 poin';
  q('#combo-display').innerText = 'Combo reset!';
  createSmoke(q('.cauldron'));
  q('#result-modal').classList.remove('hidden');
  saveProgress();
  checkAchievements();
}

function nextCustomer() {
  state.hasActiveOrder = true;
  state.isPaused = false;
  const randomEmoji = state.emojis[Math.floor(Math.random() * state.emojis.length)];
  q('#customer-emoji').innerText = randomEmoji;
  const randomRequest = state.customerRequests[Math.floor(Math.random() * state.customerRequests.length)];
  q('#customer-request').innerText = randomRequest;
  state.currentRGB = { r: 0, g: 0, b: 0 };
  q('#bubbles-container').innerHTML = '';
  updateUI();
  initGame();
  startCustomerTimer();
}

function checkResult() {
  if (!state.hasActiveOrder) return;
  clearInterval(state.timerInterval);
  state.hasActiveOrder = false;
  const distance = Math.sqrt(
    Math.pow(state.targetRGB.r - state.currentRGB.r, 2) +
      Math.pow(state.targetRGB.g - state.currentRGB.g, 2) +
      Math.pow(state.targetRGB.b - state.currentRGB.b, 2)
  );
  const maxDistance = Math.sqrt(Math.pow(255, 2) * 3);
  const accuracy = Math.max(0, 100 - (distance / maxDistance) * 100).toFixed(1);
  if (accuracy >= 95) state.stats.perfectCount++;
  const settings = state.levelSettings[state.currentLevel];
  const resultTitle = q('#result-title');
  const resultBonus = q('#result-bonus');
  const comboDisplay = q('#combo-display');
  if (accuracy >= 70) {
    state.combo++;
    state.stats.success++;
    state.stats.total++;
    if (state.combo > state.stats.maxCombo) state.stats.maxCombo = state.combo;
    const baseScore = Math.round(accuracy * settings.bonusMultiplier);
    const comboBonus = state.combo > 1 ? Math.round(baseScore * (state.combo * 0.1)) : 0;
    const totalGained = baseScore + comboBonus;
    state.score += totalGained;
    state.highScore = Math.max(0, state.highScore + totalGained);
    resultTitle.innerText = '🎉 Pelanggan Puas!';
    resultBonus.innerText = `+${baseScore} poin`;
    comboDisplay.innerText = state.combo > 1 ? `🔥 Combo x${state.combo}! Bonus +${comboBonus}` : '';
    createConfetti(q('#confetti-container'));
  } else {
    state.combo = 0;
    state.stats.fail++;
    state.stats.total++;
    resultTitle.innerText = '😞 Warna Tidak Sesuai!';
    resultBonus.innerText = 'Tidak ada poin';
    comboDisplay.innerText = 'Combo reset!';
    createSmoke(q('.cauldron'));
  }
  syncLevelAndDifficulty();
  updateUI();
  q('#result-score').innerText = `Akurasi: ${accuracy}%`;
  q('#result-modal').classList.remove('hidden');
  saveProgress();
  checkAchievements();
  setTimeout(() => {
    const c = q('.cauldron');
    if (c) c.classList.remove('glow-success', 'glow-fail');
  }, 1000);
}

function closeResultModal() {
  q('#result-modal').classList.add('hidden');
  showWaitingState();
}

function handleHint() {
  if (state.hintUsed >= state.hintQuota || !state.hasActiveOrder) return;
  const unrevealed = Object.keys(state.hintRevealed).filter((k) => !state.hintRevealed[k]);
  if (!unrevealed.length) return;
  const hintContainer = q('#target-rgb-hint');
  hintContainer.classList.remove('hidden');
  const randomKey = unrevealed[Math.floor(Math.random() * unrevealed.length)];
  state.hintRevealed[randomKey] = true;
  state.hintUsed++;
  const colorNames = { r: 'target-r', g: 'target-g', b: 'target-b' };
  q(`#${colorNames[randomKey]}`).innerText = state.targetRGB[randomKey];
  const remaining = state.hintQuota - state.hintUsed;
  const btn = q('#btn-hint');
  if (remaining > 0) btn.innerHTML = iconText('lightbulb', `Hint (${remaining}x)`, 'w-4 h-4');
  else {
    btn.disabled = true;
    btn.innerHTML = iconText('lightbulb', 'Hint Habis', 'w-4 h-4');
  }
}

function showAchievementModal() {
  const list = q('#achievement-list');
  list.innerHTML = '';
  state.achievements.forEach((ach) => {
    const unlocked = state.unlockedAchievements.includes(ach.id);
    const item = document.createElement('div');
    item.className = `achievement-item ${unlocked ? 'unlocked' : 'locked'}`;
    item.innerHTML = `
      <span class="achievement-icon icon">${icon(ach.icon, 'w-6 h-6 text-amber-300')}</span>
      <div class="achievement-info">
        <h4>${ach.name}</h4>
        <p>${ach.desc}</p>
      </div>
    `;
    list.appendChild(item);
  });
  q('#achievement-modal').classList.remove('hidden');
}

function closeAchievementModal() {
  q('#achievement-modal').classList.add('hidden');
}

function checkAchievements() {
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
}

function showAchievementPopup(achievement) {
  const popup = q('#achievement-popup');
  q('#popup-achievement-name').innerText = `${achievement.name}`;
  setIcon(q('#popup-achievement-icon'), achievement.icon || 'sparkles', 'w-5 h-5 text-slate-900');
  popup.classList.remove('hidden');
  popup.classList.add('show');
  setTimeout(() => {
    popup.classList.remove('show');
    popup.classList.add('hidden');
  }, 3000);
}

function bindEvents() {
  const bindPourButton = (id, color) => {
    const btn = document.getElementById(id);
    btn.addEventListener(
      'pointerdown',
      (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault();
        btn.setPointerCapture(e.pointerId);
        startPour(color);
        btn.classList.add('touching');
      },
      { passive: false }
    );
    const stop = () => {
      stopPour();
      btn.classList.remove('touching');
    };
    btn.addEventListener('pointerup', stop, { passive: false });
    btn.addEventListener('pointercancel', stop, { passive: false });
    btn.addEventListener('lostpointercapture', stop, { passive: false });
  };

  bindPourButton('btn-r', 'r');
  bindPourButton('btn-g', 'g');
  bindPourButton('btn-b', 'b');
  q('#btn-submit').onclick = checkResult;
  q('#btn-reset').onclick = () => {
    if (!state.hasActiveOrder) return;
    state.currentRGB = { r: 0, g: 0, b: 0 };
    q('#bubbles-container').innerHTML = '';
    updateUI();
  };
  q('#btn-next-customer').onclick = takeNewOrder;
  q('#btn-hint').onclick = handleHint;
  q('#btn-achievements').onclick = showAchievementModal;
  q('#btn-pause').onclick = () => {
    if (state.isPaused) {
      state.isPaused = false;
      setIcon(q('#icon-pause'), 'pause', 'w-4 h-4');
      if (state.hasActiveOrder && state.remainingTimeMs > 0) startCustomerTimer(state.remainingTimeMs);
    } else {
      state.isPaused = true;
      setIcon(q('#icon-pause'), 'play', 'w-4 h-4');
      clearInterval(state.timerInterval);
    }
  };
  q('#btn-back-menu').onclick = backToMenu;
  q('#btn-menu-classic').onclick = () => selectMode('classic');
  q('#btn-menu-ranked').onclick = () => selectMode('ranked');
  q('#btn-howto').onclick = () => openTutorial(true);
  q('#result-modal .btn-main').onclick = closeResultModal;
  q('#achievement-modal .btn-main').onclick = closeAchievementModal;
  const tutorialClose = q('#tutorial-modal .btn-main');
  if (tutorialClose) tutorialClose.onclick = closeTutorial;
}

function showModeMenu() {
  q('#mode-menu').classList.remove('hidden');
  q('.game-container').classList.add('hidden');
}

function selectMode(mode) {
  state.gameMode = mode;
  localStorage.setItem('alchemistGameMode', state.gameMode);
  q('#mode-menu').classList.add('hidden');
  q('.game-container').classList.remove('hidden');
  syncLevelAndDifficulty();
  updateUI();
  showWaitingState();
}

function backToMenu() {
  clearInterval(state.timerInterval);
  if (state.interval) clearInterval(state.interval);
  state.interval = null;
  state.hasActiveOrder = false;
  state.isPaused = false;
  q('#result-modal').classList.add('hidden');
  q('.game-container').classList.add('hidden');
  q('#mode-menu').classList.remove('hidden');
  q('#waiting-state').classList.add('hidden');
}

function init() {
  bindEvents();
  hydrateIcons();
  showModeMenu();
}

document.addEventListener('DOMContentLoaded', init);

export {
  initGame,
  startCustomerTimer,
  customerLeaves,
  nextCustomer,
  checkResult,
  showWaitingState,
  hideWaitingState,
  takeNewOrder,
  closeResultModal,
};
