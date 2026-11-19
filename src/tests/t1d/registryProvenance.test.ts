import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { T1D_PARAMETER_REGISTRY as R, isParameterActive, validateParameterValue } from '../../modules/t1d/registry/t1dParameterRegistry.ts';

test('assumptions do not claim validated numerical bounds', () => {
  for (const p of Object.values(R)) {
    if (p.provenanceType === 'MODEL_ASSUMPTION' || p.provenanceType === 'PHENOMENOLOGICAL_CALIBRATED') {
      assert.equal(p.minBound, null, p.id);
      assert.equal(p.maxBound, null, p.id);
      assert.doesNotThrow(() => validateParameterValue(p, p.value + 1));
    }
  }
  assert.throws(() => validateParameterValue(R.adultFastingGlucose, 107.4), /OUT_OF_VALIDATED_COHORT_BOUNDS/);
});

test('provenance identifies sources and scenario-specific use', () => {
  for (const p of [R.breakfastGlucose, R.breakfastWeight, R.breakfastRatio]) assert.equal(p.doi, '10.1177/1932296818757747');
  assert.match(R.graftGamma.sourceLocation, /23–26/);
  assert.equal(R.oxygenHenryCoefficient.value, 0.001414);
  assert.match(R.oxygenHenryCoefficient.validityWarning, /inferred/);
  assert.equal(isParameterActive('oxygenHenryCoefficient','fasting'), false);
  assert.equal(isParameterActive('oxygenHenryCoefficient','graft'), true);
  assert.equal(R.oxygenHenryCoefficient.usageType, 'ACTIVE_IN_SOLVER');
  assert.equal(R.effectiveInsulinVolume.usageType, 'CONTEXTUAL_BENCHMARK');
  assert.ok(Object.isFrozen(R.oxygenHenryCoefficient.activeScenarios));
});
