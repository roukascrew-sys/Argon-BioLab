// src/modules/t1d/registry/t1dParameterRegistry.ts
var citation = "Dalla Man et al. (2014), The UVA/PADOVA Type 1 Diabetes Simulator: New Features";
var cohort = (id, value, minBound, maxBound) => Object.freeze({
  id,
  symbol: "Gb",
  name: `${id} fasting plasma glucose`,
  value,
  unit: "mg/dL",
  minBound,
  maxBound,
  sourceCitation: citation,
  doi: "10.1177/1932296813514502",
  sourceLocation: "Table 1",
  provenanceType: "LITERATURE_TABLE",
  validityWarning: "Population summary; not an individual patient parameter."
});
var fixed = (id, symbol, value, unit, sourceCitation, doi, sourceLocation) => Object.freeze({
  id,
  symbol,
  name: id,
  value,
  unit,
  minBound: null,
  maxBound: null,
  sourceCitation,
  doi,
  sourceLocation,
  provenanceType: "LITERATURE_TABLE",
  validityWarning: "Source value; physiological bounds not reported."
});
var buchwald = "Buchwald (2009), FEM-based oxygen consumption and cell viability models for avascular pancreatic islets";
var gim = "Dalla Man et al. (2007), GIM, Simulation Software of Meal Glucose\u2013Insulin Model";
var meal = "Dalla Man, Rizza and Cobelli (2007), Meal Simulation Model of the Glucose-Insulin System";
var assumed = (id, symbol, value, unit, doi) => Object.freeze({
  id,
  symbol,
  name: id,
  value,
  unit,
  minBound: value,
  maxBound: value,
  sourceCitation: "Project blueprint, user-specified reduced-model assumption; DOI is contextual",
  doi,
  sourceLocation: "Canonical T1D Mathematical Specification, Pass 1",
  provenanceType: "MODEL_ASSUMPTION",
  validityWarning: "Assumption; neither a literature-derived estimate nor a validated physiological bound."
});
var T1D_PARAMETER_REGISTRY = Object.freeze({
  adultFastingGlucose: cohort("adult", 119.6, 107.5, 137.8),
  adolescentFastingGlucose: cohort("adolescent", 118.1, 105.7, 142.3),
  childFastingGlucose: cohort("child", 119.8, 104.7, 134.3),
  oxygenDiffusivityTissue: fixed("oxygenDiffusivityTissue", "D", 2e-9, "m\xB2/s", buchwald, "10.1186/1742-4682-6-5", "Methods: Oxygen diffusion and consumption"),
  oxygenMaxConsumption: fixed("oxygenMaxConsumption", "Rmax", 0.034, "mol/(m\xB3 s)", buchwald, "10.1186/1742-4682-6-5", "Methods: Oxygen diffusion and consumption"),
  oxygenKm: fixed("oxygenKm", "CMM", 1e-3, "mol/m\xB3", buchwald, "10.1186/1742-4682-6-5", "Methods: Oxygen diffusion and consumption"),
  oxygenCritical: fixed("oxygenCritical", "Ccr", 1e-4, "mol/m\xB3", buchwald, "10.1186/1742-4682-6-5", "Methods: Oxygen diffusion and consumption"),
  oxygenSmoothingWidth: fixed("oxygenSmoothingWidth", "epsilon", 5e-5, "mol/m\xB3", buchwald, "10.1186/1742-4682-6-5", "Methods: Oxygen diffusion and consumption"),
  insulinKd: fixed("insulinKd", "kd", 0.0164, "min\u207B\xB9", gim, "10.1177/193229680700100303", "Table 1"),
  insulinKa1: fixed("insulinKa1", "ka1", 18e-4, "min\u207B\xB9", gim, "10.1177/193229680700100303", "Table 1"),
  insulinKa2: fixed("insulinKa2", "ka2", 0.0182, "min\u207B\xB9", gim, "10.1177/193229680700100303", "Table 1"),
  sensorDelay: fixed("sensorDelay", "Td", 10, "min", gim, "10.1177/193229680700100303", "Table 1, glucose sensor delay"),
  mealKmax: fixed("mealKmax", "kmax", 0.0558, "min\u207B\xB9", meal, "10.1109/TBME.2007.893506", "Table I, normal subjects"),
  mealKmin: fixed("mealKmin", "kmin", 8e-3, "min\u207B\xB9", meal, "10.1109/TBME.2007.893506", "Table I, normal subjects"),
  mealKabs: fixed("mealKabs", "kabs", 0.057, "min\u207B\xB9", meal, "10.1109/TBME.2007.893506", "Table I, normal subjects"),
  mealKgri: fixed("mealKgri", "kgri", 0.0558, "min\u207B\xB9", meal, "10.1109/TBME.2007.893506", "Table I, normal subjects"),
  mealFraction: fixed("mealFraction", "f", 0.9, "1", meal, "10.1109/TBME.2007.893506", "Table I, normal subjects"),
  mealB: fixed("mealB", "b", 0.82, "1", meal, "10.1109/TBME.2007.893506", "Table I, normal subjects"),
  mealD: fixed("mealD", "d", 0.01, "1", meal, "10.1109/TBME.2007.893506", "Table I, normal subjects"),
  effectiveInsulinVolume: assumed("effectiveInsulinVolume", "VIeff", 135, "mL/kg", "10.1109/TBME.2007.893506"),
  insulinVolume: fixed("insulinVolume", "VI", 50, "mL/kg", meal, "10.1109/TBME.2007.893506", "Table I, insulin kinetics, normal subjects"),
  vgNormal: fixed("vgNormal", "VG", 1.88, "dL/kg", meal, "10.1109/TBME.2007.893506", "Table I, glucose kinetics, normal subjects"),
  glucoseK1: fixed("glucoseK1", "k1", 0.065, "min\u207B\xB9", meal, "10.1109/TBME.2007.893506", "Table I, glucose kinetics, normal subjects"),
  glucoseK2: fixed("glucoseK2", "k2", 0.079, "min\u207B\xB9", meal, "10.1109/TBME.2007.893506", "Table I, glucose kinetics, normal subjects"),
  insulinM1: fixed("insulinM1", "m1", 0.19, "min\u207B\xB9", meal, "10.1109/TBME.2007.893506", "Table I, insulin kinetics, normal subjects"),
  insulinM2: fixed("insulinM2", "m2", 0.484, "min\u207B\xB9", meal, "10.1109/TBME.2007.893506", "Table I, insulin kinetics, normal subjects"),
  insulinM4: fixed("insulinM4", "m4", 0.194, "min\u207B\xB9", meal, "10.1109/TBME.2007.893506", "Table I, insulin kinetics, normal subjects"),
  insulinM5: fixed("insulinM5", "m5", 0.0304, "min kg/pmol", meal, "10.1109/TBME.2007.893506", "Table I, insulin kinetics, normal subjects"),
  insulinM6: fixed("insulinM6", "m6", 0.6471, "1", meal, "10.1109/TBME.2007.893506", "Table I, insulin kinetics, normal subjects"),
  mealA: fixed("mealA", "a", 13e-5, "mg\u207B\xB9", meal, "10.1109/TBME.2007.893506", "Table I, rate of appearance, normal subjects"),
  mealC: fixed("mealC", "c", 236e-5, "mg\u207B\xB9", meal, "10.1109/TBME.2007.893506", "Table I, rate of appearance, normal subjects"),
  productionKp1Normal: fixed("productionKp1Normal", "kp1", 2.7, "mg/kg/min", meal, "10.1109/TBME.2007.893506", "Table I, endogenous production, normal subjects"),
  productionKp4: fixed("productionKp4", "kp4", 0.0618, "mg/kg/min per pmol/kg", meal, "10.1109/TBME.2007.893506", "Table I, endogenous production, normal subjects"),
  hepaticExtraction: fixed("hepaticExtraction", "HEb", 0.6, "1", meal, "10.1109/TBME.2007.893506", "Table I, insulin kinetics, normal subjects"),
  productionKp2: fixed("productionKp2", "kp2", 21e-4, "min\u207B\xB9", meal, "10.1109/TBME.2007.893506", "Table I, endogenous production, normal subjects"),
  productionKp3: fixed("productionKp3", "kp3", 9e-3, "mg/kg/min per pmol/L", meal, "10.1109/TBME.2007.893506", "Table I, endogenous production, normal subjects"),
  brainUptake: fixed("brainUptake", "Fcns", 1, "mg/kg/min", meal, "10.1109/TBME.2007.893506", "Table I, glucose utilization, normal subjects"),
  utilizationVm0: fixed("utilizationVm0", "Vm0", 2.5, "mg/kg/min", meal, "10.1109/TBME.2007.893506", "Table I, glucose utilization, normal subjects"),
  utilizationVmx: fixed("utilizationVmx", "Vmx", 0.047, "mg/kg/min per pmol/L", meal, "10.1109/TBME.2007.893506", "Table I, glucose utilization, normal subjects"),
  utilizationKm0: fixed("utilizationKm0", "Km0", 225.59, "mg/kg", meal, "10.1109/TBME.2007.893506", "Table I, glucose utilization, normal subjects"),
  actionP2u: fixed("actionP2u", "p2U", 0.0331, "min\u207B\xB9", meal, "10.1109/TBME.2007.893506", "Table I, glucose utilization, normal subjects"),
  insulinDelay: fixed("insulinDelay", "ki", 79e-4, "min\u207B\xB9", meal, "10.1109/TBME.2007.893506", "Table I, endogenous production, normal subjects"),
  renalKe1: fixed("renalKe1", "ke1", 5e-4, "min\u207B\xB9", meal, "10.1109/TBME.2007.893506", "Table I, renal excretion, normal subjects"),
  renalKe2: fixed("renalKe2", "ke2", 339, "mg/kg", meal, "10.1109/TBME.2007.893506", "Table I, renal excretion, normal subjects"),
  basalInsulinPmol: assumed("basalInsulinPmol", "Ib", 42, "pmol/L", "10.1109/TBME.2007.893506"),
  graftGamma: fixed("graftGamma", "gamma", 0.5, "min\u207B\xB9", meal, "10.1109/TBME.2007.893506", "Table I, insulin secretion, normal subjects"),
  graftK: fixed("graftK", "K", 2.3, "pmol/kg per (mg/dL)", meal, "10.1109/TBME.2007.893506", "Table I, insulin secretion, normal subjects"),
  graftAlpha: fixed("graftAlpha", "alpha", 0.05, "min\u207B\xB9", meal, "10.1109/TBME.2007.893506", "Table I, insulin secretion, normal subjects"),
  graftBeta: fixed("graftBeta", "beta", 0.11, "pmol/(kg min) per (mg/dL)", meal, "10.1109/TBME.2007.893506", "Table I, insulin secretion, normal subjects"),
  insulinElimination: assumed("insulinElimination", "ke", 0.138, "min\u207B\xB9", "10.1109/TBME.2007.893506"),
  insulinActionDecay: assumed("insulinActionDecay", "p2", 0.014, "min\u207B\xB9", "10.1109/TBME.2007.893506"),
  insulinActionSensitivity: assumed("insulinActionSensitivity", "p3", 28e-6, "min\u207B\xB2/(\xB5U/mL)", "10.1109/TBME.2007.893506"),
  glucoseEffectiveness: assumed("glucoseEffectiveness", "SG", 0.014, "min\u207B\xB9", "10.1109/TBME.2007.893506"),
  glucoseVolume: assumed("glucoseVolume", "VG", 1.49, "dL/kg", "10.1109/TBME.2007.893506"),
  basalInsulin: assumed("basalInsulin", "Ib", 7, "\xB5U/mL", "10.1109/TBME.2007.893506"),
  modelMealB: assumed("modelMealB", "b", 0.69, "1", "10.1177/1932296813514502"),
  modelMealC: assumed("modelMealC", "c", 0.17, "1", "10.1177/1932296813514502"),
  mealReferenceDose: assumed("mealReferenceDose", "Dbar", 3e4, "mg", "10.1177/1932296813514502"),
  hypoxiaMax: assumed("hypoxiaMax", "khyp,max", 2.3026, "day\u207B\xB9", "10.3389/fbioe.2022.884071"),
  immuneReject: assumed("immuneReject", "kimmune", 0.4605, "day\u207B\xB9", "10.1126/scitranslmed.adg5794"),
  cd47Lower: assumed("cd47Lower", "CD47low", 18e4, "molecules/cell", "10.1038/s41587-023-01784-x"),
  cd47Upper: assumed("cd47Upper", "CD47high", 22e4, "molecules/cell", "10.1038/s41587-023-01784-x"),
  oxygenAlginate: fixed("oxygenAlginate", "Dalg", 254e-11, "m\xB2/s", "Fernandez et al. (2022), Engineering Vascularized Islet Macroencapsulation Devices", "10.3389/fbioe.2022.884071", "Table 1"),
  oxygenIslet: fixed("oxygenIslet", "Dtissue", 124e-11, "m\xB2/s", "Fernandez et al. (2022), Engineering Vascularized Islet Macroencapsulation Devices", "10.3389/fbioe.2022.884071", "Table 1"),
  cellFraction: fixed("cellFraction", "Xcell", 0.01, "1", "Fernandez et al. (2022), Engineering Vascularized Islet Macroencapsulation Devices", "10.3389/fbioe.2022.884071", "Table 1"),
  breakfastGlucose: fixed("breakfastGlucose", "Gb", 119.1, "mg/dL", "Visentin et al. (2018), The UVA/Padova Type 1 Diabetes Simulator Goes From Single Meal to Single Day", "10.1177/1932296817740834", "Table 1"),
  breakfastWeight: fixed("breakfastWeight", "BW", 75.2, "kg", "Visentin et al. (2018), The UVA/Padova Type 1 Diabetes Simulator Goes From Single Meal to Single Day", "10.1177/1932296817740834", "Table 1"),
  breakfastRatio: fixed("breakfastRatio", "CR", 16.9, "g/U", "Visentin et al. (2018), The UVA/Padova Type 1 Diabetes Simulator Goes From Single Meal to Single Day", "10.1177/1932296817740834", "Table 1")
});
function validateParameterValue(parameter, value) {
  if (!Number.isFinite(value) || parameter.minBound !== null && value < parameter.minBound || parameter.maxBound !== null && value > parameter.maxBound) {
    throw new RangeError(`OUT_OF_VALIDATED_COHORT_BOUNDS: ${parameter.id}`);
  }
  return value;
}

