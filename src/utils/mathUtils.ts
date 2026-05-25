/**
 * @module mathUtils
 * Generic math helpers used throughout Chromatica v2.
 */

/**
 * Clamps `value` to the inclusive range [`min`, `max`].
 * @param value - The number to clamp.
 * @param min   - Lower bound.
 * @param max   - Upper bound.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linearly interpolates between `a` and `b` by factor `t`.
 * @param a - Start value (returned when t = 0).
 * @param b - End value   (returned when t = 1).
 * @param t - Interpolation factor, typically 0-1.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Returns a random integer in the inclusive range [`min`, `max`].
 */
export function randomInt(min: number, max: number): number {
  const lo = Math.ceil(min);
  const hi = Math.floor(max);
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

/**
 * Returns a random floating-point number in [`min`, `max`).
 */
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Cubic ease-out: fast start, decelerating to a stop.
 * @param t - Progress 0-1.
 */
export function easeOutCubic(t: number): number {
  const t1 = 1 - t;
  return 1 - t1 * t1 * t1;
}

/**
 * Quadratic ease-in-out: accelerates then decelerates symmetrically.
 * @param t - Progress 0-1.
 */
export function easeInOutQuad(t: number): number {
  return t < 0.5
    ? 2 * t * t
    : 1 - (-2 * t + 2) ** 2 / 2;
}
