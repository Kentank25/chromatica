# Chromatica v2 — Technical Context

> **Purpose**: This file serves as system instructions for Antigravity when working on this project. It captures the complete technical state, architecture, design decisions, and conventions of the Chromatica v2 codebase.

---

## 1. Project Identity

| Key | Value |
|-----|-------|
| **Name** | Chromatica v2 |
| **Genre** | Browser-based potion-mixing color accuracy puzzle/arcade game |
| **Core Loop** | See target color → Mix ingredients → Submit potion → Get scored on accuracy |
| **Aesthetic** | "Functional Glassmorphism & Neon Mysticism" — dark theme, glassmorphic UI, glowing accents, potion-craft fantasy vibe |
| **Location** | `d:\Project\Games\chromatica-v2` |

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Runtime** | React | 19.2.x | UI rendering |
| **Language** | TypeScript | 6.0.x (strict) | Type safety |
| **Bundler** | Vite | 8.0.x | Dev server + production builds |
| **State** | Zustand | 5.0.x | Global state management (no Redux boilerplate) |
| **Routing** | React Router DOM | 7.15.x | Client-side navigation (SPA) |
| **Audio** | Howler.js | 2.2.x | SFX playback with voice limiting |
| **Styling** | Vanilla CSS | — | CSS custom properties, no Tailwind |
| **Fonts** | Google Fonts | — | Cinzel (display), JetBrains Mono (data), Inter (body) |

### Scripts
```bash
npm run dev      # Start Vite dev server (typically localhost:5173)
npm run build    # TypeScript check + production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

### Build Status
- `tsc --noEmit`: **0 errors** (verified)
- `vite build`: **82 modules, 239ms** — 278.74 KB JS (88.12 KB gzip), 51.54 KB CSS (9.53 KB gzip)


---

## 3. Architecture Overview

```
src/
├── types/              # TypeScript interfaces & type aliases
│   ├── color.types.ts  # RGB, HSL, LAB, KMCoefficients, Ingredient
│   ├── game.types.ts   # Client, GameSession, EvaluationResult, WaveResult, phases
│   └── audio.types.ts  # SFXEvent, BGMState, AudioSettings
│
├── engine/             # Framework-agnostic game logic (NO React imports)
│   ├── colorScience.ts # Kubelka-Munk mixing, sRGB↔CIELAB, Delta E (12.8 KB)
│   ├── clientGenerator.ts # NPC spawning with weighted type selection
│   ├── scoring.ts      # Potion evaluation, combo rewards
│   ├── waveManager.ts  # Wave config, difficulty curve, clear conditions
│   └── GameEngine.ts   # Session orchestrator class (11 KB)
│
├── store/              # Zustand stores
│   ├── gameStore.ts    # All session state + actions
│   └── settingsStore.ts # Audio volumes, localStorage persistence
│
├── hooks/              # Custom React hooks
│   ├── useGameLoop.ts  # requestAnimationFrame loop with delta time
│   ├── useAudio.ts     # AudioManager wrapper, settings sync
│   └── useInput.ts     # Keyboard handling, useEscapeKey
│
├── audio/
│   └── AudioManager.ts # Howler.js singleton, voice limiting, bus routing
│
├── utils/
│   ├── mathUtils.ts    # clamp, lerp, randomInt, randomFloat, easing functions
│   ├── colorUtils.ts   # rgbToHex, hexToRgb, rgbToCssString, rgbToHsl
│   └── storageUtils.ts # localStorage: high scores, settings persistence
│
├── components/
│   ├── common/         # Reusable UI primitives
│   │   ├── Button.tsx + .css       # 4 variants, 3 sizes, spring animation
│   │   ├── GlassCard.tsx + .css    # Glassmorphism container, glow options
│   │   ├── Modal.tsx + .css        # Animated overlay, Escape key, backdrop click
│   │   └── ProgressBar.tsx + .css  # Auto-color, glow, thin/normal/thick sizes
│   │
│   ├── game/           # Gameplay-specific components
│   │   ├── ColorMixer.tsx + .css   # 8-ingredient mixer with K-M preview (CORE)
│   │   ├── PotionVial.tsx + .css   # SVG bottle with bubbles + glow
│   │   ├── ClientCard.tsx + .css   # Client info, target swatch, patience bar
│   │   ├── ComboCounter.tsx + .css # Tiered combo display, next-reward hint
│   │   └── TutorialOverlay.tsx + .css # Spotlight tutorial guide (NEW)
│   │
│   └── hud/            # Heads-up display components
│       ├── GameHUD.tsx + .css      # Composite overlay: wave, score, tokens, satisfaction
│       ├── ScoreDisplay.tsx + .css # Animated count-up, gold accent
│       ├── SatisfactionBar.tsx + .css # Health bar, shake on critical
│       ├── WaveIndicator.tsx + .css   # Current wave number
│       └── TokenDisplay.tsx + .css    # Skip/Hint/AutoCorrect token buttons
│
├── screens/            # Full-page views (each has .tsx + .css)
│   ├── SplashScreen/   # Animated orbs, loading bar, auto-navigate
│   ├── MainMenu/       # Glowing title, Play/Settings/Credits
│   ├── GameScreen/     # Full gameplay: timer, mixing, eval, combos, waves
│   ├── PauseOverlay/   # Resume/Restart/Quit, volume sliders
│   ├── ResultsScreen/  # S/A/B/C/D rating, stats grid, retry
│   ├── WaveTransition/ # Full-screen celebration overlay + sparkles (NEW)
│   └── LeaderboardScreen/ # Top 10 high score table, rank, grade, date, NEW badges (NEW)
│
├── styles/             # Global CSS
│   ├── variables.css   # 50+ CSS custom properties (tokens)
│   ├── index.css       # Reset, body styles, scrollbar, utilities
│   └── animations.css  # 10+ keyframe animations
│
├── App.tsx             # React Router: / → /menu → /game → /results
└── main.tsx            # Entry: imports styles, renders <App>
```

### Data Flow
```
[User Input] → ColorMixer (local state: amounts)
                  ↓ useMemo
              mixColorsKM() → RGB
                  ↓ useEffect
              gameStore.setPlayerMix(rgb)
                  ↓ onSubmit
              evaluatePotion(target, mix, client, time, combo) → EvaluationResult
                  ↓
              gameStore: updateScore / updateSatisfaction / combo / tokens
                  ↓
              GameScreen: checkAndAdvance() → spawn next client or gameOver