// src/modules/t1d/solvers/rk4.ts
function rk4Step(f, t, y, dt) {
  if (!Number.isFinite(t) || !Number.isFinite(dt) || dt <= 0 || y.length === 0 || y.some((v) => !Number.isFinite(v))) {
    throw new RangeError("RK4 requires finite time and state, a nonempty state, and a positive finite step");
  }
  const evaluate = (time, state) => {
    const result = f(time, state);
    if (result.length !== y.length || result.some((v) => !Number.isFinite(v))) {
      throw new RangeError("Derivative must return one finite value per state variable");
    }
    return result;
  };
  const combine = (base, slope, scale) => base.map((v, i) => v + scale * slope[i]);
  const k1 = evaluate(t, y);
  const k2 = evaluate(t + dt / 2, combine(y, k1, dt / 2));
  const k3 = evaluate(t + dt / 2, combine(y, k2, dt / 2));
  const k4 = evaluate(t + dt, combine(y, k3, dt));
  const next = y.map((v, i) => v + dt * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]) / 6);
  if (next.some((v) => !Number.isFinite(v))) throw new RangeError("RK4 step produced a non-finite state");
  return next;
}

// src/modules/t1d/solvers/isletOxygenDiffusion.ts
function buchwaldConsumptionFactor(concentration, critical, width) {
  if (![concentration, critical, width].every(Number.isFinite) || concentration < 0 || critical < 0 || width <= 0) throw new RangeError("Invalid oxygen threshold");
  const z = (concentration - critical) / width;
  return z <= -1 ? 0 : z >= 1 ? 1 : (1 + z + Math.sin(Math.PI * z) / Math.PI) / 2;
}
function steadyOxygenProfile(p, points, volumeFraction) {
  if (!Number.isInteger(points) || points < 2 || !Number.isFinite(volumeFraction) || volumeFraction < 0 || volumeFraction > 1 || !Object.values(p).every(Number.isFinite) || p.diffusion <= 0 || p.dx <= 0 || p.km <= 0 || p.rmax < 0 || p.critical < 0 || p.smoothingWidth <= 0 || p.boundary < 0) throw new RangeError("Invalid steady oxygen parameters");
  if (p.boundary === 0) return Array(points).fill(0);
  const reaction = (c) => p.rmax * volumeFraction * c / (p.km + c) * buchwaldConsumptionFactor(c, p.critical, p.smoothingWidth);
  const shoot = (core) => {
    const result2 = [core, core + p.dx ** 2 * reaction(core) / (2 * p.diffusion)];
    for (let i = 1; i < points - 1; i++) {
      if (result2[i] > p.boundary) return result2;
      result2.push(2 * result2[i] - result2[i - 1] + p.dx ** 2 * reaction(result2[i]) / p.diffusion);
    }
    return result2;
  };
  let low = 0, high = p.boundary;
  for (let i = 0; i < 100; i++) {
    const middle = (low + high) / 2;
    const trial = shoot(middle);
    if (trial.length < points || trial[points - 1] > p.boundary) high = middle;
    else low = middle;
  }
  const result = shoot(low);
  if (result.length !== points || Math.abs(result[points - 1] - p.boundary) > Math.max(1e-12, p.boundary * 1e-8)) throw new RangeError("Steady oxygen profile did not converge");
  result[points - 1] = p.boundary;
  return result;
}

