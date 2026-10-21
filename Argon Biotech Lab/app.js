/**
 * Virtual BioTech & BioChem Lab — Master Workbench Orchestrator
 * @module app
 * @version 12.0.0
 *
 * Integrates All 9 Laboratory Benches & 11 Scientific Modules:
 *  1. 3D Molecular Studio (molecular_viewer.js)
 *  2. Wet-Lab Kinetics & Bioreactor (kinetics_engine.js)
 *  3. Genetics, Mutagenesis & Circular Plasmid Map (genetics_engine.js, plasmid_map_engine.js)
 *  4. In Silico PCR & Agarose Gel Electrophoresis (pcr_gel_engine.js)
 *  5. 96-Well Microplate Reader & Lineweaver-Burk (plate_reader_engine.js)
 *  6. Golden Gate & Gibson DNA Assembly Studio (assembly_studio_engine.js)
 *  7. Clinical PK/PD & Human Organ Physiology (human_pkpd_engine.js)
 *  8. CAR-T Immunotherapy & Flow Cytometry Studio (cart_cytometry_engine.js)
 *  9. CRISPR Off-Target Genome Cleavage Map (crispr_cleavage_engine.js)
 *  + 21 CFR Part 11 Hash-Chained Electronic Lab Notebook (lab_notebook.js)
 */

import { KineticsEngine, runKineticsTests } from './kinetics_engine.js';
import { GeneticsEngine, runGeneticsTests } from './genetics_engine.js';
import { PcrGelEngine, runPcrGelTests } from './pcr_gel_engine.js';
import { MolecularViewer, runMolecularViewerTests } from './molecular_viewer.js';
import { LabNotebook, runLabNotebookTests } from './lab_notebook.js';
import { PlasmidMapEngine, runPlasmidMapTests } from './plasmid_map_engine.js';
import { PlateReaderEngine, runPlateReaderTests } from './plate_reader_engine.js';
import { AssemblyStudioEngine, runAssemblyTests } from './assembly_studio_engine.js';
import { HumanPkPdEngine, runHumanPkPdTests } from './human_pkpd_engine.js';
import { CartCytometryEngine, runCartCytometryTests } from './cart_cytometry_engine.js';
import { CrisprCleavageEngine, runCrisprCleavageTests } from './crispr_cleavage_engine.js';

const eln = new LabNotebook({ researcher: 'BioLab Operator' });
const elnTerm = document.getElementById('elnTerminal');
const inspectorBox = document.getElementById('inspectorBox');

eln.subscribe('log', () => {
  elnTerm.textContent = eln.formatTerminalOutput(60);
  elnTerm.scrollTop = elnTerm.scrollHeight;
});
elnTerm.textContent = eln.formatTerminalOutput();

// Tab Navigation Orchestration
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.bench;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.bench-ctrl').forEach(c => {
      c.style.display = c.id === `ctrl-${target}` ? 'block' : 'none';
    });
    document.querySelectorAll('.bench-view').forEach(v => {
      v.style.display = v.id === `view-${target}` ? 'flex' : 'none';
    });
    eln.setState({ activeBench: target }, false);

    if (target === 'molecular' && molStudio.viewer) {
      molStudio.viewer.resize();
      molStudio.viewer.render();
    }
    if (target === 'genetics') {
      PlasmidMapEngine.renderPlasmid(plasmidCanvas, PlasmidMapEngine.DEFAULT_PLASMID);
    }
    if (target === 'plate') {
      executeMicroplateAssay(false);
    }
    if (target === 'assembly') {
      executeAssembly(false);
    }
    if (target === 'pkpd') {
      executeClinicalSimulation(false);
    }
    if (target === 'cart') {
      executeCartSimulation(false);
    }
    if (target === 'crispr') {
      executeCrisprScan(false);
    }
  });
});

// ============================================================================
// BENCH 1: 3D MOLECULAR STUDIO
// ============================================================================
const molStudio = new MolecularViewer(document.getElementById('molViewport'), {
  onLog: (msg) => eln.logEvent('MOLECULAR', msg),
  onAtomPicked: (atom) => {
    inspectorBox.innerHTML =
      `Picked: <b>${atom.resn}${atom.resi}:${atom.atom}</b> (Chain ${atom.chain})\n` +
      `Coords: (${atom.x}, ${atom.y}, ${atom.z}) Å | Hetflag: ${atom.hetflag}`;
  },
  onDistanceMeasured: (m) => {
    document.getElementById('statDist').textContent = `${m.distanceAngstroms} Å`;
  }
});

async function loadSelectedPDB(pdbId) {
  try {
    const summary = await molStudio.fetchAndLoadPDB(pdbId);
    document.getElementById('statAtoms').textContent = summary.totalAtoms.toLocaleString();
    document.getElementById('statRes').textContent = summary.residueCount.toLocaleString();
    document.getElementById('statLig').textContent = summary.ligands.join(', ') || 'None';
  } catch (err) {
    eln.logEvent('MOLECULAR', `Fetch error: ${err.message}`);
  }
}

document.getElementById('pdbPreset').addEventListener('change', (e) => loadSelectedPDB(e.target.value));
document.getElementById('loadCustomPdbBtn').addEventListener('click', () => {
  const code = document.getElementById('customPdbInput').value;
  if (code) loadSelectedPDB(code);
});

const updateMolRender = () => {
  molStudio.applyStyle({
    backboneStyle: document.getElementById('molStyle').value,
    colorScheme: document.getElementById('molColor').value,
    ligandStyle: 'ballstick'
  });
};
document.getElementById('molStyle').addEventListener('change', updateMolRender);
document.getElementById('molColor').addEventListener('change', updateMolRender);

document.getElementById('highlightPocketBtn').addEventListener('click', () => {
  const pocket = molStudio.highlightBindingPocket(4.5);
  inspectorBox.textContent = pocket.pocketResidues.length
    ? `Contact Shell (<=4.5Å): ${pocket.pocketResidues.map(r => `${r.resn}${r.resi} (${r.minDistance}Å)`).join(', ')}`
    : 'No non-water heteroatom ligand found in structure.';
});
document.getElementById('toggleSurfBtn').addEventListener('click', () => molStudio.toggleSurface());
document.getElementById('toggleSpinBtn').addEventListener('click', () => molStudio.toggleSpin());

