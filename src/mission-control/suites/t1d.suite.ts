import { T1D_PARAMETER_REGISTRY as R } from '../../modules/t1d/registry/t1dParameterRegistry.ts';
import { initializePublishedModel, publishedModelParameters, publishedModelStep } from '../../modules/t1d/solvers/t1dCoreKinetics.ts';
export function runT1DSuite() {
  try {
    const p=publishedModelParameters(), init=initializePublishedModel(p);
    const m={kgri:R.mealKgri.value,kmin:R.mealKmin.value,kmax:R.mealKmax.value,kabs:R.mealKabs.value,fraction:R.mealFraction.value,b:R.modelMealB.value,d:R.modelMealC.value,dose:R.mealReferenceDose.value,bodyWeight:R.breakfastWeight.value};
    let state=init.state, maxDrift=0;
    // Use the workbench timestep and track both plasma and sensor for 24 hours.
    for(let i=0;i<14400;i++) {
      state=publishedModelStep(i*0.1,state,0.1,p,m,init.kp1,()=>({ingestion:0,infusion:init.basal}));
      maxDrift=Math.max(maxDrift,Math.abs(state[3]/p.VG-p.Gb),Math.abs(state[5]/p.VG-p.Gb));
    }
    return [{test:`T1D 24 h fasting equilibrium (max drift ${maxDrift.toPrecision(3)} mg/dL)`,status:Number.isFinite(maxDrift)&&maxDrift<=1?'PASS':'FAIL'}, {test:'T1D provenance metadata present',status:Object.values(R).every(x=>x.doi&&x.sourceLocation&&x.unit)?'PASS':'FAIL'}];
  } catch(e){ return [{test:`T1D suite: ${e instanceof Error?e.message:String(e)}`,status:'FAIL'}]; }
}