// src/modules/t1d/solvers/dallaManPkPdModel.ts
function mealDerivative(s, p, ingestion) {
  if (![...Object.values(s), ...Object.values(p), ingestion].every(Number.isFinite) || s.sto1 < 0 || s.sto2 < 0 || s.gut < 0 || ingestion < 0 || p.kgri < 0 || p.kmin < 0 || p.kmax < p.kmin || p.kabs < 0 || p.fraction < 0 || p.fraction > 1 || p.b <= 0 || p.b >= 1 || p.d <= 0 || p.d >= 1 || p.dose <= 0 || p.bodyWeight <= 0) throw new RangeError("Invalid meal state or parameters");
  const stomach = s.sto1 + s.sto2;
  const alpha = 5 / (2 * p.dose * (1 - p.b));
  const beta = 5 / (2 * p.dose * p.d);
  const emptying = p.kmin + (p.kmax - p.kmin) / 2 * (Math.tanh(alpha * (stomach - p.b * p.dose)) - Math.tanh(beta * (stomach - p.d * p.dose)) + 2);
  const transit = emptying * s.sto2;
  return {
    sto1: ingestion - p.kgri * s.sto1,
    sto2: p.kgri * s.sto1 - transit,
    gut: transit - p.kabs * s.gut,
    appearance: p.fraction * p.kabs * s.gut / p.bodyWeight,
    emptying
  };
}

