/** Easing functions. All take t in [0,1], return [0,1]. */

export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
}

export function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function spring(t: number, damping = 0.6, stiffness = 100): number {
  const omega = Math.sqrt(stiffness)
  return 1 - Math.exp(-damping * omega * t) * Math.cos(omega * Math.sqrt(1 - damping * damping) * t)
}

/** Linear interpolation with easing */
export function lerp(a: number, b: number, t: number, easeFn: (t: number) => number = easeOutCubic): number {
  return a + (b - a) * easeFn(Math.max(0, Math.min(1, t)))
}
