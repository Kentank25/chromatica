function createFreshStats() {
  return {
    score: 0,
    highScore: 0,
    success: 0,
    fail: 0,
    total: 0,
    maxCombo: 0,
    perfectCount: 0,
  };
}

function loadModeStats(mode) {
  const prefix = `alchemist_${mode}_`;
  return {
    score: 0,
    highScore: parseInt(localStorage.getItem(`${prefix}highScore`)) || 0,
    success: parseInt(localStorage.getItem(`${prefix}success`)) || 0,
    fail: parseInt(localStorage.getItem(`${prefix}fail`)) || 0,
    total: parseInt(localStorage.getItem(`${prefix}total`)) || 0,
    maxCombo: parseInt(localStorage.getItem(`${prefix}maxCombo`)) || 0,
    perfectCount: parseInt(localStorage.getItem(`${prefix}perfectCount`)) || 0,
  };
}

export const state = {
  currentRGB: { r: 0, g: 0, b: 0 },
  targetRGB: { r: 0, g: 0, b: 0 },
  pourInterval: null,
  isPaused: false,
  hasActiveOrder: false,
  gameMode: localStorage.getItem("alchemistGameMode") || "ranked",
  combo: 0,
  currentLevel: "medium",
  playerLevel: 1,
  hintUsed: 0,
  hintQuota: 1,
  hintRevealed: { r: false, g: false, b: false },

  modeData: {
    classic: loadModeStats("classic"),
    ranked: loadModeStats("ranked"),
  },

  score: 0,
  highScore: 0,
  stats: createFreshStats(),

  hintBonusAchievementIds: [
    "hint_bonus_apprentice",
    "hint_bonus_expert",
    "hint_bonus_legend",
  ],
  achievements: [
    {
      id: "first_potion",
      name: "Beginner",
      desc: "Complete your first potion",
      icon: "beaker",
      condition: (s) => s.stats.success >= 1,
    },
    {
      id: "ten_potions",
      name: "Apprentice",
      desc: "Complete 10 potions",
      icon: "beaker",
      condition: (s) => s.stats.success >= 10,
    },
    {
      id: "fifty_potions",
      name: "Journeyman",
      desc: "Complete 50 potions",
      icon: "sparkles",
      condition: (s) => s.stats.success >= 50,
    },
    {
      id: "hundred_potions",
      name: "Master Alchemist",
      desc: "Complete 100 potions",
      icon: "trophy",
      condition: (s) => s.stats.success >= 100,
    },
    {
      id: "combo_3",
      name: "Combo Starter",
      desc: "Reach a 3x combo streak",
      icon: "fire",
      condition: (s) => s.stats.maxCombo >= 3,
    },
    {
      id: "combo_5",
      name: "Combo Master",
      desc: "Reach a 5x combo streak",
      icon: "fire",
      condition: (s) => s.stats.maxCombo >= 5,
    },
    {
      id: "combo_10",
      name: "Unstoppable",
      desc: "Reach a 10x combo streak",
      icon: "bolt",
      condition: (s) => s.stats.maxCombo >= 10,
    },
    {
      id: "score_500",
      name: "High Scorer",
      desc: "Reach 500 total score",
      icon: "star",
      condition: (s) => s.highScore >= 500,
    },
    {
      id: "score_1000",
      name: "Elite Scorer",
      desc: "Reach 1000 total score",
      icon: "star",
      condition: (s) => s.highScore >= 1000,
    },
    {
      id: "score_2000",
      name: "Legendary",
      desc: "Reach 2000 total score",
      icon: "sparkles",
      condition: (s) => s.highScore >= 2000,
    },
    {
      id: "perfect_1",
      name: "Perfectionist",
      desc: "Achieve 95%+ accuracy",
      icon: "sparkles",
      condition: (s) => s.stats.perfectCount >= 1,
    },
    {
      id: "perfect_10",
      name: "Precision Master",
      desc: "Achieve 95%+ accuracy 10 times",
      icon: "sparkles",
      condition: (s) => s.stats.perfectCount >= 10,
    },
    {
      id: "hint_bonus_apprentice",
      name: "Hint Apprentice",
      desc: "Complete 15 successful potions (+1 hint bonus)",
      icon: "lightbulb",
      condition: (s) => s.stats.success >= 15,
    },
    {
      id: "hint_bonus_expert",
      name: "Hint Expert",
      desc: "Complete 40 successful potions (+1 hint bonus)",
      icon: "lightbulb",
      condition: (s) => s.stats.success >= 40,
    },
    {
      id: "hint_bonus_legend",
      name: "Hint Legend",
      desc: "Complete 80 successful potions (+1 hint bonus)",
      icon: "lightbulb",
      condition: (s) => s.stats.success >= 80,
    },
  ],
  unlockedAchievements:
    JSON.parse(localStorage.getItem("alchemistAchievements")) || [],
  customerRequests: [
    '"Brew me this potion!"',
    '"I need this color, hurry!"',
    '"Can you make this?"',
    '"A magic potion, please!"',
    '"This is my order, don\'t mess up!"',
    '"This color is rare, be careful!"',
    '"Quickly! I\'m in a rush!"',
    '"This potion is for an important ritual..."',
    '"Mix it precisely!"',
    '"I heard you\'re a master mixer?"',
  ],
  levelSettings: {
    easy: { timerDuration: 25, colorRange: 128, bonusMultiplier: 1 },
    medium: { timerDuration: 18, colorRange: 256, bonusMultiplier: 1.5 },
    hard: { timerDuration: 12, colorRange: 256, bonusMultiplier: 2 },
  },
  emojis: ["🧙‍♂️", "🧝‍♀️", "🧛‍♂️", "🧚", "🧟"],
};

