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
  minBound: null,
  maxBound: null,
  sourceCitation: "Project blueprint, user-specified reduced-model assumption; DOI is contextual",
  doi,
  sourceLocation: "Canonical T1D Mathematical Specification, Pass 1",
  provenanceType: "MODEL_ASSUMPTION",
  validityWarning: "Assumption; neither a literature-derived estimate nor a validated physiological bound."
});
var sourceRegistry = Object.freeze({
  adultFastingGlucose: cohort("adult", 119.6, 107.5, 137.8),
  adolescentFastingGlucose: cohort("adolescent", 118.1, 105.7, 142.3),
  childFastingGlucose: cohort("child", 119.8, 104.7, 134.3),
  oxygenDiffusivityTissue: fixed("oxygenDiffusivityTissue", "D", 2e-9, "m\xB2/s", buchwald, "10.1186/1742-4682-6-5", "Methods: Oxygen diffusion and consumption"),
  oxygenMaxConsumption: fixed("oxygenMaxConsumption", "Rmax", 0.034, "mol/(m\xB3 s)", buchwald, "10.1186/1742-4682-6-5", "Methods: Oxygen diffusion and consumption"),
  oxygenKm: fixed("oxygenKm", "CMM", 1e-3, "mol/m\xB3", buchwald, "10.1186/1742-4682-6-5", "Methods: Oxygen diffusion and consumption"),
  oxygenCritical: fixed("oxygenCritical", "Ccr", 1e-4, "mol/m\xB3", buchwald, "10.1186/1742-4682-6-5", "Methods: Oxygen diffusion and consumption"),
  oxygenSmoothingWidth: fixed("oxygenSmoothingWidth", "epsilon", 5e-5, "mol/m\xB3", buchwald, "10.1186/1742-4682-6-5", "Methods: Oxygen diffusion and consumption"),
  oxygenHenryCoefficient: Object.freeze({ id: "oxygenHenryCoefficient", symbol: "\u03B1O2", name: "Oxygen solubility coefficient at 37\xB0C", value: 1414e-6, unit: "mol/(m\xB3 mmHg)", minBound: null, maxBound: null, sourceCitation: "Fernandez et al. (2022), Engineering Vascularized Islet Macroencapsulation Devices", doi: "10.3389/fbioe.2022.884071", sourceLocation: "Table 1: inlet concentration 0.198 mol/m\xB3 at 140 mmHg, Henry conversion for water at 37\xB0C", provenanceType: "MODEL_ASSUMPTION", validityWarning: "Rounded coefficient inferred from rounded table values (0.198 / 140); not an exact reported constant or physiological bound." }),
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
  graftGamma: fixed("graftGamma", "gamma", 0.5, "min\u207B\xB9", meal, "10.1109/TBME.2007.893506", "Table I, insulin secretion, normal subjects; Eqs. 23\u201326 adapted for grafts"),
  graftK: fixed("graftK", "K", 2.3, "pmol/kg per (mg/dL)", meal, "10.1109/TBME.2007.893506", "Table I, insulin secretion, normal subjects; Eqs. 23\u201326 adapted for grafts"),
  graftAlpha: fixed("graftAlpha", "alpha", 0.05, "min\u207B\xB9", meal, "10.1109/TBME.2007.893506", "Table I, insulin secretion, normal subjects; Eqs. 23\u201326 adapted for grafts"),
  graftBeta: fixed("graftBeta", "beta", 0.11, "pmol/(kg min) per (mg/dL)", meal, "10.1109/TBME.2007.893506", "Table I, insulin secretion, normal subjects; Eqs. 23\u201326 adapted for grafts"),
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
  humanScaleCellFraction: fixed("humanScaleCellFraction", "Xcell", 0.058, "1", "Fernandez et al. (2022), Engineering Vascularized Islet Macroencapsulation Devices", "10.3389/fbioe.2022.884071", "Table 1, human-scale islet volume fraction"),
  breakfastGlucose: fixed("breakfastGlucose", "Gb", 119.1, "mg/dL", "Visentin et al. (2018), The UVA/Padova Type 1 Diabetes Simulator Goes From Single Meal to Single Day", "10.1177/1932296818757747", "Table 1"),
  breakfastWeight: fixed("breakfastWeight", "BW", 75.2, "kg", "Visentin et al. (2018), The UVA/Padova Type 1 Diabetes Simulator Goes From Single Meal to Single Day", "10.1177/1932296818757747", "Table 1"),
  breakfastRatio: fixed("breakfastRatio", "CR", 16.9, "g/U", "Visentin et al. (2018), The UVA/Padova Type 1 Diabetes Simulator Goes From Single Meal to Single Day", "10.1177/1932296818757747", "Table 1")
});
var allScenarios = ["fasting", "meal", "graft"];
var mealScenarios = ["meal", "graft"];
var graftScenarios = ["graft"];
var activeKeys = {
  adultFastingGlucose: allScenarios,
  vgNormal: allScenarios,
  glucoseK1: allScenarios,
  glucoseK2: allScenarios,
  insulinVolume: allScenarios,
  insulinM1: allScenarios,
  insulinM2: allScenarios,
  insulinM4: allScenarios,
  hepaticExtraction: allScenarios,
  productionKp2: allScenarios,
  productionKp3: allScenarios,
  brainUptake: allScenarios,
  utilizationVm0: allScenarios,
  utilizationVmx: allScenarios,
  utilizationKm0: allScenarios,
  actionP2u: allScenarios,
  insulinDelay: allScenarios,
  renalKe1: allScenarios,
  renalKe2: allScenarios,
  insulinKd: allScenarios,
  insulinKa1: allScenarios,
  insulinKa2: allScenarios,
  basalInsulinPmol: allScenarios,
  sensorDelay: allScenarios,
  mealKgri: allScenarios,
  mealKmin: allScenarios,
  mealKmax: allScenarios,
  mealKabs: allScenarios,
  mealFraction: allScenarios,
  modelMealB: allScenarios,
  modelMealC: allScenarios,
  mealReferenceDose: allScenarios,
  breakfastWeight: allScenarios,
  breakfastRatio: mealScenarios,
  oxygenAlginate: graftScenarios,
  oxygenIslet: graftScenarios,
  oxygenMaxConsumption: graftScenarios,
  oxygenKm: graftScenarios,
  oxygenCritical: graftScenarios,
  oxygenSmoothingWidth: graftScenarios,
  oxygenHenryCoefficient: graftScenarios,
  humanScaleCellFraction: graftScenarios,
  cd47Lower: graftScenarios,
  cd47Upper: graftScenarios,
  immuneReject: graftScenarios,
  hypoxiaMax: graftScenarios,
  graftGamma: graftScenarios,
  graftK: graftScenarios,
  graftAlpha: graftScenarios,
  graftBeta: graftScenarios
};
var T1D_PARAMETER_REGISTRY = Object.freeze(Object.fromEntries(
  Object.entries(sourceRegistry).map(([key, parameter]) => {
    const scenarios = Object.freeze([...activeKeys[key] ?? []]);
    return [key, Object.freeze({ ...parameter, usageType: scenarios.length ? "ACTIVE_IN_SOLVER" : "CONTEXTUAL_BENCHMARK", activeScenarios: scenarios })];
  })
));
function isParameterActive(key, scenario) {
  return T1D_PARAMETER_REGISTRY[key].activeScenarios.includes(scenario);
}
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
function simulate(scenario, basalGlucose, options = true) {
  validateParameterValue(T1D_PARAMETER_REGISTRY.adultFastingGlucose, basalGlucose);
  if (typeof options !== "boolean" && (![15, 76, 140].includes(options.oxygenMmHg) || ![0, 2e5, 6e5].includes(options.cd47) || typeof options.basalEnabled !== "boolean" || options.halfThicknessUm !== void 0 && ![150, 250, 500].includes(options.halfThicknessUm))) throw new RangeError("Unsupported scenario controls");
  const params = { ...publishedModelParameters(), Gb: basalGlucose }, init = initializePublishedModel(params), dt = 0.1;
  const meal2 = { kgri: T1D_PARAMETER_REGISTRY.mealKgri.value, kmin: T1D_PARAMETER_REGISTRY.mealKmin.value, kmax: T1D_PARAMETER_REGISTRY.mealKmax.value, kabs: T1D_PARAMETER_REGISTRY.mealKabs.value, fraction: T1D_PARAMETER_REGISTRY.mealFraction.value, b: T1D_PARAMETER_REGISTRY.modelMealB.value, d: T1D_PARAMETER_REGISTRY.modelMealC.value, dose: T1D_PARAMETER_REGISTRY.mealReferenceDose.value, bodyWeight: T1D_PARAMETER_REGISTRY.breakfastWeight.value };
  const cellFraction = T1D_PARAMETER_REGISTRY.humanScaleCellFraction.value, graftActive = scenario === "graft";
  const legacy = typeof options === "boolean";
  const boundary = legacy ? options ? 0.2 : 0 : options.oxygenMmHg * T1D_PARAMETER_REGISTRY.oxygenHenryCoefficient.value;
  const cd47 = legacy ? options ? T1D_PARAMETER_REGISTRY.cd47Upper.value : 0 : options.cd47, basalEnabled = legacy || options.basalEnabled;
  const halfThicknessUm = legacy ? 500 : options.halfThicknessUm ?? 500, points = 21;
  const oxygen = { diffusion: (1 - cellFraction) * T1D_PARAMETER_REGISTRY.oxygenAlginate.value + cellFraction * T1D_PARAMETER_REGISTRY.oxygenIslet.value, rmax: T1D_PARAMETER_REGISTRY.oxygenMaxConsumption.value, km: T1D_PARAMETER_REGISTRY.oxygenKm.value, critical: T1D_PARAMETER_REGISTRY.oxygenCritical.value, smoothingWidth: T1D_PARAMETER_REGISTRY.oxygenSmoothingWidth.value, dx: halfThicknessUm * 1e-6 / (points - 1), boundary };
  const coupling = graftActive ? { oxygen, points, cellFraction, cd47, b2mKnockout: true, ciitaKnockout: true, cd47Low: T1D_PARAMETER_REGISTRY.cd47Lower.value, cd47High: T1D_PARAMETER_REGISTRY.cd47Upper.value, immuneMax: T1D_PARAMETER_REGISTRY.immuneReject.value, hypoxiaMax: T1D_PARAMETER_REGISTRY.hypoxiaMax.value, graft: { fraction: 1, gamma: T1D_PARAMETER_REGISTRY.graftGamma.value, K: T1D_PARAMETER_REGISTRY.graftK.value, alpha: T1D_PARAMETER_REGISTRY.graftAlpha.value, beta: T1D_PARAMETER_REGISTRY.graftBeta.value, insulinVolumeLitresPerKg: params.VI } } : void 0;
  const core = graftActive ? steadyOxygenProfile(oxygen, points, cellFraction)[0] : NaN;
  const hypoxia = graftActive && core < oxygen.critical ? T1D_PARAMETER_REGISTRY.hypoxiaMax.value * (1 - core / oxygen.critical) : 0;
  const immune = graftActive ? T1D_PARAMETER_REGISTRY.immuneReject.value * (1 - Math.max(0, Math.min(1, (cd47 - T1D_PARAMETER_REGISTRY.cd47Lower.value) / (T1D_PARAMETER_REGISTRY.cd47Upper.value - T1D_PARAMETER_REGISTRY.cd47Lower.value)))) : 0;
  let state = graftActive ? [...init.state, 0, 0, 1] : [...init.state];
  const initialState = [...state], frames = [];
  const capture = (time) => {
    const [q1, q2, qgut, Gp, Gt, Gs, sc1, sc2, Ip, Il, , XL, X] = state;
    const rate = mealDerivative({ sto1: q1, sto2: q2, gut: qgut }, meal2, 0);
    const raw = graftActive ? coupling.graft.gamma * state[13] : 0;
    const effective = graftActive ? state[15] * coupling.graft.fraction * raw : 0;
    const loss = (params.m2 + params.m4) * Ip, liver = params.m1 * Il, absorption = params.ka1 * sc1 + params.ka2 * sc2;
    frames.push({
      time,
      state: [...state],
      glucose: Gp / params.VG,
      sensor: Gs / params.VG,
      insulin: Ip / params.VI,
      oxygen: graftActive ? core / T1D_PARAMETER_REGISTRY.oxygenHenryCoefficient.value : NaN,
      viability: graftActive ? state[15] : NaN,
      EGP: Math.max(0, init.kp1 - params.kp2 * Gp - params.kp3 * XL),
      Ra_meal: rate.appearance,
      U_id: (params.Vm0 + params.Vmx * X) * Gt / (params.Km0 + Gt),
      Ra_I: absorption,
      S_graft_raw: raw,
      S_graft_effective: effective,
      I_plasma_loss: loss,
      I_liver_input: liver,
      dI_p: -loss + liver + absorption + effective,
      k_immune: immune,
      k_hypoxia: hypoxia
    });
  };
  capture(0);
  for (let i = 0; i < 14400; i++) {
    const t = i * dt, active = scenario !== "fasting", ingestion = active && i >= 600 && i < 750 ? 4e3 : 0;
    const bolus = active && i >= 600 && i < 610 ? 60 / T1D_PARAMETER_REGISTRY.breakfastRatio.value * 6e3 / meal2.bodyWeight : 0;
    state = publishedModelStep(t, state, dt, params, meal2, init.kp1, () => ({ ingestion, infusion: (basalEnabled ? init.basal : 0) + bolus }), coupling);
    capture((i + 1) * dt);
  }
  const label = scenario === "graft" ? `${legacy ? options ? "Normoxic HIP graft" : "Hypoxic / unprotected graft" : `Graft \xB7 ${options.oxygenMmHg} mmHg \xB7 CD47 ${cd47.toLocaleString()} \xB7 ${basalEnabled ? "basal maintained" : "basal off"}`} \xB7 ${halfThicknessUm} \xB5m` : scenario === "meal" ? "60 g meal + bolus" : "Fasting baseline (basal insulin maintained)";
  return { scenario, label, dt, initialState, params, meal: meal2, kp1: init.kp1, basal: basalEnabled ? init.basal : 0, coupling, protocol: { mealMg: scenario === "fasting" ? 0 : 6e4, mealStartMin: 60, mealDurationMin: 15, bolusUnits: scenario === "fasting" ? 0 : 60 / T1D_PARAMETER_REGISTRY.breakfastRatio.value, bolusStartMin: 60, bolusDurationMin: 1, durationMin: 1440 }, boundaryAssumptions: `${points}-point slab; half-thickness ${halfThicknessUm} \xB5m; dx ${oxygen.dx} m; islet volume fraction ${cellFraction}; surface oxygen ${boundary} mol/m\xB3; Henry coefficient ${T1D_PARAMETER_REGISTRY.oxygenHenryCoefficient.value} mol/(m\xB3 mmHg); initial SC depots at fasting equilibrium even if basal is switched off at t=0.`, frames };
}