```

---

## 4. Color Science Engine (Critical Path)

### 4.1 Kubelka-Munk Subtractive Mixing

The game uses the **Kubelka-Munk (K-M) two-flux reflectance model** for color mixing, not simple RGB averaging. This produces realistic subtractive mixing behavior (e.g., red + blue = dark purple, yellow + blue = greenish-brown).

**Model summary:**
- Each ingredient stores absorption (K) and scattering (S) coefficients as `[R, G, B]` tuples.
- Mixing sums weighted K and S independently per channel.
- Reflectance derived from K/S ratio: `R = 1 + K/S - √((K/S)² + 2·K/S)`
- Reflectance (linear light) → sRGB via gamma companding.

**Key function:** `mixColorsKM(ingredients: { ingredient: Ingredient; amount: number }[]): RGB`

### 4.2 sRGB ↔ CIELAB Pipeline

```
sRGB (0-255) → linearize (IEC 61966-2-1 piecewise) → CIE XYZ (D65 matrix) → CIE L*a*b*
```
- D65 reference white: `[95.047, 100.0, 108.883]`
- sRGB gamma: piecewise with linear segment ≤0.04045 and 2.4 exponent above

### 4.3 Accuracy Evaluation

- **Delta E (CIE76):** Euclidean distance in LAB space. `computeDeltaE(c1, c2): number`
- **Accuracy:** `computeAccuracy(target, submitted): number` → 0-100 scale, quadratic fall-off (0.8 exponent), max Delta E ≈ 100

### 4.4 Base Ingredients (8 pigments)

| ID | Name | Display Color | K-M Behavior |
|----|------|--------------|--------------|
| `red` | Crimson Essence | rgb(220,30,30) | Low R absorption, high G/B |
| `blue` | Azure Dust | rgb(30,60,220) | High R absorption, low B |
| `yellow` | Sol Pollen | rgb(240,220,30) | Very low R/G absorption, high B |
| `green` | Verdant Sap | rgb(30,180,50) | Absorbs R and B, reflects G |
| `white` | Moonstone Powder | rgb(245,245,240) | Near-zero absorption, high scattering |
| `black` | Void Ash | rgb(25,25,30) | Maximum absorption, minimal scattering |
| `orange` | Ember Extract | rgb(235,130,20) | Low R, moderate G, high B absorption |
| `purple` | Nightshade Tincture | rgb(140,30,180) | Moderate R, high G, low B absorption |

---

## 5. Game Mechanics

### 5.1 Gameplay Loop

1. **Splash** → auto-navigate to Main Menu after 2s loading bar
2. **Main Menu** → "Begin Brewing" starts a session
3. **Game Session:**
   - Client spawns with a target color + patience timer
   - Player adjusts ingredient amounts (0-10 each) → live K-M mix preview
   - Player submits potion → accuracy evaluated via Delta E
   - Pass: earn points + combo++ + possible token reward
   - Fail: lose satisfaction + combo reset
   - Timer expires: auto-fail
   - Satisfaction ≤ 0: game over → Results screen
4. **Wave progression** — after enough clients served, wave advances with harder difficulty

### 5.2 Client Types

| Type | Multiplier | Patience | Accuracy Threshold | Penalty |
|------|-----------|----------|-------------------|---------|
| Villager | 1.0× | 45s | 70% | 5 |
| Wizard | 2.0× | 20s | 70% | 10 |
| Zombie | 1.5× | 30s | 60% | 15 |
| Noble | 2.5× | 25s | 80% | 20 |

Client type spawning is **wave-weighted**: early waves mostly villagers, later waves introduce wizards/zombies/nobles with increasing probability.

### 5.3 Scoring

```
Base Points = floor(100 × (accuracy/100) × clientMultiplier)
Combo Bonus = +10% per combo streak level
Speed Bonus = 5-20% based on remaining time / patience
Total = (base × comboMultiplier) + speedBonus
```

Failed potions earn 0 points.

### 5.4 Combo & Token System

| Streak | Reward |
|--------|--------|
| 3× | Skip token — dismiss client without penalty |
| 5× | Hint token — reveals current accuracy |
| 7× | AutoCorrect token — auto-corrects one color channel |

### 5.5 Wave Progression

| Wave | Clients | Difficulty | Target Score |
|------|---------|-----------|-------------|
| 1 | 5 | 1.0 | 200 |
| 2 | 7 | 1.5 | 400 |
| 3 | 8 | 2.0 | 650 |
| 4 | 9 | 2.3 | 900 |
| 5 | 10 | 2.5 | 1200 |
| 6+ | 10-15 | up to 3.0 | +300/wave |

Wave clears when `clientsServed ≥ clientCount AND score ≥ targetScore`.

### 5.6 Results Rating

| Score | Grade |
|-------|-------|
| ≥ 2000 | S (gold) |
| ≥ 1000 | A (blue) |
| ≥ 500 | B (green) |
| ≥ 200 | C (orange) |
| < 200 | D (red) |

---

## 6. Design System

### 6.1 Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0B0C10` | Page background |
| `--bg-secondary` | `#1F2833` | Card backgrounds |
| `--surface` | `rgba(197,198,199, 0.08)` | Glass surfaces |
| `--surface-hover` | `rgba(197,198,199, 0.15)` | Hover state |
| `--text-primary` | `#E8E8E8` | Main text |
| `--text-secondary` | `#9CA3AF` | Secondary text |
| `--text-muted` | `#6B7280` | Labels, hints |
| `--accent-success` | `#45B6FE` | Success, primary CTA |
| `--accent-failure` | `#FF4A4A` | Failure, danger |
| `--accent-warning` | `#FFA726` | Warnings, medium state |
| `--accent-combo` | `#B44FFF` | Combo effects |
| `--accent-gold` | `#FFD700` | Score, high value |

