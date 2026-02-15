// Efek ringan
export function createBubble(container) {
  if (!container) return;
  const bubble = document.createElement('div');
  bubble.className = 'bubble-lite';
  container.appendChild(bubble);
  setTimeout(() => bubble.remove(), 600);
}

export function createConfetti(container) {
  if (!container) return;
  const conf = document.createElement('div');
  conf.className = 'confetti-lite';
  container.appendChild(conf);
  setTimeout(() => conf.remove(), 800);
}

export function createSmoke(root) {
  if (!root) return;
  const smoke = document.createElement('div');
  smoke.className = 'smoke-lite';
  smoke.style.left = '50%';
  smoke.style.transform = 'translateX(-50%)';
  root.appendChild(smoke);
  setTimeout(() => smoke.remove(), 1000);
}
