/** The pasted blueprint equations, not a complete UVA/Padova simulator. Time is in minutes. */
export interface MetabolicParameters { kd: number; ka1: number; ka2: number; ke: number; p2: number; p3: number; SG: number; VG: number; Gb: number; Ib: number }
export interface MetabolicState { sc1: number; sc2: number; plasma: number; action: number; glucose: number }

/** Single-meal gastrointestinal model. Masses are mg, time minutes, weight kg. */
export interface MealState { sto1: number; sto2: number; gut: number }
export interface MealParameters { kgri: number; kmin: number; kmax: number; kabs: number; fraction: number; b: number; d: number; dose: number; bodyWeight: number }
export function mealDerivative(s: MealState, p: MealParameters, ingestion: number) {
  if (![...Object.values(s), ...Object.values(p), ingestion].every(Number.isFinite) ||
      s.sto1 < 0 || s.sto2 < 0 || s.gut < 0 || ingestion < 0 || p.kgri < 0 || p.kmin < 0 || p.kmax < p.kmin || p.kabs < 0 ||
      p.fraction < 0 || p.fraction > 1 || p.b <= 0 || p.b >= 1 || p.d <= 0 || p.d >= 1 || p.dose <= 0 || p.bodyWeight <= 0) throw new RangeError('Invalid meal state or parameters');
  const stomach = s.sto1 + s.sto2;
  const alpha = 5 / (2 * p.dose * (1 - p.b));
  const beta = 5 / (2 * p.dose * p.d);
  const emptying = p.kmin + (p.kmax - p.kmin) / 2 * (Math.tanh(alpha * (stomach - p.b * p.dose)) - Math.tanh(beta * (stomach - p.d * p.dose)) + 2);
  const transit = emptying * s.sto2;
  return { sto1: ingestion - p.kgri * s.sto1, sto2: p.kgri * s.sto1 - transit,
    gut: transit - p.kabs * s.gut, appearance: p.fraction * p.kabs * s.gut / p.bodyWeight, emptying };
}
export function metabolicDerivative(s: MetabolicState, p: MetabolicParameters, infusion: number, mealAppearance: number): MetabolicState {
  if (![...Object.values(s), ...Object.values(p), infusion, mealAppearance].every(Number.isFinite) ||
      s.sc1 < 0 || s.sc2 < 0 || s.plasma < 0 || s.glucose < 0 || infusion < 0 || mealAppearance < 0 ||
      p.kd < 0 || p.ka1 < 0 || p.ka2 < 0 || p.ke < 0 || p.p2 < 0 || p.p3 < 0 || p.SG < 0 || p.VG <= 0 || p.Gb < 0 || p.Ib < 0) throw new RangeError('Invalid metabolic state, parameters, or inputs');
  const { sc1, sc2, plasma, action, glucose } = s;
  return { sc1: infusion - (p.kd + p.ka1) * sc1, sc2: p.kd * sc1 - p.ka2 * sc2,
    plasma: p.ka1 * sc1 + p.ka2 * sc2 - p.ke * plasma,
    action: -p.p2 * action + p.p3 * (plasma - p.Ib),
    glucose: -(p.SG + action) * glucose + p.SG * p.Gb + mealAppearance / p.VG };
}
