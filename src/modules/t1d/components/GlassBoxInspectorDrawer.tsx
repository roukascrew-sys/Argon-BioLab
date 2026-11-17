import { T1D_PARAMETER_REGISTRY, isParameterActive } from '../registry/t1dParameterRegistry.ts';
import { unitDictionary } from '../utils/reproducibilityExporter.ts';
import type { Frame, Run } from '../utils/simulation.ts';

const equations:Record<string,string>={glucose:'dGp/dt = EGP + Ra_meal − Fcns − E − k1·Gp + k2·Gt; G = Gp/VG',sensor:'dGs/dt = (Gp − Gs)/Td; G_sensor = Gs/VG',insulin:'dIp/dt = −(m2 + m4)·Ip + m1·Il + Ra_I + S_graft_effective; S_graft_effective = f_viable · graft_fraction · S_graft_raw; S_graft_raw = γ · I_po; I = Ip/VI',oxygen:'D_eff·d²c/dx² = Rmax·c/(Km+c)·H_smooth(c−Ccr)·Xcell; pO₂ = c/α',viability:'df_viable/dt = −(k_immune + k_hypoxia)·f_viable/1440'};

type FluxKey = 'EGP'|'Ra_meal'|'U_id'|'Ra_I'|'S_graft_raw'|'S_graft_effective'|'I_plasma_loss'|'I_liver_input'|'dI_p'|'k_immune'|'k_hypoxia';
const fluxGroups: { title:string; entries:readonly (readonly [FluxKey,string])[] }[] = [
  {title:'Glucose Balance', entries:[['EGP','Endogenous production'],['Ra_meal','Meal appearance'],['U_id','Insulin-dependent uptake']]},
  {title:'Insulin & Graft Input', entries:[['Ra_I','SubQ absorption'],['S_graft_raw','Raw graft secretion'],['S_graft_effective','Effective graft input'],['I_plasma_loss','Plasma insulin loss'],['I_liver_input','Liver insulin input'],['dI_p','Net plasma insulin derivative']]},
  {title:'Graft Survival Rates', entries:[['k_immune','Immune clearance'],['k_hypoxia','Hypoxia loss']]}
];
// This is the solver's 13-state order followed by the optional coupled graft states.
const states = [
  ['Q_sto1','Stomach solid compartment'],['Q_sto2','Stomach liquid compartment'],['Q_gut','Intestinal glucose'],
  ['G_p','Plasma glucose mass'],['G_t','Tissue glucose mass'],['G_s','Subcutaneous sensor glucose mass'],
  ['I_sc1','First subcutaneous insulin compartment'],['I_sc2','Second subcutaneous insulin compartment'],
  ['I_p','Plasma insulin mass'],['I_l','Liver insulin mass'],['I_delay1','Delayed insulin signal'],
  ['X_L','Liver insulin action signal'],['X','Insulin-dependent uptake signal'],
  ['I_po','Graft portal insulin'],['Y_sec','Graft secretion signal'],['f_viable','Viable graft fraction']
] as const;

const formatted=(value:number)=>Number.isFinite(value) && value!==0 && Math.abs(value)<0.00005 ? value.toExponential(4) : value.toFixed(4);