### 6.2 Typography

| Font | Role | Import |
|------|------|--------|
| Cinzel | Display headings, titles | `var(--font-display)` |
| JetBrains Mono | Scores, data, hex values | `var(--font-mono)` |
| Inter | Body text, labels, UI | `var(--font-body)` |

### 6.3 Glass Effect Recipe
```css
background: var(--glass-bg);         /* rgba(197,198,199, 0.08) */
backdrop-filter: var(--glass-blur);  /* blur(12px) */
border: var(--glass-border);         /* 1px solid rgba(197,198,199, 0.15) */
border-radius: var(--radius-lg);     /* 12px */
```

### 6.4 Key Animations (in `animations.css`)
`fadeIn`, `fadeOut`, `slideUp`, `slideDown`, `scaleIn`, `float`, `pulse`, `shimmer`, `shake`, `glow`, `liquidBubble`, `sparkle`

### 6.5 Transitions
- `--transition-fast`: 0.15s ease (hover)
- `--transition-normal`: 0.3s ease (state changes)
- `--transition-slow`: 0.5s ease (page transitions)
- `--spring`: cubic-bezier(0.175, 0.885, 0.32, 1.275) (bouncy interactions)

---

## 7. Component API Contracts

### Common Components (all use `export default`)

| Component | Key Props | Notes |
|-----------|-----------|-------|
| `Button` | `variant: 'primary'│'secondary'│'danger'│'ghost'`, `size: 'sm'│'md'│'lg'`, `onClick`, `disabled`, `icon`, `id` | Spring animation on click |
| `GlassCard` | `glowColor: 'success'│'failure'│'combo'│'gold'│'none'`, `hoverable`, `padding: 'sm'│'md'│'lg'│'xl'` | Glass container |
| `Modal` | `isOpen`, `onClose`, `title`, `closable` | Escape key, backdrop click, body scroll lock |
| `ProgressBar` | `value`, `maxValue=100`, `color: 'auto'│color`, `size: 'thin'│'normal'│'thick'`, `glow` | Auto-color: green→yellow→red |