export function activateModeData(s = state) {
  const data = s.modeData[s.gameMode];
  s.score = data.score;
  s.highScore = data.highScore;
  s.stats = data;
}

export function getHintQuota(s = state) {
  const base = 1;
  const milestoneBonus = Math.floor(s.stats.success / 25);
  const achievementBonus = s.unlockedAchievements.filter((id) =>
    s.hintBonusAchievementIds.includes(id),
  ).length;
  return Math.max(0, base + milestoneBonus + achievementBonus);
}

export function computePlayerLevel(s = state) {
  return Math.floor(s.stats.success / 5) + 1;
}

export function syncLevelAndDifficulty(s = state) {
  if (s.gameMode === "classic") {
    s.currentLevel = "medium";
  } else {
    s.playerLevel = computePlayerLevel(s);
    if (s.playerLevel <= 3) s.currentLevel = "easy";
    else if (s.playerLevel <= 7) s.currentLevel = "medium";
    else s.currentLevel = "hard";
  }
  const levelTextEl = document.getElementById("level-text");
  if (levelTextEl)
    levelTextEl.innerText =
      s.gameMode === "classic" ? "Classic" : `Lv ${s.playerLevel}`;
}

export function saveProgress(s = state) {
  const prefix = `alchemist_${s.gameMode}_`;
  s.highScore = Math.max(s.highScore, s.score);
  s.stats.highScore = s.highScore;
  s.stats.score = s.score;

  s.modeData[s.gameMode] = s.stats;

  localStorage.setItem(`${prefix}highScore`, s.highScore);
  localStorage.setItem(`${prefix}success`, s.stats.success);
  localStorage.setItem(`${prefix}fail`, s.stats.fail);
  localStorage.setItem(`${prefix}total`, s.stats.total);
  localStorage.setItem(`${prefix}maxCombo`, s.stats.maxCombo);
  localStorage.setItem(`${prefix}perfectCount`, s.stats.perfectCount);
  localStorage.setItem(
    "alchemistAchievements",
    JSON.stringify(s.unlockedAchievements),
  );
}
