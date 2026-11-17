import { T1D_PARAMETER_REGISTRY } from '../registry/t1dParameterRegistry.ts';
import type { Frame, Run } from '../utils/simulation.ts';
const equations:Record<string,string>={glucose:'dGp/dt = EGP + Ra_meal − Fcns − E − k1·Gp + k2·Gt; G = Gp/VG',sensor:'dGs/dt = (Gp − Gs)/Td; G_sensor = Gs/VG',insulin:'dIp/dt = −(m2 + m4)·Ip + m1·Il + Ra_I + f_viable·graft_fraction·S_graft; I = Ip/VI',oxygen:'D_eff·d²c/dx² = Rmax·c/(Km+c)·H_smooth(c−Ccr)·Xcell; pO₂ = c/α',viability:'df_viable/dt = −(k_immune + k_hypoxia)·f_viable/1440'};
export function GlassBoxInspectorDrawer(host:HTMLElement) {
  host.className='card';host.setAttribute('aria-live','polite');
  Object.assign(host.style,{display:'none',position:'fixed',right:'16px',top:'64px',width:'min(390px, calc(100vw - 32px))',maxHeight:'calc(100vh - 80px)',overflowY:'auto',zIndex:'20',boxShadow:'0 12px 36px rgba(0,0,0,.5)'});
  const title=document.createElement('h2');title.textContent='Glass-box inspector';const close=document.createElement('button');close.textContent='Close inspector';close.addEventListener('click',()=>{host.style.display='none'});const body=document.createElement('div');body.textContent='Select a plotted point or equation to inspect its state and fluxes.';host.replaceChildren(title,close,body);
  return {show(run:Run,frame:Frame,curve:string){
    host.style.display='block';body.replaceChildren();const add=(tag:string,value:string)=>{const e=document.createElement(tag);e.textContent=value;body.append(e)};
    add('strong',`${run.label} · ${frame.time.toFixed(1)} min`);add('p',equations[curve]??equations.glucose);
    for(const key of ['EGP','Ra_meal','U_id','Ra_I','S_graft','k_immune','k_hypoxia'] as const) add('p',`${key}: ${frame[key].toPrecision(6)} ${key.startsWith('k_')?'day⁻¹':key==='Ra_I'||key==='S_graft'?'pmol/kg/min':'mg/kg/min'}`);
    add('p',`State vector: ${frame.state.map(x=>x.toPrecision(6)).join(', ')}`);
    const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Full parameter provenance';details.append(summary);
    for(const [key,p] of Object.entries(T1D_PARAMETER_REGISTRY)){const el=document.createElement('p');el.textContent=`${key}: ${p.value} ${p.unit} · ${p.provenanceType} · ${p.sourceCitation} · DOI ${p.doi} · ${p.sourceLocation}`;details.append(el)}body.append(details);
  }};
}