// src/modules/t1d/solvers/t1dCoreKinetics.ts
function publishedModelParameters() {
  return {
    VG: T1D_PARAMETER_REGISTRY.vgNormal.value,
    k1: T1D_PARAMETER_REGISTRY.glucoseK1.value,
    k2: T1D_PARAMETER_REGISTRY.glucoseK2.value,
    VI: T1D_PARAMETER_REGISTRY.insulinVolume.value / 1e3,
    m1: T1D_PARAMETER_REGISTRY.insulinM1.value,
    m2: T1D_PARAMETER_REGISTRY.insulinM2.value,
    m4: T1D_PARAMETER_REGISTRY.insulinM4.value,
    HE: T1D_PARAMETER_REGISTRY.hepaticExtraction.value,
    kp2: T1D_PARAMETER_REGISTRY.productionKp2.value,
    kp3: T1D_PARAMETER_REGISTRY.productionKp3.value,
    Fcns: T1D_PARAMETER_REGISTRY.brainUptake.value,
    Vm0: T1D_PARAMETER_REGISTRY.utilizationVm0.value,
    Vmx: T1D_PARAMETER_REGISTRY.utilizationVmx.value,
    Km0: T1D_PARAMETER_REGISTRY.utilizationKm0.value,
    p2u: T1D_PARAMETER_REGISTRY.actionP2u.value,
    ki: T1D_PARAMETER_REGISTRY.insulinDelay.value,
    ke1: T1D_PARAMETER_REGISTRY.renalKe1.value,
    ke2: T1D_PARAMETER_REGISTRY.renalKe2.value,
    kd: T1D_PARAMETER_REGISTRY.insulinKd.value,
    ka1: T1D_PARAMETER_REGISTRY.insulinKa1.value,
    ka2: T1D_PARAMETER_REGISTRY.insulinKa2.value,
    Gb: T1D_PARAMETER_REGISTRY.breakfastGlucose.value,
    Ib: T1D_PARAMETER_REGISTRY.basalInsulinPmol.value,
    Td: T1D_PARAMETER_REGISTRY.sensorDelay.value
  };
}
function initializePublishedModel(p) {
  const Gp = p.Gb * p.VG, Ip = p.Ib * p.VI, m3 = p.HE * p.m1 / (1 - p.HE), Il = p.m2 * Ip / (p.m1 + m3);
  const B = p.k2 * p.Km0 + p.Vm0 - p.k1 * Gp, C = -p.k1 * Gp * p.Km0;
  const Gt = (-B + Math.sqrt(B * B - 4 * p.k2 * C)) / (2 * p.k2);
  const uid = p.Vm0 * Gt / (p.Km0 + Gt), renal = Math.max(0, p.ke1 * (Gp - p.ke2));
  const kp1 = p.Fcns + uid + renal + p.kp2 * Gp + p.kp3 * p.Ib;
  const basal = (p.m2 + p.m4) * Ip - p.m1 * Il;
  return { kp1, basal, state: [0, 0, 0, Gp, Gt, Gp, basal / (p.kd + p.ka1), p.kd * basal / ((p.kd + p.ka1) * p.ka2), Ip, Il, p.Ib, p.Ib, 0] };
}
function publishedModelStep(t, state, dt, p, meal2, kp1, inputs, coupling) {
  if (state.length !== (coupling ? 16 : 13) || !Number.isFinite(p.Td) || p.Td <= 0) throw new RangeError("Expected 13 physiological states and optional graft states");
  let loss = 0;
  if (coupling) {
    const c = coupling, g = c.graft;
    if (!g || !Object.values(g).every(Number.isFinite) || g.fraction < 0 || g.fraction > 1 || g.gamma <= 0 || g.K < 0 || g.alpha <= 0 || g.beta < 0 || ![c.cd47, c.cd47Low, c.cd47High, c.immuneMax, c.hypoxiaMax].every(Number.isFinite) || c.cd47 < 0 || c.cd47Low < 0 || c.cd47High <= c.cd47Low || c.immuneMax < 0 || c.hypoxiaMax < 0 || c.oxygen.critical <= 0 || state[15] < 0 || state[15] > 1) throw new RangeError("Invalid graft or oxygen coupling");
    const core = steadyOxygenProfile(c.oxygen, c.points, c.cellFraction)[0];
    const hyp = core >= c.oxygen.critical ? 0 : c.hypoxiaMax * (1 - core / c.oxygen.critical);
    const immune = !c.b2mKnockout || !c.ciitaKnockout ? c.immuneMax : c.immuneMax * (1 - Math.max(0, Math.min(1, (c.cd47 - c.cd47Low) / (c.cd47High - c.cd47Low))));
    loss = (hyp + immune) / 1440;
  }
  const out = rk4Step((time, y) => {
    const input = inputs(time), q = mealDerivative({ sto1: y[0], sto2: y[1], gut: y[2] }, meal2, input.ingestion);
    const [Gp, Gt, Gs, sc1, sc2, Ip, Il, delay, XL, X] = y.slice(3, 13);
    if ([Gp, Gt, Gs, sc1, sc2, Ip, Il, delay, XL].some((v) => v < 0)) throw new RangeError("Negative physiological state");
    const insulin = Ip / p.VI, egp = Math.max(0, kp1 - p.kp2 * Gp - p.kp3 * XL);
    const uid = (p.Vm0 + p.Vmx * X) * Gt / (p.Km0 + Gt), renal = Math.max(0, p.ke1 * (Gp - p.ke2));
    const m3 = p.HE * p.m1 / (1 - p.HE);
    const dGp = egp + q.appearance - p.Fcns - renal - p.k1 * Gp + p.k2 * Gt;
    let graftInput = 0;
    const extra = [];
    if (coupling?.graft) {
      const g = coupling.graft, portal = y[13], secretion = y[14], viable = y[15];
      graftInput = viable * g.fraction * g.gamma * portal;
      extra.push(-g.gamma * portal + secretion + g.K * Math.max(dGp / p.VG, 0), -g.alpha * (secretion - Math.max(0, g.beta * (Gp / p.VG - p.Gb))), -loss * viable);
    }
    return [
      q.sto1,
      q.sto2,
      q.gut,
      dGp,
      -uid + p.k1 * Gp - p.k2 * Gt,
      (Gp - Gs) / p.Td,
      input.infusion - (p.kd + p.ka1) * sc1,
      p.kd * sc1 - p.ka2 * sc2,
      -(p.m2 + p.m4) * Ip + p.m1 * Il + p.ka1 * sc1 + p.ka2 * sc2 + graftInput,
      p.m2 * Ip - (p.m1 + m3) * Il,
      -p.ki * (delay - insulin),
      -p.ki * (XL - delay),
      -p.p2u * X + p.p2u * (insulin - p.Ib),
      ...extra
    ];
  }, t, state, dt);
  if (out.some((v, i) => i !== 12 && v < 0) || coupling && out[15] > 1) throw new RangeError("Negative physiological state");
  return out;
}

