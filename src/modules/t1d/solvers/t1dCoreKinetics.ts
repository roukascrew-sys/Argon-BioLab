import { rk4Step } from './rk4.ts';
import { immuneFluxes, type ImmuneParameters } from './hypoimmuneIsletModel.ts';
import { oxygenDerivative, hypoxiaRate, steadyOxygenProfile, type OxygenParameters, type BuchwaldParameters } from './isletOxygenDiffusion.ts';
import { metabolicDerivative, mealDerivative, type MetabolicParameters, type MealParameters } from './dallaManPkPdModel.ts';
import { T1D_PARAMETER_REGISTRY as R } from '../registry/t1dParameterRegistry.ts';

/** Qsto1, Qsto2, Qgut, Gp, Gt, Gs, Isc1, Isc2, Ip, Il, Idelay, XL, X. */
export function publishedModelParameters() {
  return { VG:R.vgNormal.value, k1:R.glucoseK1.value, k2:R.glucoseK2.value, VI:R.insulinVolume.value/1000,
    m1:R.insulinM1.value, m2:R.insulinM2.value, m4:R.insulinM4.value, HE:R.hepaticExtraction.value,
    kp2:R.productionKp2.value, kp3:R.productionKp3.value, Fcns:R.brainUptake.value,
    Vm0:R.utilizationVm0.value, Vmx:R.utilizationVmx.value, Km0:R.utilizationKm0.value,
    p2u:R.actionP2u.value, ki:R.insulinDelay.value, ke1:R.renalKe1.value, ke2:R.renalKe2.value,
    kd:R.insulinKd.value, ka1:R.insulinKa1.value, ka2:R.insulinKa2.value,
    Gb:R.breakfastGlucose.value, Ib:R.basalInsulinPmol.value, Td:R.sensorDelay.value };
}
export type PublishedModelParameters = ReturnType<typeof publishedModelParameters>;
export function initializePublishedModel(p: PublishedModelParameters) {
  const Gp = p.Gb*p.VG, Ip = p.Ib*p.VI, m3 = p.HE*p.m1/(1-p.HE), Il = p.m2*Ip/(p.m1+m3);
  const B = p.k2*p.Km0+p.Vm0-p.k1*Gp, C = -p.k1*Gp*p.Km0;
  const Gt = (-B+Math.sqrt(B*B-4*p.k2*C))/(2*p.k2);
  const uid = p.Vm0*Gt/(p.Km0+Gt), renal = Math.max(0,p.ke1*(Gp-p.ke2));
  const kp1 = p.Fcns+uid+renal+p.kp2*Gp+p.kp3*p.Ib;
  const basal = (p.m2+p.m4)*Ip-p.m1*Il;
  return { kp1, basal, state:[0,0,0,Gp,Gt,Gp,basal/(p.kd+p.ka1),p.kd*basal/((p.kd+p.ka1)*p.ka2),Ip,Il,p.Ib,p.Ib,0] };
}
/** 2007 two-compartment glucose/insulin model with the specified SC and single-meal adaptations. */
export function publishedModelStep(t:number, state:readonly number[], dt:number, p:PublishedModelParameters, meal:MealParameters, kp1:number, inputs:(t:number)=>{ingestion:number; infusion:number}, coupling?: Omit<CoupledInputs, 'meal' | 'metabolic'>):number[] {
  if (state.length!==(coupling ? 16 : 13) || !Number.isFinite(p.Td) || p.Td<=0) throw new RangeError('Expected 13 physiological states and optional graft states');
  let loss=0;
  if(coupling) {
    const c=coupling, g=c.graft;
    if(!g || !Object.values(g).every(Number.isFinite) || g.fraction<0 || g.fraction>1 || g.gamma<=0 || g.K<0 || g.alpha<=0 || g.beta<0 || ![c.cd47,c.cd47Low,c.cd47High,c.immuneMax,c.hypoxiaMax].every(Number.isFinite) || c.cd47<0 || c.cd47Low<0 || c.cd47High<=c.cd47Low || c.immuneMax<0 || c.hypoxiaMax<0 || c.oxygen.critical<=0 || state[15]<0 || state[15]>1) throw new RangeError('Invalid graft or oxygen coupling');
    const core=steadyOxygenProfile(c.oxygen,c.points,c.cellFraction)[0];
    const hyp=core>=c.oxygen.critical ? 0 : c.hypoxiaMax*(1-core/c.oxygen.critical);
    const immune=!c.b2mKnockout || !c.ciitaKnockout ? c.immuneMax : c.immuneMax*(1-Math.max(0,Math.min(1,(c.cd47-c.cd47Low)/(c.cd47High-c.cd47Low))));
    loss=(hyp+immune)/1440;
  }
  const out=rk4Step((time,y)=>{
    const input=inputs(time), q=mealDerivative({sto1:y[0],sto2:y[1],gut:y[2]},meal,input.ingestion);
    const [Gp,Gt,Gs,sc1,sc2,Ip,Il,delay,XL,X]=y.slice(3,13);
    if ([Gp,Gt,Gs,sc1,sc2,Ip,Il,delay,XL].some(v=>v<0)) throw new RangeError('Negative physiological state');
    const insulin=Ip/p.VI, egp=Math.max(0,kp1-p.kp2*Gp-p.kp3*XL);
    const uid=(p.Vm0+p.Vmx*X)*Gt/(p.Km0+Gt), renal=Math.max(0,p.ke1*(Gp-p.ke2));
    const m3=p.HE*p.m1/(1-p.HE);
    const dGp=egp+q.appearance-p.Fcns-renal-p.k1*Gp+p.k2*Gt;
    let graftInput=0; const extra:number[]=[];
    if(coupling?.graft) {
      const g=coupling.graft, portal=y[13], secretion=y[14], viable=y[15];
      graftInput=viable*g.fraction*g.gamma*portal;
      extra.push(-g.gamma*portal+secretion+g.K*Math.max(dGp/p.VG,0),-g.alpha*(secretion-Math.max(0,g.beta*(Gp/p.VG-p.Gb))),-loss*viable);
    }
    return [q.sto1,q.sto2,q.gut,dGp,-uid+p.k1*Gp-p.k2*Gt,(Gp-Gs)/p.Td,
      input.infusion-(p.kd+p.ka1)*sc1,p.kd*sc1-p.ka2*sc2,
      -(p.m2+p.m4)*Ip+p.m1*Il+p.ka1*sc1+p.ka2*sc2+graftInput,p.m2*Ip-(p.m1+m3)*Il,
      -p.ki*(delay-insulin),-p.ki*(XL-delay),-p.p2u*X+p.p2u*(insulin-p.Ib),...extra];
  },t,state,dt);
  if(out.some((v,i)=>i!==12&&v<0) || (coupling && out[15]>1)) throw new RangeError('Negative physiological state');
  return out;
}

