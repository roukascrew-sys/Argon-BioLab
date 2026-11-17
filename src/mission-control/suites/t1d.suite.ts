import { T1D_PARAMETER_REGISTRY as R } from '../../modules/t1d/registry/t1dParameterRegistry.ts';
import { initializePublishedModel, publishedModelParameters, publishedModelStep } from '../../modules/t1d/solvers/t1dCoreKinetics.ts';
export function runT1DSuite() {
  try {
    const p=publishedModelParameters(), init=initializePublishedModel(p);
    const m={kgri:R.mealKgri.value,kmin:R.mealKmin.value,kmax:R.mealKmax.value,kabs:R.mealKabs.value,fraction:R.mealFraction.value,b:R.modelMealB.value,d:R.modelMealC.value,dose:R.mealReferenceDose.value,bodyWeight:R.breakfastWeight.value};
    const next=publishedModelStep(0,init.state,0.1,p,m,init.kp1,()=>({ingestion:0,infusion:init.basal}));
    return [{test:'T1D fasting equilibrium',status:Math.abs(next[3]/p.VG-p.Gb)<1e-8?'PASS':'FAIL'}, {test:'T1D registry provenance',status:Object.values(R).every(x=>x.doi&&x.sourceLocation&&x.unit)?'PASS':'FAIL'}];
  } catch(e){ return [{test:`T1D suite: ${e instanceof Error?e.message:String(e)}`,status:'FAIL'}]; }
}
