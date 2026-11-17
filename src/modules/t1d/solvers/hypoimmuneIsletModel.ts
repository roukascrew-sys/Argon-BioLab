/** Blueprint phenomenological model; rates are per day. */
export interface ImmuneParameters { M1: number; C47: number; kT: number; KM: number; kNK: number; KC: number }
export function immuneFluxes(n: number, hypoxia: number, p: ImmuneParameters) {
  if (![n, hypoxia, p.M1, p.C47, p.kT, p.KM, p.kNK, p.KC].every(Number.isFinite) ||
      n < 0 || hypoxia < 0 || p.M1 < 0 || p.C47 < 0 || p.kT < 0 || p.kNK < 0 || p.KM <= 0 || p.KC <= 0) throw new RangeError('Invalid immune state or parameters');
  const tCell = p.kT * p.M1 / (p.M1 + p.KM) * n;
  const nkCell = p.kNK * p.KC / (p.C47 + p.KC) * n;
  const hypoxic = hypoxia * n;
  return { tCell, nkCell, hypoxic, derivative: -(tCell + nkCell + hypoxic) };
}
