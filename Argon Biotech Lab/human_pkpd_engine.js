/**
 * Virtual BioTech & BioChem Lab — Module 10: Human Clinical PK/PD & Organ Physiology Engine
 * @module human_pkpd_engine
 * @version 10.0.0
 *
 * Pure mathematical solvers for 2-compartment systemic pharmacokinetics (oral, IV bolus,
 * IV infusion), saturable CYP450 hepatic + linear renal elimination, biophase Emax Hill
 * pharmacodynamics, multi-organ clinical toxicology biomarkers, and an interactive 2D
 * HTML5 Canvas Anatomical Mannequin renderer. Zero external dependencies.
 */

export class HumanPkPdEngine {
  /**
   * Curated Clinical Pharmacology Reference Presets
   */
  static DRUG_PRESETS = {
    antiviral_mpro: {
      id: 'antiviral_mpro',
      name: 'Nirmatrelvir-Like Antiviral (Mpro Inhibitor)',
      route: 'oral',
      defaultDose_mg: 300,
      interval_h: 12,
      F: 0.75,              // 75% oral bioavailability
      ka: 1.4,              // Absorption rate constant (h^-1)
      Vc_L: 18.0,           // Central volume of distribution (L)
      Vp_L: 28.0,           // Peripheral tissue volume (L)
      Q_Lh: 10.0,           // Inter-compartmental clearance (L/h)
      CL_renal_Lh: 2.2,     // Linear renal clearance (L/h)
      CL_hepatic_Lh: 3.8,   // Linear hepatic clearance (L/h)
      Vmax_cyp_mgh: 0,      // Optional saturable CYP clearance (mg/h)
      Km_cyp_mgL: 10.0,
      ke0: 0.85,            // Biophase equilibration rate (h^-1)
      E0: 0.0,
      Emax: 100.0,          // Max viral protease inhibition (%)
      EC50_mgL: 0.8,        // Concentration for 50% inhibition (mg/L)
      hill: 1.6,
      MEC_mgL: 0.5,         // Minimum Effective Concentration (mg/L)
      MTC_mgL: 12.0,        // Minimum Toxic Concentration (mg/L)
      hepatotoxIndex: 0.08,
      nephrotoxIndex: 0.05,
      hergKi_mgL: 45.0      // High safety margin against QTc prolongation
    },
    acetaminophen: {
      id: 'acetaminophen',
      name: 'Acetaminophen / Paracetamol (Analgesic / Hepatotoxin at Overdose)',
      route: 'oral',
      defaultDose_mg: 1000,
      interval_h: 6,
      F: 0.88,
      ka: 1.8,
      Vc_L: 24.0,
      Vp_L: 42.0,
      Q_Lh: 15.0,
      CL_renal_Lh: 1.2,
      CL_hepatic_Lh: 4.5,   // Sulfation/glucuronidation linear pathway
      Vmax_cyp_mgh: 180.0,  // Saturable metabolic capacity (mg/h)
      Km_cyp_mgL: 18.0,
      ke0: 1.2,
      E0: 0.0,
      Emax: 100.0,
      EC50_mgL: 8.5,
      hill: 1.2,
      MEC_mgL: 5.0,
      MTC_mgL: 75.0,        // Rumack-Matthew hepatotoxicity threshold
      hepatotoxIndex: 0.65, // NAPQI glutathione depletion driver
      nephrotoxIndex: 0.12,
      hergKi_mgL: 250.0
    },
    antiarrhythmic: {
      id: 'antiarrhythmic',
      name: 'Class III Antiarrhythmic (Narrow Therapeutic Index / hERG Blocker)',
      route: 'iv_bolus',
      defaultDose_mg: 50,
      interval_h: 12,
      F: 1.0,
      ka: 2.0,
      Vc_L: 15.0,
      Vp_L: 35.0,
      Q_Lh: 12.0,
      CL_renal_Lh: 3.5,
      CL_hepatic_Lh: 1.0,
      Vmax_cyp_mgh: 0,
      Km_cyp_mgL: 5.0,
      ke0: 1.5,
      E0: 0.0,
      Emax: 100.0,
      EC50_mgL: 0.4,
      hill: 2.0,
      MEC_mgL: 0.25,
      MTC_mgL: 1.8,         // Narrow window before Torsades / QTc toxicity
      hepatotoxIndex: 0.04,
      nephrotoxIndex: 0.18,
      hergKi_mgL: 1.5       // Potent hERG K+ channel blocker
    }
  };

