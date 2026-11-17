import type { Run } from './simulation.ts';
/** Time in range is the fraction of simulated time in [70,180] mg/dL,
 * using the left-hand sample for each recorded interval. */
export function summarizeRun(run: Run) {
  if (run.frames.length < 2) throw new RangeError('A summary needs a trajectory with at least two samples');
  let duration = 0, inRange = 0, peak = -Infinity, minimum = Infinity;
  for (let i = 0; i < run.frames.length; i++) {
    const frame = run.frames[i];
    peak = Math.max(peak, frame.glucose);
    minimum = Math.min(minimum, frame.glucose);
    if (i + 1 < run.frames.length) {
      const dt = run.frames[i + 1].time - frame.time;
      if (!Number.isFinite(dt) || dt <= 0) throw new RangeError('Trajectory times must strictly increase');
      duration += dt;
      if (frame.glucose >= 70 && frame.glucose <= 180) inRange += dt;
    }
  }
  const finalViability = run.frames[run.frames.length - 1].viability;
  return { timeInRangePercent: 100 * inRange / duration, peak, minimum,
    excursion: peak - run.params.Gb, viabilityPercent: Number.isFinite(finalViability) ? finalViability * 100 : null };
}
