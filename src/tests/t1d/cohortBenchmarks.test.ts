import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { T1D_PARAMETER_REGISTRY as registry, validateParameterValue } from '../../modules/t1d/registry/t1dParameterRegistry.ts';
import { metabolicDerivative, mealDerivative } from '../../modules/t1d/solvers/dallaManPkPdModel.ts';
import { oxygenDerivative, hypoxiaRate, buchwaldConsumptionFactor, buchwaldOxygenDerivative } from '../../modules/t1d/solvers/isletOxygenDiffusion.ts';
import { immuneFluxes } from '../../modules/t1d/solvers/hypoimmuneIsletModel.ts';
import { coreStep, fastingState, coupledStep, publishedModelParameters, initializePublishedModel, publishedModelStep } from '../../modules/t1d/solvers/t1dCoreKinetics.ts';
import { rk4Step } from '../../modules/t1d/solvers/rk4.ts';

// Synthetic rates exercise equations only; they are not physiological estimates.
const metabolic = { kd: 0.2, ka1: 0.1, ka2: 0.3, ke: 0.4, p2: 0.2, p3: 0.01, SG: 0.1, VG: 2, Gb: 0, Ib: 2 };
const immune = { M1: 1, C47: 2, kT: 0.3, KM: 2, kNK: 0.4, KC: 3 };
const oxygen = { diffusion: 0.1, vmax: 0, km: 1, critical: 1, hypoxiaMaxPerDay: 2, dx: 1, boundary: 4 };

test('published fasting glucose summaries remain at basal equilibrium', () => {
  for (const cohort of [registry.adultFastingGlucose, registry.adolescentFastingGlucose, registry.childFastingGlucose]) {
    const p = { ...metabolic, Gb: cohort.value };
    // At equilibrium, infusion = ke * Ib and each depot flux balances.
    const infusion = p.ke * p.Ib;
    const sc1 = infusion / (p.kd + p.ka1), sc2 = p.kd * sc1 / p.ka2;
    const d = metabolicDerivative({ sc1, sc2, plasma: p.Ib, action: 0, glucose: p.Gb }, p, infusion, 0);
    for (const value of Object.values(d)) assert.ok(Math.abs(value) < 1e-12);
    let state = [sc1, sc2, p.Ib, 0, p.Gb];
    for (let minute = 0; minute < 1440; minute++) {
      state = rk4Step((_time, y) => {
        const rate = metabolicDerivative({ sc1: y[0], sc2: y[1], plasma: y[2], action: y[3], glucose: y[4] }, p, infusion, 0);
        return [rate.sc1, rate.sc2, rate.plasma, rate.action, rate.glucose];
      }, minute, state, 1);
    }
    assert.ok(Math.abs(state[4] - cohort.value) < 1e-9);
    assert.equal(validateParameterValue(cohort, cohort.value), cohort.value);
    assert.throws(() => validateParameterValue(cohort, cohort.maxBound + 1), /OUT_OF_VALIDATED_COHORT_BOUNDS/);
  }
});

test('meal transit conserves mass and uses liquid stomach emptying', () => {
  const p = { kgri: registry.mealKgri.value, kmin: registry.mealKmin.value, kmax: registry.mealKmax.value,
    kabs: registry.mealKabs.value, fraction: registry.mealFraction.value, b: registry.mealB.value, d: registry.mealD.value, dose: 50000, bodyWeight: 69.7 };
  const result = mealDerivative({ sto1: 1000, sto2: 500, gut: 200 }, p, 0);
  assert.ok(Math.abs(result.sto1 + result.sto2 + result.gut + p.kabs * 200) < 1e-10);
  assert.ok(Math.abs(result.appearance - p.fraction * p.kabs * 200 / p.bodyWeight) < 1e-12);
});

test('Buchwald threshold shuts off consumption below the smoothed boundary', () => {
  const critical = registry.oxygenCritical.value, width = registry.oxygenSmoothingWidth.value;
  assert.equal(buchwaldConsumptionFactor(0, critical, width), 0);
  assert.equal(buchwaldConsumptionFactor(critical, critical, width), 0.5);
  assert.equal(buchwaldConsumptionFactor(critical + width, critical, width), 1);
  const p = { diffusion: registry.oxygenDiffusivityTissue.value, rmax: registry.oxygenMaxConsumption.value,
    km: registry.oxygenKm.value, critical, smoothingWidth: width, dx: 0.001, boundary: 0 };
  assert.deepEqual(buchwaldOxygenDerivative([0, 0], p), [0, 0]);
});

test('direct insulin absorption and cell-loss fluxes are accounted for', () => {
  const d = metabolicDerivative({ sc1: 10, sc2: 0, plasma: 0, action: 0, glucose: 0 }, metabolic, 0, 0);
  assert.ok(Math.abs(d.plasma - 1) < 1e-12);
  assert.ok(Math.abs(d.sc1 + d.sc2 + d.plasma) < 1e-12);
  const flux = immuneFluxes(10, 0.2, immune);
  assert.equal(flux.derivative, -(flux.tCell + flux.nkCell + flux.hypoxic));
});