loadSelectedPDB('1EMA');

// ============================================================================
// BENCH 2: WET-LAB KINETICS & BIOREACTOR (RK4)
// ============================================================================
const wetCtx = document.getElementById('wetChart').getContext('2d');
const wetChart = new Chart(wetCtx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      { label: 'Product [P] (mM)', data: [], borderColor: '#58a6ff', tension: 0.2 },
      { label: 'Substrate [S] (mM)', data: [], borderColor: '#f85149', tension: 0.2 }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { color: '#1e2633' }, ticks: { color: '#8b949e' } },
      y: { grid: { color: '#1e2633' }, ticks: { color: '#8b949e' } }
    },
    plugins: { legend: { labels: { color: '#e2e8f0' } } }
  }
});

['S0', 'E0', 'Temp', 'Ph', 'Glu'].forEach(id => {
  const inp = document.getElementById(`inp${id}`);
  const lbl = document.getElementById(`lbl${id}`);
  inp.addEventListener('input', () => { lbl.textContent = parseFloat(inp.value).toFixed(1); });
});

document.getElementById('wetMode').addEventListener('change', (e) => {
  const isKin = e.target.value === 'kinetics';
  document.getElementById('kinInputs').style.display = isKin ? 'block' : 'none';
  document.getElementById('bioInputs').style.display = isKin ? 'none' : 'block';
});

let wetTimer = null;
document.getElementById('startWetBtn').addEventListener('click', () => {
  if (wetTimer) {
    clearInterval(wetTimer);
    wetTimer = null;
    document.getElementById('startWetBtn').textContent = 'Resume RK4 Simulation';
    return;
  }

  const mode = document.getElementById('wetMode').value;
  wetChart.data.labels = [];
  wetChart.data.datasets[0].data = [];
  wetChart.data.datasets[1].data = [];

  if (mode === 'kinetics') {
    let state = { S: parseFloat(document.getElementById('inpS0').value), P: 0, t: 0 };
    const E = parseFloat(document.getElementById('inpE0').value);
    const inhibitorType = document.getElementById('inpInhType').value;
    eln.clearTelemetry('kinetics');
    eln.logEvent('KINETICS', `Started RK4 Enzyme Assay ([S]0=${state.S}mM, [E]=${E}µM, Inh=${inhibitorType})`);

    wetChart.data.datasets[0].label = 'Product [P] (mM)';
    wetChart.data.datasets[1].label = 'Substrate [S] (mM)';

    wetTimer = setInterval(() => {
      state = KineticsEngine.stepEnzymeReaction(
        state,
        { E, kcat: 15.0, Km: 2.5, inhibitorType, I: inhibitorType === 'none' ? 0 : 2.0, Kic: 1.5, Kiu: 1.5 },
        0.4
      );
      eln.recordTelemetry('kinetics', state);
      wetChart.data.labels.push(`${state.t.toFixed(1)}s`);
      wetChart.data.datasets[0].data.push(state.P.toFixed(2));
      wetChart.data.datasets[1].data.push(state.S.toFixed(2));
      wetChart.update();

      document.getElementById('wLbl1').textContent = 'Velocity (v)';
      document.getElementById('wVal1').textContent = `${state.v.toFixed(3)} mM/s`;
      document.getElementById('wLbl2').textContent = 'Product [P]';
      document.getElementById('wVal2').textContent = `${state.P.toFixed(2)} mM`;
      document.getElementById('wLbl3').textContent = 'Absorbance (A420)';
      document.getElementById('wVal3').textContent = `${state.absorbance.toFixed(3)} AU`;
      document.getElementById('wLbl4').textContent = 'Apparent Km';
      document.getElementById('wVal4').textContent = `${state.Km_app.toFixed(2)} mM`;

      if (state.S <= 0.05 || wetChart.data.labels.length > 50) {
        clearInterval(wetTimer);
        wetTimer = null;
        eln.logEvent('KINETICS', `Assay equilibrium reached at t=${state.t}s ([P]=${state.P.toFixed(2)}mM).`);
      }
    }, 120);
  } else {
    let state = { X: 0.08, S: parseFloat(document.getElementById('inpGlu').value), t: 0 };
    const temp = parseFloat(document.getElementById('inpTemp').value);
    const pH = parseFloat(document.getElementById('inpPh').value);
    eln.clearTelemetry('bioreactor');
    eln.logEvent('BIOREACTOR', `Started Monod Fermentation (Temp=${temp}°C, pH=${pH}, Glu=${state.S}g/L)`);

    wetChart.data.datasets[0].label = 'Biomass X (g/L)';
    wetChart.data.datasets[1].label = 'Glucose S (g/L)';

    wetTimer = setInterval(() => {
      state = KineticsEngine.stepBioreactor(state, { muMax: 0.85, Ks: 0.5, Yxs: 0.5, kd: 0.01, temp, pH }, 0.25);
      eln.recordTelemetry('bioreactor', state);
      wetChart.data.labels.push(`${state.t.toFixed(1)}h`);
      wetChart.data.datasets[0].data.push(state.X.toFixed(2));
      wetChart.data.datasets[1].data.push(state.S.toFixed(2));
      wetChart.update();

      document.getElementById('wLbl1').textContent = 'Growth Rate (µ)';
      document.getElementById('wVal1').textContent = `${state.mu.toFixed(3)} h⁻¹`;
      document.getElementById('wLbl2').textContent = 'Biomass (X)';
      document.getElementById('wVal2').textContent = `${state.X.toFixed(2)} g/L`;
      document.getElementById('wLbl3').textContent = 'Residual Glucose';
      document.getElementById('wVal3').textContent = `${state.S.toFixed(2)} g/L`;
      document.getElementById('wLbl4').textContent = 'Doubling Time';
      document.getElementById('wVal4').textContent = state.doublingTime < 100 ? `${state.doublingTime.toFixed(2)} h` : 'Stationary';

      if (wetChart.data.labels.length > 48) {
        clearInterval(wetTimer);
        wetTimer = null;
        eln.logEvent('BIOREACTOR', `Batch culture completed. Final biomass=${state.X.toFixed(2)} g/L.`);
      }
    }, 120);
  }
});

