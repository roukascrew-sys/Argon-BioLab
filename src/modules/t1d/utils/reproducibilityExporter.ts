import { T1D_PARAMETER_REGISTRY } from '../registry/t1dParameterRegistry.ts';
import type { Run } from './simulation.ts';
export const ODE_COMMIT = 'a81e7f3aeeba17b6b5920e5fda2563bfe05a0856';
const stateNames=['Q_sto1','Q_sto2','Q_gut','G_p','G_t','G_s','I_sc1','I_sc2','I_p','I_l','I_delay1','X_L','X','I_po','Y_sec','f_viable'];
/** Units apply to CSV header names and are included verbatim in both exports. */
export const unitDictionary: Readonly<Record<string,string>> = Object.freeze({
  scenario:'label',time_min:'min',Q_sto1:'mg',Q_sto2:'mg',Q_gut:'mg',G_p:'mg/kg',G_t:'mg/kg',G_s:'mg/kg',
  I_sc1:'pmol/kg',I_sc2:'pmol/kg',I_p:'pmol/kg',I_l:'pmol/kg',I_delay1:'pmol/L',X_L:'pmol/L',X:'pmol/L',
  I_po:'pmol/kg',Y_sec:'pmol/(kg min)',f_viable:'dimensionless fraction',glucose_mg_dL:'mg/dL',sensor_mg_dL:'mg/dL',
  insulin_pmol_L:'pmol/L',oxygen_mmHg:'mmHg',viability:'dimensionless fraction',EGP:'mg/(kg min)',Ra_meal:'mg/(kg min)',U_id:'mg/(kg min)',
  Ra_I:'pmol/(kg min)',S_graft_raw:'pmol/(kg min)',S_graft_effective:'pmol/(kg min)',I_plasma_loss:'pmol/(kg min)',I_liver_input:'pmol/(kg min)',dI_p:'pmol/(kg min)',k_immune:'day⁻¹',k_hypoxia:'day⁻¹'
});
export function makeBundle(runs:Run[]) {
  const manifest={odeCommit:ODE_COMMIT,dtMinutes:0.1,parameterProvenance:T1D_PARAMETER_REGISTRY,runs:runs.map(({frames,...run})=>run),stateNames,unitDictionary,csvUnitsRow:'The second row maps each column to its unit; skip it when loading numeric rows.'};
  const cols=['scenario','time_min',...stateNames,'glucose_mg_dL','sensor_mg_dL','insulin_pmol_L','oxygen_mmHg','viability','EGP','Ra_meal','U_id','Ra_I','S_graft_raw','S_graft_effective','I_plasma_loss','I_liver_input','dI_p','k_immune','k_hypoxia'];
  const cell=(x:unknown)=>typeof x==='number'&&!Number.isFinite(x)?'':typeof x==='string'?`"${x.replaceAll('"','""')}"`:x===undefined?'':String(x);
  const rows=[cols.join(','),cols.map((c,i)=>cell(i===0?'unitDictionary':unitDictionary[c])).join(',')];
  for(const run of runs) for(const f of run.frames) rows.push([run.label,f.time,...stateNames.map((_,i)=>f.state[i]),f.glucose,f.sensor,f.insulin,f.oxygen,f.viability,f.EGP,f.Ra_meal,f.U_id,f.Ra_I,f.S_graft_raw,f.S_graft_effective,f.I_plasma_loss,f.I_liver_input,f.dI_p,f.k_immune,f.k_hypoxia].map(cell).join(','));
  return {json:JSON.stringify(manifest,null,2),csv:rows.join('\n')+'\n'};
}
function download(name:string,contents:string,type:string){const url=URL.createObjectURL(new Blob([contents],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export function downloadBundle(runs:Run[]){const files=makeBundle(runs);download('t1d-provenance.json',files.json,'application/json');download('t1d-trajectory.csv',files.csv,'text/csv');}