/** Eight-state reduced model in minutes. The input is a rate, not an impulse. */
export function mealInsulinStep(t: number, y: readonly number[], dt: number, meal: MealParameters, metabolic: MetabolicParameters,
  inputs: (minutes: number) => { ingestion: number; infusion: number }): number[] {
  if (y.length !== 8) throw new RangeError('Expected eight metabolic state values');
  const next = rk4Step((time, state) => {
    const u = inputs(time);
    const m = mealDerivative({ sto1: state[0], sto2: state[1], gut: state[2] }, meal, u.ingestion);
    const d = metabolicDerivative({ sc1: state[3], sc2: state[4], plasma: state[5], action: state[6], glucose: state[7] }, metabolic, u.infusion, m.appearance);
    return [m.sto1, m.sto2, m.gut, d.sc1, d.sc2, d.plasma, d.action, d.glucose];
  }, t, y, dt);
  if (next.some((v, i) => i !== 6 && v < 0)) throw new RangeError('Negative state: reduce step size or check inputs');
  return next;
}

/** Exact fasting equilibrium for the reduced insulin model. */
export function fastingState(p: MetabolicParameters): { state: number[]; basalInfusion: number } {
  if (![p.ke, p.Ib, p.kd, p.ka1, p.ka2, p.Gb].every(Number.isFinite) || p.ke < 0 || p.Ib < 0 || p.kd < 0 || p.ka1 < 0 || p.kd + p.ka1 <= 0 || p.ka2 <= 0 || p.Gb < 0) throw new RangeError('Invalid fasting parameters');
  const basalInfusion = p.ke * p.Ib;
  const sc1 = basalInfusion / (p.kd + p.ka1);
  return { state: [0, 0, 0, sc1, p.kd * sc1 / p.ka2, p.Ib, 0, p.Gb], basalInfusion };
}