  /**
   * Normalized 2D Anatomical Organ Coordinates (relative to canvas width [0..1] and height [0..1])
   * Includes physiological blood perfusion rate (L/min) for clinical inspection.
   */
  static ORGAN_NODES = [
    {
      id: 'brain',
      label: 'Brain & CNS',
      relX: 0.50,
      relY: 0.15,
      radiusPx: 20,
      perfusion_Lmin: 0.75
    },
    {
      id: 'lungs',
      label: 'Lungs (Pulmonary)',
      relX: 0.37,
      relY: 0.39,
      radiusPx: 22,
      perfusion_Lmin: 5.00
    },
    {
      id: 'heart',
      label: 'Heart (Myocardium)',
      relX: 0.56,
      relY: 0.41,
      radiusPx: 19,
      perfusion_Lmin: 0.25
    },
    {
      id: 'liver',
      label: 'Liver (Hepatic CYP)',
      relX: 0.41,
      relY: 0.58,
      radiusPx: 23,
      perfusion_Lmin: 1.35
    },
    {
      id: 'kidneys',
      label: 'Kidneys (Renal)',
      relX: 0.59,
      relY: 0.68,
      radiusPx: 19,
      perfusion_Lmin: 1.10
    }
  ];

  // =========================================================================
  // 1. MATHEMATICAL PK/PD & TOXICOLOGY SOLVERS
  // =========================================================================

  /**
   * Creates an initialized patient compartment state vector.
   */
  static createInitialState() {
    return {
      t: 0.0,              // Elapsed clinical time (hours)
      A_gut: 0.0,          // Unabsorbed drug in GI tract (mg)
      A_central: 0.0,      // Drug mass in central blood/plasma compartment (mg)
      A_peripheral: 0.0,   // Drug mass in peripheral tissue compartment (mg)
      Ce: 0.0,             // Effect-site biophase concentration (mg/L)
      A_renal: 0.0,        // Cumulative drug mass excreted renally (mg)
      A_hepatic: 0.0,      // Cumulative drug mass metabolized hepatically (mg)
      totalDoseAdministered: 0.0 // Total bioavailable mass entered into system (mg)
    };
  }

  /**
   * Computes target receptor occupancy / pharmacodynamic effect via the
   * sigmoidal Hill equation: E(Ce) = E0 + (Emax * Ce^h) / (EC50^h + Ce^h)
   */
  static computeHillEffect(Ce, { E0 = 0, Emax = 100, EC50_mgL = 1.0, hill = 1.0 } = {}) {
    if (Ce <= 0) return E0;
    if (EC50_mgL <= 0) throw new RangeError('EC50_mgL must be positive.');
    const cePow = Math.pow(Ce, hill);
    const ec50Pow = Math.pow(EC50_mgL, hill);
    return E0 + (Emax * cePow) / (ec50Pow + cePow);
  }

