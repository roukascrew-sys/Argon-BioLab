import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { simulate } from '../../modules/t1d/utils/simulation.ts';
import { steadyOxygenProfile, buchwaldOxygenDerivative } from '../../modules/t1d/solvers/isletOxygenDiffusion.ts';
import { T1D_PARAMETER_REGISTRY as R } from '../../modules/t1d/registry/t1dParameterRegistry.ts';
import { publishedModelStep } from '../../modules/t1d/solvers/t1dCoreKinetics.ts';

const settings = { cd47:600000 as const, basalEnabled:true };

test('human-scale 250 and 500 µm grafts resolve oxygen and viability at source-backed conditions', () => {
  const low250=simulate('graft',119.6,{...settings,oxygenMmHg:15,halfThicknessUm:250});
  const low500=simulate('graft',119.6,{...settings,oxygenMmHg:15,halfThicknessUm:500});
  for(const thickness of [250,500] as const) {
    const high=simulate('graft',119.6,{...settings,oxygenMmHg:140,halfThicknessUm:thickness});
    assert.equal(high.coupling.cellFraction,R.humanScaleCellFraction.value);
    assert.ok(high.frames[0].oxygen*R.oxygenHenryCoefficient.value>R.oxygenCritical.value);
    assert.equal(high.frames[0].k_hypoxia,0);
    assert.ok(Math.abs(high.frames.at(-1)!.viability-1)<1e-12);
  }
  // The supplied equation predicts no loss at 250 µm; asserting otherwise would change the model.
  assert.ok(low250.frames[0].oxygen*R.oxygenHenryCoefficient.value>R.oxygenCritical.value);
  assert.equal(low250.frames[0].k_hypoxia,0);
  assert.ok(low500.frames[0].oxygen*R.oxygenHenryCoefficient.value<R.oxygenCritical.value);
  assert.ok(low500.frames[0].k_hypoxia>0);
  assert.ok(low500.frames.at(-1)!.viability<1);
  assert.equal(low500.frames.at(-1)!.time,1440);
  let state=[...low500.frames.at(-1)!.state];
  for(let i=0;i<14400;i++) state=publishedModelStep(1440+i*0.1,state,0.1,low500.params,low500.meal,low500.kp1,()=>({ingestion:0,infusion:low500.basal}),low500.coupling);
  assert.ok(state[15]<low500.frames.at(-1)!.viability);
});

test('500 µm hypoxic oxygen profile satisfies the discretized equation and converges under grid refinement', () => {
  const fraction=R.humanScaleCellFraction.value,points=21,halfThickness=500e-6;
  const p={diffusion:(1-fraction)*R.oxygenAlginate.value+fraction*R.oxygenIslet.value,rmax:R.oxygenMaxConsumption.value,km:R.oxygenKm.value,critical:R.oxygenCritical.value,smoothingWidth:R.oxygenSmoothingWidth.value,dx:halfThickness/(points-1),boundary:15*R.oxygenHenryCoefficient.value};
  const coarse=steadyOxygenProfile(p,points,fraction),fine=steadyOxygenProfile({...p,dx:halfThickness/40},41,fraction);
  assert.ok(Math.abs(coarse[0]-fine[0])/fine[0]<0.005);
  const residual=buchwaldOxygenDerivative(coarse,{...p,rmax:p.rmax*fraction});
  assert.ok(Math.max(...residual.map(Math.abs))<1e-10);
  assert.equal(coarse.at(-1),p.boundary);
});
