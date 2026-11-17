export interface Parameter {
  readonly id: string; readonly symbol: string; readonly name: string; readonly value: number;
  readonly unit: string; readonly minBound: number | null; readonly maxBound: number | null;
  readonly sourceCitation: string; readonly doi: string; readonly sourceLocation: string;
  readonly provenanceType: 'LITERATURE_TABLE' | 'PHENOMENOLOGICAL_CALIBRATED' | 'MODEL_ASSUMPTION';
  readonly validityWarning: string;
  readonly usageType: 'ACTIVE_IN_SOLVER' | 'CONTEXTUAL_BENCHMARK';
  readonly activeScenarios: readonly T1DScenario[];
}
export type T1DScenario = 'fasting' | 'meal' | 'graft';
type SourceParameter = Omit<Parameter, 'usageType' | 'activeScenarios'>;
const citation = 'Dalla Man et al. (2014), The UVA/PADOVA Type 1 Diabetes Simulator: New Features';
const cohort = (id: string, value: number, minBound: number, maxBound: number): Readonly<SourceParameter> => Object.freeze({
  id, symbol: 'Gb', name: `${id} fasting plasma glucose`, value, unit: 'mg/dL', minBound, maxBound,
  sourceCitation: citation, doi: '10.1177/1932296813514502', sourceLocation: 'Table 1',
  provenanceType: 'LITERATURE_TABLE', validityWarning: 'Population summary; not an individual patient parameter.'
});
const fixed = (id: string, symbol: string, value: number, unit: string, sourceCitation: string, doi: string, sourceLocation: string): Readonly<SourceParameter> => Object.freeze({
  id, symbol, name: id, value, unit, minBound: null, maxBound: null, sourceCitation, doi, sourceLocation,
  provenanceType: 'LITERATURE_TABLE', validityWarning: 'Source value; physiological bounds not reported.'
});
const buchwald = 'Buchwald (2009), FEM-based oxygen consumption and cell viability models for avascular pancreatic islets';
const gim = 'Dalla Man et al. (2007), GIM, Simulation Software of Meal Glucose–Insulin Model';
const meal = 'Dalla Man, Rizza and Cobelli (2007), Meal Simulation Model of the Glucose-Insulin System';
const assumed = (id: string, symbol: string, value: number, unit: string, doi: string): Readonly<SourceParameter> => Object.freeze({
  id, symbol, name: id, value, unit, minBound: null, maxBound: null,
  sourceCitation: 'Project blueprint, user-specified reduced-model assumption; DOI is contextual', doi,
  sourceLocation: 'Canonical T1D Mathematical Specification, Pass 1', provenanceType: 'MODEL_ASSUMPTION',
  validityWarning: 'Assumption; neither a literature-derived estimate nor a validated physiological bound.'
});
/** Published source values, population summaries, and explicitly identified model assumptions. */
const sourceRegistry = Object.freeze({
  adultFastingGlucose: cohort('adult', 119.6, 107.5, 137.8),
  adolescentFastingGlucose: cohort('adolescent', 118.1, 105.7, 142.3),
  childFastingGlucose: cohort('child', 119.8, 104.7, 134.3),
  oxygenDiffusivityTissue: fixed('oxygenDiffusivityTissue', 'D', 2e-9, 'm²/s', buchwald, '10.1186/1742-4682-6-5', 'Methods: Oxygen diffusion and consumption'),
  oxygenMaxConsumption: fixed('oxygenMaxConsumption', 'Rmax', 0.034, 'mol/(m³ s)', buchwald, '10.1186/1742-4682-6-5', 'Methods: Oxygen diffusion and consumption'),
  oxygenKm: fixed('oxygenKm', 'CMM', 0.001, 'mol/m³', buchwald, '10.1186/1742-4682-6-5', 'Methods: Oxygen diffusion and consumption'),
  oxygenCritical: fixed('oxygenCritical', 'Ccr', 0.0001, 'mol/m³', buchwald, '10.1186/1742-4682-6-5', 'Methods: Oxygen diffusion and consumption'),
  oxygenSmoothingWidth: fixed('oxygenSmoothingWidth', 'epsilon', 0.00005, 'mol/m³', buchwald, '10.1186/1742-4682-6-5', 'Methods: Oxygen diffusion and consumption'),
  oxygenHenryCoefficient: Object.freeze({ id: 'oxygenHenryCoefficient', symbol: 'αO2', name: 'Oxygen solubility coefficient at 37°C', value: 0.001414, unit: 'mol/(m³ mmHg)', minBound: null, maxBound: null, sourceCitation: 'Fernandez et al. (2022), Engineering Vascularized Islet Macroencapsulation Devices', doi: '10.3389/fbioe.2022.884071', sourceLocation: 'Table 1: inlet concentration 0.198 mol/m³ at 140 mmHg, Henry conversion for water at 37°C', provenanceType: 'MODEL_ASSUMPTION' as const, validityWarning: 'Rounded coefficient inferred from rounded table values (0.198 / 140); not an exact reported constant or physiological bound.' }),
  insulinKd: fixed('insulinKd', 'kd', 0.0164, 'min⁻¹', gim, '10.1177/193229680700100303', 'Table 1'),
  insulinKa1: fixed('insulinKa1', 'ka1', 0.0018, 'min⁻¹', gim, '10.1177/193229680700100303', 'Table 1'),
  insulinKa2: fixed('insulinKa2', 'ka2', 0.0182, 'min⁻¹', gim, '10.1177/193229680700100303', 'Table 1'),
  sensorDelay: fixed('sensorDelay', 'Td', 10, 'min', gim, '10.1177/193229680700100303', 'Table 1, glucose sensor delay'),
  mealKmax: fixed('mealKmax', 'kmax', 0.0558, 'min⁻¹', meal, '10.1109/TBME.2007.893506', 'Table I, normal subjects'),
  mealKmin: fixed('mealKmin', 'kmin', 0.008, 'min⁻¹', meal, '10.1109/TBME.2007.893506', 'Table I, normal subjects'),
  mealKabs: fixed('mealKabs', 'kabs', 0.057, 'min⁻¹', meal, '10.1109/TBME.2007.893506', 'Table I, normal subjects'),
  mealKgri: fixed('mealKgri', 'kgri', 0.0558, 'min⁻¹', meal, '10.1109/TBME.2007.893506', 'Table I, normal subjects'),
  mealFraction: fixed('mealFraction', 'f', 0.9, '1', meal, '10.1109/TBME.2007.893506', 'Table I, normal subjects'),
  mealB: fixed('mealB', 'b', 0.82, '1', meal, '10.1109/TBME.2007.893506', 'Table I, normal subjects'),
  mealD: fixed('mealD', 'd', 0.01, '1', meal, '10.1109/TBME.2007.893506', 'Table I, normal subjects'),
  effectiveInsulinVolume: assumed('effectiveInsulinVolume', 'VIeff', 135, 'mL/kg', '10.1109/TBME.2007.893506'),
  insulinVolume: fixed('insulinVolume', 'VI', 50, 'mL/kg', meal, '10.1109/TBME.2007.893506', 'Table I, insulin kinetics, normal subjects'),
  vgNormal: fixed('vgNormal','VG',1.88,'dL/kg',meal,'10.1109/TBME.2007.893506','Table I, glucose kinetics, normal subjects'),
  glucoseK1: fixed('glucoseK1','k1',0.065,'min⁻¹',meal,'10.1109/TBME.2007.893506','Table I, glucose kinetics, normal subjects'),
  glucoseK2: fixed('glucoseK2','k2',0.079,'min⁻¹',meal,'10.1109/TBME.2007.893506','Table I, glucose kinetics, normal subjects'),
  insulinM1: fixed('insulinM1','m1',0.190,'min⁻¹',meal,'10.1109/TBME.2007.893506','Table I, insulin kinetics, normal subjects'),
  insulinM2: fixed('insulinM2','m2',0.484,'min⁻¹',meal,'10.1109/TBME.2007.893506','Table I, insulin kinetics, normal subjects'),
  insulinM4: fixed('insulinM4','m4',0.194,'min⁻¹',meal,'10.1109/TBME.2007.893506','Table I, insulin kinetics, normal subjects'),
  insulinM5: fixed('insulinM5','m5',0.0304,'min kg/pmol',meal,'10.1109/TBME.2007.893506','Table I, insulin kinetics, normal subjects'),
  insulinM6: fixed('insulinM6','m6',0.6471,'1',meal,'10.1109/TBME.2007.893506','Table I, insulin kinetics, normal subjects'),
  mealA: fixed('mealA','a',0.00013,'mg⁻¹',meal,'10.1109/TBME.2007.893506','Table I, rate of appearance, normal subjects'),
  mealC: fixed('mealC','c',0.00236,'mg⁻¹',meal,'10.1109/TBME.2007.893506','Table I, rate of appearance, normal subjects'),
  productionKp1Normal: fixed('productionKp1Normal','kp1',2.7,'mg/kg/min',meal,'10.1109/TBME.2007.893506','Table I, endogenous production, normal subjects'),
  productionKp4: fixed('productionKp4','kp4',0.0618,'mg/kg/min per pmol/kg',meal,'10.1109/TBME.2007.893506','Table I, endogenous production, normal subjects'),
  hepaticExtraction: fixed('hepaticExtraction','HEb',0.6,'1',meal,'10.1109/TBME.2007.893506','Table I, insulin kinetics, normal subjects'),
  productionKp2: fixed('productionKp2','kp2',0.0021,'min⁻¹',meal,'10.1109/TBME.2007.893506','Table I, endogenous production, normal subjects'),
  productionKp3: fixed('productionKp3','kp3',0.009,'mg/kg/min per pmol/L',meal,'10.1109/TBME.2007.893506','Table I, endogenous production, normal subjects'),
  brainUptake: fixed('brainUptake','Fcns',1,'mg/kg/min',meal,'10.1109/TBME.2007.893506','Table I, glucose utilization, normal subjects'),
  utilizationVm0: fixed('utilizationVm0','Vm0',2.5,'mg/kg/min',meal,'10.1109/TBME.2007.893506','Table I, glucose utilization, normal subjects'),
  utilizationVmx: fixed('utilizationVmx','Vmx',0.047,'mg/kg/min per pmol/L',meal,'10.1109/TBME.2007.893506','Table I, glucose utilization, normal subjects'),
  utilizationKm0: fixed('utilizationKm0','Km0',225.59,'mg/kg',meal,'10.1109/TBME.2007.893506','Table I, glucose utilization, normal subjects'),
  actionP2u: fixed('actionP2u','p2U',0.0331,'min⁻¹',meal,'10.1109/TBME.2007.893506','Table I, glucose utilization, normal subjects'),
  insulinDelay: fixed('insulinDelay','ki',0.0079,'min⁻¹',meal,'10.1109/TBME.2007.893506','Table I, endogenous production, normal subjects'),
  renalKe1: fixed('renalKe1','ke1',0.0005,'min⁻¹',meal,'10.1109/TBME.2007.893506','Table I, renal excretion, normal subjects'),
  renalKe2: fixed('renalKe2','ke2',339,'mg/kg',meal,'10.1109/TBME.2007.893506','Table I, renal excretion, normal subjects'),
  basalInsulinPmol: assumed('basalInsulinPmol','Ib',42,'pmol/L','10.1109/TBME.2007.893506'),
  graftGamma: fixed('graftGamma', 'gamma', 0.5, 'min⁻¹', meal, '10.1109/TBME.2007.893506', 'Table I, insulin secretion, normal subjects; Eqs. 23–26 adapted for grafts'),
  graftK: fixed('graftK', 'K', 2.3, 'pmol/kg per (mg/dL)', meal, '10.1109/TBME.2007.893506', 'Table I, insulin secretion, normal subjects; Eqs. 23–26 adapted for grafts'),
  graftAlpha: fixed('graftAlpha', 'alpha', 0.05, 'min⁻¹', meal, '10.1109/TBME.2007.893506', 'Table I, insulin secretion, normal subjects; Eqs. 23–26 adapted for grafts'),
  graftBeta: fixed('graftBeta', 'beta', 0.11, 'pmol/(kg min) per (mg/dL)', meal, '10.1109/TBME.2007.893506', 'Table I, insulin secretion, normal subjects; Eqs. 23–26 adapted for grafts'),
  insulinElimination: assumed('insulinElimination', 'ke', 0.138, 'min⁻¹', '10.1109/TBME.2007.893506'),
  insulinActionDecay: assumed('insulinActionDecay', 'p2', 0.014, 'min⁻¹', '10.1109/TBME.2007.893506'),
  insulinActionSensitivity: assumed('insulinActionSensitivity', 'p3', 0.000028, 'min⁻²/(µU/mL)', '10.1109/TBME.2007.893506'),
  glucoseEffectiveness: assumed('glucoseEffectiveness', 'SG', 0.014, 'min⁻¹', '10.1109/TBME.2007.893506'),
  glucoseVolume: assumed('glucoseVolume', 'VG', 1.49, 'dL/kg', '10.1109/TBME.2007.893506'),
  basalInsulin: assumed('basalInsulin', 'Ib', 7, 'µU/mL', '10.1109/TBME.2007.893506'),
  modelMealB: assumed('modelMealB', 'b', 0.69, '1', '10.1177/1932296813514502'),
  modelMealC: assumed('modelMealC', 'c', 0.17, '1', '10.1177/1932296813514502'),
  mealReferenceDose: assumed('mealReferenceDose', 'Dbar', 30000, 'mg', '10.1177/1932296813514502'),
  hypoxiaMax: assumed('hypoxiaMax', 'khyp,max', 2.3026, 'day⁻¹', '10.3389/fbioe.2022.884071'),
  immuneReject: assumed('immuneReject', 'kimmune', 0.4605, 'day⁻¹', '10.1126/scitranslmed.adg5794'),
  cd47Lower: assumed('cd47Lower', 'CD47low', 180000, 'molecules/cell', '10.1038/s41587-023-01784-x'),
  cd47Upper: assumed('cd47Upper', 'CD47high', 220000, 'molecules/cell', '10.1038/s41587-023-01784-x'),
  oxygenAlginate: fixed('oxygenAlginate', 'Dalg', 2.54e-9, 'm²/s', 'Fernandez et al. (2022), Engineering Vascularized Islet Macroencapsulation Devices', '10.3389/fbioe.2022.884071', 'Table 1'),
  oxygenIslet: fixed('oxygenIslet', 'Dtissue', 1.24e-9, 'm²/s', 'Fernandez et al. (2022), Engineering Vascularized Islet Macroencapsulation Devices', '10.3389/fbioe.2022.884071', 'Table 1'),
  cellFraction: fixed('cellFraction', 'Xcell', 0.01, '1', 'Fernandez et al. (2022), Engineering Vascularized Islet Macroencapsulation Devices', '10.3389/fbioe.2022.884071', 'Table 1'),
  breakfastGlucose: fixed('breakfastGlucose', 'Gb', 119.1, 'mg/dL', 'Visentin et al. (2018), The UVA/Padova Type 1 Diabetes Simulator Goes From Single Meal to Single Day', '10.1177/1932296818757747', 'Table 1'),
  breakfastWeight: fixed('breakfastWeight', 'BW', 75.2, 'kg', 'Visentin et al. (2018), The UVA/Padova Type 1 Diabetes Simulator Goes From Single Meal to Single Day', '10.1177/1932296818757747', 'Table 1'),
  breakfastRatio: fixed('breakfastRatio', 'CR', 16.9, 'g/U', 'Visentin et al. (2018), The UVA/Padova Type 1 Diabetes Simulator Goes From Single Meal to Single Day', '10.1177/1932296818757747', 'Table 1')
});
export type T1DParameterKey = keyof typeof sourceRegistry;
const allScenarios: readonly T1DScenario[] = ['fasting', 'meal', 'graft'];
const mealScenarios: readonly T1DScenario[] = ['meal', 'graft'];
const graftScenarios: readonly T1DScenario[] = ['graft'];
const activeKeys: Partial<Record<T1DParameterKey, readonly T1DScenario[]>> = {
  adultFastingGlucose: allScenarios, vgNormal: allScenarios, glucoseK1: allScenarios, glucoseK2: allScenarios,
  insulinVolume: allScenarios, insulinM1: allScenarios, insulinM2: allScenarios, insulinM4: allScenarios,
  hepaticExtraction: allScenarios, productionKp2: allScenarios, productionKp3: allScenarios,
  brainUptake: allScenarios, utilizationVm0: allScenarios, utilizationVmx: allScenarios, utilizationKm0: allScenarios,
  actionP2u: allScenarios, insulinDelay: allScenarios, renalKe1: allScenarios, renalKe2: allScenarios,
  insulinKd: allScenarios, insulinKa1: allScenarios, insulinKa2: allScenarios, basalInsulinPmol: allScenarios,
  sensorDelay: allScenarios, mealKgri: allScenarios, mealKmin: allScenarios, mealKmax: allScenarios,
  mealKabs: allScenarios, mealFraction: allScenarios, modelMealB: allScenarios, modelMealC: allScenarios,
  mealReferenceDose: allScenarios, breakfastWeight: allScenarios, breakfastRatio: mealScenarios,
  oxygenAlginate: graftScenarios, oxygenIslet: graftScenarios, oxygenMaxConsumption: graftScenarios,
  oxygenKm: graftScenarios, oxygenCritical: graftScenarios, oxygenSmoothingWidth: graftScenarios,
  oxygenHenryCoefficient: graftScenarios, cellFraction: graftScenarios, cd47Lower: graftScenarios,
  cd47Upper: graftScenarios, immuneReject: graftScenarios, hypoxiaMax: graftScenarios,
  graftGamma: graftScenarios, graftK: graftScenarios, graftAlpha: graftScenarios, graftBeta: graftScenarios
};
/** Usage labels reflect the workbench scenarios; the raw registry may also support other solver APIs. */
export const T1D_PARAMETER_REGISTRY = Object.freeze(Object.fromEntries(
  Object.entries(sourceRegistry).map(([key, parameter]) => {
    const scenarios = Object.freeze([...(activeKeys[key as T1DParameterKey] ?? [])]);
    return [key, Object.freeze({ ...parameter, usageType: scenarios.length ? 'ACTIVE_IN_SOLVER' : 'CONTEXTUAL_BENCHMARK', activeScenarios: scenarios })];
  })
)) as { readonly [K in T1DParameterKey]: Readonly<Parameter> };
export function isParameterActive(key: T1DParameterKey, scenario: T1DScenario): boolean {
  return T1D_PARAMETER_REGISTRY[key].activeScenarios.includes(scenario);
}
export function validateParameterValue(parameter: Parameter, value: number): number {
  if (!Number.isFinite(value) || (parameter.minBound !== null && value < parameter.minBound) || (parameter.maxBound !== null && value > parameter.maxBound)) {
    throw new RangeError(`OUT_OF_VALIDATED_COHORT_BOUNDS: ${parameter.id}`);
  }
  return value;
}