export interface GraftParameters { fraction: number; gamma: number; K: number; alpha: number; beta: number; insulinVolumeLitresPerKg: number }
export interface CoupledInputs { meal: MealParameters; metabolic: MetabolicParameters; oxygen: BuchwaldParameters; points: number; cellFraction: number; cd47: number; b2mKnockout: boolean; ciitaKnockout: boolean; cd47Low: number; cd47High: number; immuneMax: number; hypoxiaMax: number; graft?: GraftParameters }
/** Eight metabolic states, viable fraction and, if configured, portal insulin and secretion state. Time: minutes. */
export function coupledStep(t: number, state: readonly number[], dt: number, p: CoupledInputs,
  inputs: (minutes: number) => { ingestion: number; infusion: number }): { state: number[]; oxygen: number[]; immunePerDay: number; hypoxiaPerDay: number } {
  if (state.length !== (p.graft ? 11 : 9) || ![p.cd47, p.cd47Low, p.cd47High, p.immuneMax, p.hypoxiaMax].every(Number.isFinite) || p.cd47 < 0 || p.cd47Low < 0 || p.cd47High <= p.cd47Low || p.immuneMax < 0 || p.hypoxiaMax < 0 || state[8] < 0 || state[8] > 1) throw new RangeError('Invalid coupled inputs');
  if (p.graft && (!Object.values(p.graft).every(Number.isFinite) || p.graft.fraction < 0 || p.graft.fraction > 1 || p.graft.gamma <= 0 || p.graft.K < 0 || p.graft.alpha <= 0 || p.graft.beta < 0 || p.graft.insulinVolumeLitresPerKg <= 0)) throw new RangeError('Invalid graft parameters');
  const oxygen = steadyOxygenProfile(p.oxygen, p.points, p.cellFraction);
  const core = oxygen[0];
  if (p.oxygen.critical <= 0) throw new RangeError('Invalid critical oxygen');
  const hypoxiaPerDay = core >= p.oxygen.critical ? 0 : p.hypoxiaMax * (1 - core / p.oxygen.critical);
  const immunePerDay = !p.b2mKnockout || !p.ciitaKnockout ? p.immuneMax : p.immuneMax * (1 - Math.max(0, Math.min(1, (p.cd47 - p.cd47Low) / (p.cd47High - p.cd47Low))));
  const next = rk4Step((time, y) => {
    const input = inputs(time);
    const meal = mealDerivative({ sto1: y[0], sto2: y[1], gut: y[2] }, p.meal, input.ingestion);
    const m = metabolicDerivative({ sc1: y[3], sc2: y[4], plasma: y[5], action: y[6], glucose: y[7] }, p.metabolic, input.infusion, meal.appearance);
    let insulin = m.plasma;
    const secretion: number[] = [];
    if (p.graft) {
      const g = p.graft;
      const portalSecretion = y[10] + g.K * Math.max(m.glucose, 0);
      const graftSecretion = g.gamma * y[9];
      insulin += y[8] * g.fraction * graftSecretion / (6 * g.insulinVolumeLitresPerKg);
      secretion.push(-g.gamma * y[9] + portalSecretion, -g.alpha * (y[10] - Math.max(0, g.beta * (y[7] - p.metabolic.Gb))));
    }
    return [meal.sto1, meal.sto2, meal.gut, m.sc1, m.sc2, insulin, m.action, m.glucose, -(immunePerDay + hypoxiaPerDay) * y[8] / 1440, ...secretion];
  }, t, state, dt);
  if (next.some((v, i) => i !== 6 && v < 0) || next[8] > 1) throw new RangeError('Invalid coupled state: reduce step size or check inputs');
  return { state: next, oxygen, immunePerDay, hypoxiaPerDay };
}

export interface CoreParameters { immune: ImmuneParameters; oxygen: OxygenParameters; metabolic: MetabolicParameters; initialCells: number }
/** State: cells, oxygen grid, sc1, sc2, plasma, action, glucose. Integration time is seconds. */
export function coreStep(t: number, state: readonly number[], dt: number, p: CoreParameters,
  inputs: (seconds: number) => { infusion: number; mealAppearance: number }): number[] {
  const count = state.length - 6;
  if (count < 2 || !Number.isFinite(p.initialCells) || p.initialCells <= 0) throw new RangeError('Invalid core state or initial cells');
  const next = rk4Step((time, y) => {
    const cells = y[0], oxygen = y.slice(1, 1 + count), m = y.slice(1 + count);
    const h = hypoxiaRate(oxygen[0], p.oxygen);
    const immune = immuneFluxes(cells, h, p.immune);
    const diff = oxygenDerivative(oxygen, cells / p.initialCells, p.oxygen);
    const input = inputs(time);
    const metabolic = metabolicDerivative({ sc1: m[0], sc2: m[1], plasma: m[2], action: m[3], glucose: m[4] }, p.metabolic, input.infusion, input.mealAppearance);
    return [immune.derivative / 86400, ...diff, metabolic.sc1 / 60, metabolic.sc2 / 60, metabolic.plasma / 60, metabolic.action / 60, metabolic.glucose / 60];
  }, t, state, dt);
  if (next.some((v, i) => i !== next.length - 2 && v < 0)) throw new RangeError('Negative concentration: reduce step size or check inputs');
  return next;
}
