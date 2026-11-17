/** Oxygen is in mmHg, distance in cm, and time in seconds. */
export interface OxygenParameters { diffusion: number; vmax: number; km: number; critical: number; hypoxiaMaxPerDay: number; dx: number; boundary: number }
/** Buchwald (2009): concentrations mol/m³, diffusivity m²/s, length m, time s. */
export interface BuchwaldParameters { diffusion: number; rmax: number; km: number; critical: number; smoothingWidth: number; dx: number; boundary: number }
export function buchwaldConsumptionFactor(concentration: number, critical: number, width: number): number {
  if (![concentration, critical, width].every(Number.isFinite) || concentration < 0 || critical < 0 || width <= 0) throw new RangeError('Invalid oxygen threshold');
  const z = (concentration - critical) / width;
  return z <= -1 ? 0 : z >= 1 ? 1 : (1 + z + Math.sin(Math.PI * z) / Math.PI) / 2;
}
/** Reflecting core, fixed surface; this is a 1-D slab, not Buchwald's FEM geometry. */
export function buchwaldOxygenDerivative(values: readonly number[], p: BuchwaldParameters): number[] {
  if (values.length < 2 || values.some(v => !Number.isFinite(v) || v < 0) ||
      !Object.values(p).every(Number.isFinite) || p.diffusion < 0 || p.rmax < 0 || p.km <= 0 || p.critical < 0 || p.smoothingWidth <= 0 || p.dx <= 0 || p.boundary < 0 || values.at(-1) !== p.boundary) throw new RangeError('Invalid Buchwald oxygen state or parameters');
  return values.map((v, i) => i === values.length - 1 ? 0 : p.diffusion * ((i === 0 ? values[1] : values[i - 1]) - 2 * v + values[i + 1]) / p.dx ** 2 - p.rmax * v / (p.km + v) * buchwaldConsumptionFactor(v, p.critical, p.smoothingWidth));
}
/** Solve the nonlinear steady slab profile by monotone shooting from the reflecting core. */
export function steadyOxygenProfile(p: BuchwaldParameters, points: number, volumeFraction: number): number[] {
  if (!Number.isInteger(points) || points < 2 || !Number.isFinite(volumeFraction) || volumeFraction < 0 || volumeFraction > 1 || !Object.values(p).every(Number.isFinite) || p.diffusion <= 0 || p.dx <= 0 || p.km <= 0 || p.rmax < 0 || p.critical < 0 || p.smoothingWidth <= 0 || p.boundary < 0) throw new RangeError('Invalid steady oxygen parameters');
  if (p.boundary === 0) return Array(points).fill(0);
  const reaction = (c: number) => p.rmax * volumeFraction * c / (p.km + c) * buchwaldConsumptionFactor(c, p.critical, p.smoothingWidth);
  const shoot = (core: number) => {
    const result = [core, core + p.dx ** 2 * reaction(core) / (2 * p.diffusion)];
    for (let i = 1; i < points - 1; i++) {
      if (result[i] > p.boundary) return result;
      result.push(2 * result[i] - result[i - 1] + p.dx ** 2 * reaction(result[i]) / p.diffusion);
    }
    return result;
  };
  let low = 0, high = p.boundary;
  for (let i = 0; i < 100; i++) {
    const middle = (low + high) / 2;
    const trial = shoot(middle);
    if (trial.length < points || trial[points - 1] > p.boundary) high = middle; else low = middle;
  }
  const result = shoot(low);
  if (result.length !== points || Math.abs(result[points - 1] - p.boundary) > Math.max(1e-12, p.boundary * 1e-8)) throw new RangeError('Steady oxygen profile did not converge');
  result[points - 1] = p.boundary;
  return result;
}
/** Legacy phenomenological rule; not the Buchwald necrosis formulation. */
/** Values run from the symmetric core (index 0) to the fixed surface (last index). */
export function oxygenDerivative(values: readonly number[], viableFraction: number, p: OxygenParameters): number[] {
  if (values.length < 2 || values.some(x => !Number.isFinite(x) || x < 0) || !Number.isFinite(viableFraction) || viableFraction < 0 ||
      ![p.diffusion, p.vmax, p.km, p.critical, p.hypoxiaMaxPerDay, p.dx, p.boundary].every(Number.isFinite) ||
      p.diffusion < 0 || p.vmax < 0 || p.km <= 0 || p.critical <= 0 || p.hypoxiaMaxPerDay < 0 || p.dx <= 0 || p.boundary < 0 || values.at(-1) !== p.boundary) throw new RangeError('Invalid oxygen state or parameters');
  return values.map((v, i) => {
    if (i === values.length - 1) return 0;
    const left = i === 0 ? values[1] : values[i - 1];
    return p.diffusion * (left - 2 * v + values[i + 1]) / (p.dx * p.dx) - p.vmax * v / (p.km + v) * viableFraction;
  });
}
export function hypoxiaRate(core: number, p: OxygenParameters): number {
  if (!Number.isFinite(core) || core < 0 || !Number.isFinite(p.critical) || p.critical <= 0 || !Number.isFinite(p.hypoxiaMaxPerDay) || p.hypoxiaMaxPerDay < 0) throw new RangeError('Invalid hypoxia inputs');
  return core < p.critical ? p.hypoxiaMaxPerDay * (1 - core / p.critical) : 0;
}
