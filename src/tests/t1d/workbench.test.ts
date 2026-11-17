import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { simulate } from '../../modules/t1d/utils/simulation.ts';
import { makeBundle, ODE_COMMIT } from '../../modules/t1d/utils/reproducibilityExporter.ts';
import { runT1DSuite } from '../../mission-control/suites/t1d.suite.ts';

test('scenario traces and reproducibility bundle preserve actual simulation inputs', () => {
  const run=simulate('meal',119.6);
  assert.equal(run.frames.length,14401);
  assert.equal(run.frames[0].time,0);
  assert.ok(Math.abs(run.frames.at(-1).time-1440)<1e-9);
  assert.ok(Math.max(...run.frames.map(f=>f.glucose))>run.params.Gb);
  const bundle=makeBundle([run]), manifest=JSON.parse(bundle.json);
  assert.equal(manifest.odeCommit,ODE_COMMIT);
  assert.equal(manifest.runs[0].params.Gb,119.6);
  assert.deepEqual(manifest.runs[0].initialState,run.initialState);
  assert.equal(bundle.csv.trimEnd().split('\n').length,14402);
  assert.ok(runT1DSuite().every(r=>r.status==='PASS'));
});

test('hypoxic unprotected graft loses viability while normoxic HIP survives', () => {
  const healthy=simulate('graft',119.6,true), challenged=simulate('graft',119.6,false);
  assert.ok(healthy.frames.at(-1).viability>0.999);
  assert.ok(challenged.frames.at(-1).viability<0.1);
  assert.ok(healthy.frames.at(-1).oxygen>7);
  assert.equal(challenged.frames.at(-1).oxygen,0);
});