document.getElementById('resetWetBtn').addEventListener('click', () => {
  if (wetTimer) clearInterval(wetTimer);
  wetTimer = null;
  wetChart.data.labels = [];
  wetChart.data.datasets[0].data = [];
  wetChart.data.datasets[1].data = [];
  wetChart.update();
  document.getElementById('startWetBtn').textContent = 'Run RK4 Simulation';
});

// ============================================================================
// BENCH 3: GENETICS & PLASMID MAP
// ============================================================================
let lastDigestFragments = [720];

function refreshWildTypeSequence() {
  const dna = document.getElementById('dnaInput').value;
  const trans = GeneticsEngine.translate(dna, 0);
  const pep = GeneticsEngine.analyzePeptide(trans.protein);
  document.getElementById('proteinOutput').textContent = trans.protein;
  document.getElementById('gClass').textContent = 'Wild-Type';
  document.getElementById('gMass').textContent = `${pep.molecularWeightDa.toLocaleString()} Da`;
  document.getElementById('gCharge').textContent = pep.netCharge74;
  document.getElementById('gGravy').textContent = pep.gravy;
}
refreshWildTypeSequence();

document.getElementById('applyMutBtn').addEventListener('click', () => {
  const dna = document.getElementById('dnaInput').value;
  const pos = parseInt(document.getElementById('mutPos').value, 10);
  const base = document.getElementById('mutBase').value;

  const res = GeneticsEngine.introduceMutation(dna, pos, base, 'substitution');
  const pep = GeneticsEngine.analyzePeptide(res.mutatedProtein);

  document.getElementById('proteinOutput').textContent = res.mutatedProtein;
  document.getElementById('gClass').textContent = res.classification;
  document.getElementById('gMass').textContent = `${pep.molecularWeightDa.toLocaleString()} Da (Δ${res.deltaMassDa})`;
  document.getElementById('gCharge').textContent = `${pep.netCharge74} (Δ${res.deltaCharge >= 0 ? '+' : ''}${res.deltaCharge})`;
  document.getElementById('gGravy').textContent = `${pep.gravy} (Δ${res.deltaHydropathy})`;

  eln.logEvent('GENETICS', `Mutagenesis ${res.mutationNotation}: ${res.classification}`, {
    deltaCharge: res.deltaCharge,
    deltaHydropathy: res.deltaHydropathy
  });
});

document.getElementById('runDigestBtn').addEventListener('click', () => {
  const dna = document.getElementById('dnaInput').value;
  const sel = Array.from(document.getElementById('digestEnzymes').selectedOptions).map(o => o.value);
  const isCircular = document.getElementById('dnaTopology').value === 'circular';

  const digest = GeneticsEngine.digestDNA(dna, sel, isCircular);
  lastDigestFragments = digest.fragments.map(f => f.length);

  document.getElementById('digestOutput').innerHTML =
    `<b>Topology:</b> ${isCircular ? 'Circular Plasmid' : 'Linear'} (${digest.totalLength} bp) | <b>Cuts:</b> ${digest.cutCount}<br>` +
    digest.fragments.map(f =>
      `• Band #${f.fragmentNumber}: <b>${f.length} bp</b> [${f.leftEnd} → ${f.rightEnd}]`
    ).join('<br>');

  eln.logEvent('GENETICS', `Restriction Digest (${sel.join(' + ')}): ${digest.fragments.length} fragments`, {
    fragmentsBp: lastDigestFragments
  });
  renderAgaroseGel(lastDigestFragments, []);
});

const plasmidCanvas = document.getElementById('plasmidCanvas');
PlasmidMapEngine.renderPlasmid(plasmidCanvas, PlasmidMapEngine.DEFAULT_PLASMID);
PlasmidMapEngine.bindInteractiveCanvas(plasmidCanvas, PlasmidMapEngine.DEFAULT_PLASMID, {
  onHover: (hit) => {
    if (!hit.onTrack) return;
    const featStr = hit.feature
      ? `Feature: <b>${hit.feature.name}</b> (${hit.feature.startBp}..${hit.feature.endBp} bp)`
      : 'Plasmid Backbone';
    const cutStr = hit.cutSite
      ? ` | Cut Site: <b>${hit.cutSite.enzyme}</b> at ${hit.cutSite.cutBp} bp (${hit.cutSite.overhang})`
      : '';
    inspectorBox.innerHTML = `Vector Coordinate: <b>${hit.bp} bp</b>\n${featStr}${cutStr}`;
  },
  onSelect: (hit) => {
    if (hit.cutSite) {
      eln.logEvent('GENETICS', `Selected plasmid restriction site: ${hit.cutSite.enzyme} (${hit.cutSite.cutBp} bp)`);
    } else if (hit.feature) {
      eln.logEvent('GENETICS', `Inspected plasmid feature: ${hit.feature.name} [${hit.feature.startBp}..${hit.feature.endBp} bp]`);
    }
  }
});

// ============================================================================
// BENCH 4: PCR & GEL ELECTROPHORESIS
// ============================================================================
const pcrCtx = document.getElementById('pcrChart').getContext('2d');
const pcrChart = new Chart(pcrCtx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{ label: 'dsDNA Yield (ng)', data: [], borderColor: '#3fb950', tension: 0.25 }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { color: '#1e2633' }, ticks: { color: '#8b949e' } },
      y: { grid: { color: '#1e2633' }, ticks: { color: '#8b949e' } }
    },
    plugins: { legend: { labels: { color: '#e2e8f0' } } }
  }
});

document.getElementById('gelPct').addEventListener('input', (e) => {
  document.getElementById('lblGelPct').textContent = `${parseFloat(e.target.value).toFixed(1)}%`;
});