  /**
   * Evaluates organ-specific physiological biomarkers and safety statuses from
   * current systemic plasma concentration, tissue load, and cumulative metabolism.
   */
  static computeOrganBiomarkers(state, params) {
    const Vc = params.Vc_L || 20.0;
    const Vp = params.Vp_L || 30.0;
    const Cp = Math.max(0, state.A_central / Vc);
    const Ct = Math.max(0, state.A_peripheral / Vp);

    // 1. Liver (Hepatic) — Baseline ALT = 24 U/L; DILI clinical alert > 72 U/L (3x baseline)
    const hepaticLoad = (state.A_hepatic * (params.hepatotoxIndex ?? 0.1)) / 25.0;
    const alt_UL = Number((24.0 + hepaticLoad * 1.8 + Math.max(0, Cp - (params.MTC_mgL || 20)) * 2.2).toFixed(1));

    // 2. Heart (Cardiac) — hERG channel blockade drives QTc prolongation (baseline 400 ms)
    const hergKi = params.hergKi_mgL || 50.0;
    const deltaQTc_ms = Number(((65.0 * Cp) / (hergKi + Cp)).toFixed(1));
    const qtc_ms = Number((400.0 + deltaQTc_ms).toFixed(1));

    // 3. Kidneys (Renal) — Baseline Creatinine = 0.90 mg/dL, Baseline eGFR = 105 mL/min
    const renalStress = (state.A_renal * (params.nephrotoxIndex ?? 0.08)) / 80.0;
    const creatinine_mgdL = Number((0.90 + renalStress * 0.35).toFixed(2));
    const egfr_mLmin = Number(Math.max(15.0, 105.0 / (creatinine_mgdL / 0.90)).toFixed(1));

    // 4. Target Therapeutic Efficacy (%)
    const targetEffectPct = Number(this.computeHillEffect(state.Ce, params).toFixed(2));

    const classify = (val, warnThresh, toxicThresh) => {
      if (val >= toxicThresh) return 'TOXIC';
      if (val >= warnThresh) return 'STRESSED';
      return 'OPTIMAL';
    };

    const organs = {
      brain: {
        id: 'brain',
        name: 'Brain & CNS',
        concentration_mgL: Number((Ct * 0.65).toFixed(3)),
        perfusion_Lmin: 0.75,
        status: classify(Cp, params.MTC_mgL * 0.9, params.MTC_mgL * 1.4),
        metricLabel: 'BBB Penetration',
        metricValue: `${(Ct * 0.65).toFixed(2)} mg/L`
      },
      heart: {
        id: 'heart',
        name: 'Heart & Myocardium',
        concentration_mgL: Number(Cp.toFixed(3)),
        perfusion_Lmin: 0.25,
        status: classify(deltaQTc_ms, 20.0, 35.0),
        metricLabel: 'QTc Interval',
        metricValue: `${qtc_ms} ms (Δ+${deltaQTc_ms} ms)`
      },
      lungs: {
        id: 'lungs',
        name: 'Lungs & Pulmonary Bed',
        concentration_mgL: Number((Cp * 0.92).toFixed(3)),
        perfusion_Lmin: 5.00,
        status: targetEffectPct >= 50 ? 'OPTIMAL' : 'STRESSED',
        metricLabel: 'Target Suppression',
        metricValue: `${targetEffectPct}%`
      },
      liver: {
        id: 'liver',
        name: 'Liver (Hepatic CYP450)',
        concentration_mgL: Number((Ct * 1.25).toFixed(3)),
        perfusion_Lmin: 1.35,
        status: classify(alt_UL, 55.0, 75.0),
        metricLabel: 'Serum ALT',
        metricValue: `${alt_UL} U/L`
      },
      kidneys: {
        id: 'kidneys',
        name: 'Kidneys (Renal Cortex)',
        concentration_mgL: Number(Cp.toFixed(3)),
        perfusion_Lmin: 1.10,
        status: classify(creatinine_mgdL, 1.30, 1.75),
        metricLabel: 'Creatinine / eGFR',
        metricValue: `${creatinine_mgdL} mg/dL (${egfr_mLmin} mL/min)`
      }
    };

    return {
      Cp_mgL: Number(Cp.toFixed(4)),
      Ct_mgL: Number(Ct.toFixed(4)),
      Ce_mgL: Number(state.Ce.toFixed(4)),
      targetEffectPct,
      alt_UL,
      qtc_ms,
      deltaQTc_ms,
      creatinine_mgdL,
      egfr_mLmin,
      organs
    };
  }

