import "../css/styles.css";
import { setIcon } from "./icons.js";
import { state, activateModeData } from "./state.js";
import {
  startPour,
  stopPour,
  startDecrement,
  stopDecrement,
  resetCauldron,
  checkResult,
  handleHint,
  takeNewOrder,
  togglePause,
  backToMenu,
  selectMode,
  showModeMenu,
  showAchievementModal,
  closeAchievementModal,
  closeResultModal,
  updateUI,
} from "./game.js";

const q = (sel) => document.querySelector(sel);
const TUTORIAL_HIDE_KEY = "alchemistHideTutorial";

// ── Icon Hydration ───────────────────────────────────────────────

function hydrateIcons() {
  setIcon(
    q("#icon-score"),
    "star",
    "w-4 h-4 text-amber-300 filter drop-shadow-sm",
  );
  setIcon(
    q("#icon-highscore"),
    "trophy",
    "w-4 h-4 text-amber-100 filter drop-shadow-sm",
  );
  setIcon(
    q("#icon-level"),
    "swatch",
    "w-4 h-4 text-indigo-300 filter drop-shadow-sm",
  );
  setIcon(q("#icon-header-hint"), "lightbulb", "w-5 h-5 filter drop-shadow-sm");
  setIcon(q("#icon-pause"), "pause", "w-5 h-5 filter drop-shadow-sm");
  setIcon(q("#icon-back"), "home", "w-5 h-5 filter drop-shadow-sm");
  setIcon(
    q("#icon-success"),
    "check",
    "w-4 h-4 text-emerald-400 filter drop-shadow-sm",
  );
  setIcon(q("#icon-fail"), "x", "w-4 h-4 text-rose-400 filter drop-shadow-sm");
  setIcon(
    q("#icon-achievements"),
    "sparkles",
    "w-6 h-6 text-amber-300 filter drop-shadow-md animate-pulse",
  );
  setIcon(q("#icon-achievement-title"), "sparkles", "w-6 h-6 text-amber-400");
  setIcon(q("#icon-next"), "clipboard", "w-5 h-5");
  setIcon(q("#icon-hint"), "lightbulb", "w-4 h-4");

  // Tutorial Icons
  setIcon(q("#tutorial-icon-target"), "swatch", "w-6 h-6");
  setIcon(q("#tutorial-icon-pour"), "beaker", "w-6 h-6");
  setIcon(q("#tutorial-icon-vision"), "eye", "w-6 h-6");
  setIcon(q("#tutorial-icon-timer"), "clock", "w-6 h-6");

  setIcon(q("#popup-achievement-icon"), "sparkles", "w-6 h-6 text-amber-300");
}

// ── Tutorial ─────────────────────────────────────────────────────

function openTutorial(force = false) {
  const modal = q("#tutorial-modal");
  if (!modal) return;
  const dontShow = localStorage.getItem(TUTORIAL_HIDE_KEY) === "true";
  if (dontShow && !force) return;
  const checkbox = q("#dont-show-tutorial");
  if (checkbox) checkbox.checked = false;
  modal.classList.remove("hidden");
}

function closeTutorial() {
  const modal = q("#tutorial-modal");
  if (!modal) return;
  const checkbox = q("#dont-show-tutorial");
  if (checkbox && checkbox.checked)
    localStorage.setItem(TUTORIAL_HIDE_KEY, "true");
  modal.classList.add("hidden");
}

// ── Event Binding ────────────────────────────────────────────────

function bindHoldButton(id, onStart, onStop) {
  const btn = document.getElementById(id);
  btn.addEventListener(
    "pointerdown",
    (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      btn.setPointerCapture(e.pointerId);
      onStart();
      btn.classList.add("touching");
    },
    { passive: false },
  );
  const stop = () => {
    onStop();
    btn.classList.remove("touching");
  };
  btn.addEventListener("pointerup", stop, { passive: false });
  btn.addEventListener("pointercancel", stop, { passive: false });
  btn.addEventListener("lostpointercapture", stop, { passive: false });
}

function bindEvents() {
  // Pour buttons (hold to increase)
  bindHoldButton("btn-r", () => startPour("r"), stopPour);
  bindHoldButton("btn-g", () => startPour("g"), stopPour);
  bindHoldButton("btn-b", () => startPour("b"), stopPour);

  // Decrement buttons (hold to decrease)
  bindHoldButton("btn-dec-r", () => startDecrement("r"), stopDecrement);
  bindHoldButton("btn-dec-g", () => startDecrement("g"), stopDecrement);
  bindHoldButton("btn-dec-b", () => startDecrement("b"), stopDecrement);

  q("#btn-submit").onclick = checkResult;
  q("#btn-reset").onclick = resetCauldron;
  q("#btn-next-customer").onclick = takeNewOrder;
  q("#btn-hint").onclick = handleHint;
  q("#btn-achievements").onclick = showAchievementModal;
  q("#btn-pause").onclick = togglePause;
  q("#btn-back-menu").onclick = backToMenu;
  q("#btn-menu-classic").onclick = () => selectMode("classic");
  q("#btn-menu-ranked").onclick = () => selectMode("ranked");
  q("#btn-howto").onclick = () => openTutorial(true);
  q("#result-modal .btn-main").onclick = closeResultModal;
  q("#achievement-modal .btn-main").onclick = closeAchievementModal;

  const tutorialClose = q("#tutorial-modal .btn-main");
  if (tutorialClose) tutorialClose.onclick = closeTutorial;
}

// ── Init ─────────────────────────────────────────────────────────

function init() {
  activateModeData();
  bindEvents();
  hydrateIcons();
  showModeMenu();
}

document.addEventListener("DOMContentLoaded", init);