// src/modules/t1d/utils/simulation.ts
function simulate(scenario, basalGlucose, protectedGraft = true) {
  validateParameterValue(T1D_PARAMETER_REGISTRY.adultFastingGlucose, basalGlucose);
  const params = { ...publishedModelParameters(), Gb: basalGlucose }, init = initializePublishedModel(params), dt = 0.1;
  const meal2 = { kgri: T1D_PARAMETER_REGISTRY.mealKgri.value, kmin: T1D_PARAMETER_REGISTRY.mealKmin.value, kmax: T1D_PARAMETER_REGISTRY.mealKmax.value, kabs: T1D_PARAMETER_REGISTRY.mealKabs.value, fraction: T1D_PARAMETER_REGISTRY.mealFraction.value, b: T1D_PARAMETER_REGISTRY.modelMealB.value, d: T1D_PARAMETER_REGISTRY.modelMealC.value, dose: T1D_PARAMETER_REGISTRY.mealReferenceDose.value, bodyWeight: T1D_PARAMETER_REGISTRY.breakfastWeight.value };
  const cellFraction = T1D_PARAMETER_REGISTRY.cellFraction.value, graftActive = scenario === "graft";
  const boundary = protectedGraft ? 0.2 : 0, oxygen = { diffusion: (1 - cellFraction) * T1D_PARAMETER_REGISTRY.oxygenAlginate.value + cellFraction * T1D_PARAMETER_REGISTRY.oxygenIslet.value, rmax: T1D_PARAMETER_REGISTRY.oxygenMaxConsumption.value, km: T1D_PARAMETER_REGISTRY.oxygenKm.value, critical: T1D_PARAMETER_REGISTRY.oxygenCritical.value, smoothingWidth: T1D_PARAMETER_REGISTRY.oxygenSmoothingWidth.value, dx: 1e-4, boundary };
  const coupling = graftActive ? { oxygen, points: 4, cellFraction, cd47: protectedGraft ? T1D_PARAMETER_REGISTRY.cd47Upper.value : 0, b2mKnockout: true, ciitaKnockout: true, cd47Low: T1D_PARAMETER_REGISTRY.cd47Lower.value, cd47High: T1D_PARAMETER_REGISTRY.cd47Upper.value, immuneMax: T1D_PARAMETER_REGISTRY.immuneReject.value, hypoxiaMax: T1D_PARAMETER_REGISTRY.hypoxiaMax.value, graft: { fraction: 1, gamma: T1D_PARAMETER_REGISTRY.graftGamma.value, K: T1D_PARAMETER_REGISTRY.graftK.value, alpha: T1D_PARAMETER_REGISTRY.graftAlpha.value, beta: T1D_PARAMETER_REGISTRY.graftBeta.value, insulinVolumeLitresPerKg: params.VI } } : void 0;
  const core = graftActive ? steadyOxygenProfile(oxygen, 4, cellFraction)[0] : NaN;
  const hypoxia = graftActive && core < oxygen.critical ? T1D_PARAMETER_REGISTRY.hypoxiaMax.value * (1 - core / oxygen.critical) : 0;
  const immune = graftActive && !protectedGraft ? T1D_PARAMETER_REGISTRY.immuneReject.value : 0;
  let state = graftActive ? [...init.state, 0, 0, 1] : [...init.state];
  const initialState = [...state], frames = [];
  const capture = (time) => {
    const [q1, q2, qgut, Gp, Gt, Gs, sc1, sc2, Ip, , , XL, X] = state;
    const rate = mealDerivative({ sto1: q1, sto2: q2, gut: qgut }, meal2, 0);
    frames.push({
      time,
      state: [...state],
      glucose: Gp / params.VG,
      sensor: Gs / params.VG,
      insulin: Ip / params.VI,
      oxygen: graftActive ? core / 1414e-6 : NaN,
      viability: graftActive ? state[15] : NaN,
      EGP: Math.max(0, init.kp1 - params.kp2 * Gp - params.kp3 * XL),
      Ra_meal: rate.appearance,
      U_id: (params.Vm0 + params.Vmx * X) * Gt / (params.Km0 + Gt),
      Ra_I: params.ka1 * sc1 + params.ka2 * sc2,
      S_graft: graftActive ? state[15] * T1D_PARAMETER_REGISTRY.graftGamma.value * state[13] : 0,
      k_immune: immune,
      k_hypoxia: hypoxia
    });
  };
  capture(0);
  for (let i = 0; i < 14400; i++) {
    const t = i * dt, active = scenario !== "fasting", ingestion = active && i >= 600 && i < 750 ? 4e3 : 0;
    const bolus = active && i >= 600 && i < 610 ? 60 / T1D_PARAMETER_REGISTRY.breakfastRatio.value * 6e3 / meal2.bodyWeight : 0;
    state = publishedModelStep(t, state, dt, params, meal2, init.kp1, () => ({ ingestion, infusion: init.basal + bolus }), coupling);
    capture((i + 1) * dt);
  }
  return { scenario, label: scenario === "graft" ? protectedGraft ? "Normoxic HIP graft" : "Hypoxic / unprotected graft" : scenario === "meal" ? "60 g meal + bolus" : "Untreated fasting", dt, initialState, params, meal: meal2, kp1: init.kp1, basal: init.basal, coupling, protocol: { mealMg: scenario === "fasting" ? 0 : 6e4, mealStartMin: 60, mealDurationMin: 15, bolusUnits: scenario === "fasting" ? 0 : 60 / T1D_PARAMETER_REGISTRY.breakfastRatio.value, bolusStartMin: 60, bolusDurationMin: 1, durationMin: 1440 }, boundaryAssumptions: "4-point slab; dx 0.0001 m; boundary 0.2 or 0 mol/m\xB3; Henry coefficient 0.001414 mol/(m\xB3 mmHg).", frames };
}