  /**
   * Advances the 6-state coupled PK/PD differential equation system by dt (hours)
   * using 4th-Order Runge-Kutta (RK4) numerical integration.
   */
  static stepPKPD(state, params, dt = 0.05, ivInfusionRate_mgh = 0) {
    const Vc = params.Vc_L || 20.0;
    const Vp = params.Vp_L || 30.0;
    const Q = params.Q_Lh ?? 10.0;
    const ka = params.ka ?? 1.2;
    const CL_renal = params.CL_renal_Lh ?? 2.0;
    const CL_hepatic = params.CL_hepatic_Lh ?? 3.0;
    const Vmax_cyp = params.Vmax_cyp_mgh ?? 0.0;
    const Km_cyp = params.Km_cyp_mgL || 10.0;
    const ke0 = params.ke0 ?? 1.0;

    const derivs = (s) => {
      const agut = Math.max(0, s.A_gut);
      const ac = Math.max(0, s.A_central);
      const ap = Math.max(0, s.A_peripheral);
      const ce = Math.max(0, s.Ce);

      const Cp = ac / Vc;
      const Ct = ap / Vp;

      const absorptionFlux = ka * agut;
      const distFlux = Q * (Cp - Ct);
      const renalFlux = CL_renal * Cp;
      const saturableCypFlux = Vmax_cyp > 0 ? (Vmax_cyp * Cp) / (Km_cyp + Cp) : 0;
      const hepaticFlux = CL_hepatic * Cp + saturableCypFlux;

      return {
        dAgut: -absorptionFlux,
        dAcentral: absorptionFlux + ivInfusionRate_mgh - distFlux - renalFlux - hepaticFlux,
        dAperipheral: distFlux,
        dCe: ke0 * (Cp - ce),
        dArenal: renalFlux,
        dAhepatic: hepaticFlux
      };
    };

    const addScaled = (base, d, scale) => ({
      A_gut: base.A_gut + scale * d.dAgut,
      A_central: base.A_central + scale * d.dAcentral,
      A_peripheral: base.A_peripheral + scale * d.dAperipheral,
      Ce: base.Ce + scale * d.dCe,
      A_renal: base.A_renal + scale * d.dArenal,
      A_hepatic: base.A_hepatic + scale * d.dAhepatic
    });

    const k1 = derivs(state);
    const k2 = derivs(addScaled(state, k1, 0.5 * dt));
    const k3 = derivs(addScaled(state, k2, 0.5 * dt));
    const k4 = derivs(addScaled(state, k3, dt));

    const nextState = {
      t: Number((state.t + dt).toFixed(6)),
      A_gut: Math.max(0, state.A_gut + (dt / 6) * (k1.dAgut + 2 * k2.dAgut + 2 * k3.dAgut + k4.dAgut)),
      A_central: Math.max(0, state.A_central + (dt / 6) * (k1.dAcentral + 2 * k2.dAcentral + 2 * k3.dAcentral + k4.dAcentral)),
      A_peripheral: Math.max(0, state.A_peripheral + (dt / 6) * (k1.dAperipheral + 2 * k2.dAperipheral + 2 * k3.dAperipheral + k4.dAperipheral)),
      Ce: Math.max(0, state.Ce + (dt / 6) * (k1.dCe + 2 * k2.dCe + 2 * k3.dCe + k4.dCe)),
      A_renal: Math.max(0, state.A_renal + (dt / 6) * (k1.dArenal + 2 * k2.dArenal + 2 * k3.dArenal + k4.dArenal)),
      A_hepatic: Math.max(0, state.A_hepatic + (dt / 6) * (k1.dAhepatic + 2 * k2.dAhepatic + 2 * k3.dAhepatic + k4.dAhepatic)),
      totalDoseAdministered: state.totalDoseAdministered + ivInfusionRate_mgh * dt
    };

    const biomarkers = this.computeOrganBiomarkers(nextState, params);
    return { ...nextState, ...biomarkers };
  }