// src/modules/t1d/utils/reproducibilityExporter.ts
var ODE_COMMIT = "a81e7f3aeeba17b6b5920e5fda2563bfe05a0856";
var stateNames = ["Q_sto1", "Q_sto2", "Q_gut", "G_p", "G_t", "G_s", "I_sc1", "I_sc2", "I_p", "I_l", "I_delay1", "X_L", "X", "I_po", "Y_sec", "f_viable"];
var unitDictionary = Object.freeze({
  scenario: "label",
  time_min: "min",
  Q_sto1: "mg",
  Q_sto2: "mg",
  Q_gut: "mg",
  G_p: "mg/kg",
  G_t: "mg/kg",
  G_s: "mg/kg",
  I_sc1: "pmol/kg",
  I_sc2: "pmol/kg",
  I_p: "pmol/kg",
  I_l: "pmol/kg",
  I_delay1: "pmol/L",
  X_L: "pmol/L",
  X: "pmol/L",
  I_po: "pmol/kg",
  Y_sec: "pmol/(kg min)",
  f_viable: "dimensionless fraction",
  glucose_mg_dL: "mg/dL",
  sensor_mg_dL: "mg/dL",
  insulin_pmol_L: "pmol/L",
  oxygen_mmHg: "mmHg",
  viability: "dimensionless fraction",
  EGP: "mg/(kg min)",
  Ra_meal: "mg/(kg min)",
  U_id: "mg/(kg min)",
  Ra_I: "pmol/(kg min)",
  S_graft_raw: "pmol/(kg min)",
  S_graft_effective: "pmol/(kg min)",
  I_plasma_loss: "pmol/(kg min)",
  I_liver_input: "pmol/(kg min)",
  dI_p: "pmol/(kg min)",
  k_immune: "day\u207B\xB9",
  k_hypoxia: "day\u207B\xB9"
});
function makeBundle(runs) {
  const manifest = { odeCommit: ODE_COMMIT, dtMinutes: 0.1, parameterProvenance: T1D_PARAMETER_REGISTRY, runs: runs.map(({ frames, ...run }) => run), stateNames, unitDictionary, csvUnitsRow: "The second row maps each column to its unit; skip it when loading numeric rows." };
  const cols = ["scenario", "time_min", ...stateNames, "glucose_mg_dL", "sensor_mg_dL", "insulin_pmol_L", "oxygen_mmHg", "viability", "EGP", "Ra_meal", "U_id", "Ra_I", "S_graft_raw", "S_graft_effective", "I_plasma_loss", "I_liver_input", "dI_p", "k_immune", "k_hypoxia"];
  const cell = (x) => typeof x === "number" && !Number.isFinite(x) ? "" : typeof x === "string" ? `"${x.replaceAll('"', '""')}"` : x === void 0 ? "" : String(x);
  const rows = [cols.join(","), cols.map((c, i) => cell(i === 0 ? "unitDictionary" : unitDictionary[c])).join(",")];
  for (const run of runs) for (const f of run.frames) rows.push([run.label, f.time, ...stateNames.map((_, i) => f.state[i]), f.glucose, f.sensor, f.insulin, f.oxygen, f.viability, f.EGP, f.Ra_meal, f.U_id, f.Ra_I, f.S_graft_raw, f.S_graft_effective, f.I_plasma_loss, f.I_liver_input, f.dI_p, f.k_immune, f.k_hypoxia].map(cell).join(","));
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

// src/modules/t1d/utils/resultsSummary.ts
function summarizeRun(run) {
  if (run.frames.length < 2) throw new RangeError("A summary needs a trajectory with at least two samples");
  let duration = 0, inRange = 0, peak = -Infinity, minimum = Infinity;
  for (let i = 0; i < run.frames.length; i++) {
    const frame = run.frames[i];
    peak = Math.max(peak, frame.glucose);
    minimum = Math.min(minimum, frame.glucose);
    if (i + 1 < run.frames.length) {
      const dt = run.frames[i + 1].time - frame.time;
      if (!Number.isFinite(dt) || dt <= 0) throw new RangeError("Trajectory times must strictly increase");
      duration += dt;
      if (frame.glucose >= 70 && frame.glucose <= 180) inRange += dt;
    }
  }
  const finalViability = run.frames[run.frames.length - 1].viability;
  return {
    timeInRangePercent: 100 * inRange / duration,
    peak,
    minimum,
    excursion: peak - run.params.Gb,
    viabilityPercent: Number.isFinite(finalViability) ? finalViability * 100 : null
  };
}

// src/modules/t1d/components/GlassBoxInspectorDrawer.tsx
var equations = { glucose: "dGp/dt = EGP + Ra_meal \u2212 Fcns \u2212 E \u2212 k1\xB7Gp + k2\xB7Gt; G = Gp/VG", sensor: "dGs/dt = (Gp \u2212 Gs)/Td; G_sensor = Gs/VG", insulin: "dIp/dt = \u2212(m2 + m4)\xB7Ip + m1\xB7Il + Ra_I + S_graft_effective; S_graft_effective = f_viable \xB7 graft_fraction \xB7 S_graft_raw; S_graft_raw = \u03B3 \xB7 I_po; I = Ip/VI", oxygen: "D_eff\xB7d\xB2c/dx\xB2 = Rmax\xB7c/(Km+c)\xB7H_smooth(c\u2212Ccr)\xB7Xcell; pO\u2082 = c/\u03B1", viability: "df_viable/dt = \u2212(k_immune + k_hypoxia)\xB7f_viable/1440" };
var fluxGroups = [
  { title: "Glucose Balance", entries: [["EGP", "Endogenous production"], ["Ra_meal", "Meal appearance"], ["U_id", "Insulin-dependent uptake"]] },
  { title: "Insulin & Graft Input", entries: [["Ra_I", "SubQ absorption"], ["S_graft_raw", "Raw graft secretion"], ["S_graft_effective", "Effective graft input"], ["I_plasma_loss", "Plasma insulin loss"], ["I_liver_input", "Liver insulin input"], ["dI_p", "Net plasma insulin derivative"]] },
  { title: "Graft Survival Rates", entries: [["k_immune", "Immune clearance"], ["k_hypoxia", "Hypoxia loss"]] }
];
var states = [
  ["Q_sto1", "Stomach solid compartment"],
  ["Q_sto2", "Stomach liquid compartment"],
  ["Q_gut", "Intestinal glucose"],
  ["G_p", "Plasma glucose mass"],
  ["G_t", "Tissue glucose mass"],
  ["G_s", "Subcutaneous sensor glucose mass"],
  ["I_sc1", "First subcutaneous insulin compartment"],
  ["I_sc2", "Second subcutaneous insulin compartment"],
  ["I_p", "Plasma insulin mass"],
  ["I_l", "Liver insulin mass"],
  ["I_delay1", "Delayed insulin signal"],
  ["X_L", "Liver insulin action signal"],
  ["X", "Insulin-dependent uptake signal"],
  ["I_po", "Graft portal insulin"],
  ["Y_sec", "Graft secretion signal"],
  ["f_viable", "Viable graft fraction"]
];
var formatted = (value) => Number.isFinite(value) && value !== 0 && Math.abs(value) < 5e-5 ? value.toExponential(4) : value.toFixed(4);
function GlassBoxInspectorDrawer(host) {
  host.className = "card t1d-inspector";
  host.setAttribute("aria-live", "polite");
  host.setAttribute("aria-label", "Glass-box inspector");
  Object.assign(host.style, { display: "none", position: "fixed", right: "16px", top: "64px", width: "min(470px, calc(100vw - 32px))", maxHeight: "calc(100vh - 80px)", overflowY: "auto", zIndex: "20", boxShadow: "0 12px 36px rgba(0,0,0,.5)" });
  const style = document.createElement("style");
  style.textContent = `
    .t1d-inspector{padding:18px;color:#e2e8f0}.t1d-inspector .inspect-header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.t1d-inspector .inspect-header h2{color:#e8f3ff;font-size:.87rem;letter-spacing:.04em;margin:0}.t1d-inspector .inspect-close{width:auto;white-space:nowrap;font-size:.7rem;padding:6px 9px}.t1d-inspector .inspect-equation{background:#0a111b;border:1px solid #35516c;border-radius:8px;padding:13px;margin-bottom:10px}.t1d-inspector .inspect-caption{font-size:.65rem;letter-spacing:.09em;text-transform:uppercase;color:#8cbce9;font-weight:700;margin-bottom:7px}.t1d-inspector .inspect-context{color:#b7cadc;font-size:.72rem;line-height:1.5;margin-bottom:9px}.t1d-inspector code{font-family:Consolas,monospace;color:#d7eaff;font-size:.75rem;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere}.t1d-inspector .inspect-run{font-size:.7rem;color:#a5b8ca;line-height:1.5;margin:10px 0 14px}.t1d-inspector .inspect-group{border:1px solid #2a3444;border-radius:8px;margin:10px 0;background:#111923;overflow:hidden}.t1d-inspector .inspect-group h3{color:#a8d0f4;font-size:.72rem;letter-spacing:.03em;padding:10px 12px;background:#192534;margin:0}.t1d-inspector .inspect-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:7px 12px;border-top:1px solid #25313f}.t1d-inspector .inspect-label{min-width:0;font-size:.7rem;color:#d6e3f0;overflow-wrap:anywhere}.t1d-inspector .inspect-symbol{font-family:Consolas,monospace;color:#91bde4;font-size:.68rem;margin-right:5px}.t1d-inspector .inspect-value{text-align:right;white-space:nowrap;font-family:Consolas,monospace;font-size:.72rem;color:#f0f6fc}.t1d-inspector .inspect-unit{display:block;color:#9baebe;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:.62rem;margin-top:2px}.t1d-inspector details{border:1px solid #2a3444;border-radius:8px;padding:10px 12px;margin-top:10px}.t1d-inspector summary{cursor:pointer;color:#cbe2ff;font-size:.73rem;font-weight:600;line-height:1.5}.t1d-inspector .inspect-table-wrap{overflow-x:auto;margin-top:10px}.t1d-inspector table{border-collapse:collapse;width:100%;font-size:.68rem}.t1d-inspector th,.t1d-inspector td{padding:7px 5px;text-align:left;border-bottom:1px solid #2a3444;vertical-align:top}.t1d-inspector th{color:#a9bfd3;font-weight:600}.t1d-inspector td:first-child,.t1d-inspector .state-value{font-family:Consolas,monospace;color:#d7eaff}.t1d-inspector .state-value{overflow-wrap:anywhere}.t1d-inspector .state-unit{color:#9baebe}.t1d-inspector .provenance p{font-size:.7rem;line-height:1.55;overflow-wrap:anywhere;padding-top:10px;color:#b9cbdc}
  `;
  const header = document.createElement("div");
  header.className = "inspect-header";
  const title = document.createElement("h2");
  title.textContent = "Glass-box inspector";
  const close = document.createElement("button");
  close.className = "inspect-close";
  close.textContent = "Close inspector";
  close.addEventListener("click", () => {
    host.style.display = "none";
  });
  header.append(title, close);
  const body = document.createElement("div");
  host.replaceChildren(style, header, body);
  return { show(run, frame, curve) {
    host.style.display = "block";
    const stateOpen = body.querySelector(".inspect-states")?.open ?? false;
    const provenanceOpen = body.querySelector(".provenance")?.open ?? false;
    body.replaceChildren();
    const equation = document.createElement("section");
    equation.className = "inspect-equation";
    const caption = document.createElement("div");
    caption.className = "inspect-caption";
    caption.textContent = "Active governing equation";
    const context = document.createElement("div");
    context.className = "inspect-context";
    context.textContent = `${run.label} \xB7 t = ${frame.time.toFixed(1)} min`;
    const formula = document.createElement("code");
    formula.textContent = equations[curve] ?? equations.glucose;
    equation.append(caption, context, formula);
    body.append(equation);
    const runInfo = document.createElement("p");
    runInfo.className = "inspect-run";
    runInfo.textContent = `Run fasting glucose: ${run.params.Gb} mg/dL${run.coupling ? ` \xB7 CD47: ${run.coupling.cd47} molecules/cell` : ""}`;
    body.append(runInfo);
    for (const group of fluxGroups) {
      const section = document.createElement("section");
      section.className = "inspect-group";
      const heading = document.createElement("h3");
      heading.textContent = group.title;
      section.append(heading);
      for (const [key, label] of group.entries) {
        const row = document.createElement("div");
        row.className = "inspect-row";
        const name = document.createElement("div");
        name.className = "inspect-label";
        const symbol = document.createElement("span");
        symbol.className = "inspect-symbol";
        symbol.textContent = key;
        name.append(symbol, document.createTextNode(label));
        const value = document.createElement("div");
        value.className = "inspect-value";
        value.textContent = formatted(frame[key]);
        value.title = String(frame[key]);
        const unit = document.createElement("span");
        unit.className = "inspect-unit";
        unit.textContent = unitDictionary[key];
        value.append(unit);
        row.append(name, value);
        section.append(row);
      }
      body.append(section);
    }
    const stateDetails = document.createElement("details");
    stateDetails.className = "inspect-states";
    stateDetails.open = stateOpen;
    const stateSummary = document.createElement("summary");
    stateSummary.textContent = "All 13 ODE State Variables (Exact Values)";
    stateDetails.append(stateSummary);
    const stateNote = document.createElement("p");
    stateNote.className = "inspect-run";
    stateNote.textContent = "The three additional graft states are present only in graft simulations.";
    stateDetails.append(stateNote);
    const wrap = document.createElement("div");
    wrap.className = "inspect-table-wrap";
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    for (const heading of ["Symbol", "State", "Exact value", "Unit"]) {
      const th = document.createElement("th");
      th.scope = "col";
      th.textContent = heading;
      headRow.append(th);
    }
    thead.append(headRow);
    table.append(thead);
    const tbody = document.createElement("tbody");
    states.forEach(([symbol, name], index) => {
      const row = document.createElement("tr");
      for (const [column, text] of [symbol, name, index < frame.state.length ? String(frame.state[index]) : "Not modeled", unitDictionary[symbol]].entries()) {
        const cell = document.createElement("td");
        if (column === 2) cell.className = "state-value";
        if (column === 3) cell.className = "state-unit";
        cell.textContent = text;
        row.append(cell);
      }
      tbody.append(row);
    });
    table.append(tbody);
    wrap.append(table);
    stateDetails.append(wrap);
    body.append(stateDetails);
    const details = document.createElement("details");
    details.className = "provenance";
    details.open = provenanceOpen;
    const summary = document.createElement("summary");
    summary.textContent = "Full parameter provenance";
    details.append(summary);
    for (const [key, p] of Object.entries(T1D_PARAMETER_REGISTRY)) {
      const active = isParameterActive(key, run.scenario);
      const el = document.createElement("p"), badge = document.createElement("span");
      badge.className = "t1d-badge";
      badge.dataset.active = String(active);
      badge.textContent = `${p.provenanceType} \xB7 ${active ? "ACTIVE_IN_SOLVER" : "CONTEXTUAL_BENCHMARK"}`;
      el.append(document.createTextNode(`${key}: ${p.value} ${p.unit}${key === "adultFastingGlucose" ? ` (run: ${run.params.Gb} ${p.unit})` : ""} `), badge, document.createTextNode(` \xB7 ${p.sourceCitation} \xB7 `));
      const a = document.createElement("a");
      a.href = `https://doi.org/${p.doi}`;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = p.doi;
      el.append(a, document.createTextNode(` \xB7 ${p.sourceLocation}. ${p.validityWarning}`));
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
    let state = init.state, maxDrift = 0;
    for (let i = 0; i < 14400; i++) {
      state = publishedModelStep(i * 0.1, state, 0.1, p, m, init.kp1, () => ({ ingestion: 0, infusion: init.basal }));
      maxDrift = Math.max(maxDrift, Math.abs(state[3] / p.VG - p.Gb), Math.abs(state[5] / p.VG - p.Gb));
    }
    return [{ test: `T1D 24 h fasting equilibrium (max drift ${maxDrift.toPrecision(3)} mg/dL)`, status: Number.isFinite(maxDrift) && maxDrift <= 1 ? "PASS" : "FAIL" }, { test: "T1D provenance metadata present", status: Object.values(T1D_PARAMETER_REGISTRY).every((x) => x.doi && x.sourceLocation && x.unit) ? "PASS" : "FAIL" }];
  } catch (e) {
    return [{ test: `T1D suite: ${e instanceof Error ? e.message : String(e)}`, status: "FAIL" }];
  }
}

// src/modules/t1d/components/T1DWorkbenchView.tsx
function T1DWorkbenchView(controls2, view2) {
  const p = T1D_PARAMETER_REGISTRY.adultFastingGlucose;
  controls2.innerHTML = `<h2>Experiment setup</h2>
  <div class="control-group"><label for="t1dScenario">Scenario preset</label><select id="t1dScenario"><option value="fasting">Fasting baseline</option><option value="meal">Meal and insulin bolus</option><option value="graft">Islet graft</option><option value="basal-compare">Graft: compare basal insulin</option></select><small id="t1dScenarioDescription"></small></div>
  <div class="control-group" data-graft-control><label for="t1dOxygen">Capsule surface oxygen tension</label><select id="t1dOxygen"><option value="140">140 mmHg \xB7 normoxic</option><option value="76">76 mmHg \xB7 arterial</option><option value="15">15 mmHg \xB7 hypoxic</option></select><small>Surface oxygen may differ from oxygen at the core.</small></div>
  <div class="control-group" data-graft-control><label for="t1dThickness">Capsule half-thickness</label><select id="t1dThickness"><option value="150">150 \xB5m</option><option value="250">250 \xB5m</option><option value="500" selected>500 \xB5m</option></select></div>
  <div class="control-group" data-shield-control><label for="t1dCd47">Immune shielding (CD47)</label><select id="t1dCd47"><option value="600000">600,000 molecules/cell \xB7 HIP</option><option value="200000">200,000 molecules/cell \xB7 threshold</option><option value="0">0 molecules/cell \xB7 DKO</option></select></div>
  <div class="control-group"><label for="t1dGb">Baseline fasting glucose <span id="t1dGbLabel" class="val-display"></span></label><input id="t1dGb" type="range" min="${p.minBound}" max="${p.maxBound}" step="0.1" value="${p.value}"><small>Adult cohort range, mg/dL.</small></div><button class="primary" id="t1dRun">Run simulation</button><button id="t1dExport" disabled>Download reproducibility bundle</button><p id="t1dStatus" role="status">Choose a scenario, then run.</p><details class="t1d-parameters"><summary>View Underlying ODE Parameters &amp; Citations (Read-Only)</summary><div id="t1dParameters"></div></details>`;
  const panel = controls2.querySelector("#t1dParameters");
  for (const [key, param] of Object.entries(T1D_PARAMETER_REGISTRY)) {
    const d = document.createElement("div");
    d.className = "control-group";
    const title = document.createElement("strong");
    title.textContent = `${key}: ${param.value} ${param.unit} `;
    const badge = document.createElement("span");
    badge.className = "t1d-badge";
    badge.textContent = `${param.provenanceType} \xB7 ${param.usageType}`;
    badge.dataset.parameter = key;
    const detail = document.createElement("p");
    detail.append(document.createTextNode(`${param.sourceCitation} \xB7 DOI `));
    const doi = document.createElement("a");
    doi.href = `https://doi.org/${param.doi}`;
    doi.target = "_blank";
    doi.rel = "noopener noreferrer";
    doi.textContent = param.doi;
    detail.append(doi, document.createTextNode(` \xB7 ${param.sourceLocation}. ${param.validityWarning} ${param.minBound === null || param.maxBound === null ? "No verified slider range; read only." : `Bounds ${param.minBound}\u2013${param.maxBound}.`}`));
    d.append(title, badge, detail);
    panel.append(d);
  }
  view2.style.gap = "18px";
  const style = document.createElement("style");
  style.textContent = `
  .t1d-badge{display:inline-block;border:1px solid #5276a1;border-radius:10px;padding:2px 6px;color:#b6d6ff;background:#20324a;font-size:.65rem}.t1d-badge[data-active="true"]{border-color:#3fb950;color:#adf3bb;background:#173621}.t1d-badge[data-active="false"]{opacity:.7}
  #view-t1d a,#ctrl-t1d a{color:#79c0ff} #ctrl-t1d small{display:block;color:#aab8c9;line-height:1.45;margin-top:6px} #ctrl-t1d .control-group{margin-bottom:18px} #ctrl-t1d #t1dExport{margin-top:8px} #t1dStatus{color:#aab8c9;font-size:.75rem;margin:10px 0 18px} .t1d-parameters summary,.t1d-disclosure>summary{cursor:pointer;color:#cbe2ff;font-weight:600;line-height:1.5} .t1d-parameters #t1dParameters{padding-top:16px;font-size:.75rem;overflow-wrap:anywhere} .t1d-parameters p{color:#aab8c9;line-height:1.5;margin-top:5px}
  .t1d-intro h2{color:#f8fafc;font-size:1.15rem;letter-spacing:0;text-transform:none;margin:4px 0}.t1d-intro p,.t1d-muted{color:#aebed0;line-height:1.5;font-size:.8rem}.t1d-eyebrow{color:#70b6ff;font-size:.67rem;letter-spacing:.11em;text-transform:uppercase;font-weight:700}
  .t1d-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.t1d-summary .metric-card{min-width:0;text-align:left;padding:18px;background:linear-gradient(145deg,#192536,#151b26);border-radius:10px}.t1d-summary .label{font-size:.78rem;color:#c5d4e5;font-weight:600}.t1d-summary .val{font-size:1.8rem;line-height:1.2;margin:12px 0 7px;color:#f8fafc}.t1d-summary .detail{font-size:.72rem;color:#b7c8d9;line-height:1.45}.t1d-status{display:inline-block;border-radius:12px;padding:3px 7px;font-size:.65rem;font-weight:600;margin-top:9px;background:#203b35;color:#a9e9ba}.t1d-status.warn{background:#4a321b;color:#ffda9c}.t1d-status.neutral{background:#273647;color:#c1d3e6}
  .t1d-threshold{border:1px solid #f0a64b;color:#ffe2ad;background:#493116;padding:10px 14px;border-radius:8px}.t1d-stale{position:absolute;inset:0;z-index:2;background:rgba(11,15,23,.9);display:grid;place-items:center;text-align:center;font-weight:bold;color:#fff;pointer-events:auto}.t1d-stale[hidden]{display:none}.t1d-empty{color:#b8c7d9;padding:3rem 1rem;text-align:center}.t1d-takeaway{border-left:3px solid #58a6ff;line-height:1.55}.t1d-takeaway h2{color:#a8d4ff}.t1d-plots{display:grid;gap:16px}.t1d-chart-card{padding:18px;min-width:0}.t1d-chart-card h2{color:#e2edf8;font-size:.85rem;letter-spacing:0;text-transform:none}.t1d-chart-note{color:#91d5b1;font-size:.72rem;margin-bottom:8px}.t1d-chart-wrap{height:250px;position:relative}.t1d-disclosure{padding:16px}.t1d-secondary-plots{display:grid;gap:12px;margin-top:14px}.t1d-inspection{display:grid;gap:12px;margin-top:14px}.t1d-inspection .btn-row{margin:0}
  @media(max-width:600px){.t1d-summary{grid-template-columns:1fr}.t1d-summary .metric-card{padding:14px}.t1d-summary .val{font-size:1.5rem;margin:6px 0}.t1d-chart-wrap{height:220px}}
  `;
  const intro = document.createElement("div");
  intro.className = "t1d-intro";
  intro.innerHTML = '<span class="t1d-eyebrow">Islet graft &amp; glucose sandbox</span><h2>Lab readout</h2><p>Explore a simulated 24-hour experiment. Select a curve to inspect the model behind it.</p>';
  const alert = document.createElement("div");
  alert.setAttribute("role", "status");
  alert.hidden = true;
  const staleNotice = document.createElement("div");
  staleNotice.className = "t1d-threshold";
  staleNotice.textContent = "Inputs changed. These results are stale \u2014 click Run simulation to update them.";
  staleNotice.hidden = true;
  const takeaway = document.createElement("section");
  takeaway.className = "card t1d-takeaway";
  takeaway.setAttribute("aria-live", "polite");
  takeaway.hidden = true;
  const summary = document.createElement("section");
  summary.className = "t1d-summary";
  summary.setAttribute("aria-label", "Lab readout");
  const timeline = document.createElement("div");
  timeline.className = "card";
  timeline.innerHTML = '<label for="t1dActiveRun">Inspect comparison run</label><select id="t1dActiveRun" disabled></select><label for="t1dTime">Inspect timestamp (minutes) <span id="t1dTimeValue" class="val-display">0</span></label><input id="t1dTime" type="range" min="0" max="1440" step="0.1" value="0" disabled>';
  const plotContainer = document.createElement("div");
  plotContainer.className = "t1d-plots";
  plotContainer.style.position = "relative";
  const plots = [], emptyStates = [];
  const formulas = document.createElement("div");
  formulas.className = "btn-row";
  const secondary = document.createElement("details");
  secondary.className = "card t1d-disclosure";
  secondary.innerHTML = '<summary>Secondary Physiological Traces</summary><p class="t1d-muted">Explore insulin and oxygen behavior in more detail.</p>';
  const secondaryPlots = document.createElement("div");
  secondaryPlots.className = "t1d-secondary-plots";
  secondary.append(secondaryPlots);
  for (const [index, label] of ["Blood Sugar \u2014 Plasma Glucose G(t) & Sensor Glucose", "Plasma Insulin \u2014 I(t)", "Capsule Core Oxygen \u2014 pO\u2082", "Surviving Islets \u2014 Graft Viability f_viable(t)"].entries()) {
    const card = document.createElement("section");
    card.className = "card t1d-chart-card";
    const h = document.createElement("h2");
    h.textContent = label;
    const wrapper = document.createElement("div");
    wrapper.className = "t1d-chart-wrap";
    const c = document.createElement("canvas");
    c.setAttribute("aria-label", label);
    c.setAttribute("role", "img");
    const empty = document.createElement("p");
    empty.className = "t1d-empty";
    empty.textContent = index === 2 ? "No graft is present in this scenario, so core oxygen is not simulated." : "No graft is present in this scenario, so graft viability is not simulated.";
    empty.hidden = true;
    wrapper.append(c, empty);
    emptyStates[index] = empty;
    card.append(h);
    if (index === 0) {
      const legend = document.createElement("p");
      legend.className = "t1d-chart-note";
      legend.textContent = "\u25B0 70\u2013180 mg/dL reference band \xB7 not a personalized target";
      card.append(legend);
    }
    card.append(wrapper);
    if (index === 0 || index === 3) plotContainer.append(card);
    else secondaryPlots.append(card);
    plots[index] = c;
  }
  plotContainer.append(secondary);
  const stale = document.createElement("div");
  stale.className = "t1d-stale";
  stale.textContent = "Stale Results \u2014 Click Run";
  stale.hidden = true;
  plotContainer.append(stale);
  const inspection = document.createElement("details");
  inspection.className = "card t1d-disclosure";
  inspection.innerHTML = "<summary>Inspect equations &amp; timestamps</summary>";
  const inspectionBody = document.createElement("div");
  inspectionBody.className = "t1d-inspection";
  inspectionBody.append(timeline, formulas);
  inspection.append(inspectionBody);
  const inspectorHost = document.createElement("section");
  const inspector = GlassBoxInspectorDrawer(inspectorHost);
  view2.replaceChildren(style, intro, staleNotice, summary, alert, takeaway, plotContainer, inspection, inspectorHost, OmittedPhysiologyPanel());
  const scenario = controls2.querySelector("#t1dScenario"), oxygen = controls2.querySelector("#t1dOxygen"), thickness = controls2.querySelector("#t1dThickness"), cd47 = controls2.querySelector("#t1dCd47"), slider = controls2.querySelector("#t1dGb"), display = controls2.querySelector("#t1dGbLabel"), runButton = controls2.querySelector("#t1dRun"), exportButton = controls2.querySelector("#t1dExport"), status = controls2.querySelector("#t1dStatus");
  const timeInput = timeline.querySelector("#t1dTime"), timeLabel = timeline.querySelector("#t1dTimeValue"), activeRun = timeline.querySelector("#t1dActiveRun");
  let runs = [], charts = [], selectedRun = 0, selectedFrame = 0, selectedCurve = "glucose";
  display.textContent = slider.value;
  const renderResults = () => {
    const run = runs[selectedRun];
    summary.replaceChildren();
    const result = run ? summarizeRun(run) : null;
    const hasHypoxia = !!run && run.scenario === "graft" && run.frames.some((f) => f.k_hypoxia > 0);
    const hasImmuneLoss = !!run && run.scenario === "graft" && run.frames.some((f) => f.k_immune > 0);
    const graftStatus = !run ? "Awaiting simulation" : run.scenario !== "graft" ? "No graft in this scenario" : hasHypoxia ? hasImmuneLoss ? "Oxygen and immune loss" : "Core hypoxia loss" : hasImmuneLoss ? "Immune-related loss" : "Protected & oxygenated";
    const cards = [
      { label: "Peak Blood Sugar", value: result ? `${result.peak.toFixed(1)} mg/dL` : "\u2014", detail: result ? `${result.excursion >= 0 ? "+" : ""}${result.excursion.toFixed(1)} mg/dL vs. baseline` : "Run a simulation to see results", badge: "", tone: "neutral" },
      { label: "Lowest Blood Sugar", value: result ? `${result.minimum.toFixed(1)} mg/dL` : "\u2014", detail: "Lowest simulated plasma glucose", badge: result ? result.minimum < 60 ? "Below 60 floor" : result.minimum > 60 ? "Above 60 floor" : "At 60 floor" : "Awaiting simulation", tone: result ? result.minimum <= 60 ? "warn" : "" : "neutral" },
      { label: "24h Surviving Islets", value: result?.viabilityPercent != null ? `${result.viabilityPercent.toFixed(1)}%` : "\u2014", detail: run?.scenario === "graft" ? "Modeled graft viability after 24 hours" : "No graft survival to report", badge: graftStatus, tone: !run || run.scenario !== "graft" ? "neutral" : hasHypoxia || hasImmuneLoss ? "warn" : "" }
    ];
    for (const item of cards) {
      const card = document.createElement("div");
      card.className = "metric-card";
      const name = document.createElement("div");
      name.className = "label";
      name.textContent = item.label;
      const val = document.createElement("div");
      val.className = "val";
      val.textContent = item.value;
      const detail = document.createElement("div");
      detail.className = "detail";
      detail.textContent = item.detail;
      card.append(name, val, detail);
      if (item.badge) {
        const badge = document.createElement("span");
        badge.className = `t1d-status ${item.tone}`;
        badge.textContent = item.badge;
        card.append(badge);
      }
      summary.append(card);
    }
    if (!run || !result) {
      takeaway.hidden = true;
      return;
    }
    takeaway.replaceChildren();
    const heading = document.createElement("h2");
    heading.textContent = "Result takeaway";
    const message = document.createElement("p");
    message.textContent = `In ${run.label}, simulated glucose rose at most ${result.excursion.toFixed(1)} mg/dL above its starting level and reached a minimum of ${result.minimum.toFixed(1)} mg/dL.${result.viabilityPercent === null ? " No graft was included." : ` After 24 hours, ${result.viabilityPercent.toFixed(1)}% of the modeled graft remained viable.`} ${result.timeInRangePercent.toFixed(1)}% of simulated time was in the 70\u2013180 mg/dL reference band. This is a simulation, not medical advice.`;
    takeaway.append(heading, message);
    takeaway.hidden = false;
  };
  renderResults();
  const inspect = () => {
    if (runs[selectedRun]) inspector.show(runs[selectedRun], runs[selectedRun].frames[selectedFrame], selectedCurve);
  };
  const markStale = () => {
    exportButton.disabled = true;
    status.textContent = "Stale Results \u2014 Click Run";
    if (runs.length) {
      stale.hidden = false;
      staleNotice.hidden = false;
      alert.hidden = true;
      takeaway.hidden = true;
      summary.style.opacity = ".5";
      summary.setAttribute("aria-label", "Lab readout: stale results");
      timeInput.disabled = true;
      activeRun.disabled = true;
      inspectorHost.style.display = "none";
    }
  };
  const updateControls = () => {
    const graft = scenario.value === "graft" || scenario.value === "basal-compare";
    oxygen.disabled = !graft;
    thickness.disabled = !graft;
    cd47.disabled = !graft || scenario.value === "basal-compare";
    controls2.querySelectorAll("[data-graft-control]").forEach((el) => el.hidden = !graft);
    controls2.querySelector("[data-shield-control]").hidden = scenario.value !== "graft";
    const descriptions = { fasting: "Follow fasting glucose with continuous basal insulin maintained.", meal: "See the response to a 60 g meal and mealtime insulin bolus.", graft: "Explore a graft with selectable oxygen, thickness, and immune shielding.", "basal-compare": "Compare a protected graft with basal insulin maintained versus switched off at time zero; initial insulin depots remain." };
    controls2.querySelector("#t1dScenarioDescription").textContent = descriptions[scenario.value];
  };
  const changeScenario = () => {
    updateControls();
    markStale();
  };
  updateControls();
  slider.addEventListener("input", () => {
    display.textContent = slider.value;
    markStale();
  });
  scenario.addEventListener("change", changeScenario);
  oxygen.addEventListener("change", markStale);
  thickness.addEventListener("change", markStale);
  cd47.addEventListener("change", markStale);
  timeInput.addEventListener("input", () => {
    selectedFrame = Math.round(Number(timeInput.value) * 10);
    timeLabel.textContent = timeInput.value;
    inspect();
  });
  activeRun.addEventListener("change", () => {
    selectedRun = Number(activeRun.value);
    renderResults();
    inspect();
  });
  for (const [key, label] of Object.entries({ glucose: "Glucose equation", sensor: "Sensor equation", insulin: "Insulin equation", oxygen: "Oxygen equation", viability: "Viability equation" })) {
    const button = document.createElement("button");
    button.textContent = label;
    button.addEventListener("click", () => {
      selectedCurve = key;
      inspect();
    });
    formulas.append(button);
  }
  runButton.addEventListener("click", () => {
    runButton.disabled = true;
    exportButton.disabled = true;
    status.textContent = "Running\u2026";
    setTimeout(() => {
      try {
        const value = validateParameterValue(p, Number(slider.value));
        const opts = { oxygenMmHg: Number(oxygen.value), cd47: Number(cd47.value), basalEnabled: true, halfThicknessUm: Number(thickness.value) };
        switch (scenario.value) {
          case "fasting":
            runs = [simulate("fasting", value)];
            break;
          case "meal":
            runs = [simulate("meal", value)];
            break;
          case "basal-compare":
            runs = [simulate("graft", value, { ...opts, cd47: 6e5, basalEnabled: true }), simulate("graft", value, { ...opts, cd47: 6e5, basalEnabled: false })];
            break;
          case "graft":
            runs = [simulate("graft", value, opts)];
            break;
          default:
            throw new Error("Unknown scenario");
        }
        selectedRun = 0;
        selectedFrame = 0;
        selectedCurve = "glucose";
        staleNotice.hidden = true;
        summary.style.opacity = "";
        summary.setAttribute("aria-label", "Lab readout");
        activeRun.replaceChildren();
        runs.forEach((run, i) => {
          const option = document.createElement("option");
          option.value = String(i);
          option.textContent = run.label;
          activeRun.append(option);
        });
        activeRun.disabled = runs.length < 2;
        renderResults();
        for (const badge of panel.querySelectorAll("[data-parameter]")) {
          const key = badge.dataset.parameter;
          const active = isParameterActive(key, runs[0].scenario);
          badge.dataset.active = String(active);
          badge.textContent = `${T1D_PARAMETER_REGISTRY[key].provenanceType} \xB7 ${active ? "ACTIVE_IN_SOLVER" : "CONTEXTUAL_BENCHMARK"}`;
        }
        charts.forEach((c) => c.destroy());
        charts = [];
        const lowRuns = runs.map((run) => {
          const low = run.frames.reduce((a, b) => a.glucose < b.glucose ? a : b);
          return { label: run.label, low };
        }).filter((x) => x.low.glucose < 60);
        alert.hidden = lowRuns.length === 0;
        alert.className = lowRuns.length ? "t1d-threshold" : "";
        alert.textContent = lowRuns.length ? `Model threshold below 60 mg/dL: ${lowRuns.map((x) => `${x.label}, ${x.low.glucose.toFixed(1)} mg/dL at ${x.low.time.toFixed(1)} min`).join("; ")}. Simulation only; not clinical guidance.` : "";
        const defs = [["glucose", "sensor"], ["insulin"], ["oxygen"], ["viability"]], units = ["mg/dL", "pmol/L", "mmHg", "% viable"];
        defs.forEach((metrics, idx) => {
          const datasets = [];
          for (const [rIndex, run] of runs.entries()) for (const [metricIndex, metric] of metrics.entries()) {
            if (idx > 1 && run.scenario !== "graft") continue;
            const data = run.frames.filter((_, i) => i % 50 === 0).map((f) => ({ x: f.time, y: Number.isFinite(f[metric]) ? metric === "viability" ? 100 * f[metric] : f[metric] : null }));
            datasets.push({ label: `${run.label} \xB7 ${metric}`, data, borderColor: rIndex ? "#f78166" : metricIndex ? "#d2a8ff" : "#58a6ff", borderDash: metric === "sensor" ? [5, 4] : [], pointRadius: 0, pointHitRadius: 10, tension: 0, _run: rIndex, _metric: metric });
          }
          const isEmpty = idx > 1 && runs.every((run) => run.scenario !== "graft");
          emptyStates[idx].hidden = !isEmpty;
          plots[idx].hidden = isEmpty;
          plots[idx].style.display = isEmpty ? "none" : "";
          if (isEmpty) {
            plots[idx].onclick = null;
            return;
          }
          const annotations = { id: "t1d-annotations", beforeDatasetsDraw(chart2) {
            if (idx !== 0) return;
            const area = chart2.chartArea, ctx = chart2.ctx, y70 = chart2.scales.y.getPixelForValue(70), y180 = chart2.scales.y.getPixelForValue(180), top = Math.max(area.top, Math.min(y70, y180)), bottom = Math.min(area.bottom, Math.max(y70, y180));
            if (bottom > top) {
              ctx.save();
              ctx.fillStyle = "rgba(46,160,90,0.15)";
              ctx.fillRect(area.left, top, area.right - area.left, bottom - top);
              ctx.restore();
            }
          }, afterDatasetsDraw(chart2) {
            if (idx !== 0) return;
            const area = chart2.chartArea, ctx = chart2.ctx;
            ctx.save();
            if (lowRuns.length) {
              const y = chart2.scales.y.getPixelForValue(60);
              if (y >= area.top && y <= area.bottom) {
                ctx.strokeStyle = "#ffbd66";
                ctx.setLineDash([6, 4]);
                ctx.beginPath();
                ctx.moveTo(area.left, y);
                ctx.lineTo(area.right, y);
                ctx.stroke();
                ctx.fillStyle = "#ffdfad";
                ctx.fillText("60 mg/dL", area.left + 4, y - 4);
              }
            }
            const protocol = runs[0].protocol;
            if (protocol.mealMg > 0) {
              const x = chart2.scales.x.getPixelForValue(protocol.mealStartMin);
              if (x >= area.left && x <= area.right) {
                ctx.strokeStyle = "#e7c36a";
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(x, area.top);
                ctx.lineTo(x, area.bottom);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = "#ffe1a4";
                const label = `t = ${protocol.mealStartMin} min: ${protocol.mealMg / 1e3} g meal + ${protocol.bolusUnits.toFixed(2)} U bolus`;
                ctx.fillText(label, Math.max(area.left + 4, Math.min(x + 4, area.right - ctx.measureText(label).width - 4)), area.top + 12, area.right - area.left - 8);
              }
            }
            ctx.restore();
          } };
          const chart = new Chart(plots[idx], { type: "line", data: { datasets }, plugins: [annotations], options: { responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: "nearest", intersect: false }, plugins: { legend: { labels: { color: "#cbd5e1" } } }, scales: { x: { type: "linear", ticks: { color: "#cbd5e1" }, grid: { color: "#2a3444" }, title: { display: true, text: "Time (min)", color: "#cbd5e1" } }, y: { ticks: { color: "#cbd5e1" }, grid: { color: "#2a3444" }, title: { display: true, text: units[idx], color: "#cbd5e1" } } } } });
          charts.push(chart);
          plots[idx].onclick = (event) => {
            if (!datasets.length) return;
            const time = chart.scales.x.getValueForPixel(event.offsetX);
            if (!Number.isFinite(time)) return;
            const point = Math.max(0, Math.min(288, Math.round(time / 5)));
            let nearest = null, distance = Infinity;
            for (const ds of datasets) {
              const v = ds.data[point]?.y;
              if (v === null || v === void 0) continue;
              const delta = Math.abs(chart.scales.y.getPixelForValue(v) - event.offsetY);
              if (delta < distance) {
                distance = delta;
                nearest = ds;
              }
            }
            if (nearest) {
              selectedRun = nearest._run;
              activeRun.value = String(selectedRun);
              selectedFrame = point * 50;
              selectedCurve = nearest._metric;
              timeInput.value = String(selectedFrame / 10);
              timeLabel.textContent = timeInput.value;
              renderResults();
              inspect();
            }
          };
        });
        status.textContent = `Completed ${runs.length} ${runs.length === 1 ? "trajectory" : "trajectories"} at 0.1 min steps.`;
        exportButton.disabled = false;
        timeInput.disabled = false;
        timeInput.value = "0";
        timeLabel.textContent = "0";
        stale.hidden = true;
      } catch (e) {
        runs = [];
        charts.forEach((c) => c.destroy());
        charts = [];
        timeInput.disabled = true;
        activeRun.disabled = true;
        alert.hidden = true;
        takeaway.hidden = true;
        staleNotice.hidden = true;
        summary.style.opacity = "";
        summary.setAttribute("aria-label", "Lab readout");
        renderResults();
        stale.hidden = true;
        status.textContent = `Simulation failed: ${e instanceof Error ? e.message : String(e)}`;
      } finally {
        runButton.disabled = false;
      }
    }, 20);
  });
  secondary.addEventListener("toggle", () => {
    if (secondary.open) requestAnimationFrame(() => charts.forEach((chart) => chart.resize()));
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