### Game Components (all use `export default`)

| Component | Key Props | Notes |
|-----------|-----------|-------|
| `ColorMixer` | `onSubmit: () => void`, `disabled`, `resetKey` | Reads `BASE_INGREDIENTS`, calls `mixColorsKM`, resets on client change, memoized |
| `PotionVial` | `color: RGB`, `fillLevel: 0-1`, `size: 'sm'│'md'│'lg'`, `label`, `animated` | SVG bottle with bubbles, named export, memoized |
| `ClientCard` | `client: Client│null`, `timeRemaining: number`, `maxTime: number`, `phase`, `feedback` | Dynamic expressions (😐/😤/😡/😊/🤩), low patience border/shaking cues, memoized |
| `ComboCounter` | (none — reads from store) | Hidden at combo 0, next threshold reward info, memoized |

### HUD Components (all use named `export`)

| Component | Key Props |
|-----------|-----------|
| `GameHUD` | `onUseToken`, `onPause` |
| `ScoreDisplay` | (none — reads store) |
| `SatisfactionBar` | (none — reads store) |
| `WaveIndicator` | (none — reads store) |
| `TokenDisplay` | `onUseToken` |

> **IMPORTANT — Export Style Mismatch:**
> - Common + Game components: `export default`
> - HUD components + Screens + PotionVial: named `export`
> - Import accordingly: `import Button from '...'` vs `import { GameHUD } from '...'`

---

## 8. Zustand Store Shapes

### `useGameStore` (from `src/store/gameStore.ts`)

**State fields:**
```typescript
score: number;               // Cumulative score
satisfaction: number;         // 0-100 health bar
currentWave: number;          // 1-indexed
comboStreak: number;
highestCombo: number;
potionsCompleted: number;
potionsFailed: number;
tokens: { skip: number; hint: number; autoCorrect: number };
currentClient: Client | null;
playerMix: RGB;               // Current mix color
waveHistory: WaveResult[];
timeRemaining: number;        // Seconds (float)
phase: GamePhase;             // 'idle'|'playing'|'evaluating'|'result'|'paused'|'gameOver'|'waveClear'
clientsServedThisWave: number;
waveScore: number;            // Score accumulated in current wave
```