export function GlassBoxInspectorDrawer(host:HTMLElement) {
  host.className='card t1d-inspector';host.setAttribute('aria-live','polite');host.setAttribute('aria-label','Glass-box inspector');
  Object.assign(host.style,{display:'none',position:'fixed',right:'16px',top:'64px',width:'min(470px, calc(100vw - 32px))',maxHeight:'calc(100vh - 80px)',overflowY:'auto',zIndex:'20',boxShadow:'0 12px 36px rgba(0,0,0,.5)'});
  const style=document.createElement('style');style.textContent=`
    .t1d-inspector{padding:18px;color:#e2e8f0}.t1d-inspector .inspect-header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.t1d-inspector .inspect-header h2{color:#e8f3ff;font-size:.87rem;letter-spacing:.04em;margin:0}.t1d-inspector .inspect-close{width:auto;white-space:nowrap;font-size:.7rem;padding:6px 9px}.t1d-inspector .inspect-equation{background:#0a111b;border:1px solid #35516c;border-radius:8px;padding:13px;margin-bottom:10px}.t1d-inspector .inspect-caption{font-size:.65rem;letter-spacing:.09em;text-transform:uppercase;color:#8cbce9;font-weight:700;margin-bottom:7px}.t1d-inspector .inspect-context{color:#b7cadc;font-size:.72rem;line-height:1.5;margin-bottom:9px}.t1d-inspector code{font-family:Consolas,monospace;color:#d7eaff;font-size:.75rem;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere}.t1d-inspector .inspect-run{font-size:.7rem;color:#a5b8ca;line-height:1.5;margin:10px 0 14px}.t1d-inspector .inspect-group{border:1px solid #2a3444;border-radius:8px;margin:10px 0;background:#111923;overflow:hidden}.t1d-inspector .inspect-group h3{color:#a8d0f4;font-size:.72rem;letter-spacing:.03em;padding:10px 12px;background:#192534;margin:0}.t1d-inspector .inspect-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:7px 12px;border-top:1px solid #25313f}.t1d-inspector .inspect-label{min-width:0;font-size:.7rem;color:#d6e3f0;overflow-wrap:anywhere}.t1d-inspector .inspect-symbol{font-family:Consolas,monospace;color:#91bde4;font-size:.68rem;margin-right:5px}.t1d-inspector .inspect-value{text-align:right;white-space:nowrap;font-family:Consolas,monospace;font-size:.72rem;color:#f0f6fc}.t1d-inspector .inspect-unit{display:block;color:#9baebe;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:.62rem;margin-top:2px}.t1d-inspector details{border:1px solid #2a3444;border-radius:8px;padding:10px 12px;margin-top:10px}.t1d-inspector summary{cursor:pointer;color:#cbe2ff;font-size:.73rem;font-weight:600;line-height:1.5}.t1d-inspector .inspect-table-wrap{overflow-x:auto;margin-top:10px}.t1d-inspector table{border-collapse:collapse;width:100%;font-size:.68rem}.t1d-inspector th,.t1d-inspector td{padding:7px 5px;text-align:left;border-bottom:1px solid #2a3444;vertical-align:top}.t1d-inspector th{color:#a9bfd3;font-weight:600}.t1d-inspector td:first-child,.t1d-inspector .state-value{font-family:Consolas,monospace;color:#d7eaff}.t1d-inspector .state-value{overflow-wrap:anywhere}.t1d-inspector .state-unit{color:#9baebe}.t1d-inspector .provenance p{font-size:.7rem;line-height:1.55;overflow-wrap:anywhere;padding-top:10px;color:#b9cbdc}
  `;
  const header=document.createElement('div');header.className='inspect-header';const title=document.createElement('h2');title.textContent='Glass-box inspector';const close=document.createElement('button');close.className='inspect-close';close.textContent='Close inspector';close.addEventListener('click',()=>{host.style.display='none'});header.append(title,close);const body=document.createElement('div');host.replaceChildren(style,header,body);
  return {show(run:Run,frame:Frame,curve:string){
    host.style.display='block';
    const stateOpen=body.querySelector<HTMLDetailsElement>('.inspect-states')?.open??false;
    const provenanceOpen=body.querySelector<HTMLDetailsElement>('.provenance')?.open??false;
    body.replaceChildren();
    const equation=document.createElement('section');equation.className='inspect-equation';
    const caption=document.createElement('div');caption.className='inspect-caption';caption.textContent='Active governing equation';
    const context=document.createElement('div');context.className='inspect-context';context.textContent=`${run.label} · t = ${frame.time.toFixed(1)} min`;
    const formula=document.createElement('code');formula.textContent=equations[curve]??equations.glucose;equation.append(caption,context,formula);body.append(equation);
    const runInfo=document.createElement('p');runInfo.className='inspect-run';runInfo.textContent=`Run fasting glucose: ${run.params.Gb} mg/dL${run.coupling?` · CD47: ${run.coupling.cd47} molecules/cell`:''}`;body.append(runInfo);
    for(const group of fluxGroups){
      const section=document.createElement('section');section.className='inspect-group';const heading=document.createElement('h3');heading.textContent=group.title;section.append(heading);
      for(const [key,label] of group.entries){const row=document.createElement('div');row.className='inspect-row';const name=document.createElement('div');name.className='inspect-label';const symbol=document.createElement('span');symbol.className='inspect-symbol';symbol.textContent=key;name.append(symbol,document.createTextNode(label));const value=document.createElement('div');value.className='inspect-value';value.textContent=formatted(frame[key]);value.title=String(frame[key]);const unit=document.createElement('span');unit.className='inspect-unit';unit.textContent=unitDictionary[key];value.append(unit);row.append(name,value);section.append(row)}
      body.append(section);
    }
    const stateDetails=document.createElement('details');stateDetails.className='inspect-states';stateDetails.open=stateOpen;const stateSummary=document.createElement('summary');stateSummary.textContent='All 13 ODE State Variables (Exact Values)';stateDetails.append(stateSummary);
    const stateNote=document.createElement('p');stateNote.className='inspect-run';stateNote.textContent='The three additional graft states are present only in graft simulations.';stateDetails.append(stateNote);
    const wrap=document.createElement('div');wrap.className='inspect-table-wrap';const table=document.createElement('table');const thead=document.createElement('thead');const headRow=document.createElement('tr');for(const heading of ['Symbol','State','Exact value','Unit']){const th=document.createElement('th');th.scope='col';th.textContent=heading;headRow.append(th)}thead.append(headRow);table.append(thead);const tbody=document.createElement('tbody');
    states.forEach(([symbol,name],index)=>{const row=document.createElement('tr');for(const [column,text] of [symbol,name,index<frame.state.length?String(frame.state[index]):'Not modeled',unitDictionary[symbol]].entries()){const cell=document.createElement('td');if(column===2)cell.className='state-value';if(column===3)cell.className='state-unit';cell.textContent=text;row.append(cell)}tbody.append(row)});table.append(tbody);wrap.append(table);stateDetails.append(wrap);body.append(stateDetails);
    const details=document.createElement('details');details.className='provenance';details.open=provenanceOpen;const summary=document.createElement('summary');summary.textContent='Full parameter provenance';details.append(summary);
    for(const [key,p] of Object.entries(T1D_PARAMETER_REGISTRY)){
      const active=isParameterActive(key as keyof typeof T1D_PARAMETER_REGISTRY,run.scenario);const el=document.createElement('p'),badge=document.createElement('span');badge.className='t1d-badge';badge.dataset.active=String(active);badge.textContent=`${p.provenanceType} · ${active?'ACTIVE_IN_SOLVER':'CONTEXTUAL_BENCHMARK'}`;
      el.append(document.createTextNode(`${key}: ${p.value} ${p.unit}${key==='adultFastingGlucose'?` (run: ${run.params.Gb} ${p.unit})`:''} `),badge,document.createTextNode(` · ${p.sourceCitation} · `));
      const a=document.createElement('a');a.href=`https://doi.org/${p.doi}`;a.target='_blank';a.rel='noopener noreferrer';a.textContent=p.doi;el.append(a,document.createTextNode(` · ${p.sourceLocation}. ${p.validityWarning}`));details.append(el);
    }body.append(details);
  }};
}