// src/modules/t1d/utils/reproducibilityExporter.ts
var ODE_COMMIT = "a81e7f3aeeba17b6b5920e5fda2563bfe05a0856";
var stateNames = ["Q_sto1", "Q_sto2", "Q_gut", "G_p", "G_t", "G_s", "I_sc1", "I_sc2", "I_p", "I_l", "I_delay1", "X_L", "X", "I_po", "Y_sec", "f_viable"];
function makeBundle(runs) {
  const manifest = { odeCommit: ODE_COMMIT, dtMinutes: 0.1, parameterProvenance: T1D_PARAMETER_REGISTRY, runs: runs.map(({ frames, ...run }) => run), stateNames };
  const cols = ["scenario", "time_min", ...stateNames, "glucose_mg_dL", "sensor_mg_dL", "insulin_pmol_L", "oxygen_mmHg", "viability", "EGP", "Ra_meal", "U_id", "Ra_I", "S_graft", "k_immune", "k_hypoxia"];
  const rows = [cols.join(",")];
  const cell = (x) => typeof x === "number" && !Number.isFinite(x) ? "" : typeof x === "string" ? `"${x.replaceAll('"', '""')}"` : x === void 0 ? "" : String(x);
  for (const run of runs) for (const f of run.frames) rows.push([run.label, f.time, ...stateNames.map((_, i) => f.state[i]), f.glucose, f.sensor, f.insulin, f.oxygen, f.viability, f.EGP, f.Ra_meal, f.U_id, f.Ra_I, f.S_graft, f.k_immune, f.k_hypoxia].map(cell).join(","));
  return { json: JSON.stringify(manifest, null, 2), csv: rows.join("\n") + "\n" };
}
function download(name, contents, type) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
function downloadBundle(runs) {
  const files = makeBundle(runs);
  download("t1d-provenance.json", files.json, "application/json");
  download("t1d-trajectory.csv", files.csv, "text/csv");
}

// src/modules/t1d/components/GlassBoxInspectorDrawer.tsx
var equations = { glucose: "dGp/dt = EGP + Ra_meal \u2212 Fcns \u2212 E \u2212 k1\xB7Gp + k2\xB7Gt; G = Gp/VG", sensor: "dGs/dt = (Gp \u2212 Gs)/Td; G_sensor = Gs/VG", insulin: "dIp/dt = \u2212(m2 + m4)\xB7Ip + m1\xB7Il + Ra_I + f_viable\xB7graft_fraction\xB7S_graft; I = Ip/VI", oxygen: "D_eff\xB7d\xB2c/dx\xB2 = Rmax\xB7c/(Km+c)\xB7H_smooth(c\u2212Ccr)\xB7Xcell; pO\u2082 = c/\u03B1", viability: "df_viable/dt = \u2212(k_immune + k_hypoxia)\xB7f_viable/1440" };
function GlassBoxInspectorDrawer(host) {
  host.className = "card";
  host.setAttribute("aria-live", "polite");
  Object.assign(host.style, { display: "none", position: "fixed", right: "16px", top: "64px", width: "min(390px, calc(100vw - 32px))", maxHeight: "calc(100vh - 80px)", overflowY: "auto", zIndex: "20", boxShadow: "0 12px 36px rgba(0,0,0,.5)" });
  const title = document.createElement("h2");
  title.textContent = "Glass-box inspector";
  const close = document.createElement("button");
  close.textContent = "Close inspector";
  close.addEventListener("click", () => {
    host.style.display = "none";
  });
  const body = document.createElement("div");
  body.textContent = "Select a plotted point or equation to inspect its state and fluxes.";
  host.replaceChildren(title, close, body);
  return { show(run, frame, curve) {
    host.style.display = "block";
    body.replaceChildren();
    const add = (tag, value) => {
      const e = document.createElement(tag);
      e.textContent = value;
      body.append(e);
    };
    add("strong", `${run.label} \xB7 ${frame.time.toFixed(1)} min`);
    add("p", equations[curve] ?? equations.glucose);
    for (const key of ["EGP", "Ra_meal", "U_id", "Ra_I", "S_graft", "k_immune", "k_hypoxia"]) add("p", `${key}: ${frame[key].toPrecision(6)} ${key.startsWith("k_") ? "day\u207B\xB9" : key === "Ra_I" || key === "S_graft" ? "pmol/kg/min" : "mg/kg/min"}`);
    add("p", `State vector: ${frame.state.map((x) => x.toPrecision(6)).join(", ")}`);
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "Full parameter provenance";
    details.append(summary);
    for (const [key, p] of Object.entries(T1D_PARAMETER_REGISTRY)) {
      const el = document.createElement("p");
      el.textContent = `${key}: ${p.value} ${p.unit} \xB7 ${p.provenanceType} \xB7 ${p.sourceCitation} \xB7 DOI ${p.doi} \xB7 ${p.sourceLocation}`;
      details.append(el);
    }
    body.append(details);
  } };
}

