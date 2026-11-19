import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { simulate } from '../../modules/t1d/utils/simulation.ts';
import { makeBundle, ODE_COMMIT } from '../../modules/t1d/utils/reproducibilityExporter.ts';
import { publishedModelStep } from '../../modules/t1d/solvers/t1dCoreKinetics.ts';
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
  const rows=bundle.csv.trimEnd().split('\n');
  assert.equal(rows.length,14403);
  const names=rows[0].split(',');
  const units=rows[1].split(',').map(unit=>unit.replaceAll('"',''));
  assert.equal(units[0],'unitDictionary');
  for(let i=1;i<names.length;i++) assert.equal(units[i],manifest.unitDictionary[names[i]],`unit for ${names[i]}`);
  assert.equal(manifest.unitDictionary.S_graft_raw,'pmol/(kg min)');
  assert.equal(manifest.unitDictionary.S_graft_effective,'pmol/(kg min)');
  assert.ok(runT1DSuite().every(r=>r.status==='PASS'));
});

test('inspector graft fluxes reconstruct the exact insulin derivative', () => {
  const run=simulate('graft',119.6,false), frame=run.frames[1200], coupling=run.coupling;
  assert.equal(frame.S_graft_raw,coupling.graft.gamma*frame.state[13]);
  assert.equal(frame.S_graft_effective,frame.viability*coupling.graft.fraction*frame.S_graft_raw);
  assert.equal(frame.dI_p,-frame.I_plasma_loss+frame.I_liver_input+frame.Ra_I+frame.S_graft_effective);
  // Freeze all other derivatives at a nonzero graft snapshot. The unchanged RK4
  // step then integrates its true initial insulin derivative exactly.
  const p={...run.params,m1:0,m2:0,m4:0,k1:0,k2:0,Fcns:0,Vm0:0,Vmx:0,ke1:0,kd:0,ka1:0,ka2:0};
  const state=[...frame.state]; state[0]=state[1]=state[2]=0;
  state[14]=coupling.graft.gamma*state[13];
  p.Gb=state[3]/p.VG-state[14]/coupling.graft.beta;
  const config={...coupling,immuneMax:0,hypoxiaMax:0,graft:{...coupling.graft,K:0,fraction:0.37}};
  const dt=0.5, next=publishedModelStep(frame.time,state,dt,p,run.meal,0,()=>({ingestion:0,infusion:0}),config);
  const solverDerivative=(next[8]-state[8])/dt;
  const reconstructed=frame.S_graft_raw*frame.viability*config.graft.fraction;
  assert.ok(Math.abs(solverDerivative-reconstructed)<=Number.EPSILON*8*Math.max(1,Math.abs(reconstructed)));
});

test('hypoxic unprotected graft loses viability while normoxic HIP survives', () => {
  const healthy=simulate('graft',119.6,true), challenged=simulate('graft',119.6,false);
  assert.ok(healthy.frames.at(-1).viability>0.999);
  assert.ok(challenged.frames.at(-1).viability<0.1);
  assert.ok(healthy.frames.at(-1).oxygen>7);
  assert.equal(challenged.frames.at(-1).oxygen,0);
});

test('oxygen and CD47 controls are independent, and basal-off preserves initial depots', () => {
  const base={oxygenMmHg:15 as const,cd47:200000 as const,basalEnabled:true};
  const partial=simulate('graft',119.6,base);
  const unprotected=simulate('graft',119.6,{...base,cd47:0});
  const arterial=simulate('graft',119.6,{...base,oxygenMmHg:76});
  const off=simulate('graft',119.6,{...base,basalEnabled:false});
  assert.ok(partial.frames[0].oxygen<arterial.frames[0].oxygen);
  assert.ok(Math.abs(partial.frames[0].k_immune*2-unprotected.frames[0].k_immune)<1e-12);
  assert.equal(partial.frames[0].oxygen,unprotected.frames[0].oxygen);
  assert.equal(off.basal,0);
  assert.deepEqual(off.initialState,partial.initialState);
  assert.ok(off.frames.at(-1)!.glucose>partial.frames.at(-1)!.glucose);
});