function renderAgaroseGel(digestBpList = [], pcrBpList = []) {
  const canvas = document.getElementById('gelCanvas');
  const ctx = canvas.getContext('2d');
  const agarosePercent = parseFloat(document.getElementById('gelPct').value);

  ctx.fillStyle = '#070a0f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const lanes = [
    { title: '1kb Ladder', x: 30, bands: PcrGelEngine.LADDERS['1kb'], color: 'rgba(255, 165, 100,' },
    { title: 'Digest', x: 105, bands: digestBpList, color: 'rgba(255, 130, 90,' },
    { title: 'PCR Prod', x: 180, bands: pcrBpList, color: 'rgba(110, 240, 150,' }
  ];

  ctx.fillStyle = '#8b949e';
  ctx.font = '10px monospace';

  lanes.forEach(lane => {
    ctx.fillText(lane.title, lane.x - 4, 14);
    ctx.fillStyle = '#1e2633';
    ctx.fillRect(lane.x, 20, 44, 6);

    const migrated = PcrGelEngine.simulateGelMigration(lane.bands, {
      agarosePercent,
      gelLengthPx: canvas.height,
      wellOffsetPx: 26
    });

    migrated.forEach(b => {
      ctx.fillStyle = `${lane.color}${Math.max(0.45, b.relativeIntensity)})`;
      ctx.shadowColor = '#ff7b54';
      ctx.shadowBlur = 6;
      ctx.fillRect(lane.x + 2, b.yPixel, 40, 3.5);
      ctx.shadowBlur = 0;

      if (lane.title === '1kb Ladder' && [10000, 3000, 1000, 500, 250].includes(b.bp)) {
        ctx.fillStyle = '#8b949e';
        ctx.fillText(`${b.bp}`, 2, b.yPixel + 4);
      }
    });
  });
}

document.getElementById('runPcrBtn').addEventListener('click', () => {
  try {
    const template = document.getElementById('dnaInput').value;
    const fwd = document.getElementById('fwdPrimer').value;
    const rev = document.getElementById('revPrimer').value;
    const annealingTemp = parseFloat(document.getElementById('pcrTa').value);
    const cycles = parseInt(document.getElementById('pcrCycles').value, 10);

    const amp = PcrGelEngine.findAmplicon(template, fwd, rev);
    const sim = PcrGelEngine.simulatePCR({
      ampliconLength: amp.ampliconLength,
      cycles,
      annealingTemp,
      primerMinTm: Math.min(amp.forwardPrimer.Tm_NN, amp.reversePrimer.Tm_NN)
    });

    document.getElementById('pTm').textContent = `${amp.forwardPrimer.Tm_NN}°C / ${amp.reversePrimer.Tm_NN}°C`;
    document.getElementById('pSize').textContent = `${amp.ampliconLength} bp`;
    document.getElementById('pYield').textContent = `${sim.finalYield_ng} ng`;
    document.getElementById('pRecTa').textContent = `${amp.recommendedAnnealingTemp} °C`;

    pcrChart.data.labels = sim.cycleHistory.map(c => `C${c.cycle}`);
    pcrChart.data.datasets[0].data = sim.cycleHistory.map(c => c.mass_ng);
    pcrChart.update();

    renderAgaroseGel(lastDigestFragments, [amp.ampliconLength]);
    eln.logEvent('PCR', `Amplified ${amp.ampliconLength}bp amplicon over ${cycles} cycles: Yield=${sim.finalYield_ng}ng`);
  } catch (err) {
    eln.logEvent('PCR', `PCR Error: ${err.message}`);
  }
});

renderAgaroseGel(lastDigestFragments, [720]);

// ============================================================================
// BENCH 5: 96-WELL MICROPLATE READER
// ============================================================================
const plateCanvas = document.getElementById('plateCanvas');
const lbCtx = document.getElementById('lbChart').getContext('2d');
let currentPlateData = null;

const lbChart = new Chart(lbCtx, {
  type: 'scatter',
  data: {
    datasets: [
      {
        label: 'Control (Row A: Uninhibited)',
        data: [],
        borderColor: '#58a6ff',
        backgroundColor: '#58a6ff',
        showLine: true,
        tension: 0
      },
      {
        label: 'Selected Row Regimen',
        data: [],
        borderColor: '#f0883e',
        backgroundColor: '#f0883e',
        showLine: true,
        tension: 0
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: { display: true, text: '1 / [S] (mM⁻¹)', color: '#8b949e' },
        grid: { color: '#1e2633' },
        ticks: { color: '#8b949e' }
      },
      y: {
        title: { display: true, text: '1 / v₀ (s / mM)', color: '#8b949e' },
        grid: { color: '#1e2633' },
        ticks: { color: '#8b949e' }
      }
    },
    plugins: { legend: { labels: { color: '#e2e8f0' } } }
  }
});

document.getElementById('plateS').addEventListener('input', (e) => {
  document.getElementById('lblPlateS').textContent = parseFloat(e.target.value).toFixed(1);
});
document.getElementById('plateDil').addEventListener('input', (e) => {
  document.getElementById('lblPlateDil').textContent = `${parseFloat(e.target.value).toFixed(2)}x`;
});
document.getElementById('plateI').addEventListener('input', (e) => {
  document.getElementById('lblPlateI').textContent = parseFloat(e.target.value).toFixed(1);
});

function executeMicroplateAssay(logToEln = true) {
  const startS_mM = parseFloat(document.getElementById('plateS').value);
  const dilutionFactor = parseFloat(document.getElementById('plateDil').value);
  const I_mM = parseFloat(document.getElementById('plateI').value);
  const selectedRowIdx = parseInt(document.getElementById('plateRowSelect').value, 10);

  currentPlateData = PlateReaderEngine.simulateMicroplateAssay({
    startS_mM,
    dilutionFactor,
    I_mM,
    dye: 'pnp'
  });

  PlateReaderEngine.renderMicroplate(plateCanvas, currentPlateData);

  const rowControl = currentPlateData.matrix[0];
  const rowSelected = currentPlateData.matrix[selectedRowIdx];

  const fitControl = PlateReaderEngine.fitLineweaverBurk(
    rowControl.map(w => w.S_mM),
    rowControl.map(w => w.v0_mM_s)
  );
  const fitSelected = PlateReaderEngine.fitLineweaverBurk(
    rowSelected.map(w => w.S_mM),
    rowSelected.map(w => w.v0_mM_s)
  );

  lbChart.data.datasets[0].data = fitControl.points.map(p => ({ x: p.invS, y: p.invV }));
  lbChart.data.datasets[1].label = rowSelected[0].regimenLabel;
  lbChart.data.datasets[1].data = fitSelected.points.map(p => ({ x: p.invS, y: p.invV }));
  lbChart.update();

  document.getElementById('lbVmax').textContent = `${fitSelected.Vmax_fit} mM/s`;
  document.getElementById('lbKm').textContent = `${fitSelected.Km_fit} mM`;
  document.getElementById('lbSlope').textContent = `${fitSelected.slope} s`;
  document.getElementById('lbR2').textContent = fitSelected.rSquared.toFixed(4);

  if (logToEln) {
    eln.logEvent('PLATE_READER', `Read 96-well plate (${rowSelected[0].regimenLabel}): Vmax_app=${fitSelected.Vmax_fit}mM/s, Km_app=${fitSelected.Km_fit}mM`);
  }
}

