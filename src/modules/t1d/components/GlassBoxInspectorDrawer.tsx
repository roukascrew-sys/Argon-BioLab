import { T1D_PARAMETER_REGISTRY, isParameterActive } from '../registry/t1dParameterRegistry.ts';
import type { Frame, Run } from '../utils/simulation.ts';
const equations:Record<string,string>={glucose:'dGp/dt = EGP + Ra_meal − Fcns − E − k1·Gp + k2·Gt; G = Gp/VG',sensor:'dGs/dt = (Gp − Gs)/Td; G_sensor = Gs/VG',insulin:'dIp/dt = −(m2 + m4)·Ip + m1·Il + Ra_I + S_graft_effective; S_graft_effective = f_viable · graft_fraction · S_graft_raw; S_graft_raw = γ · I_po; I = Ip/VI',oxygen:'D_eff·d²c/dx² = Rmax·c/(Km+c)·H_smooth(c−Ccr)·Xcell; pO₂ = c/α',viability:'df_viable/dt = −(k_immune + k_hypoxia)·f_viable/1440'};
export function GlassBoxInspectorDrawer(host:HTMLElement) {
  host.className='card';host.setAttribute('aria-live','polite');
  Object.assign(host.style,{display:'none',position:'fixed',right:'16px',top:'64px',width:'min(390px, calc(100vw - 32px))',maxHeight:'calc(100vh - 80px)',overflowY:'auto',zIndex:'20',boxShadow:'0 12px 36px rgba(0,0,0,.5)'});
  const title=document.createElement('h2');title.textContent='Glass-box inspector';const close=document.createElement('button');close.textContent='Close inspector';close.addEventListener('click',()=>{host.style.display='none'});const body=document.createElement('div');host.replaceChildren(title,close,body);
  return {show(run:Run,frame:Frame,curve:string){
    host.style.display='block';body.replaceChildren();const add=(tag:string,value:string)=>{const e=document.createElement(tag);e.textContent=value;body.append(e)};
    add('strong',`${run.label} · ${frame.time.toFixed(1)} min`);add('p',equations[curve]??equations.glucose);
    add('p',`Run fasting glucose: ${run.params.Gb} mg/dL${run.coupling?` · CD47: ${run.coupling.cd47} molecules/cell`:''}`);
    for(const key of ['EGP','Ra_meal','U_id','Ra_I','S_graft_raw','S_graft_effective','I_plasma_loss','I_liver_input','dI_p','k_immune','k_hypoxia'] as const) add('p',`${key}: ${frame[key].toPrecision(10)} ${key.startsWith('k_')?'day⁻¹':key==='Ra_I'||key.startsWith('S_graft')||key.startsWith('I_')||key==='dI_p'?'pmol/kg/min':'mg/kg/min'}`);
    add('p',`State vector: ${frame.state.map(x=>x.toPrecision(6)).join(', ')}`);
    const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Full parameter provenance';details.append(summary);
    for(const [key,p] of Object.entries(T1D_PARAMETER_REGISTRY)){
      const active=isParameterActive(key as keyof typeof T1D_PARAMETER_REGISTRY,run.scenario);const el=document.createElement('p'),badge=document.createElement('span');badge.className='t1d-badge';badge.dataset.active=String(active);badge.textContent=`${p.provenanceType} · ${active?'ACTIVE_IN_SOLVER':'CONTEXTUAL_BENCHMARK'}`;
      el.append(document.createTextNode(`${key}: ${p.value} ${p.unit}${key==='adultFastingGlucose'?` (run: ${run.params.Gb} ${p.unit})`:''} `),badge,document.createTextNode(` · ${p.sourceCitation} · `));
      const a=document.createElement('a');a.href=`https://doi.org/${p.doi}`;a.target='_blank';a.rel='noopener noreferrer';a.textContent=p.doi;el.append(a,document.createTextNode(` · ${p.sourceLocation}. ${p.validityWarning}`));details.append(el);
    }body.append(details);
  }};
}
