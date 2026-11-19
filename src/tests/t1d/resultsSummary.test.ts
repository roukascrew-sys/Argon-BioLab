import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { summarizeRun } from '../../modules/t1d/utils/resultsSummary.ts';
import type { Run } from '../../modules/t1d/utils/simulation.ts';

test('summary weights time in range by interval and reports the final graft state', () => {
  const run = { params: { Gb: 100 }, frames: [
    { time: 0, glucose: 60, viability: 1 },
    { time: 1, glucose: 70, viability: 0.8 },
    { time: 4, glucose: 180, viability: 0.5 },
    { time: 5, glucose: 181, viability: 0.4 }
  ] } as unknown as Run;
  const result = summarizeRun(run);
  assert.equal(result.timeInRangePercent, 80);
  assert.equal(result.peak, 181);
  assert.equal(result.minimum, 60);
  assert.equal(result.excursion, 81);
  assert.equal(result.viabilityPercent, 40);
});