document.getElementById('runPlateBtn').addEventListener('click', () => executeMicroplateAssay(true));
document.getElementById('plateRowSelect').addEventListener('change', () => executeMicroplateAssay(true));

PlateReaderEngine.bindInteractivePlate(plateCanvas, () => currentPlateData, {
  onHover: (well) => {
    inspectorBox.innerHTML =
      `Well <b>${well.wellId}</b> (${well.regimenLabel})\n` +
      `[S]: <b>${well.S_mM} mM</b> | v₀: <b>${well.v0_mM_s} mM/s</b> | OD: <b>${well.od} AU</b>`;
  },
  onSelect: (well) => {
    eln.logEvent('PLATE_READER', `Inspected microwell ${well.wellId}: [S]=${well.S_mM}mM, v0=${well.v0_mM_s}mM/s, OD=${well.od}`);
  }
});

executeMicroplateAssay(false);

// ============================================================================
// BENCH 6: GOLDEN GATE & GIBSON ASSEMBLY STUDIO
// ============================================================================
const asmCanvas = document.getElementById('assemblyCanvas');

function loadAssemblyPresets(method) {
  const presetList = AssemblyStudioEngine.PRESETS[method] || AssemblyStudioEngine.PRESETS.goldengate;
  document.getElementById('asmPart1').value = presetList[0].sequence;
  document.getElementById('asmPart2').value = presetList[1].sequence;
  document.getElementById('asmPart3').value = presetList[2].sequence;
}

loadAssemblyPresets('goldengate');

function executeAssembly(logToEln = true) {
  const method = document.getElementById('assemblyMethod').value;
  const p1Seq = document.getElementById('asmPart1').value;
  const p2Seq = document.getElementById('asmPart2').value;
  const p3Seq = document.getElementById('asmPart3').value;

  const parts = [
    { id: 'part1', name: 'Part 1 (Promoter)', sequence: p1Seq },
    { id: 'part2', name: 'Part 2 (GFP CDS)', sequence: p2Seq },
    { id: 'part3', name: 'Part 3 (Terminator)', sequence: p3Seq }
  ];

  const result = method === 'goldengate'
    ? AssemblyStudioEngine.simulateGoldenGate(parts, 'BsaI')
    : AssemblyStudioEngine.simulateGibson(parts, 18, true);

  AssemblyStudioEngine.renderAssemblyMap(asmCanvas, result, parts);

  document.getElementById('asmStatus').textContent = result.success ? 'ASSEMBLED' : 'BLOCKED';
  document.getElementById('asmStatus').style.color = result.success ? '#3fb950' : '#f85149';
  document.getElementById('asmLen').textContent = result.success ? `${result.assembledLengthBp} bp` : 'N/A';
  document.getElementById('asmParts').textContent = `${parts.length} Parts`;
  document.getElementById('asmFid').textContent = result.success ? '100% Homology' : 'Mismatch';

  if (result.success) {
    const juncList = (result.junctions || result.overlaps || []).map(j =>
      `• ${j.fromPart} → ${j.toPart}: <b>${j.overhang ? `5'-${j.overhang} sticky ligation` : `${j.overlapLengthBp} bp homologous overlap`}</b>`
    ).join('\n');
    document.getElementById('assemblyOutput').innerHTML =
      `<b>Verified Junctions:</b>\n${juncList}\n\n<b>Seamless Assembled Sequence (5' → 3'):</b>\n${result.assembledSequence}`;
    if (logToEln) {
      eln.logEvent('ASSEMBLY', `Constructed ${result.assembledLengthBp} bp circular vector via ${method.toUpperCase()}`);
    }
  } else {
    document.getElementById('assemblyOutput').innerHTML =
      `<span style="color:#ff7b72"><b>Assembly Blocked — Homology Errors:</b>\n${result.errors.join('\n')}</span>`;
  }
}

document.getElementById('assemblyMethod').addEventListener('change', (e) => {
  loadAssemblyPresets(e.target.value);
  executeAssembly(true);
});
document.getElementById('runAssemblyBtn').addEventListener('click', () => executeAssembly(true));

// ============================================================================
// BENCH 7: HUMAN CLINICAL PK/PD & ORGAN PHYSIOLOGY
// ============================================================================
const pkpdCanvas = document.getElementById('pkpdCanvas');
const pkpdCtx = document.getElementById('pkpdChart').getContext('2d');
let currentClinicalState = null;

const pkpdChart = new Chart(pkpdCtx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Plasma Cp (mg/L)',
        data: [],
        borderColor: '#58a6ff',
        backgroundColor: 'rgba(88, 166, 255, 0.12)',
        fill: true,
        tension: 0.25,
        pointRadius: 0
      },
      {
        label: 'Peripheral Tissue Ct (mg/L)',
        data: [],
        borderColor: '#3fb950',
        borderDash: [4, 4],
        tension: 0.25,
        pointRadius: 0
      },
      {
        label: 'Toxic Threshold (MTC)',
        data: [],
        borderColor: '#f85149',
        borderWidth: 1.5,
        borderDash: [2, 2],
        pointRadius: 0
      },
      {
        label: 'Min Effective (MEC)',
        data: [],
        borderColor: '#d29922',
        borderWidth: 1.2,
        borderDash: [6, 3],
        pointRadius: 0
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: { display: true, text: 'Clinical Time (Hours)', color: '#8b949e' },
        grid: { color: '#1e2633' },
        ticks: { color: '#8b949e', maxTicksLimit: 12 }
      },
      y: {
        title: { display: true, text: 'Concentration (mg/L)', color: '#8b949e' },
        grid: { color: '#1e2633' },
        ticks: { color: '#8b949e' }
      }
    },
    plugins: { legend: { labels: { color: '#e2e8f0' } } }
  }
});

