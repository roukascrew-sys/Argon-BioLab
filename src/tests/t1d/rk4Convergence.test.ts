import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { rk4Step } from '../../modules/t1d/solvers/rk4.ts';

function solve(dt: number): number {
  let state = [1];
  for (let i = 0; i < Math.round(1 / dt); i++) state = rk4Step((_t, y) => [-y[0]], i * dt, state, dt);
  return state[0];
}

test('RK4 converges at fourth order for exponential decay', () => {
  const exact = Math.exp(-1);
  const coarseError = Math.abs(solve(0.1) - exact);
  const fineError = Math.abs(solve(0.05) - exact);
  assert.ok(coarseError / fineError > 15);
  assert.ok(fineError / exact < 0.0001);
});

test('RK4 evaluates time-dependent coupled derivatives at intermediate stages', () => {
  const result = rk4Step((t, y) => [t, y[0]], 0, [0, 0], 1);
  assert.ok(Math.abs(result[0] - 0.5) < 1e-14);
  assert.ok(Math.abs(result[1] - 1 / 6) < 1e-14);
});

test('RK4 rejects invalid inputs and derivative outputs', () => {
  assert.throws(() => rk4Step(() => [1], 0, [0], 0));
  assert.throws(() => rk4Step(() => [NaN], 0, [0], 0.1));
  assert.throws(() => rk4Step(() => [], 0, [0], 0.1));
});