// src/modules/t1d/components/OmittedPhysiologyPanel.tsx
function OmittedPhysiologyPanel() {
  const panel = document.createElement("section");
  panel.className = "card";
  panel.innerHTML = `<h2>Scope &amp; omitted physiology</h2><p><strong>Pre-clinical research and educational simulation only. Not clinical decision support.</strong></p><p>Excludes counter-regulatory glucagon, epinephrine and cortisol surges; exercise-induced GLUT4 uptake; C-peptide kinetics; and intraday insulin sensitivity variation.</p><p>The immune rejection rate and maximum hypoxia loss rate are model assumptions. Graft insulin secretion is adapted from Dalla Man 2007 and is not a validated graft model. The oxygen profile is a one-dimensional slab. The 119.34 mg/dL peak is a regression target, not a published cohort result.</p>`;
  return panel;
}

// src/mission-control/suites/t1d.suite.ts
function runT1DSuite() {
  try {
    const p = publishedModelParameters(), init = initializePublishedModel(p);
    const m = { kgri: T1D_PARAMETER_REGISTRY.mealKgri.value, kmin: T1D_PARAMETER_REGISTRY.mealKmin.value, kmax: T1D_PARAMETER_REGISTRY.mealKmax.value, kabs: T1D_PARAMETER_REGISTRY.mealKabs.value, fraction: T1D_PARAMETER_REGISTRY.mealFraction.value, b: T1D_PARAMETER_REGISTRY.modelMealB.value, d: T1D_PARAMETER_REGISTRY.modelMealC.value, dose: T1D_PARAMETER_REGISTRY.mealReferenceDose.value, bodyWeight: T1D_PARAMETER_REGISTRY.breakfastWeight.value };
    const next = publishedModelStep(0, init.state, 0.1, p, m, init.kp1, () => ({ ingestion: 0, infusion: init.basal }));
    return [{ test: "T1D fasting equilibrium", status: Math.abs(next[3] / p.VG - p.Gb) < 1e-8 ? "PASS" : "FAIL" }, { test: "T1D registry provenance", status: Object.values(T1D_PARAMETER_REGISTRY).every((x) => x.doi && x.sourceLocation && x.unit) ? "PASS" : "FAIL" }];
  } catch (e) {
    return [{ test: `T1D suite: ${e instanceof Error ? e.message : String(e)}`, status: "FAIL" }];
  }
}