test('oxygen grid uses a reflecting core and fixed surface', () => {
  assert.deepEqual(oxygenDerivative([2, 3, 4], 1, oxygen), [0.2, 0, 0]);
  assert.equal(hypoxiaRate(0.5, oxygen), 1);
});

test('coupled core converts per-day cell loss to seconds', () => {
  const params = { immune, oxygen, metabolic: { ...metabolic, Gb: 100 }, initialCells: 10 };
  const initial = [10, 4, 4, 0, 0, 0, 0, 100];
  const next = coreStep(0, initial, 1, params, () => ({ infusion: 0, mealAppearance: 0 }));
  const expected = 10 * Math.exp(immuneFluxes(1, 0, immune).derivative / 86400);
  assert.ok(Math.abs(next[0] - expected) < 1e-12);
  assert.equal(next[2], 4);
});

test('specified published-model fasting and breakfast numerical targets', () => {
  const p = publishedModelParameters();
  const m = { kgri: registry.mealKgri.value, kmin: registry.mealKmin.value, kmax: registry.mealKmax.value, kabs: registry.mealKabs.value, fraction: registry.mealFraction.value, b: registry.modelMealB.value, d: registry.modelMealC.value, dose: registry.mealReferenceDose.value, bodyWeight: registry.breakfastWeight.value };
  const basal = initializePublishedModel(p); let y = basal.state;
  let fasting = [...y];
  for (let i = 0; i < 1440; i++) {
    fasting = publishedModelStep(i, fasting, 1, p, m, basal.kp1, () => ({ ingestion: 0, infusion: basal.basal }));
    assert.ok(Math.abs(fasting[3] / p.VG - p.Gb) <= 1 && Math.abs(fasting[5] / p.VG - p.Gb) <= 1);
  }
  let peak = -Infinity, nadir = Infinity, peakTime = 0, sensorPeak = -Infinity, sensorPeakTime = 0, absorbed = 0;
  for (let i = 0; i < 14400; i++) {
    const t = i / 10;
    const ingestion = i >= 600 && i < 750 ? 4000 : 0;
    const bolus = i >= 600 && i < 610 ? (60 / registry.breakfastRatio.value) * 6000 / m.bodyWeight : 0;
    const oldGut = y[2];
    y = publishedModelStep(t, y, 0.1, p, m, basal.kp1, () => ({ ingestion, infusion: basal.basal + bolus }));
    absorbed += m.fraction * m.kabs * (oldGut + y[2]) * 0.05;
    if (i >= 600) {
      const glucose = y[3] / p.VG, sensor = y[5] / p.VG;
      if (glucose > peak) { peak = glucose; peakTime = t + 0.1; }
      if (sensor > sensorPeak) { sensorPeak = sensor; sensorPeakTime = t + 0.1; }
      nadir = Math.min(nadir, glucose);
    }
  }
  assert.ok(Math.abs(absorbed - 54000) < 270, `Absorbed ${absorbed} mg`);
  assert.ok(Math.abs(peak - p.Gb - 119.34) < 1, `Peak excursion ${peak - p.Gb}; nadir ${nadir}`);
  assert.ok(peakTime >= 105 && peakTime <= 180, `Peak at ${peakTime}`);
  assert.ok(sensorPeakTime > peakTime);
  assert.ok(nadir > 60, `Nadir was ${nadir}`);
});

