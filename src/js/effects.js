const CONFIG = {
  bubbleColors: [
    "bg-rose-400",
    "bg-emerald-400",
    "bg-sky-400",
    "bg-purple-400",
    "bg-white",
  ],
  confettiColors: ["#f43f5e", "#34d399", "#38bdf8", "#fbbf24", "#a78bfa"],
};

export function createBubble(container) {
  if (!container) return;
  const bubble = document.createElement("div");
  const size = Math.random() * 10 + 5 + "px";
  const colorClass =
    CONFIG.bubbleColors[Math.floor(Math.random() * CONFIG.bubbleColors.length)];
  const left = Math.random() * 100 + "%";
  const duration = Math.random() * 2 + 1 + "s";
  const delay = Math.random() * 1 + "s";

  bubble.className = `absolute bottom-0 rounded-full opacity-60 animate-[bubble-rise_3s_ease-in_infinite] ${colorClass}`;
  bubble.style.width = size;
  bubble.style.height = size;
  bubble.style.left = left;
  bubble.style.animationDuration = duration;
  bubble.style.animationDelay = delay;

  container.appendChild(bubble);

  setTimeout(() => bubble.remove(), 3000);
}

export function createConfetti(container) {
  if (!container) return;
  for (let i = 0; i < 30; i++) {
    const conf = document.createElement("div");
    const color =
      CONFIG.confettiColors[
        Math.floor(Math.random() * CONFIG.confettiColors.length)
      ];
    const left = Math.random() * 100 + "vw";
    const animDuration = Math.random() * 3 + 2 + "s";
    const size = Math.random() * 8 + 4 + "px";

    conf.className =
      "absolute top-[-20px] z-50 animate-[confetti-fall_4s_linear_forwards]";
    conf.style.backgroundColor = color;
    conf.style.left = left;
    conf.style.width = size;
    conf.style.height = size * 0.6 + "px";
    conf.style.animationDuration = animDuration;
    conf.style.transform = `rotate(${Math.random() * 360}deg)`;

    container.appendChild(conf);
    setTimeout(() => conf.remove(), 5000);
  }
}

export function createSmoke(root) {
  if (!root) return;
  const smoke = document.createElement("div");
  const size = Math.random() * 40 + 20 + "px";

  smoke.className =
    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-500/30 rounded-full blur-xl animate-[smoke-rise_1.5s_ease-out_forwards]";
  smoke.style.width = size;
  smoke.style.height = size;

  root.appendChild(smoke);
  setTimeout(() => smoke.remove(), 1500);
}