document.getElementById('pkDose').addEventListener('input', (e) => {
  document.getElementById('lblPkDose').textContent = `${e.target.value} mg`;
});

document.getElementById('pkDrugPreset').addEventListener('change', (e) => {
  const preset = HumanPkPdEngine.DRUG_PRESETS[e.target.value];
  if (preset) {
    document.getElementById('pkRoute').value = preset.route;
    document.getElementById('pkDose').value = preset.defaultDose_mg;
    document.getElementById('lblPkDose').textContent = `${preset.defaultDose_mg} mg`;
    document.getElementById('pkInterval').value = String(preset.interval_h);
    executeClinicalSimulation(true);
  }
});

function executeClinicalSimulation(logToEln = true) {
  const presetKey = document.getElementById('pkDrugPreset').value;
  const basePreset = HumanPkPdEngine.DRUG_PRESETS[presetKey] || HumanPkPdEngine.DRUG_PRESETS.antiviral_mpro;
  const route = document.getElementById('pkRoute').value;
  const dose_mg = parseFloat(document.getElementById('pkDose').value);
  const interval_h = parseFloat(document.getElementById('pkInterval').value);
  const duration_h = parseFloat(document.getElementById('pkDuration').value);

  const params = { ...basePreset, route };
  const sim = HumanPkPdEngine.simulateClinicalRegimen(params, {
    dose_mg,
    interval_h,
    duration_h,
    dt: 0.25
  });

  currentClinicalState = sim.finalState;
  HumanPkPdEngine.renderAnatomicalMannequin(pkpdCanvas, currentClinicalState);

  pkpdChart.data.labels = sim.timeSeries.map(pt => `${pt.t.toFixed(1)}h`);
  pkpdChart.data.datasets[0].data = sim.timeSeries.map(pt => pt.Cp_mgL);
  pkpdChart.data.datasets[1].data = sim.timeSeries.map(pt => pt.Ct_mgL);
  pkpdChart.data.datasets[2].data = sim.timeSeries.map(() => params.MTC_mgL);
  pkpdChart.data.datasets[3].data = sim.timeSeries.map(() => params.MEC_mgL);
  pkpdChart.update();

  document.getElementById('pkStatCmax').textContent = `${sim.Cmax_mgL} mg/L (${sim.AUC_mgLh} mg·h/L)`;
  document.getElementById('pkStatEff').textContent = `${currentClinicalState.targetEffectPct}%`;
  document.getElementById('pkStatAlt').textContent = `${currentClinicalState.alt_UL} U/L (${currentClinicalState.organs.liver.status})`;
  document.getElementById('pkStatAlt').style.color =
    currentClinicalState.organs.liver.status === 'TOXIC' ? '#f85149' : '#f8fafc';
  document.getElementById('pkStatOrgan').textContent =
    `${currentClinicalState.qtc_ms} ms / ${currentClinicalState.egfr_mLmin} mL/m`;

  eln.clearTelemetry('pkpd');
  sim.timeSeries.forEach(pt => eln.recordTelemetry('pkpd', {
    t_h: pt.t,
    Cp_mgL: pt.Cp_mgL,
    Ct_mgL: pt.Ct_mgL,
    targetEffectPct: pt.targetEffectPct,
    alt_UL: pt.alt_UL,
    qtc_ms: pt.qtc_ms
  }));

  if (logToEln) {
    eln.logEvent('PKPD', `Simulated ${params.name} (${dose_mg}mg ${route} q${interval_h}h): Cmax=${sim.Cmax_mgL}mg/L, ALT=${currentClinicalState.alt_UL}U/L`);
  }
}

document.getElementById('runPkpdBtn').addEventListener('click', () => executeClinicalSimulation(true));
document.getElementById('pkRoute').addEventListener('change', () => executeClinicalSimulation(true));
document.getElementById('pkInterval').addEventListener('change', () => executeClinicalSimulation(true));
document.getElementById('pkDuration').addEventListener('change', () => executeClinicalSimulation(true));

HumanPkPdEngine.bindInteractiveMannequin(pkpdCanvas, () => currentClinicalState, {
  onHoverOrgan: (organ) => {
    inspectorBox.innerHTML =
      `Organ: <b>${organ.name}</b> [Status: <b>${organ.status}</b>]\n` +
      `Local Tissue Conc: <b>${organ.concentration_mgL} mg/L</b> | Blood Perfusion: <b>${organ.perfusion_Lmin} L/min</b>\n` +
      `Clinical Biomarker — ${organ.metricLabel}: <b>${organ.metricValue}</b>`;
  },
  onSelectOrgan: (organ) => {
    eln.logEvent('PKPD', `Inspected ${organ.name}: Status=${organ.status}, Conc=${organ.concentration_mgL}mg/L, ${organ.metricLabel}=${organ.metricValue}`);
  }
});

executeClinicalSimulation(false);

// ============================================================================
// BENCH 8: CAR-T IMMUNOTHERAPY & FLOW CYTOMETRY STUDIO
// ============================================================================
const cartArenaCanvas = document.getElementById('cartArenaCanvas');
const cartFlowCanvas = document.getElementById('cartFlowCanvas');
let currentCartSeries = [];
let currentCartState = null;

document.getElementById('carET').addEventListener('input', (e) => {
  document.getElementById('lblCarET').textContent = `${parseFloat(e.target.value).toFixed(2)} : 1`;
});
document.getElementById('carPdl1').addEventListener('input', (e) => {
  document.getElementById('lblCarPdl1').textContent = parseFloat(e.target.value).toFixed(2);
});

document.getElementById('carPreset').addEventListener('change', (e) => {
  const preset = CartCytometryEngine.CAR_PRESETS[e.target.value];
  if (preset) {
    document.getElementById('carCostim').value = preset.costimDomain;
    document.getElementById('carET').value = preset.defaultETRatio;
    document.getElementById('lblCarET').textContent = `${preset.defaultETRatio.toFixed(2)} : 1`;
    document.getElementById('carPdl1').value = preset.pdl1Expression;
    document.getElementById('lblCarPdl1').textContent = preset.pdl1Expression.toFixed(2);
    executeCartSimulation(true);
  }
});