**Actions:**
`startGame`, `setPlayerMix`, `setCurrentClient`, `updateScore`, `updateSatisfaction`, `incrementCombo`, `resetCombo`, `addToken`, `useToken`, `setPhase`, `setTimeRemaining`, `addWaveResult`, `nextWave`, `incrementPotionsCompleted`, `incrementPotionsFailed`, `incrementClientsServed`, `addWaveScore`

### `useSettingsStore` (from `src/store/settingsStore.ts`)

**State:** `masterVolume`, `bgmVolume`, `sfxVolume`, `muted` (all 0-1 floats)  
**Actions:** `setVolume(channel: 'master'|'bgm'|'sfx', value)`, `toggleMute`, `loadFromStorage`  
**Persistence:** Auto-saves to `localStorage` key `chromatica-settings` on every change.

---

## 9. Routing

| Path | Screen | Description |
|------|--------|-------------|
| `/` | SplashScreen | 2s loading → auto-navigate to `/menu` |
| `/menu` | MainMenu | Play, Settings modal, Credits modal |
| `/game` | GameScreen | Full gameplay loop |
| `/results` | ResultsScreen | Score, stats, rating, retry |

Navigation is via `useNavigate()` from React Router. No hash routing.

---

## 10. Audio System

- **AudioManager** (`src/audio/AudioManager.ts`) — Howler.js-backed singleton
- **Voice limiting** per SFX event type (prevents audio overload)
- **Bus architecture:** Master → BGM + SFX, each with independent volume
- **Current state:** Placeholder silent stubs — real `.mp3`/`.ogg` files not yet added
- **SFX events:** `pour`, `success`, `failure`, `clientArriveWizard/Zombie/Villager`, `uiClick`, `uiHover`, `comboMilestone`, `waveClear`
- **BGM states:** `ambient`, `driving`, `tension`, `silent` (crossfade not yet implemented)

---

## 11. Known Issues & Gaps

### Must Fix
- **None** — TypeScript compiles clean, production build passes.

### Future Enhancements (ordered by priority)
1. **Real audio files** — Drop `.mp3`/`.ogg` into `public/audio/`, update `AudioManager.ts` source paths
2. **PixiJS integration** — The original plan calls for PixiJS (v8) WebGL rendering for liquid shader effects in the PotionVial. Current implementation uses CSS/SVG which works for MVP.
3. **Adaptive BGM** — Web Audio API bus routing for parallel BGM layer crossfading
4. **Mobile touch optimization** — Layout works responsively but ingredient buttons could use larger touch targets
5. **Leaderboard sync** — Current leaderboard is local-only; could add cloud sync (Firebase/Supabase)
6. **Even more ingredients** — System easily supports arbitrary ingredients; can add more themed pigments


---

## 12. Development Conventions

### Code Style
- All engine code (`src/engine/`) is framework-agnostic — **no React imports**
- All components use TSX with typed props interfaces
- JSDoc comments on all public API functions in engine/
- CSS files co-located with components (ComponentName.css alongside ComponentName.tsx)

### Export Conventions (IMPORTANT)
- Common components (`Button`, `GlassCard`, `Modal`, `ProgressBar`): **`export default`**
- Game components (`ColorMixer`, `ClientCard`, `ComboCounter`): **`export default`**
- `PotionVial`: **named export** (`export const PotionVial`)
- HUD components: **named export** (`export const ScoreDisplay`)
- Screens: **named export** (`export const SplashScreen`)
- Stores: **named export** (`export const useGameStore`)
- Engine functions: **named export** (`export function mixColorsKM`)

### File Naming
- Components: PascalCase (`ColorMixer.tsx`)
- Engine/utils: camelCase (`colorScience.ts`)
- Types: camelCase with `.types.ts` suffix (`game.types.ts`)
- Styles: same name as component (`ColorMixer.css`)

### Design References
- [TryColors – Guess Mix](https://trycolors.com/games/guess-mix) — color-picking mechanics inspiration
- Pinterest pins (synthesized into "Functional Glassmorphism & Neon Mysticism" aesthetic)