  /**
   * Simulates a complete multi-dose clinical regimen over `duration_h`.
   */
  static simulateClinicalRegimen(params, {
    dose_mg = params.defaultDose_mg || 300,
    interval_h = params.interval_h || 12,
    duration_h = 48,
    dt = 0.1
  } = {}) {
    let state = this.createInitialState();
    const route = (params.route || 'oral').toLowerCase();
    const F = route === 'oral' ? (params.F ?? 0.8) : 1.0;

    const steps = Math.round(duration_h / dt);
    const intervalSteps = Math.max(1, Math.round(interval_h / dt));
    const timeSeries = [];

    let Cmax_mgL = 0;
    let Tmax_h = 0;
    let AUC_mgLh = 0;

    for (let i = 0; i <= steps; i++) {
      if (i % intervalSteps === 0 && i < steps) {
        if (route === 'oral') {
          const bioavailableDose = dose_mg * F;
          state.A_gut += bioavailableDose;
          state.totalDoseAdministered += bioavailableDose;
        } else if (route === 'iv_bolus') {
          state.A_central += dose_mg;
          state.totalDoseAdministered += dose_mg;
        }
      }

      const infRate = route === 'iv_infusion' ? (dose_mg / interval_h) : 0;
      const snapshot = i === 0
        ? { ...state, ...this.computeOrganBiomarkers(state, params) }
        : this.stepPKPD(state, params, dt, infRate);

      if (i > 0) {
        const prevCp = timeSeries[timeSeries.length - 1].Cp_mgL;
        AUC_mgLh += 0.5 * (prevCp + snapshot.Cp_mgL) * dt;
      }

      if (snapshot.Cp_mgL > Cmax_mgL) {
        Cmax_mgL = snapshot.Cp_mgL;
        Tmax_h = snapshot.t;
      }

      state = snapshot;
      timeSeries.push(snapshot);
    }

    const totalAccountedMass =
      state.A_gut + state.A_central + state.A_peripheral + state.A_renal + state.A_hepatic;
    const massBalanceError_mg = Math.abs(state.totalDoseAdministered - totalAccountedMass);

    return {
      route,
      dose_mg,
      interval_h,
      duration_h,
      Cmax_mgL: Number(Cmax_mgL.toFixed(3)),
      Tmax_h: Number(Tmax_h.toFixed(2)),
      AUC_mgLh: Number(AUC_mgLh.toFixed(2)),
      massBalanceError_mg: Number(massBalanceError_mg.toExponential(3)),
      finalState: state,
      timeSeries
    };
  }

  // =========================================================================
  // 2. 2D ANATOMICAL MANNEQUIN & ORGAN HUD RENDERER (Substep 2)
  // =========================================================================