test('coupled oxygen and immune loss uses per-day rates on a minute clock', () => {
  const p = { kd: registry.insulinKd.value, ka1: registry.insulinKa1.value, ka2: registry.insulinKa2.value, ke: registry.insulinElimination.value, p2: registry.insulinActionDecay.value, p3: registry.insulinActionSensitivity.value, SG: registry.glucoseEffectiveness.value, VG: registry.glucoseVolume.value, Gb: registry.breakfastGlucose.value, Ib: registry.basalInsulin.value };
  const m = { kgri: registry.mealKgri.value, kmin: registry.mealKmin.value, kmax: registry.mealKmax.value, kabs: registry.mealKabs.value, fraction: registry.mealFraction.value, b: registry.modelMealB.value, d: registry.modelMealC.value, dose: registry.mealReferenceDose.value, bodyWeight: registry.breakfastWeight.value };
  const basal = fastingState(p);
  const cfg = { meal: m, metabolic: p, oxygen: { diffusion: registry.oxygenAlginate.value, rmax: registry.oxygenMaxConsumption.value, km: registry.oxygenKm.value, critical: registry.oxygenCritical.value, smoothingWidth: registry.oxygenSmoothingWidth.value, dx: 0.0001, boundary: 0 }, points: 4, cellFraction: registry.cellFraction.value, cd47: 0, b2mKnockout: true, ciitaKnockout: true, cd47Low: registry.cd47Lower.value, cd47High: registry.cd47Upper.value, immuneMax: registry.immuneReject.value, hypoxiaMax: registry.hypoxiaMax.value };
  const out = coupledStep(0, [...basal.state, 1], 1, cfg, () => ({ ingestion: 0, infusion: basal.basalInfusion }));
  assert.equal(out.immunePerDay, cfg.immuneMax);
  assert.equal(out.hypoxiaPerDay, cfg.hypoxiaMax);
  assert.ok(Math.abs(out.state[8] - Math.exp(-(cfg.immuneMax + cfg.hypoxiaMax) / 1440)) < 1e-12);
  const protectedResult = coupledStep(0, [...basal.state, 1], 1, { ...cfg, cd47: cfg.cd47High, oxygen: { ...cfg.oxygen, boundary: 0.2 } }, () => ({ ingestion: 0, infusion: basal.basalInfusion }));
  assert.equal(protectedResult.immunePerDay, 0);
  assert.equal(protectedResult.hypoxiaPerDay, 0);
  assert.equal(protectedResult.state[8], 1);
  const graft = { fraction: 1, gamma: registry.graftGamma.value, K: registry.graftK.value, alpha: registry.graftAlpha.value, beta: registry.graftBeta.value, insulinVolumeLitresPerKg: registry.insulinVolume.value / 1000 };
  const simulation = (fraction: number) => {
    const config = { ...cfg, immuneMax: 0, hypoxiaMax: 0, graft: { ...graft, fraction } };
    let state = [...basal.state, 1, 0, 0], peak = 0, maxSecretion = 0;
    for (let i = 0; i < 600; i++) {
      const t = i / 2, ingestion = i < 30 ? 4000 : 0;
      state = coupledStep(t, state, 0.5, config, () => ({ ingestion, infusion: basal.basalInfusion })).state;
      peak = Math.max(peak, state[7]); maxSecretion = Math.max(maxSecretion, graft.gamma * state[9]);
    }
    return { peak, maxSecretion };
  };
  const ungrafted = simulation(0), restored = simulation(1);
  assert.ok(restored.maxSecretion > 0);
  assert.ok(restored.peak < ungrafted.peak);
});

test('13-state model couples graft secretion to oxygen and immune survival', () => {
  const p=publishedModelParameters(), init=initializePublishedModel(p);
  const meal={kgri:registry.mealKgri.value,kmin:registry.mealKmin.value,kmax:registry.mealKmax.value,kabs:registry.mealKabs.value,fraction:registry.mealFraction.value,b:registry.modelMealB.value,d:registry.modelMealC.value,dose:registry.mealReferenceDose.value,bodyWeight:registry.breakfastWeight.value};
  const fraction=registry.cellFraction.value;
  const config={ oxygen:{ diffusion:(1-fraction)*registry.oxygenAlginate.value+fraction*registry.oxygenIslet.value, rmax:registry.oxygenMaxConsumption.value, km:registry.oxygenKm.value, critical:registry.oxygenCritical.value, smoothingWidth:registry.oxygenSmoothingWidth.value, dx:0.0001, boundary:0.2 }, points:4, cellFraction:fraction, cd47:registry.cd47Upper.value, b2mKnockout:true, ciitaKnockout:true, cd47Low:registry.cd47Lower.value, cd47High:registry.cd47Upper.value, immuneMax:registry.immuneReject.value, hypoxiaMax:registry.hypoxiaMax.value,
    graft:{fraction:1,gamma:registry.graftGamma.value,K:registry.graftK.value,alpha:registry.graftAlpha.value,beta:registry.graftBeta.value,insulinVolumeLitresPerKg:p.VI} };
  const run=(boundary:number,cd47:number,graftFraction:number)=>{
    const cfg={...config,oxygen:{...config.oxygen,boundary},cd47,graft:{...config.graft,fraction:graftFraction}};
    let y=[...init.state,0,0,1];
    for(let i=0;i<1440;i++) y=publishedModelStep(i,y,1,p,meal,init.kp1,()=>({ingestion:0,infusion:init.basal}),cfg);
    const viability=y[15]; let peak=-Infinity, secretion=0;
    for(let i=0;i<600;i++) {
      y=publishedModelStep(i/2,y,0.5,p,meal,init.kp1,()=>({ingestion:i<30?4000:0,infusion:init.basal}),cfg);
      peak=Math.max(peak,y[3]/p.VG); secretion=Math.max(secretion,y[13]*cfg.graft.gamma*y[15]*graftFraction);
    }
    return {viability,peak,secretion};
  };
  const protectedGraft=run(0.2,config.cd47High,1), noGraft=run(0.2,config.cd47High,0), hypoxic=run(0,config.cd47High,1), unprotected=run(0.2,0,1);
  assert.ok(Math.abs(protectedGraft.viability-1)<1e-12);
  assert.ok(protectedGraft.secretion>0 && protectedGraft.peak<noGraft.peak);
  assert.ok(hypoxic.viability<protectedGraft.viability && hypoxic.secretion<protectedGraft.secretion && hypoxic.peak>protectedGraft.peak);
  assert.ok(unprotected.viability<protectedGraft.viability && unprotected.secretion<protectedGraft.secretion && unprotected.peak>protectedGraft.peak);
});
