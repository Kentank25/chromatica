import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  state,
  getHintQuota,
  computePlayerLevel,
  syncLevelAndDifficulty,
  saveProgress,
  activateModeData,
} from "../state.js";

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

describe("computePlayerLevel", () => {
  it("returns level 1 for 0 successes", () => {
    expect(computePlayerLevel({ stats: { success: 0 } })).toBe(1);
  });

  it("returns level 2 for 5 successes", () => {
    expect(computePlayerLevel({ stats: { success: 5 } })).toBe(2);
  });

  it("returns level 3 for 10 successes", () => {
    expect(computePlayerLevel({ stats: { success: 10 } })).toBe(3);
  });

  it("returns level 4 for 15 successes", () => {
    expect(computePlayerLevel({ stats: { success: 15 } })).toBe(4);
  });

  it("returns level 11 for 50 successes", () => {
    expect(computePlayerLevel({ stats: { success: 50 } })).toBe(11);
  });
});

describe("getHintQuota", () => {
  it("returns base quota of 1 for new player", () => {
    const s = {
      stats: { success: 0 },
      unlockedAchievements: [],
      hintBonusAchievementIds: state.hintBonusAchievementIds,
    };
    expect(getHintQuota(s)).toBe(1);
  });

  it("adds milestone bonus (+1 per 25 successes)", () => {
    const s = {
      stats: { success: 50 },
      unlockedAchievements: [],
      hintBonusAchievementIds: state.hintBonusAchievementIds,
    };
    // base(1) + milestone(2) = 3
    expect(getHintQuota(s)).toBe(3);
  });

  it("adds achievement bonus", () => {
    const s = {
      stats: { success: 0 },
      unlockedAchievements: ["hint_bonus_apprentice", "hint_bonus_expert"],
      hintBonusAchievementIds: state.hintBonusAchievementIds,
    };
    // base(1) + achievement(2) = 3
    expect(getHintQuota(s)).toBe(3);
  });

  it("combines milestone and achievement bonuses", () => {
    const s = {
      stats: { success: 25 },
      unlockedAchievements: ["hint_bonus_apprentice"],
      hintBonusAchievementIds: state.hintBonusAchievementIds,
    };
    // base(1) + milestone(1) + achievement(1) = 3
    expect(getHintQuota(s)).toBe(3);
  });
});

describe("syncLevelAndDifficulty", () => {
  beforeEach(() => {
    // Create mock DOM elements
    document.body.innerHTML = '<span id="level-text"></span>';
  });

  it("sets medium for classic mode", () => {
    const s = {
      gameMode: "classic",
      stats: { success: 100 },
      playerLevel: 1,
      currentLevel: "easy",
    };
    syncLevelAndDifficulty(s);
    expect(s.currentLevel).toBe("medium");
  });

  it("sets easy for ranked player level 1-3", () => {
    const s = {
      gameMode: "ranked",
      stats: { success: 0 },
      playerLevel: 1,
      currentLevel: "medium",
    };
    syncLevelAndDifficulty(s);
    expect(s.currentLevel).toBe("easy");
    expect(s.playerLevel).toBe(1);
  });

  it("sets medium for ranked player level 4-7", () => {
    const s = {
      gameMode: "ranked",
      stats: { success: 20 },
      playerLevel: 1,
      currentLevel: "easy",
    };
    syncLevelAndDifficulty(s);
    expect(s.currentLevel).toBe("medium");
    expect(s.playerLevel).toBe(5);
  });

  it("sets hard for ranked player level 8+", () => {
    const s = {
      gameMode: "ranked",
      stats: { success: 40 },
      playerLevel: 1,
      currentLevel: "easy",
    };
    syncLevelAndDifficulty(s);
    expect(s.currentLevel).toBe("hard");
    expect(s.playerLevel).toBe(9);
  });
});

describe("saveProgress", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("saves to localStorage with mode-specific keys", () => {
    const s = {
      gameMode: "ranked",
      score: 150,
      highScore: 100,
      stats: {
        success: 5,
        fail: 2,
        total: 7,
        maxCombo: 3,
        perfectCount: 1,
        highScore: 0,
        score: 0,
      },
      modeData: { classic: {}, ranked: {} },
      unlockedAchievements: ["first_potion"],
    };
    saveProgress(s);

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "alchemist_ranked_highScore",
      150,
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "alchemist_ranked_success",
      5,
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "alchemist_ranked_fail",
      2,
    );
  });

  it("updates highScore to max of current score and stored highScore", () => {
    const s = {
      gameMode: "classic",
      score: 200,
      highScore: 150,
      stats: {
        success: 10,
        fail: 0,
        total: 10,
        maxCombo: 5,
        perfectCount: 3,
        highScore: 0,
        score: 0,
      },
      modeData: { classic: {}, ranked: {} },
      unlockedAchievements: [],
    };
    saveProgress(s);
    expect(s.highScore).toBe(200); // max(200, 150) = 200
  });

  it("does not decrease highScore when score drops", () => {
    const s = {
      gameMode: "ranked",
      score: 50,
      highScore: 300,
      stats: {
        success: 3,
        fail: 5,
        total: 8,
        maxCombo: 2,
        perfectCount: 0,
        highScore: 0,
        score: 0,
      },
      modeData: { classic: {}, ranked: {} },
      unlockedAchievements: [],
    };
    saveProgress(s);
    expect(s.highScore).toBe(300); // max(300, 50) = 300
  });
});

describe("activateModeData", () => {
  it("loads correct mode data into state", () => {
    const s = {
      gameMode: "ranked",
      score: 0,
      highScore: 0,
      stats: {},
      modeData: {
        classic: {
          score: 100,
          highScore: 200,
          success: 10,
          fail: 2,
          total: 12,
          maxCombo: 4,
          perfectCount: 2,
        },
        ranked: {
          score: 50,
          highScore: 500,
          success: 20,
          fail: 5,
          total: 25,
          maxCombo: 7,
          perfectCount: 5,
        },
      },
    };
    activateModeData(s);
    expect(s.score).toBe(50);
    expect(s.highScore).toBe(500);
    expect(s.stats.success).toBe(20);
  });

  it("switches between modes correctly", () => {
    const s = {
      gameMode: "classic",
      score: 0,
      highScore: 0,
      stats: {},
      modeData: {
        classic: {
          score: 100,
          highScore: 200,
          success: 10,
          fail: 2,
          total: 12,
          maxCombo: 4,
          perfectCount: 2,
        },
        ranked: {
          score: 50,
          highScore: 500,
          success: 20,
          fail: 5,
          total: 25,
          maxCombo: 7,
          perfectCount: 5,
        },
      },
    };
    activateModeData(s);
    expect(s.highScore).toBe(200);

    s.gameMode = "ranked";
    activateModeData(s);
    expect(s.highScore).toBe(500);
  });
});
