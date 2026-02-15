// State and config
export const state = {
  currentRGB: { r: 0, g: 0, b: 0 },
  targetRGB: { r: 0, g: 0, b: 0 },
  interval: null,
  timerInterval: null,
  isPaused: false,
  hasActiveOrder: false,
  remainingTimeMs: 0,
  gameMode: localStorage.getItem('alchemistGameMode') || 'ranked',
  score: 0,
  combo: 0,
  highScore: parseInt(localStorage.getItem('alchemistHighScore')) || 0,
  currentLevel: 'medium',
  playerLevel: 1,
  hintUsed: 0,
  hintQuota: 1,
  hintRevealed: { r: false, g: false, b: false },
  stats: {
    success: parseInt(localStorage.getItem('alchemistStatsSuccess')) || 0,
    fail: parseInt(localStorage.getItem('alchemistStatsFail')) || 0,
    total: parseInt(localStorage.getItem('alchemistStatsTotal')) || 0,
    maxCombo: parseInt(localStorage.getItem('alchemistMaxCombo')) || 0,
    perfectCount: parseInt(localStorage.getItem('alchemistPerfectCount')) || 0,
  },
  hintBonusAchievementIds: ['hint_bonus_apprentice', 'hint_bonus_expert', 'hint_bonus_legend'],
  achievements: [
    { id: 'first_potion', name: 'Pemula', desc: 'Selesaikan ramuan pertama', icon: 'beaker', condition: (s) => s.stats.success >= 1 },
    { id: 'ten_potions', name: 'Apprentice', desc: 'Selesaikan 10 ramuan', icon: 'beaker', condition: (s) => s.stats.success >= 10 },
    { id: 'fifty_potions', name: 'Journeyman', desc: 'Selesaikan 50 ramuan', icon: 'sparkles', condition: (s) => s.stats.success >= 50 },
    { id: 'hundred_potions', name: 'Master Alchemist', desc: 'Selesaikan 100 ramuan', icon: 'trophy', condition: (s) => s.stats.success >= 100 },
    { id: 'combo_3', name: 'Combo Starter', desc: 'Raih 3 combo berturut-turut', icon: 'fire', condition: (s) => s.stats.maxCombo >= 3 },
    { id: 'combo_5', name: 'Combo Master', desc: 'Raih 5 combo berturut-turut', icon: 'fire', condition: (s) => s.stats.maxCombo >= 5 },
    { id: 'combo_10', name: 'Unstoppable', desc: 'Raih 10 combo berturut-turut', icon: 'bolt', condition: (s) => s.stats.maxCombo >= 10 },
    { id: 'score_500', name: 'Skor Tinggi', desc: 'Raih 500 skor total', icon: 'star', condition: (s) => s.highScore >= 500 },
    { id: 'score_1000', name: 'Skor Elite', desc: 'Raih 1000 skor total', icon: 'star', condition: (s) => s.highScore >= 1000 },
    { id: 'score_2000', name: 'Legendary', desc: 'Raih 2000 skor total', icon: 'sparkles', condition: (s) => s.highScore >= 2000 },
    { id: 'perfect_1', name: 'Perfeksionis', desc: 'Raih akurasi 95%+', icon: 'sparkles', condition: (s) => s.stats.perfectCount >= 1 },
    { id: 'perfect_10', name: 'Precision Master', desc: 'Raih 10x akurasi 95%+', icon: 'sparkles', condition: (s) => s.stats.perfectCount >= 10 },
    { id: 'hint_bonus_apprentice', name: 'Hint Apprentice', desc: 'Selesaikan 15 ramuan sukses (bonus +1 hint)', icon: 'lightbulb', condition: (s) => s.stats.success >= 15 },
    { id: 'hint_bonus_expert', name: 'Hint Expert', desc: 'Selesaikan 40 ramuan sukses (bonus +1 hint)', icon: 'lightbulb', condition: (s) => s.stats.success >= 40 },
    { id: 'hint_bonus_legend', name: 'Hint Legend', desc: 'Selesaikan 80 ramuan sukses (bonus +1 hint)', icon: 'lightbulb', condition: (s) => s.stats.success >= 80 },
  ],
  unlockedAchievements: JSON.parse(localStorage.getItem('alchemistAchievements')) || [],
  customerRequests: [
    '"Buatkan aku ramuan ini!"',
    '"Aku butuh warna ini, cepat!"',
    '"Bisakah kau membuat ini?"',
    '"Ramuan ajaib, tolong!"',
    '"Ini pesananku, jangan salah!"',
    '"Warna ini langka, hati-hati!"',
    '"Cepat! Aku sedang terburu-buru!"',
    '"Ramuan ini untuk ritual penting..."',
    '"Campurkan dengan tepat, ya!"',
    '"Aku dengar kau ahli mixing?"',
  ],
  levelSettings: {
    easy: { timerDuration: 25, colorRange: 128, bonusMultiplier: 1 },
    medium: { timerDuration: 18, colorRange: 256, bonusMultiplier: 1.5 },
    hard: { timerDuration: 12, colorRange: 256, bonusMultiplier: 2 },
  },
  emojis: ['🧙‍♂️', '🧝‍♀️', '🧛‍♂️', '🧚', '🧟'],
};

export function getHintQuota(s = state) {
  const base = 1;
  const milestoneBonus = Math.floor(s.stats.success / 25);
  const achievementBonus = s.unlockedAchievements.filter((id) => s.hintBonusAchievementIds.includes(id)).length;
  return Math.max(0, base + milestoneBonus + achievementBonus);
}

export function computePlayerLevel(s = state) {
  return Math.floor(s.stats.success / 5) + 1;
}

export function syncLevelAndDifficulty(s = state) {
  if (s.gameMode === 'classic') {
    s.currentLevel = 'medium';
  } else {
    s.playerLevel = computePlayerLevel(s);
    if (s.playerLevel <= 3) s.currentLevel = 'easy';
    else if (s.playerLevel <= 7) s.currentLevel = 'medium';
    else s.currentLevel = 'hard';
  }
  const levelTextEl = document.getElementById('level-text');
  const diffTextEl = document.getElementById('difficulty-text');
  if (levelTextEl) levelTextEl.innerText = s.gameMode === 'classic' ? 'Classic' : `Lv ${s.playerLevel}`;
  if (diffTextEl) {
    const label = s.currentLevel.charAt(0).toUpperCase() + s.currentLevel.slice(1);
    diffTextEl.innerText = s.gameMode === 'classic' ? `${label} (Fixed)` : label;
  }
}

export function saveProgress(s = state) {
  localStorage.setItem('alchemistHighScore', s.highScore);
  localStorage.setItem('alchemistStatsSuccess', s.stats.success);
  localStorage.setItem('alchemistStatsFail', s.stats.fail);
  localStorage.setItem('alchemistStatsTotal', s.stats.total);
  localStorage.setItem('alchemistMaxCombo', s.stats.maxCombo);
  localStorage.setItem('alchemistPerfectCount', s.stats.perfectCount);
  localStorage.setItem('alchemistAchievements', JSON.stringify(s.unlockedAchievements));
}