function renderCartSnapshotAtHour(targetHour) {
  if (!currentCartSeries.length) return;
  const snapshot = currentCartSeries.reduce((prev, curr) =>
    Math.abs(curr.t - targetHour) < Math.abs(prev.t - targetHour) ? curr : prev
  );
  currentCartState = snapshot;

  CartCytometryEngine.renderTumorArena(cartArenaCanvas, snapshot);
  const flowData = CartCytometryEngine.generateFlowCytometryPopulation(snapshot, 240);
  CartCytometryEngine.renderFlowCytometryPlot(cartFlowCanvas, flowData);

  document.getElementById('carStatLysis').textContent = `${snapshot.tumorClearancePct}% (t=${snapshot.t}h)`;
  document.getElementById('carStatExh').textContent = `${snapshot.exhaustionPct}%`;
  document.getElementById('carStatCyt').textContent = `${snapshot.il6_pgmL} / ${snapshot.ifng_pgmL} pg/mL`;
  document.getElementById('carStatCrs').textContent = `Grade ${snapshot.crsGrade}`;
  document.getElementById('carStatCrs').style.color =
    snapshot.crsGrade >= 2 ? '#f85149' : (snapshot.crsGrade === 1 ? '#d29922' : '#3fb950');
}

function executeCartSimulation(logToEln = true) {
  const presetKey = document.getElementById('carPreset').value;
  const basePreset = CartCytometryEngine.CAR_PRESETS[presetKey] || CartCytometryEngine.CAR_PRESETS.anti_cd19_41bb;
  const costimDomain = document.getElementById('carCostim').value;
  const etRatio = parseFloat(document.getElementById('carET').value);
  const pdl1Expression = parseFloat(document.getElementById('carPdl1').value);
  const antiPd1Enabled = document.getElementById('carAntiPd1').value === 'on';
  const inspectHour = parseFloat(document.getElementById('carTimeSlider').value);

  const params = {
    ...basePreset,
    costimDomain,
    pdl1Expression,
    antiPd1Enabled
  };

  const sim = CartCytometryEngine.simulateCytolysisRegimen(params, {
    initialTargets: 1000,
    etRatio,
    duration_h: 48,
    dt: 0.5
  });

  currentCartSeries = sim.timeSeries;
  renderCartSnapshotAtHour(inspectHour);

  eln.clearTelemetry('cart');
  sim.timeSeries.forEach(pt => eln.recordTelemetry('cart', {
    t_h: pt.t,
    T_viable: Number(pt.T_viable.toFixed(1)),
    E_active: Number(pt.E_active.toFixed(1)),
    E_exhausted: Number(pt.E_exhausted.toFixed(1)),
    tumorClearancePct: pt.tumorClearancePct,
    il6_pgmL: pt.il6_pgmL,
    crsGrade: pt.crsGrade
  }));

  if (logToEln) {
    eln.logEvent(
      'CART_CYTOMETRY',
      `Simulated ${basePreset.name} (${costimDomain}, E:T=${etRatio}:1, Anti-PD1=${antiPd1Enabled}): 48h Lysis=${sim.finalState.tumorClearancePct}%, Peak IL-6=${sim.peakIl6_pgmL}pg/mL (Max CRS Grade ${sim.maxCrsGrade})`
    );
  }
}

document.getElementById('carTimeSlider').addEventListener('input', (e) => {
  const hr = parseFloat(e.target.value);
  document.getElementById('lblCarTime').textContent = `${hr} h`;
  renderCartSnapshotAtHour(hr);
});

document.getElementById('runCartBtn').addEventListener('click', () => executeCartSimulation(true));
document.getElementById('carCostim').addEventListener('change', () => executeCartSimulation(true));
document.getElementById('carAntiPd1').addEventListener('change', () => executeCartSimulation(true));

CartCytometryEngine.bindInteractiveArena(cartArenaCanvas, () => currentCartState, {
  onHoverCell: (cell, state) => {
    inspectorBox.innerHTML =
      `Cell Entity: <b>${cell.label}</b> [ID: ${cell.id}]\n` +
      `Microwell Coords: (${cell.x}, ${cell.y}) px | Snapshot Time: <b>${state.t} h</b>\n` +
      `Supernatant IL-6: <b>${state.il6_pgmL} pg/mL</b> | IFN-γ: <b>${state.ifng_pgmL} pg/mL</b> (${state.crsStatus})`;
  },
  onSelectCell: (cell, state) => {
    eln.logEvent('CART_CYTOMETRY', `Inspected ${cell.label} at t=${state.t}h (Clearance=${state.tumorClearancePct}%, Exhaustion=${state.exhaustionPct}%)`);
  }
});

executeCartSimulation(false);

// ============================================================================
// BENCH 9: CRISPR OFF-TARGET GENOME CLEAVAGE STUDIO
// ============================================================================
const crisprCircosCanvas = document.getElementById('crisprCircosCanvas');
const crisprAlignCanvas = document.getElementById('crisprAlignCanvas');
let currentCrisprScan = null;
let currentCrisprRepair = null;

document.getElementById('crisprPreset').addEventListener('change', (e) => {
  const preset = CrisprCleavageEngine.GENE_PRESETS[e.target.value];
  if (preset) {
    document.getElementById('crisprGuideInput').value = preset.sgRNA;
    document.getElementById('crisprDonor').value = preset.donorTemplateAvailable ? 'yes' : 'no';
    executeCrisprScan(true);
  }
});

