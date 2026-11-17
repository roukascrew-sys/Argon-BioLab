import { T1D_PARAMETER_REGISTRY as R, validateParameterValue } from '../registry/t1dParameterRegistry.ts';
import { simulate, type Run, type Scenario } from '../utils/simulation.ts';
import { downloadBundle } from '../utils/reproducibilityExporter.ts';
import { GlassBoxInspectorDrawer } from './GlassBoxInspectorDrawer.tsx';
import { OmittedPhysiologyPanel } from './OmittedPhysiologyPanel.tsx';
import { runT1DSuite } from '../../../mission-control/suites/t1d.suite.ts';

declare const Chart:any;
export function T1DWorkbenchView(controls:HTMLElement,view:HTMLElement) {
  const p=R.adultFastingGlucose;
  controls.innerHTML=`<h2>Type 1 Diabetes Workbench</h2><div class="control-group"><label for="t1dScenario">Scenario</label><select id="t1dScenario"><option value="fasting">Untreated T1D fasting</option><option value="meal">60 g meal + bolus</option><option value="graft">Normoxic HIP vs hypoxic / unprotected graft</option></select></div><div class="control-group"><label for="t1dGb">Adult fasting glucose <span id="t1dGbLabel" class="val-display"></span></label><input id="t1dGb" type="range" min="${p.minBound}" max="${p.maxBound}" step="0.1" value="${p.value}"><small>Adult cohort range (mg/dL); adjusts model baseline.</small></div><button class="primary" id="t1dRun">Run simulation</button><button id="t1dExport" disabled>Download reproducibility bundle</button><p id="t1dStatus" role="status">Choose a scenario, then run.</p><details><summary>Parameter provenance</summary><div id="t1dParameters"></div></details>`;
  const panel=controls.querySelector('#t1dParameters')!;
  for(const [key,param] of Object.entries(R)){const d=document.createElement('div');d.className='control-group';const title=document.createElement('strong');title.textContent=`${key}: ${param.value} ${param.unit} · ${param.provenanceType}`;const detail=document.createElement('p');detail.textContent=`${param.sourceCitation} · DOI ${param.doi} · ${param.sourceLocation}. ${param.validityWarning} ${param.minBound===null||param.maxBound===null?'No verified slider range; read only.':`Bounds ${param.minBound}–${param.maxBound}.`}`;d.append(title,detail);panel.append(d)}
  view.style.gap='12px';const intro=document.createElement('div');intro.innerHTML='<h2>T1D Simulation</h2><p>Select a plotted point or equation to inspect it. Insulin is shown in pmol/L; oxygen and viability appear for graft scenarios.</p>';
  const timeline=document.createElement('div');timeline.className='card';timeline.innerHTML='<label for="t1dTime">Inspect timestamp (minutes) <span id="t1dTimeValue" class="val-display">0</span></label><input id="t1dTime" type="range" min="0" max="1440" step="0.1" value="0" disabled>';
  const plotContainer=document.createElement('div');const plots:HTMLCanvasElement[]=[];const formulas=document.createElement('div');formulas.className='btn-row';
  for(const [index,label] of ['Plasma and sensor glucose','Plasma insulin','Core oxygen','Graft viability'].entries()){const card=document.createElement('section');card.className='card';card.style.height='250px';card.innerHTML=`<h2>${label}</h2>`;const wrapper=document.createElement('div');wrapper.style.height='190px';const c=document.createElement('canvas');c.setAttribute('aria-label',label);c.setAttribute('role','img');wrapper.append(c);card.append(wrapper);plotContainer.append(card);plots[index]=c;}
  const inspectorHost=document.createElement('section');const inspector=GlassBoxInspectorDrawer(inspectorHost);
  view.replaceChildren(intro,OmittedPhysiologyPanel(),timeline,formulas,plotContainer,inspectorHost);
  const scenario=controls.querySelector<HTMLSelectElement>('#t1dScenario')!, slider=controls.querySelector<HTMLInputElement>('#t1dGb')!, display=controls.querySelector<HTMLElement>('#t1dGbLabel')!, runButton=controls.querySelector<HTMLButtonElement>('#t1dRun')!, exportButton=controls.querySelector<HTMLButtonElement>('#t1dExport')!, status=controls.querySelector<HTMLElement>('#t1dStatus')!;
  let runs:Run[]=[],charts:any[]=[];display.textContent=slider.value;
  const timeInput=timeline.querySelector<HTMLInputElement>('#t1dTime')!,timeLabel=timeline.querySelector<HTMLElement>('#t1dTimeValue')!;
  timeInput.addEventListener('input',()=>{timeLabel.textContent=timeInput.value;if(runs.length)inspector.show(runs[0],runs[0].frames[Math.round(Number(timeInput.value)*10)],'glucose')});
  slider.addEventListener('input',()=>{display.textContent=slider.value;exportButton.disabled=true;status.textContent='Parameters changed. Run simulation to update results.'});scenario.addEventListener('change',()=>{exportButton.disabled=true;status.textContent='Scenario changed. Run simulation to update results.'});
  for(const [key,label] of Object.entries({glucose:'Glucose equation',sensor:'Sensor equation',insulin:'Insulin equation',oxygen:'Oxygen equation',viability:'Viability equation'})){const button=document.createElement('button');button.textContent=label;button.addEventListener('click',()=>{if(runs.length)inspector.show(runs[0],runs[0].frames[0],key)});formulas.append(button)}
  runButton.addEventListener('click',()=>{runButton.disabled=true;exportButton.disabled=true;status.textContent='Running…';setTimeout(()=>{try{
    const value=validateParameterValue(p,Number(slider.value)), selected=scenario.value as Scenario;
    runs=selected==='graft'?[simulate(selected,value,true),simulate(selected,value,false)]:[simulate(selected,value)];
    charts.forEach(c=>c.destroy());charts=[];
    const defs=[['glucose','sensor'],['insulin'],['oxygen'],['viability']] as const;
    defs.forEach((metrics,idx)=>{const datasets:any[]=[];for(const [rIndex,run] of runs.entries())for(const [metricIndex,metric] of metrics.entries()){
      if(idx>1&&selected!=='graft')continue;
      const data=run.frames.filter((_,i)=>i%50===0).map(f=>({x:f.time,y:Number.isFinite(f[metric])?f[metric]:null}));
      datasets.push({label:`${run.label} · ${metric}`,data,borderColor:rIndex?'#f78166':metricIndex?'#d2a8ff':'#58a6ff',borderDash:metric==='sensor'?[5,4]:[],pointRadius:0,pointHitRadius:10,tension:0,_run:rIndex,_metric:metric});}
      const chart=new Chart(plots[idx],{type:'line',data:{datasets},options:{responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:'nearest',intersect:false},plugins:{legend:{labels:{color:'#cbd5e1'}}},scales:{x:{type:'linear',ticks:{color:'#cbd5e1'},grid:{color:'#2a3444'},title:{display:true,text:'Time (min)',color:'#cbd5e1'}},y:{ticks:{color:'#cbd5e1'},grid:{color:'#2a3444'}}}}});charts.push(chart);
      plots[idx].onclick=(event)=>{if(!datasets.length)return;const time=chart.scales.x.getValueForPixel(event.offsetX);if(!Number.isFinite(time))return;const point=Math.max(0,Math.min(288,Math.round(time/5)));let nearest:any=null,distance=Infinity;for(const ds of datasets){const value=ds.data[point]?.y;if(value===null||value===undefined)continue;const delta=Math.abs(chart.scales.y.getPixelForValue(value)-event.offsetY);if(delta<distance){distance=delta;nearest=ds}}if(nearest)inspector.show(runs[nearest._run],runs[nearest._run].frames[point*50],nearest._metric)};
    });
    status.textContent=`Completed ${runs.length} ${runs.length===1?'trajectory':'trajectories'} at 0.1 min steps.`;exportButton.disabled=false;timeInput.disabled=false;timeInput.value='0';timeLabel.textContent='0';
  }catch(e){runs=[];charts.forEach(c=>c.destroy());charts=[];timeInput.disabled=true;status.textContent=`Simulation failed: ${e instanceof Error?e.message:String(e)}`;}finally{runButton.disabled=false}},20)});
  exportButton.addEventListener('click',()=>{if(runs.length)downloadBundle(runs)});
  document.getElementById('runTestsBtn')?.addEventListener('click',()=>{const results=runT1DSuite();const out=document.createElement('p');out.textContent=`T1D suite: ${results.map(r=>`${r.test} ${r.status}`).join('; ')}`;document.getElementById('inspectorBox')?.append(out)});
}
const controls=document.getElementById('ctrl-t1d'),view=document.getElementById('view-t1d');if(controls&&view)T1DWorkbenchView(controls,view);
