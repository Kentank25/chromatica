import {
  Star,
  Trophy,
  Lightbulb,
  Pause,
  Play,
  Home,
  CircleCheck,
  X,
  BarChart3,
  ClipboardCheck,
  Sparkles,
  Palette,
  FlaskConical,
  Eye,
  Clock,
  Zap,
  Flame,
  createElement,
} from "lucide";

const ICON_MAP = {
  star: Star,
  trophy: Trophy,
  lightbulb: Lightbulb,
  pause: Pause,
  play: Play,
  home: Home,
  check: CircleCheck,
  x: X,
  chart: BarChart3,
  clipboard: ClipboardCheck,
  sparkles: Sparkles,
  swatch: Palette,
  beaker: FlaskConical,
  eye: Eye,
  clock: Clock,
  bolt: Zap,
  fire: Flame,
};

export function icon(name, classes = "w-5 h-5") {
  const iconData = ICON_MAP[name];
  if (!iconData) return "";
  const el = createElement(iconData);
  el.setAttribute("class", classes);
  el.setAttribute("aria-hidden", "true");
  return el.outerHTML;
}

export function setIcon(el, name, classes = "w-5 h-5") {
  if (!el) return;
  el.innerHTML = icon(name, classes);
}

export function iconText(name, text, classes = "w-5 h-5") {
  return `${icon(name, classes)}<span class="ml-1">${text}</span>`;
}
