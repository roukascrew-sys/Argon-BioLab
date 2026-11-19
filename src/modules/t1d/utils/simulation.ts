import { T1D_PARAMETER_REGISTRY as R, validateParameterValue } from '../registry/t1dParameterRegistry.ts';
import { publishedModelParameters, initializePublishedModel, publishedModelStep } from '../solvers/t1dCoreKinetics.ts';
import { mealDerivative } from '../solvers/dallaManPkPdModel.ts';
import { steadyOxygenProfile } from '../solvers/isletOxygenDiffusion.ts';

export type Scenario = 'fasting' | 'meal' | 'graft';
export interface ScenarioOptions { oxygenMmHg: 15 | 76 | 140; cd47: 0 | 200000 | 600000; basalEnabled: boolean; halfThicknessUm?: 150 | 250 | 500 }
export interface Frame { time: number; state: number[]; glucose: number; sensor: number; insulin: number; oxygen: number; viability: number; EGP: number; Ra_meal: number; U_id: number; Ra_I: number; S_graft_raw: number; S_graft_effective: number; I_plasma_loss: number; I_liver_input: number; dI_p: number; k_immune: number; k_hypoxia: number }
export interface Run { scenario: Scenario; label: string; dt: number; initialState: number[]; params: ReturnType<typeof publishedModelParameters>; meal: {kgri:number;kmin:number;kmax:number;kabs:number;fraction:number;b:number;d:number;dose:number;bodyWeight:number}; kp1:number; basal:number; coupling: any; protocol:{mealMg:number;mealStartMin:number;mealDurationMin:number;bolusUnits:number;bolusStartMin:number;bolusDurationMin:number;durationMin:number}; boundaryAssumptions: string; frames: Frame[] }
export function simulate(scenario: Scenario, basalGlucose: number, options: boolean | ScenarioOptions = true): Run {
  validateParameterValue(R.adultFastingGlucose, basalGlucose);
  if(typeof options!=='boolean' && (![15,76,140].includes(options.oxygenMmHg) || ![0,200000,600000].includes(options.cd47) || typeof options.basalEnabled!=='boolean' || (options.halfThicknessUm!==undefined && ![150,250,500].includes(options.halfThicknessUm)))) throw new RangeError('Unsupported scenario controls');
  const params={...publishedModelParameters(),Gb:basalGlucose}, init=initializePublishedModel(params), dt=0.1;
  const meal={kgri:R.mealKgri.value,kmin:R.mealKmin.value,kmax:R.mealKmax.value,kabs:R.mealKabs.value,fraction:R.mealFraction.value,b:R.modelMealB.value,d:R.modelMealC.value,dose:R.mealReferenceDose.value,bodyWeight:R.breakfastWeight.value};
  const cellFraction=R.humanScaleCellFraction.value, graftActive=scenario==='graft';
  // Domain and boundary are scenario assumptions, not patient-specific measurements.
  const legacy=typeof options==='boolean';
  const boundary=legacy?(options?0.2:0):options.oxygenMmHg*R.oxygenHenryCoefficient.value;
  const cd47=legacy?(options?R.cd47Upper.value:0):options.cd47, basalEnabled=legacy||options.basalEnabled;
  // Geometry and mesh are numerical scenario settings, not physiological rate constants.
  const halfThicknessUm=legacy?500:(options.halfThicknessUm??500),points=21;
  const oxygen={diffusion:(1-cellFraction)*R.oxygenAlginate.value+cellFraction*R.oxygenIslet.value,rmax:R.oxygenMaxConsumption.value,km:R.oxygenKm.value,critical:R.oxygenCritical.value,smoothingWidth:R.oxygenSmoothingWidth.value,dx:halfThicknessUm*1e-6/(points-1),boundary};
  const coupling=graftActive?{oxygen,points,cellFraction,cd47,b2mKnockout:true,ciitaKnockout:true,cd47Low:R.cd47Lower.value,cd47High:R.cd47Upper.value,immuneMax:R.immuneReject.value,hypoxiaMax:R.hypoxiaMax.value,graft:{fraction:1,gamma:R.graftGamma.value,K:R.graftK.value,alpha:R.graftAlpha.value,beta:R.graftBeta.value,insulinVolumeLitresPerKg:params.VI}}:undefined;
  const core=graftActive?steadyOxygenProfile(oxygen,points,cellFraction)[0]:NaN;
  const hypoxia=graftActive&&core<oxygen.critical?R.hypoxiaMax.value*(1-core/oxygen.critical):0;
  const immune=graftActive?R.immuneReject.value*(1-Math.max(0,Math.min(1,(cd47-R.cd47Lower.value)/(R.cd47Upper.value-R.cd47Lower.value)))):0;
  let state=graftActive?[...init.state,0,0,1]:[...init.state];
  const initialState=[...state],frames:Frame[]=[];
  const capture=(time:number) => {
    const [q1,q2,qgut,Gp,Gt,Gs,sc1,sc2,Ip,Il, ,XL,X]=state;
    const rate=mealDerivative({sto1:q1,sto2:q2,gut:qgut},meal,0);
    const raw=graftActive?coupling!.graft.gamma*state[13]:0;
    const effective=graftActive?state[15]*coupling!.graft.fraction*raw:0;
    const loss=(params.m2+params.m4)*Ip, liver=params.m1*Il, absorption=params.ka1*sc1+params.ka2*sc2;
    frames.push({time,state:[...state],glucose:Gp/params.VG,sensor:Gs/params.VG,insulin:Ip/params.VI,
      oxygen:graftActive?core/R.oxygenHenryCoefficient.value:NaN,viability:graftActive?state[15]:NaN,
      EGP:Math.max(0,init.kp1-params.kp2*Gp-params.kp3*XL),Ra_meal:rate.appearance,
      U_id:(params.Vm0+params.Vmx*X)*Gt/(params.Km0+Gt),Ra_I:absorption,
      S_graft_raw:raw,S_graft_effective:effective,I_plasma_loss:loss,I_liver_input:liver,dI_p:-loss+liver+absorption+effective,k_immune:immune,k_hypoxia:hypoxia});
  };
  capture(0);
  for(let i=0;i<14400;i++){
    const t=i*dt, active=scenario!=='fasting', ingestion=active&&i>=600&&i<750?4000:0;
    const bolus=active&&i>=600&&i<610?(60/R.breakfastRatio.value)*6000/meal.bodyWeight:0;
    state=publishedModelStep(t,state,dt,params,meal,init.kp1,()=>({ingestion,infusion:(basalEnabled?init.basal:0)+bolus}),coupling);
    capture((i+1)*dt);
  }
  const label=scenario==='graft'?`${legacy?(options?'Normoxic HIP graft':'Hypoxic / unprotected graft'):`Graft · ${options.oxygenMmHg} mmHg · CD47 ${cd47.toLocaleString()} · ${basalEnabled?'basal maintained':'basal off'}`} · ${halfThicknessUm} µm`:scenario==='meal'?'60 g meal + bolus':'Fasting baseline (basal insulin maintained)';
  return {scenario,label,dt,initialState,params,meal,kp1:init.kp1,basal:basalEnabled?init.basal:0,coupling,protocol:{mealMg:scenario==='fasting'?0:60000,mealStartMin:60,mealDurationMin:15,bolusUnits:scenario==='fasting'?0:60/R.breakfastRatio.value,bolusStartMin:60,bolusDurationMin:1,durationMin:1440},boundaryAssumptions:`${points}-point slab; half-thickness ${halfThicknessUm} µm; dx ${oxygen.dx} m; islet volume fraction ${cellFraction}; surface oxygen ${boundary} mol/m³; Henry coefficient ${R.oxygenHenryCoefficient.value} mol/(m³ mmHg); initial SC depots at fasting equilibrium even if basal is switched off at t=0.`,frames};
}