function executeCrisprScan(logToEln = true) {
  try {
    const presetKey = document.getElementById('crisprPreset').value;
    const preset = CrisprCleavageEngine.GENE_PRESETS[presetKey] || CrisprCleavageEngine.GENE_PRESETS.hbb_sickle;
    let rawGuide = CrisprCleavageEngine.sanitize(document.getElementById('crisprGuideInput').value);
    if (rawGuide.length < 20) {
      rawGuide = (rawGuide + preset.sgRNA).slice(0, 20);
      document.getElementById('crisprGuideInput').value = rawGuide;
    }

    const chromSel = document.getElementById('crisprChromatin').value;
    const globalChromatinOverride = chromSel === 'native' ? null : chromSel;
    const donorTemplatePresent = document.getElementById('crisprDonor').value === 'yes';
    const nhejInhibitorAdded = document.getElementById('crisprNhejInh').value === 'on';

    currentCrisprScan = CrisprCleavageEngine.scanGenomicLoci(rawGuide, preset.candidateLoci, {
      nuclease: preset.nuclease,
      globalChromatinOverride
    });

    currentCrisprRepair = CrisprCleavageEngine.predictRepairPathway(
      currentCrisprScan.onTargetScorePct,
      { donorTemplatePresent, nhejInhibitorAdded }
    );

    const primaryLocus = currentCrisprScan.loci[0];
    CrisprCleavageEngine.renderCircosMap(crisprCircosCanvas, currentCrisprScan, {
      selectedLocusId: primaryLocus.id
    });
    CrisprCleavageEngine.renderMismatchTrack(crisprAlignCanvas, primaryLocus, currentCrisprRepair);

    document.getElementById('crStatOnTarget').textContent = `${currentCrisprScan.onTargetScorePct}%`;
    document.getElementById('crStatSpec').textContent = `${currentCrisprScan.specificityScore} (${currentCrisprScan.safetyClassification})`;
    document.getElementById('crStatSpec').style.color =
      currentCrisprScan.specificityScore >= 85 ? '#3fb950' : '#d29922';
    document.getElementById('crStatHdr').textContent = `${currentCrisprRepair.hdrPct}%`;
    document.getElementById('crStatNhej').textContent = `${currentCrisprRepair.nhejPct}%`;

    document.getElementById('crisprLociTable').innerHTML = currentCrisprScan.loci.map(l =>
      `• <b>${l.chr}:${l.coordMb}Mb</b> — ${l.gene} | Mismatches: <b>${l.mismatchCount}</b> (Seed: ${l.seedMismatchCount}) | PAM: <b>${l.pam}</b> | Cut: <b>${l.cleavageScorePct}%</b>`
    ).join('\n');

    if (logToEln) {
      eln.logEvent(
        'CRISPR',
        `Scanned 24-Chr genome for ${preset.name} (sgRNA=${rawGuide}): On-Target=${currentCrisprScan.onTargetScorePct}%, MIT Specificity=${currentCrisprScan.specificityScore}, HDR=${currentCrisprRepair.hdrPct}%`
      );
    }
  } catch (err) {
    eln.logEvent('CRISPR', `CRISPR Scan Error: ${err.message}`);
  }
}

document.getElementById('runCrisprBtn').addEventListener('click', () => executeCrisprScan(true));
document.getElementById('crisprChromatin').addEventListener('change', () => executeCrisprScan(true));
document.getElementById('crisprDonor').addEventListener('change', () => executeCrisprScan(true));
document.getElementById('crisprNhejInh').addEventListener('change', () => executeCrisprScan(true));

CrisprCleavageEngine.bindInteractiveCircos(crisprCircosCanvas, () => currentCrisprScan, {
  onHoverLocus: (locus) => {
    inspectorBox.innerHTML =
      `Genomic Locus: <b>${locus.gene}</b> [${locus.chr}:${locus.coordMb} Mb]\n` +
      `Protospacer: <b>5'-${locus.targetSequence}-3'</b> (PAM: <b>${locus.pam}</b> | ${locus.chromatinState})\n` +
      `Mismatches: <b>${locus.mismatchCount}</b> (Positions: ${locus.mismatchPositions.join(', ') || 'None'}) | Cleavage: <b>${locus.cleavageScorePct}%</b>`;
  },
  onSelectLocus: (locus) => {
    CrisprCleavageEngine.renderCircosMap(crisprCircosCanvas, currentCrisprScan, {
      selectedLocusId: locus.id
    });
    CrisprCleavageEngine.renderMismatchTrack(crisprAlignCanvas, locus, currentCrisprRepair);
    eln.logEvent('CRISPR', `Aligned duplex at ${locus.chr}:${locus.coordMb}Mb (${locus.gene}): Cut=${locus.cleavageScorePct}%, Mismatches=${locus.mismatchCount}`);
  }
});

executeCrisprScan(false);

// ============================================================================
// MASTER VERIFICATION SUITE (ALL 11 SCIENTIFIC ENGINES) & EXPORTERS
// ============================================================================
document.getElementById('runTestsBtn').addEventListener('click', () => {
  const allResults = [
    ...runKineticsTests(),
    ...runGeneticsTests(),
    ...runPcrGelTests(),
    ...runMolecularViewerTests(),
    ...runLabNotebookTests(),
    ...runPlasmidMapTests(),
    ...runPlateReaderTests(),
    ...runAssemblyTests(),
    ...runHumanPkPdTests(),
    ...runCartCytometryTests(),
    ...runCrisprCleavageTests()
  ];
  const passed = allResults.filter(r => r.status === 'PASS').length;
  const failedList = allResults.filter(r => r.status !== 'PASS').map(r => r.test);
  const integrity = eln.verifyIntegrity();

  eln.logEvent('DIAGNOSTICS', `Executed Full 11-Module Test Suite: ${passed}/${allResults.length} PASSED`, {
    hashChainValid: integrity.valid,
    failedTests: failedList
  });
  inspectorBox.innerHTML =
    `<b>Verification Suite Complete:</b> ${passed}/${allResults.length} Assertions Passed.` +
    (failedList.length ? `\n<span style="color:#ff7b72">Failed: ${failedList.join(', ')}</span>` : '') +
    `\n<b>ELN Hash Chain:</b> ${integrity.valid ? 'VALID' : 'CORRUPTED'} (${integrity.checkedCount} blocks)`;
});

function downloadBlob(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

document.getElementById('exportCsvBtn').addEventListener('click', () => {
  const csv =
    eln.exportTelemetryCSV('cart') ||
    eln.exportTelemetryCSV('pkpd') ||
    eln.exportTelemetryCSV('kinetics') ||
    eln.exportTelemetryCSV('bioreactor');
  if (!csv) {
    eln.logEvent('SYSTEM', 'No telemetry recorded yet.');
    return;
  }
  downloadBlob(`${eln.sessionId}_telemetry.csv`, csv, 'text/csv');
});

document.getElementById('exportJsonBtn').addEventListener('click', () => {
  downloadBlob(`${eln.sessionId}_snapshot.json`, eln.exportSessionJSON(), 'application/json');
});
// === END OF APP.JS (v12.0) ===