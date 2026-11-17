import { T1D_PARAMETER_REGISTRY as R, validateParameterValue } from '../registry/t1dParameterRegistry.ts';
import { publishedModelParameters, initializePublishedModel, publishedModelStep } from '../solvers/t1dCoreKinetics.ts';
import { mealDerivative } from '../solvers/dallaManPkPdModel.ts';
import { steadyOxygenProfile } from '../solvers/isletOxygenDiffusion.ts';

export type Scenario = 'fasting' | 'meal' | 'graft';
export interface Frame { time: number; state: number[]; glucose: number; sensor: number; insulin: number; oxygen: number; viability: number; EGP: number; Ra_meal: number; U_id: number; Ra_I: number; S_graft: number; k_immune: number; k_hypoxia: number }
export interface Run { scenario: Scenario; label: string; dt: number; initialState: number[]; params: ReturnType<typeof publishedModelParameters>; meal: {kgri:number;kmin:number;kmax:number;kabs:number;fraction:number;b:number;d:number;dose:number;bodyWeight:number}; kp1:number; basal:number; coupling: any; protocol:{mealMg:number;mealStartMin:number;mealDurationMin:number;bolusUnits:number;bolusStartMin:number;bolusDurationMin:number;durationMin:number}; boundaryAssumptions: string; frames: Frame[] }
export function simulate(scenario: Scenario, basalGlucose: number, protectedGraft = true): Run {
  validateParameterValue(R.adultFastingGlucose, basalGlucose);
  const params={...publishedModelParameters(),Gb:basalGlucose}, init=initializePublishedModel(params), dt=0.1;
  const meal={kgri:R.mealKgri.value,kmin:R.mealKmin.value,kmax:R.mealKmax.value,kabs:R.mealKabs.value,fraction:R.mealFraction.value,b:R.modelMealB.value,d:R.modelMealC.value,dose:R.mealReferenceDose.value,bodyWeight:R.breakfastWeight.value};
  const cellFraction=R.cellFraction.value, graftActive=scenario==='graft';
  // Domain and boundary are scenario assumptions, not patient-specific measurements.
  const boundary=protectedGraft?0.2:0, oxygen={diffusion:(1-cellFraction)*R.oxygenAlginate.value+cellFraction*R.oxygenIslet.value,rmax:R.oxygenMaxConsumption.value,km:R.oxygenKm.value,critical:R.oxygenCritical.value,smoothingWidth:R.oxygenSmoothingWidth.value,dx:0.0001,boundary};
  const coupling=graftActive?{oxygen,points:4,cellFraction,cd47:protectedGraft?R.cd47Upper.value:0,b2mKnockout:true,ciitaKnockout:true,cd47Low:R.cd47Lower.value,cd47High:R.cd47Upper.value,immuneMax:R.immuneReject.value,hypoxiaMax:R.hypoxiaMax.value,graft:{fraction:1,gamma:R.graftGamma.value,K:R.graftK.value,alpha:R.graftAlpha.value,beta:R.graftBeta.value,insulinVolumeLitresPerKg:params.VI}}:undefined;
  const core=graftActive?steadyOxygenProfile(oxygen,4,cellFraction)[0]:NaN;
  const hypoxia=graftActive&&core<oxygen.critical?R.hypoxiaMax.value*(1-core/oxygen.critical):0;
  const immune=graftActive&&!protectedGraft?R.immuneReject.value:0;
  let state=graftActive?[...init.state,0,0,1]:[...init.state];
  const initialState=[...state],frames:Frame[]=[];
  const capture=(time:number) => {
    const [q1,q2,qgut,Gp,Gt,Gs,sc1,sc2,Ip,, ,XL,X]=state;
    const rate=mealDerivative({sto1:q1,sto2:q2,gut:qgut},meal,0);
    frames.push({time,state:[...state],glucose:Gp/params.VG,sensor:Gs/params.VG,insulin:Ip/params.VI,
      oxygen:graftActive?core/0.001414:NaN,viability:graftActive?state[15]:NaN,
      EGP:Math.max(0,init.kp1-params.kp2*Gp-params.kp3*XL),Ra_meal:rate.appearance,
      U_id:(params.Vm0+params.Vmx*X)*Gt/(params.Km0+Gt),Ra_I:params.ka1*sc1+params.ka2*sc2,
      S_graft:graftActive?state[15]*R.graftGamma.value*state[13]:0,k_immune:immune,k_hypoxia:hypoxia});
  };
  capture(0);
  for(let i=0;i<14400;i++){
    const t=i*dt, active=scenario!=='fasting', ingestion=active&&i>=600&&i<750?4000:0;
    const bolus=active&&i>=600&&i<610?(60/R.breakfastRatio.value)*6000/meal.bodyWeight:0;
    state=publishedModelStep(t,state,dt,params,meal,init.kp1,()=>({ingestion,infusion:init.basal+bolus}),coupling);
    capture((i+1)*dt);
  }
  return {scenario,label:scenario==='graft'?(protectedGraft?'Normoxic HIP graft':'Hypoxic / unprotected graft'):scenario==='meal'?'60 g meal + bolus':'Untreated fasting',dt,initialState,params,meal,kp1:init.kp1,basal:init.basal,coupling,protocol:{mealMg:scenario==='fasting'?0:60000,mealStartMin:60,mealDurationMin:15,bolusUnits:scenario==='fasting'?0:60/R.breakfastRatio.value,bolusStartMin:60,bolusDurationMin:1,durationMin:1440},boundaryAssumptions:'4-point slab; dx 0.0001 m; boundary 0.2 or 0 mol/m³; Henry coefficient 0.001414 mol/(m³ mmHg).',frames};
}