// src/modules/t1d/components/T1DWorkbenchView.tsx
function T1DWorkbenchView(controls2, view2) {
  const p = T1D_PARAMETER_REGISTRY.adultFastingGlucose;
  controls2.innerHTML = `<h2>Type 1 Diabetes Workbench</h2><div class="control-group"><label for="t1dScenario">Scenario</label><select id="t1dScenario"><option value="fasting">Untreated T1D fasting</option><option value="meal">60 g meal + bolus</option><option value="graft">Normoxic HIP vs hypoxic / unprotected graft</option></select></div><div class="control-group"><label for="t1dGb">Adult fasting glucose <span id="t1dGbLabel" class="val-display"></span></label><input id="t1dGb" type="range" min="${p.minBound}" max="${p.maxBound}" step="0.1" value="${p.value}"><small>Adult cohort range (mg/dL); adjusts model baseline.</small></div><button class="primary" id="t1dRun">Run simulation</button><button id="t1dExport" disabled>Download reproducibility bundle</button><p id="t1dStatus" role="status">Choose a scenario, then run.</p><details><summary>Parameter provenance</summary><div id="t1dParameters"></div></details>`;
  const panel = controls2.querySelector("#t1dParameters");
  for (const [key, param] of Object.entries(T1D_PARAMETER_REGISTRY)) {
    const d = document.createElement("div");
    d.className = "control-group";
    const title = document.createElement("strong");
    title.textContent = `${key}: ${param.value} ${param.unit} \xB7 ${param.provenanceType}`;
    const detail = document.createElement("p");
    detail.textContent = `${param.sourceCitation} \xB7 DOI ${param.doi} \xB7 ${param.sourceLocation}. ${param.validityWarning} ${param.minBound === null || param.maxBound === null ? "No verified slider range; read only." : `Bounds ${param.minBound}\u2013${param.maxBound}.`}`;
    d.append(title, detail);
    panel.append(d);
  }
  view2.style.gap = "12px";
  const intro = document.createElement("div");
  intro.innerHTML = "<h2>T1D Simulation</h2><p>Select a plotted point or equation to inspect it. Insulin is shown in pmol/L; oxygen and viability appear for graft scenarios.</p>";
  const timeline = document.createElement("div");
  timeline.className = "card";
  timeline.innerHTML = '<label for="t1dTime">Inspect timestamp (minutes) <span id="t1dTimeValue" class="val-display">0</span></label><input id="t1dTime" type="range" min="0" max="1440" step="0.1" value="0" disabled>';
  const plotContainer = document.createElement("div");
  const plots = [];
  const formulas = document.createElement("div");
  formulas.className = "btn-row";
  for (const [index, label] of ["Plasma and sensor glucose", "Plasma insulin", "Core oxygen", "Graft viability"].entries()) {
    const card = document.createElement("section");
    card.className = "card";
    card.style.height = "250px";
    card.innerHTML = `<h2>${label}</h2>`;
    const wrapper = document.createElement("div");
    wrapper.style.height = "190px";
    const c = document.createElement("canvas");
    c.setAttribute("aria-label", label);
    c.setAttribute("role", "img");
    wrapper.append(c);
    card.append(wrapper);
    plotContainer.append(card);
    plots[index] = c;
  }
  const inspectorHost = document.createElement("section");
  const inspector = GlassBoxInspectorDrawer(inspectorHost);
  view2.replaceChildren(intro, OmittedPhysiologyPanel(), timeline, formulas, plotContainer, inspectorHost);
  const scenario = controls2.querySelector("#t1dScenario"), slider = controls2.querySelector("#t1dGb"), display = controls2.querySelector("#t1dGbLabel"), runButton = controls2.querySelector("#t1dRun"), exportButton = controls2.querySelector("#t1dExport"), status = controls2.querySelector("#t1dStatus");
  let runs = [], charts = [];
  display.textContent = slider.value;
  const timeInput = timeline.querySelector("#t1dTime"), timeLabel = timeline.querySelector("#t1dTimeValue");
  timeInput.addEventListener("input", () => {
    timeLabel.textContent = timeInput.value;
    if (runs.length) inspector.show(runs[0], runs[0].frames[Math.round(Number(timeInput.value) * 10)], "glucose");
  });
  slider.addEventListener("input", () => {
    display.textContent = slider.value;
    exportButton.disabled = true;
    status.textContent = "Parameters changed. Run simulation to update results.";
  });
  scenario.addEventListener("change", () => {
    exportButton.disabled = true;
    status.textContent = "Scenario changed. Run simulation to update results.";
  });
  for (const [key, label] of Object.entries({ glucose: "Glucose equation", sensor: "Sensor equation", insulin: "Insulin equation", oxygen: "Oxygen equation", viability: "Viability equation" })) {
    const button = document.createElement("button");
    button.textContent = label;
    button.addEventListener("click", () => {
      if (runs.length) inspector.show(runs[0], runs[0].frames[0], key);
    });
    formulas.append(button);
  }
  runButton.addEventListener("click", () => {
    runButton.disabled = true;
    exportButton.disabled = true;
    status.textContent = "Running\u2026";
    setTimeout(() => {
      try {
        const value = validateParameterValue(p, Number(slider.value)), selected = scenario.value;
        runs = selected === "graft" ? [simulate(selected, value, true), simulate(selected, value, false)] : [simulate(selected, value)];
        charts.forEach((c) => c.destroy());
        charts = [];
        const defs = [["glucose", "sensor"], ["insulin"], ["oxygen"], ["viability"]];
        defs.forEach((metrics, idx) => {
          const datasets = [];
          for (const [rIndex, run] of runs.entries()) for (const [metricIndex, metric] of metrics.entries()) {
            if (idx > 1 && selected !== "graft") continue;
            const data = run.frames.filter((_, i) => i % 50 === 0).map((f) => ({ x: f.time, y: Number.isFinite(f[metric]) ? f[metric] : null }));
            datasets.push({ label: `${run.label} \xB7 ${metric}`, data, borderColor: rIndex ? "#f78166" : metricIndex ? "#d2a8ff" : "#58a6ff", borderDash: metric === "sensor" ? [5, 4] : [], pointRadius: 0, pointHitRadius: 10, tension: 0, _run: rIndex, _metric: metric });
          }
          const chart = new Chart(plots[idx], { type: "line", data: { datasets }, options: { responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: "nearest", intersect: false }, plugins: { legend: { labels: { color: "#cbd5e1" } } }, scales: { x: { type: "linear", ticks: { color: "#cbd5e1" }, grid: { color: "#2a3444" }, title: { display: true, text: "Time (min)", color: "#cbd5e1" } }, y: { ticks: { color: "#cbd5e1" }, grid: { color: "#2a3444" } } } } });
          charts.push(chart);
          plots[idx].onclick = (event) => {
            if (!datasets.length) return;
            const time = chart.scales.x.getValueForPixel(event.offsetX);
            if (!Number.isFinite(time)) return;
            const point = Math.max(0, Math.min(288, Math.round(time / 5)));
            let nearest = null, distance = Infinity;
            for (const ds of datasets) {
              const value2 = ds.data[point]?.y;
              if (value2 === null || value2 === void 0) continue;
              const delta = Math.abs(chart.scales.y.getPixelForValue(value2) - event.offsetY);
              if (delta < distance) {
                distance = delta;
                nearest = ds;
              }
            }
            if (nearest) inspector.show(runs[nearest._run], runs[nearest._run].frames[point * 50], nearest._metric);
          };
        });
        status.textContent = `Completed ${runs.length} ${runs.length === 1 ? "trajectory" : "trajectories"} at 0.1 min steps.`;
        exportButton.disabled = false;
        timeInput.disabled = false;
        timeInput.value = "0";
        timeLabel.textContent = "0";
      } catch (e) {
        runs = [];
        charts.forEach((c) => c.destroy());
        charts = [];
        timeInput.disabled = true;
        status.textContent = `Simulation failed: ${e instanceof Error ? e.message : String(e)}`;
      } finally {
        runButton.disabled = false;
      }
    }, 20);
  });
  exportButton.addEventListener("click", () => {
    if (runs.length) downloadBundle(runs);
  });
  document.getElementById("runTestsBtn")?.addEventListener("click", () => {
    const results = runT1DSuite();
    const out = document.createElement("p");
    out.textContent = `T1D suite: ${results.map((r) => `${r.test} ${r.status}`).join("; ")}`;
    document.getElementById("inspectorBox")?.append(out);
  });
}
var controls = document.getElementById("ctrl-t1d");
var view = document.getElementById("view-t1d");
if (controls && view) T1DWorkbenchView(controls, view);
export {
  T1DWorkbenchView
};