  /**
   * Performs 2D Euclidean hit-testing on the anatomical mannequin canvas to
   * identify if the user's cursor is hovering over a specific organ node.
   *
   * @param {number} x - Cursor X coordinate in canvas pixels
   * @param {number} y - Cursor Y coordinate in canvas pixels
   * @param {number} canvasWidth - Canvas width in pixels
   * @param {number} canvasHeight - Canvas height in pixels
   * @param {Object} [organStates={}] - Organ state dictionary from computeOrganBiomarkers
   * @returns {Object|null} Hovered organ telemetry object or null
   */
  static hitTestMannequin(x, y, canvasWidth, canvasHeight, organStates = {}) {
    for (const node of this.ORGAN_NODES) {
      const cx = node.relX * canvasWidth;
      const cy = node.relY * canvasHeight;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= node.radiusPx + 5) {
        const dynamicData = organStates[node.id] || {};
        return {
          ...node,
          cx: Number(cx.toFixed(1)),
          cy: Number(cy.toFixed(1)),
          distancePx: Number(dist.toFixed(2)),
          ...dynamicData
        };
      }
    }
    return null;
  }

  /**
   * Renders the 2D Human Anatomical Silhouette, Vascular Perfusion Tree, and
   * Color-Coded Organ Status Nodes onto an HTML5 Canvas.
   *
   * @param {HTMLCanvasElement} canvas - Target HTML5 canvas element
   * @param {Object} clinicalState - State snapshot containing `organs`, `Cp_mgL`, `targetEffectPct`
   * @param {Object} [options] - { hoveredOrganId: string|null }
   */
  static renderAnatomicalMannequin(canvas, clinicalState = {}, options = {}) {
    if (!canvas || typeof canvas.getContext !== 'function') return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w * 0.5;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#070a0f';
    ctx.fillRect(0, 0, w, h);

    // Subtle diagnostic telemetry grid
    ctx.strokeStyle = 'rgba(48, 54, 61, 0.35)';
    ctx.lineWidth = 1;
    for (let gx = 25; gx < w; gx += 25) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
    }
    for (let gy = 25; gy < h; gy += 25) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
    }

    // 1. Draw Stylized Human Head, Neck & Torso Silhouette
    ctx.save();
    ctx.strokeStyle = '#30363d';
    ctx.fillStyle = 'rgba(21, 27, 38, 0.78)';
    ctx.lineWidth = 2;

    // Head cranium oval
    ctx.beginPath();
    ctx.ellipse(cx, h * 0.15, w * 0.11, h * 0.095, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Neck & Torso contour
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.045, h * 0.24);
    ctx.lineTo(cx - w * 0.24, h * 0.29); // Left shoulder
    ctx.quadraticCurveTo(cx - w * 0.27, h * 0.45, cx - w * 0.21, h * 0.86); // Left flank
    ctx.lineTo(cx + w * 0.21, h * 0.86); // Pelvis base
    ctx.quadraticCurveTo(cx + w * 0.27, h * 0.45, cx + w * 0.24, h * 0.29); // Right shoulder
    ctx.lineTo(cx + w * 0.045, h * 0.24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 2. Draw Systemic Vascular Tree Connecting Heart Hub to Target Organs
    const heartNode = this.ORGAN_NODES.find(n => n.id === 'heart');
    const hx = heartNode.relX * w;
    const hy = heartNode.relY * h;
    const cpNorm = Math.min(1, (clinicalState.Cp_mgL || 0) / 10.0);

    ctx.save();
    ctx.strokeStyle = `rgba(88, 166, 255, ${(0.28 + 0.55 * cpNorm).toFixed(2)})`;
    ctx.lineWidth = 2.2;
    for (const node of this.ORGAN_NODES) {
      if (node.id === 'heart') continue;
      const nx = node.relX * w;
      const ny = node.relY * h;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.quadraticCurveTo(cx, (hy + ny) * 0.5, nx, ny);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Draw Individual Organ Nodes with Physiological Status Color Coding
    const statusPalette = {
      OPTIMAL:  { fill: 'rgba(63, 185, 80, 0.24)',  stroke: '#3fb950', text: '#7ee787' },
      STRESSED: { fill: 'rgba(210, 153, 34, 0.26)', stroke: '#d29922', text: '#e3b341' },
      TOXIC:    { fill: 'rgba(248, 81, 73, 0.30)',  stroke: '#f85149', text: '#ff7b72' }
    };

    const organStates = clinicalState.organs || {};

    for (const node of this.ORGAN_NODES) {
      const nx = node.relX * w;
      const ny = node.relY * h;
      const oData = organStates[node.id] || { status: 'OPTIMAL', concentration_mgL: 0, metricValue: '—' };
      const colors = statusPalette[oData.status] || statusPalette.OPTIMAL;
      const isHovered = options.hoveredOrganId === node.id;

      ctx.save();
      if (isHovered || oData.status === 'TOXIC') {
        ctx.shadowColor = colors.stroke;
        ctx.shadowBlur = isHovered ? 12 : 8;
      }

      // Outer organ capsule circle
      ctx.beginPath();
      ctx.arc(nx, ny, isHovered ? node.radiusPx + 2 : node.radiusPx, 0, 2 * Math.PI);
      ctx.fillStyle = colors.fill;
      ctx.fill();
      ctx.lineWidth = isHovered ? 2.5 : 1.6;
      ctx.strokeStyle = colors.stroke;
      ctx.stroke();

      // Organ title & live concentration readout
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#f0f6fc';
      ctx.font = 'bold 9.5px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.id.toUpperCase(), nx, ny - 2);

      ctx.fillStyle = colors.text;
      ctx.font = '8.5px monospace';
      ctx.fillText(`${oData.concentration_mgL ?? 0}mg/L`, nx, ny + 9);
      ctx.restore();
    }

    // 4. Bottom HUD Legend Banner
    ctx.fillStyle = '#8b949e';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      `Plasma Cp: ${(clinicalState.Cp_mgL || 0).toFixed(2)} mg/L | Target Occupancy: ${(clinicalState.targetEffectPct || 0).toFixed(1)}%`,
      cx,
      h - 10
    );
  }

  /**
   * Binds interactive mouse hover and click listeners to the anatomical mannequin canvas.
   *
   * @param {HTMLCanvasElement} canvas - Target canvas
   * @param {Function} getClinicalStateFn - Getter returning current clinical state object
   * @param {Object} callbacks - { onHoverOrgan: Function, onSelectOrgan: Function }
   */
  static bindInteractiveMannequin(canvas, getClinicalStateFn, callbacks = {}) {
    if (!canvas) return;

    const getCoords = (evt) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (evt.clientX - rect.left) * (canvas.width / rect.width),
        y: (evt.clientY - rect.top) * (canvas.height / rect.height)
      };
    };

    canvas.addEventListener('mousemove', (evt) => {
      const { x, y } = getCoords(evt);
      const state = getClinicalStateFn() || {};
      const hit = this.hitTestMannequin(x, y, canvas.width, canvas.height, state.organs);

      canvas.style.cursor = hit ? 'pointer' : 'default';
      this.renderAnatomicalMannequin(canvas, state, {
        hoveredOrganId: hit ? hit.id : null
      });

      if (hit && callbacks.onHoverOrgan) {
        callbacks.onHoverOrgan(hit);
      }
    });

    canvas.addEventListener('click', (evt) => {
      const { x, y } = getCoords(evt);
      const state = getClinicalStateFn() || {};
      const hit = this.hitTestMannequin(x, y, canvas.width, canvas.height, state.organs);
      if (hit && callbacks.onSelectOrgan) {
        callbacks.onSelectOrgan(hit);
      }
    });
  }
}

