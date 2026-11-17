/** A derivative of a vector state at time t. Implementations must not mutate y. */
export type Derivative = (t: number, y: readonly number[]) => readonly number[];

/** One classical fourth-order Runge–Kutta step; time and step use caller-defined units. */
export function rk4Step(f: Derivative, t: number, y: readonly number[], dt: number): number[] {
  if (!Number.isFinite(t) || !Number.isFinite(dt) || dt <= 0 || y.length === 0 || y.some(v => !Number.isFinite(v))) {
    throw new RangeError('RK4 requires finite time and state, a nonempty state, and a positive finite step');
  }
  const evaluate = (time: number, state: readonly number[]): readonly number[] => {
    const result = f(time, state);
    if (result.length !== y.length || result.some(v => !Number.isFinite(v))) {
      throw new RangeError('Derivative must return one finite value per state variable');
    }
    return result;
  };
  const combine = (base: readonly number[], slope: readonly number[], scale: number) =>
    base.map((v, i) => v + scale * slope[i]);
  const k1 = evaluate(t, y);
  const k2 = evaluate(t + dt / 2, combine(y, k1, dt / 2));
  const k3 = evaluate(t + dt / 2, combine(y, k2, dt / 2));
  const k4 = evaluate(t + dt, combine(y, k3, dt));
  const next = y.map((v, i) => v + dt * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]) / 6);
  if (next.some(v => !Number.isFinite(v))) throw new RangeError('RK4 step produced a non-finite state');
  return next;
}
