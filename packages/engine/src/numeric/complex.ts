export interface Complex {
  re: number;
  im: number;
}

export const C = (re: number, im = 0): Complex => ({ re, im });
export const ZERO: Complex = C(0);
export const add = (a: Complex, b: Complex): Complex => C(a.re + b.re, a.im + b.im);
export const sub = (a: Complex, b: Complex): Complex => C(a.re - b.re, a.im - b.im);
export const mul = (a: Complex, b: Complex): Complex => C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
export const scale = (a: Complex, k: number): Complex => C(a.re * k, a.im * k);
export const conj = (a: Complex): Complex => C(a.re, -a.im);
export const abs = (a: Complex): number => Math.hypot(a.re, a.im);
export const arg = (a: Complex): number => Math.atan2(a.im, a.re);
export function div(a: Complex, b: Complex): Complex {
  const d = b.re * b.re + b.im * b.im;
  if (d === 0) throw new Error("numeric.division_by_zero");
  return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
}
export const polar = (mag: number, angle: number): Complex => C(mag * Math.cos(angle), mag * Math.sin(angle));