/**
 * Zero-Dependency Verification Test Suite for Module 10 (Substeps 1 & 2)
 */
export function runHumanPkPdTests() {
  const results = [];
  const assert = (name, condition, expected, actual) => {
    results.push({
      test: name,
      expected,
      actual,
      status: condition ? 'PASS' : 'FAIL'
    });
  };

  // Test 1: Strict 2-Compartment + Elimination Mass Balance Conservation
  const reg = HumanPkPdEngine.simulateClinicalRegimen(HumanPkPdEngine.DRUG_PRESETS.antiviral_mpro, {
    dose_mg: 300,
    interval_h: 12,
    duration_h: 48,
    dt: 0.05
  });
  assert(
    '2-Compartment PK Multi-Dose Mass Balance Conservation',
    reg.massBalanceError_mg < 1e-8,
    'Mass Error < 1e-8 mg',
    `Error = ${reg.massBalanceError_mg} mg (Administered=${reg.finalState.totalDoseAdministered} mg)`
  );

  // Test 2: Analytical AUC_0-inf Identity for Single IV Bolus (AUC = Dose / CL_total)
  const singleBolus = HumanPkPdEngine.simulateClinicalRegimen(
    {
      route: 'iv_bolus',
      Vc_L: 10.0,
      Vp_L: 15.0,
      Q_Lh: 8.0,
      CL_renal_Lh: 3.0,
      CL_hepatic_Lh: 2.0,
      Vmax_cyp_mgh: 0,
      ke0: 1.0,
      EC50_mgL: 1.0,
      hill: 1.0,
      MEC_mgL: 0.5,
      MTC_mgL: 10.0
    },
    { dose_mg: 100, interval_h: 200, duration_h: 120, dt: 0.02 }
  );
  assert(
    'Single IV Bolus Analytical AUC Identity (AUC = Dose / CL_total = 20.0)',
    Math.abs(singleBolus.AUC_mgLh - 20.0) < 0.15,
    '20.0 mg·h/L',
    `${singleBolus.AUC_mgLh} mg·h/L`
  );

  // Test 3: Sigmoidal Emax Hill Equation Boundary Limits
  const eZero = HumanPkPdEngine.computeHillEffect(0, { E0: 5, Emax: 90, EC50_mgL: 2.0, hill: 2.0 });
  const eHalf = HumanPkPdEngine.computeHillEffect(2.0, { E0: 0, Emax: 100, EC50_mgL: 2.0, hill: 2.0 });
  assert(
    'Sigmoidal Emax Hill Equation Limits (Ce=0 & Ce=EC50)',
    eZero === 5 && eHalf === 50,
    'E(0)=5, E(EC50)=50',
    `E(0)=${eZero}, E(EC50)=${eHalf}`
  );

  // Test 4: Acetaminophen Overdose Hepatotoxicity Trigger
  const safeApap = HumanPkPdEngine.simulateClinicalRegimen(HumanPkPdEngine.DRUG_PRESETS.acetaminophen, {
    dose_mg: 500, interval_h: 8, duration_h: 24, dt: 0.05
  });
  const toxicApap = HumanPkPdEngine.simulateClinicalRegimen(HumanPkPdEngine.DRUG_PRESETS.acetaminophen, {
    dose_mg: 4000, interval_h: 6, duration_h: 24, dt: 0.05
  });
  assert(
    'Acetaminophen Overdose Hepatotoxicity Biomarker (ALT Elevation & Liver TOXIC Status)',
    safeApap.finalState.organs.liver.status === 'OPTIMAL' &&
      toxicApap.finalState.organs.liver.status === 'TOXIC' &&
      toxicApap.finalState.alt_UL > 75.0,
    'Safe=OPTIMAL, Overdose=TOXIC (ALT > 75 U/L)',
    `Safe=${safeApap.finalState.organs.liver.status} (ALT=${safeApap.finalState.alt_UL}), Overdose=${toxicApap.finalState.organs.liver.status} (ALT=${toxicApap.finalState.alt_UL})`
  );

  // Test 5: Cardiac hERG Blockade & QTc Prolongation Scaling
  const lowDoseCard = HumanPkPdEngine.simulateClinicalRegimen(HumanPkPdEngine.DRUG_PRESETS.antiarrhythmic, {
    dose_mg: 5, interval_h: 12, duration_h: 12, dt: 0.05
  });
  const highDoseCard = HumanPkPdEngine.simulateClinicalRegimen(HumanPkPdEngine.DRUG_PRESETS.antiarrhythmic, {
    dose_mg: 60, interval_h: 12, duration_h: 12, dt: 0.05
  });
  assert(
    'Cardiac hERG Blockade QTc Prolongation Scaling',
    highDoseCard.timeSeries[1].deltaQTc_ms > lowDoseCard.timeSeries[1].deltaQTc_ms + 25,
    'High-dose ΔQTc > Low-dose ΔQTc + 25 ms',
    `High ΔQTc=${highDoseCard.timeSeries[1].deltaQTc_ms}ms vs Low ΔQTc=${lowDoseCard.timeSeries[1].deltaQTc_ms}ms`
  );

  // Test 6: 2D Anatomical Mannequin Organ Hit-Testing (Liver Node at relX=0.41, relY=0.58)
  const canvasW = 300, canvasH = 340;
  const liverX = 0.41 * canvasW;
  const liverY = 0.58 * canvasH;
  const hitLiver = HumanPkPdEngine.hitTestMannequin(liverX, liverY, canvasW, canvasH, toxicApap.finalState.organs);
  const hitMiss = HumanPkPdEngine.hitTestMannequin(10, 10, canvasW, canvasH, toxicApap.finalState.organs);
  assert(
    '2D Anatomical Mannequin Organ Hit-Testing (Detects Liver & Rejects Background)',
    hitLiver !== null && hitLiver.id === 'liver' && hitLiver.status === 'TOXIC' && hitMiss === null,
    'hit=liver(TOXIC), miss=null',
    `hit=${hitLiver?.id}(${hitLiver?.status}), miss=${hitMiss}`
  );

  return results;
}

// Auto-execute test suite if run directly in Node.js
if (typeof process !== 'undefined' && process.argv && import.meta.url.endsWith(process.argv[1])) {
  const report = runHumanPkPdTests();
  console.table(report);
  const failed = report.filter(r => r.status === 'FAIL');
  if (failed.length > 0) process.exit(1);
}