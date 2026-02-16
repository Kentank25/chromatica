// Timer module — fixes the pause/resume bug by properly tracking remaining time

let timerInterval = null;
let remainingMs = 0;
let onTickCallback = null;
let onExpireCallback = null;
let isPaused = false;
let startTimestamp = 0;
let durationForThisRun = 0;

export function getTimerState() {
  return { remainingMs, isPaused };
}

export function startTimer(totalMs, onTick, onExpire) {
  clearTimer();
  remainingMs = totalMs;
  durationForThisRun = totalMs;
  onTickCallback = onTick;
  onExpireCallback = onExpire;
  isPaused = false;
  startTimestamp = Date.now();

  timerInterval = setInterval(() => {
    if (isPaused) return;
    const elapsed = Date.now() - startTimestamp;
    remainingMs = Math.max(0, durationForThisRun - elapsed);
    const pct = (remainingMs / totalMs) * 100;

    if (onTickCallback) onTickCallback(pct, remainingMs);

    if (remainingMs <= 0) {
      clearTimer();
      if (onExpireCallback) onExpireCallback();
    }
  }, 100);
}

export function pauseTimer() {
  if (isPaused || !timerInterval) return;
  isPaused = true;
  // Snapshot the remaining time at pause moment
  const elapsed = Date.now() - startTimestamp;
  remainingMs = Math.max(0, durationForThisRun - elapsed);
}

export function resumeTimer(totalMsForPercent) {
  if (!isPaused || !timerInterval) return;
  isPaused = false;
  // Reset the clock references so elapsed calculation is correct from this point
  durationForThisRun = remainingMs;
  startTimestamp = Date.now();
}

export function clearTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  isPaused = false;
}

export function isTimerPaused() {
  return isPaused;
}
