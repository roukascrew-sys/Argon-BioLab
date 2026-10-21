/**
 * Virtual BioTech & BioChem Lab — Module 11: CAR-T Cell Therapy & Immune Cytometry Engine
 * @module cart_cytometry_engine
 * @version 11.0.0
 *
 * Pure mathematical solvers for Chimeric Antigen Receptor (CAR) T-cell cytolytic
 * synapse kinetics, CD28 vs. 4-1BB costimulatory persistence, PD-1/PD-L1 immune
 * checkpoint exhaustion, Cytokine Release Syndrome (CRS) cascades, and dual HTML5
 * Canvas visualizers (2D Micro-Tumor Arena & 4-Quadrant Flow Cytometry Scatter Plot).
 * Zero external dependencies.
 */

export class CartCytometryEngine {
  /**
   * Costimulatory Intracellular Signaling Domain Profiles
   */
  static COSTIM_DOMAINS = {
    CD28: {
      id: 'CD28',
      name: 'CD28-CD3ζ (Fast-Acting / High Cytokine Peak)',
      kKillMax: 0.22,
      kProlifMax: 0.065,
      kExhaustBase: 0.048,
      il6SecretionRate: 14.5,
      ifngSecretionRate: 28.0
    },
    '4-1BB': {
      id: '4-1BB',
      name: '4-1BB-CD3ζ (Sustained Memory / High Persistence)',
      kKillMax: 0.145,
      kProlifMax: 0.055,
      kExhaustBase: 0.014,
      il6SecretionRate: 7.2,
      ifngSecretionRate: 16.5
    }
  };

  /**
   * Curated Clinical CAR-T Construct Presets
   */
  static CAR_PRESETS = {
    anti_cd19_41bb: {
      id: 'anti_cd19_41bb',
      name: 'Tisagenlecleucel-Like Anti-CD19 (4-1BB-CD3ζ)',
      targetAntigen: 'CD19 (B-Cell ALL / Lymphoma)',
      costimDomain: '4-1BB',
      defaultETRatio: 2.0,
      antigenDensity: 12000,
      scFvKd: 2500,
      pdl1Expression: 0.35,
      antiPd1Enabled: false
    },
    anti_cd19_cd28: {
      id: 'anti_cd19_cd28',
      name: 'Axicabtagene-Like Anti-CD19 (CD28-CD3ζ)',
      targetAntigen: 'CD19 (Aggressive NHL)',
      costimDomain: 'CD28',
      defaultETRatio: 2.0,
      antigenDensity: 12000,
      scFvKd: 2200,
      pdl1Expression: 0.45,
      antiPd1Enabled: false
    },
    anti_her2_solid: {
      id: 'anti_her2_solid',
      name: 'Anti-HER2 Solid Tumor CAR (High PD-L1 Checkpoint Suppression)',
      targetAntigen: 'HER2 (Solid Carcinoma)',
      costimDomain: 'CD28',
      defaultETRatio: 3.0,
      antigenDensity: 8500,
      scFvKd: 3000,
      pdl1Expression: 0.85,
      antiPd1Enabled: false
    }
  };

  // =========================================================================
  // 1. MATHEMATICAL RK4 IMMUNOTHERAPY & FLOW CYTOMETRY SOLVERS
  // =========================================================================

  static createInitialState({ initialTargets = 1000, etRatio = 2.0 } = {}) {
    const initialEffectors = initialTargets * etRatio;
    return {
      t: 0.0,
      initialTargets,
      T_viable: initialTargets,
      E_active: initialEffectors,
      E_exhausted: 0.0,
      D_lysed: 0.0,
      il6_pgmL: 2.0,
      ifng_pgmL: 5.0
    };
  }

  static computeAntigenOccupancy(antigenDensity = 10000, scFvKd = 2500) {
    if (antigenDensity <= 0) return 0;
    return antigenDensity / (antigenDensity + Math.max(1, scFvKd));
  }

  static computeClinicalMetrics(state) {
    const totalT = Math.max(1e-6, state.initialTargets);
    const tumorClearancePct = Number(
      Math.max(0, Math.min(100, ((totalT - state.T_viable) / totalT) * 100)).toFixed(2)
    );

    const totalEffectors = Math.max(1e-6, state.E_active + state.E_exhausted);
    const exhaustionPct = Number(((state.E_exhausted / totalEffectors) * 100).toFixed(2));
    const tnfa_pgmL = Number((3.5 + 0.32 * state.ifng_pgmL + 0.18 * state.il6_pgmL).toFixed(1));

    let crsGrade = 0;
    let crsStatus = 'Grade 0 (Baseline Homeostasis)';
    if (state.il6_pgmL >= 500) {
      crsGrade = 4;
      crsStatus = 'Grade 4 (Critical CRS Storm — ICU / Tocilizumab Required)';
    } else if (state.il6_pgmL >= 220) {
      crsGrade = 3;
      crsStatus = 'Grade 3 (Severe CRS — Hypotension / Hypoxia Risk)';
    } else if (state.il6_pgmL >= 80) {
      crsGrade = 2;
      crsStatus = 'Grade 2 (Moderate CRS — High Fever & Cytokine Surge)';
    } else if (state.il6_pgmL >= 25) {
      crsGrade = 1;
      crsStatus = 'Grade 1 (Mild Fever — Active Immune Engagement)';
    }

    return {
      tumorClearancePct,
      exhaustionPct,
      il6_pgmL: Number(state.il6_pgmL.toFixed(1)),
      ifng_pgmL: Number(state.ifng_pgmL.toFixed(1)),
      tnfa_pgmL,
      crsGrade,
      crsStatus
    };
  }

  static stepImmunotherapy(state, params = {}, dt = 0.1) {
    const domain = this.COSTIM_DOMAINS[params.costimDomain] || this.COSTIM_DOMAINS['4-1BB'];
    const fAntigen = this.computeAntigenOccupancy(
      params.antigenDensity ?? 10000,
      params.scFvKd ?? 2500
    );

    const kTumorGrowth = params.kTumorGrowth ?? 0.018;
    const tumorCarryingCap = params.tumorCarryingCap ?? 3000;
    const pdl1 = Math.max(0, Math.min(1, params.pdl1Expression ?? 0.35));
    const antiPd1 = Boolean(params.antiPd1Enabled);

    const checkpointMultiplier = antiPd1 ? 0.20 : 1.0;
    const kReactivate = antiPd1 ? 0.045 : 0.002;
    const kCytokineClearance = 0.055;
    const K_sat = 450;

    const derivs = (s) => {
      const T = Math.max(0, s.T_viable);
      const Ea = Math.max(0, s.E_active);
      const Ee = Math.max(0, s.E_exhausted);
      const il6 = Math.max(2.0, s.il6_pgmL);
      const ifng = Math.max(5.0, s.ifng_pgmL);

      const synapseEngagement = (T / (K_sat + T + 0.35 * Ea)) * fAntigen;
      const lysisRate = domain.kKillMax * Ea * synapseEngagement;
      const tumorGrowthRate = kTumorGrowth * T * (1 - T / tumorCarryingCap);
      const prolifRate = domain.kProlifMax * Ea * synapseEngagement;
      const exhaustRate =
        domain.kExhaustBase * (0.35 + 1.65 * pdl1) * checkpointMultiplier * Ea * (0.25 + synapseEngagement);
      const rescueRate = kReactivate * Ee;

      const dIl6 =
        domain.il6SecretionRate * (lysisRate / 100) - kCytokineClearance * (il6 - 2.0);
      const dIfng =
        domain.ifngSecretionRate * (lysisRate / 100) - kCytokineClearance * (ifng - 5.0);

      return {
        dT: tumorGrowthRate - lysisRate,
        dEa: prolifRate - exhaustRate + rescueRate,
        dEe: exhaustRate - rescueRate,
        dD: lysisRate,
        dIl6,
        dIfng
      };
    };

    const addScaled = (base, d, scale) => ({
      T_viable: base.T_viable + scale * d.dT,
      E_active: base.E_active + scale * d.dEa,
      E_exhausted: base.E_exhausted + scale * d.dEe,
      D_lysed: base.D_lysed + scale * d.dD,
      il6_pgmL: base.il6_pgmL + scale * d.dIl6,
      ifng_pgmL: base.ifng_pgmL + scale * d.dIfng
    });

    const k1 = derivs(state);
    const k2 = derivs(addScaled(state, k1, 0.5 * dt));
    const k3 = derivs(addScaled(state, k2, 0.5 * dt));
    const k4 = derivs(addScaled(state, k3, dt));

    const nextState = {
      t: Number((state.t + dt).toFixed(4)),
      initialTargets: state.initialTargets,
      T_viable: Math.max(0, state.T_viable + (dt / 6) * (k1.dT + 2 * k2.dT + 2 * k3.dT + k4.dT)),
      E_active: Math.max(0, state.E_active + (dt / 6) * (k1.dEa + 2 * k2.dEa + 2 * k3.dEa + k4.dEa)),
      E_exhausted: Math.max(0, state.E_exhausted + (dt / 6) * (k1.dEe + 2 * k2.dEe + 2 * k3.dEe + k4.dEe)),
      D_lysed: Math.max(0, state.D_lysed + (dt / 6) * (k1.dD + 2 * k2.dD + 2 * k3.dD + k4.dD)),
      il6_pgmL: Math.max(2.0, state.il6_pgmL + (dt / 6) * (k1.dIl6 + 2 * k2.dIl6 + 2 * k3.dIl6 + k4.dIl6)),
      ifng_pgmL: Math.max(5.0, state.ifng_pgmL + (dt / 6) * (k1.dIfng + 2 * k2.dIfng + 2 * k3.dIfng + k4.dIfng))
    };

    const metrics = this.computeClinicalMetrics(nextState);
    return { ...nextState, ...metrics };
  }

  static simulateCytolysisRegimen(params = {}, {
    initialTargets = 1000,
    etRatio = params.defaultETRatio ?? 2.0,
    duration_h = 48,
    dt = 0.25
  } = {}) {
    let state = {
      ...this.createInitialState({ initialTargets, etRatio }),
      ...this.computeClinicalMetrics(this.createInitialState({ initialTargets, etRatio }))
    };

    const steps = Math.round(duration_h / dt);
    const timeSeries = [state];
    let peakIl6_pgmL = state.il6_pgmL;
    let peakIfng_pgmL = state.ifng_pgmL;
    let maxCrsGrade = state.crsGrade;

    for (let i = 1; i <= steps; i++) {
      state = this.stepImmunotherapy(state, params, dt);
      if (state.il6_pgmL > peakIl6_pgmL) peakIl6_pgmL = state.il6_pgmL;
      if (state.ifng_pgmL > peakIfng_pgmL) peakIfng_pgmL = state.ifng_pgmL;
      if (state.crsGrade > maxCrsGrade) maxCrsGrade = state.crsGrade;
      timeSeries.push(state);
    }

    return {
      etRatio,
      duration_h,
      costimDomain: params.costimDomain || '4-1BB',
      peakIl6_pgmL: Number(peakIl6_pgmL.toFixed(1)),
      peakIfng_pgmL: Number(peakIfng_pgmL.toFixed(1)),
      maxCrsGrade,
      finalState: state,
      timeSeries
    };
  }

  static generateFlowCytometryPopulation(state, totalEvents = 240) {
    const popQ1 = Math.max(0, state.E_exhausted);
    const popQ2 = Math.max(0, state.D_lysed);
    const popQ3 = Math.max(0, state.T_viable);
    const popQ4 = Math.max(0, state.E_active);

    const totalCells = Math.max(1e-6, popQ1 + popQ2 + popQ3 + popQ4);

    let seed = Math.round((state.t + 1) * 1337 + popQ3 * 7 + popQ4 * 13);
    const rand = () => {
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const gauss = (mean, std) => {
      const u1 = Math.max(1e-7, rand());
      const u2 = rand();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      return Math.max(0.08, Math.min(3.92, mean + z * std));
    };

    const countQ1 = Math.round((popQ1 / totalCells) * totalEvents);
    const countQ2 = Math.round((popQ2 / totalCells) * totalEvents);
    const countQ3 = Math.round((popQ3 / totalCells) * totalEvents);
    const countQ4 = Math.max(0, totalEvents - countQ1 - countQ2 - countQ3);

    const events = [];
    const pushCluster = (count, quadrant, meanX, meanY, stdX, stdY, color) => {
      for (let i = 0; i < count; i++) {
        let x = gauss(meanX, stdX);
        let y = gauss(meanY, stdY);
        if (quadrant === 'Q1') { x = Math.min(1.92, x); y = Math.max(2.08, y); }
        if (quadrant === 'Q2') { x = Math.max(2.08, x); y = Math.max(2.08, y); }
        if (quadrant === 'Q3') { x = Math.min(1.92, x); y = Math.min(1.92, y); }
        if (quadrant === 'Q4') { x = Math.max(2.08, x); y = Math.min(1.92, y); }
        events.push({
          x: Number(x.toFixed(3)),
          y: Number(y.toFixed(3)),
          quadrant,
          color
        });
      }
    };

    pushCluster(countQ1, 'Q1', 1.05, 2.95, 0.32, 0.32, '#8b949e');
    pushCluster(countQ2, 'Q2', 3.05, 3.10, 0.35, 0.35, '#f85149');
    pushCluster(countQ3, 'Q3', 0.90, 0.85, 0.30, 0.30, '#bc8cff');
    pushCluster(countQ4, 'Q4', 3.10, 0.90, 0.32, 0.30, '#3fb950');

    const actualTotal = Math.max(1, events.length);
    const percentages = {
      Q1: Number(((countQ1 / actualTotal) * 100).toFixed(1)),
      Q2: Number(((countQ2 / actualTotal) * 100).toFixed(1)),
      Q3: Number(((countQ3 / actualTotal) * 100).toFixed(1)),
      Q4: Number(((countQ4 / actualTotal) * 100).toFixed(1))
    };

    return {
      totalEvents: actualTotal,
      quadrants: { Q1: countQ1, Q2: countQ2, Q3: countQ3, Q4: countQ4 },
      percentages,
      events
    };
  }

  // =========================================================================
  // 2. 2D MICRO-TUMOR ARENA & FLOW CYTOMETRY CANVAS VISUALIZERS (Substep 5)
  // =========================================================================

  /**
   * Builds a deterministic 2D spatial particle representation of the microwell co-culture
   * for rendering and cursor hit-testing. Computes active immunological synapses when
   * an active CAR-T effector approaches within `synapseDistPx` of a viable tumor cell.
   *
   * @param {Object} state - Current cellular state vector
   * @param {number} [width=320] - Canvas width in pixels
   * @param {number} [height=300] - Canvas height in pixels
   * @returns {Object} { particles, synapses, wellCenter: { cx, cy, dishRadius } }
   */
  static buildArenaParticles(state, width = 320, height = 300) {
    const cx = width / 2;
    const cy = height / 2;
    const dishRadius = Math.min(width, height) * 0.42;

    const totalT = Math.max(1, (state.T_viable || 0) + (state.D_lysed || 0));
    const nViableTumor = Math.min(28, Math.max(0, Math.round(((state.T_viable || 0) / totalT) * 24)));
    const nLysedDebris = Math.min(26, Math.max(0, Math.round(((state.D_lysed || 0) / totalT) * 24)));
    const nActiveCar = Math.min(34, Math.max(1, Math.round((state.E_active || 0) / 95)));
    const nExhaustedCar = Math.min(24, Math.max(0, Math.round((state.E_exhausted || 0) / 95)));

    const particles = [];
    const phase = (state.t || 0) * 0.45;

    // 1. Viable Tumor Cells (Clustered in central micro-tumor spheroid core)
    for (let i = 0; i < nViableTumor; i++) {
      const goldenAngle = i * 2.39996;
      const r = Math.sqrt((i + 0.5) / Math.max(1, nViableTumor)) * (dishRadius * 0.54);
      const x = cx + r * Math.cos(goldenAngle);
      const y = cy + r * Math.sin(goldenAngle);
      particles.push({
        id: `tumor_${i}`,
        type: 'viable_tumor',
        label: 'Viable Antigen+ Tumor Cell',
        x: Number(x.toFixed(1)),
        y: Number(y.toFixed(1)),
        radius: 7.5,
        color: '#bc8cff'
      });
    }

    // 2. Lysed Apoptotic Tumor Debris (Fragmented outer ring)
    for (let i = 0; i < nLysedDebris; i++) {
      const ang = i * 1.75 + 0.4;
      const r = dishRadius * (0.28 + 0.58 * ((i * 7) % 11) / 10);
      particles.push({
        id: `debris_${i}`,
        type: 'lysed_debris',
        label: 'Apoptotic Tumor Debris (Annexin-V+ / PI+)',
        x: Number((cx + r * Math.cos(ang)).toFixed(1)),
        y: Number((cy + r * Math.sin(ang)).toFixed(1)),
        radius: 4.0,
        color: '#f85149'
      });
    }

    // 3. Active Cytolytic CAR-T Effectors (Chemotactically infiltrating tumor core)
    const synapses = [];
    for (let i = 0; i < nActiveCar; i++) {
      let x, y;
      // Pair early effectors directly onto viable tumor cells to illustrate immunological synapses
      if (i < nViableTumor && i % 2 === 0) {
        const target = particles[i];
        const dockAngle = i * 1.3 + phase;
        x = target.x + 11.5 * Math.cos(dockAngle);
        y = target.y + 11.5 * Math.sin(dockAngle);
        synapses.push({
          effectorX: Number(x.toFixed(1)),
          effectorY: Number(y.toFixed(1)),
          targetX: target.x,
          targetY: target.y,
          midX: Number(((x + target.x) * 0.5).toFixed(1)),
          midY: Number(((y + target.y) * 0.5).toFixed(1))
        });
      } else {
        const ang = i * 2.1 + phase * 0.7;
        const r = dishRadius * (0.18 + 0.72 * (((i * 5) % 13) / 12));
        x = cx + r * Math.cos(ang);
        y = cy + r * Math.sin(ang);
      }

      particles.push({
        id: `car_active_${i}`,
        type: 'active_cart',
        label: 'Active CD8+ CAR-T Effector (Perforin/Granzyme+)',
        x: Number(x.toFixed(1)),
        y: Number(y.toFixed(1)),
        radius: 5.2,
        color: '#3fb950'
      });
    }

    // 4. PD-1/PD-L1 Exhausted CAR-T Cells (Drifting toward microwell periphery)
    for (let i = 0; i < nExhaustedCar; i++) {
      const ang = i * 1.92 - 0.5;
      const r = dishRadius * (0.68 + 0.24 * (i % 4) / 3);
      particles.push({
        id: `car_exhaust_${i}`,
        type: 'exhausted_cart',
        label: 'PD-1+ Exhausted / Anergic CAR-T Cell',
        x: Number((cx + r * Math.cos(ang)).toFixed(1)),
        y: Number((cy + r * Math.sin(ang)).toFixed(1)),
        radius: 4.8,
        color: '#8b949e'
      });
    }

    return {
      particles,
      synapses,
      wellCenter: { cx, cy, dishRadius: Number(dishRadius.toFixed(1)) }
    };
  }

  /**
   * Performs 2D Euclidean hit-testing on the Micro-Tumor Arena canvas.
   */
  static hitTestArena(x, y, state, width = 320, height = 300) {
    const { particles } = this.buildArenaParticles(state, width, height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const dx = x - p.x;
      const dy = y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= p.radius + 4) {
        return { ...p, distancePx: Number(dist.toFixed(2)) };
      }
    }
    return null;
  }

  /**
   * Renders the 2D Living Micro-Tumor Arena onto an HTML5 Canvas element.
   */
  static renderTumorArena(canvas, state = {}, options = {}) {
    if (!canvas || typeof canvas.getContext !== 'function') return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#070a0f';
    ctx.fillRect(0, 0, w, h);

    const { particles, synapses, wellCenter } = this.buildArenaParticles(state, w, h);
    const { cx, cy, dishRadius } = wellCenter;

    // 1. Draw Microwell Petri Dish Perimeter & Grid
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, dishRadius + 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#0b1018';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#30363d';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, dishRadius * 0.55, 0, 2 * Math.PI);
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = 'rgba(88, 166, 255, 0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // 2. Draw Cyan Immunological Synapse Rings & Cytolytic Vectors
    ctx.save();
    for (const syn of synapses) {
      ctx.beginPath();
      ctx.moveTo(syn.effectorX, syn.effectorY);
      ctx.lineTo(syn.targetX, syn.targetY);
      ctx.strokeStyle = '#58a6ff';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(syn.midX, syn.midY, 8.5, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(88, 166, 255, 0.75)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    ctx.restore();

    // 3. Draw Individual Cell Particles (Viable Tumors, Lysed Debris, Active & Exhausted CAR-T)
    for (const p of particles) {
      const isHovered = options.hoveredParticleId === p.id;
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, isHovered ? p.radius + 2.5 : p.radius, 0, 2 * Math.PI);
      ctx.fillStyle = p.color;

      if (p.type === 'viable_tumor' || p.type === 'active_cart' || isHovered) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = isHovered ? 12 : 6;
      }
      ctx.fill();

      ctx.lineWidth = isHovered ? 2.0 : 1.0;
      ctx.strokeStyle = isHovered ? '#ffffff' : '#0d1117';
      ctx.stroke();
      ctx.restore();
    }

    // 4. Legend & Synapse Telemetry Footer
    ctx.fillStyle = '#8b949e';
    ctx.font = '9.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      `Synapses: ${synapses.length} | Viable Tumor: ${Math.round(state.T_viable || 0)}/µL | Active CAR-T: ${Math.round(state.E_active || 0)}/µL`,
      cx,
      h - 8
    );
  }

  /**
   * Renders the Dual-Axis Logarithmic 4-Quadrant Flow Cytometry Scatter Plot
   * onto an HTML5 Canvas element.
   */
  static renderFlowCytometryPlot(canvas, gatedData) {
    if (!canvas || typeof canvas.getContext !== 'function' || !gatedData) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#070a0f';
    ctx.fillRect(0, 0, w, h);

    const padLeft = 38;
    const padRight = 14;
    const padTop = 18;
    const padBottom = 30;
    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    const toPxX = (logVal) => padLeft + (logVal / 4.0) * plotW;
    const toPxY = (logVal) => padTop + plotH - (logVal / 4.0) * plotH;

    // 1. Plot Border & Logarithmic Decade Grid Lines (10^0 .. 10^4)
    ctx.strokeStyle = '#1e2633';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#8b949e';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';

    for (let dec = 0; dec <= 4; dec++) {
      const gx = toPxX(dec);
      const gy = toPxY(dec);

      ctx.beginPath(); ctx.moveTo(gx, padTop); ctx.lineTo(gx, padTop + plotH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(padLeft, gy); ctx.lineTo(padLeft + plotW, gy); ctx.stroke();

      ctx.fillText(`10^${dec}`, gx, h - 16);
      ctx.textAlign = 'right';
      ctx.fillText(`10^${dec}`, padLeft - 4, gy + 3);
      ctx.textAlign = 'center';
    }

    // 2. Quadrant Gate Crosshairs (Threshold at 10^2 on both axes)
    const gateX = toPxX(2.0);
    const gateY = toPxY(2.0);
    ctx.save();
    ctx.strokeStyle = '#58a6ff';
    ctx.lineWidth = 1.3;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(gateX, padTop); ctx.lineTo(gateX, padTop + plotH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(padLeft, gateY); ctx.lineTo(padLeft + plotW, gateY); ctx.stroke();
    ctx.restore();

    // 3. Render Single-Cell Fluorescent Events
    for (const ev of gatedData.events) {
      const px = toPxX(ev.x);
      const py = toPxY(ev.y);
      ctx.fillStyle = ev.color;
      ctx.beginPath();
      ctx.arc(px, py, 2.2, 0, 2 * Math.PI);
      ctx.fill();
    }

    // 4. Quadrant Percentage Headers
    const pct = gatedData.percentages;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#8b949e';
    ctx.fillText(`Q1 Exhausted: ${pct.Q1}%`, padLeft + 6, padTop + 14);
    ctx.fillStyle = '#bc8cff';
    ctx.fillText(`Q3 Viable Tumor: ${pct.Q3}%`, padLeft + 6, padTop + plotH - 6);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#f85149';
    ctx.fillText(`Q2 Lysed Target: ${pct.Q2}%`, padLeft + plotW - 6, padTop + 14);
    ctx.fillStyle = '#3fb950';
    ctx.fillText(`Q4 Active CAR-T: ${pct.Q4}%`, padLeft + plotW - 6, padTop + plotH - 6);

    // 5. Axis Titles
    ctx.fillStyle = '#c9d1d9';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CD8-FITC / CAR-GFP Log Fluorescence →', padLeft + plotW / 2, h - 3);
  }

  /**
   * Binds interactive hover and click listeners to the 2D Micro-Tumor Arena canvas.
   */
  static bindInteractiveArena(canvas, getStateFn, callbacks = {}) {
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
      const state = getStateFn() || {};
      const hit = this.hitTestArena(x, y, state, canvas.width, canvas.height);

      canvas.style.cursor = hit ? 'pointer' : 'default';
      this.renderTumorArena(canvas, state, { hoveredParticleId: hit ? hit.id : null });

      if (hit && callbacks.onHoverCell) {
        callbacks.onHoverCell(hit, state);
      }
    });

    canvas.addEventListener('click', (evt) => {
      const { x, y } = getCoords(evt);
      const state = getStateFn() || {};
      const hit = this.hitTestArena(x, y, state, canvas.width, canvas.height);
      if (hit && callbacks.onSelectCell) {
        callbacks.onSelectCell(hit, state);
      }
    });
  }
}

/**
 * Zero-Dependency Verification Test Suite for Module 11 (Substeps 4 & 5)
 */
export function runCartCytometryTests() {
  const results = [];
  const assert = (name, condition, expected, actual) => {
    results.push({
      test: name,
      expected,
      actual,
      status: condition ? 'PASS' : 'FAIL'
    });
  };

  // Test 1: Monotonic Tumor Clearance Scaling with Effector-to-Target (E:T) Ratio
  const lowET = CartCytometryEngine.simulateCytolysisRegimen(
    CartCytometryEngine.CAR_PRESETS.anti_cd19_41bb,
    { etRatio: 0.5, duration_h: 24 }
  );
  const highET = CartCytometryEngine.simulateCytolysisRegimen(
    CartCytometryEngine.CAR_PRESETS.anti_cd19_41bb,
    { etRatio: 5.0, duration_h: 24 }
  );
  assert(
    'CAR-T Cytolytic Scaling with Effector-to-Target (E:T) Ratio',
    highET.finalState.tumorClearancePct > lowET.finalState.tumorClearancePct + 30,
    'Clearance(E:T=5:1) > Clearance(E:T=0.5:1) + 30%',
    `5:1=${highET.finalState.tumorClearancePct}% vs 0.5:1=${lowET.finalState.tumorClearancePct}%`
  );

  // Test 2: Costimulatory Domain Phenotype (4-1BB Sustains Lower Exhaustion Than CD28)
  const run41bb = CartCytometryEngine.simulateCytolysisRegimen(
    { ...CartCytometryEngine.CAR_PRESETS.anti_cd19_41bb, costimDomain: '4-1BB', pdl1Expression: 0.6 },
    { etRatio: 2.0, duration_h: 48 }
  );
  const runCd28 = CartCytometryEngine.simulateCytolysisRegimen(
    { ...CartCytometryEngine.CAR_PRESETS.anti_cd19_cd28, costimDomain: 'CD28', pdl1Expression: 0.6 },
    { etRatio: 2.0, duration_h: 48 }
  );
  assert(
    'Costimulatory Persistence (4-1BB Exhaustion % < CD28 Exhaustion % at 48h)',
    run41bb.finalState.exhaustionPct < runCd28.finalState.exhaustionPct * 0.6,
    '4-1BB Exhaustion < 60% of CD28 Exhaustion',
    `4-1BB=${run41bb.finalState.exhaustionPct}% vs CD28=${runCd28.finalState.exhaustionPct}%`
  );

  // Test 3: Anti-PD-1 Checkpoint Inhibitor Rescue of Exhausted Solid-Tumor CAR-T Cells
  const untreatedSolid = CartCytometryEngine.simulateCytolysisRegimen(
    { ...CartCytometryEngine.CAR_PRESETS.anti_her2_solid, antiPd1Enabled: false },
    { etRatio: 1.5, duration_h: 48 }
  );
  const rescuedSolid = CartCytometryEngine.simulateCytolysisRegimen(
    { ...CartCytometryEngine.CAR_PRESETS.anti_her2_solid, antiPd1Enabled: true },
    { etRatio: 1.5, duration_h: 48 }
  );
  assert(
    'Anti-PD-1 Checkpoint Blockade Reduces Exhaustion & Boosts Tumor Lysis',
    rescuedSolid.finalState.exhaustionPct < untreatedSolid.finalState.exhaustionPct &&
      rescuedSolid.finalState.tumorClearancePct > untreatedSolid.finalState.tumorClearancePct,
    'Rescued: Lower Exhaustion & Higher Lysis',
    `Lysis: ${rescuedSolid.finalState.tumorClearancePct}% > ${untreatedSolid.finalState.tumorClearancePct}% (Exh: ${rescuedSolid.finalState.exhaustionPct}% < ${untreatedSolid.finalState.exhaustionPct}%)`
  );

  // Test 4: Cytokine Release Syndrome (CRS) IL-6 Surge Correlates with CD28 High-Burden Lysis
  const highBurdenCd28 = CartCytometryEngine.simulateCytolysisRegimen(
    CartCytometryEngine.CAR_PRESETS.anti_cd19_cd28,
    { initialTargets: 2500, etRatio: 4.0, duration_h: 36 }
  );
  assert(
    'Cytokine Release Syndrome (CRS) IL-6 & IFN-γ Surge Under High Tumor Burden',
    highBurdenCd28.peakIl6_pgmL > 80 && highBurdenCd28.maxCrsGrade >= 2,
    'Peak IL-6 > 80 pg/mL (CRS Grade >= 2)',
    `Peak IL-6=${highBurdenCd28.peakIl6_pgmL} pg/mL (CRS Grade ${highBurdenCd28.maxCrsGrade})`
  );

  // Test 5: 4-Quadrant Flow Cytometry Event & Percentage Conservation
  const flow = CartCytometryEngine.generateFlowCytometryPopulation(highET.finalState, 200);
  const sumCounts = flow.quadrants.Q1 + flow.quadrants.Q2 + flow.quadrants.Q3 + flow.quadrants.Q4;
  const sumPct = flow.percentages.Q1 + flow.percentages.Q2 + flow.percentages.Q3 + flow.percentages.Q4;
  assert(
    'Flow Cytometry 4-Quadrant Gating Conservation (Q1+Q2+Q3+Q4 = 100%)',
    sumCounts === 200 && Math.abs(sumPct - 100.0) < 0.5 && flow.quadrants.Q2 > flow.quadrants.Q3,
    '200 events (100%), Q2(Lysed) > Q3(Viable)',
    `Events=${sumCounts} (${sumPct.toFixed(1)}%), Q2=${flow.quadrants.Q2} > Q3=${flow.quadrants.Q3}`
  );

  // Test 6: 2D Micro-Tumor Arena Particle & Immunological Synapse Spatial Hit-Testing
  const earlyState = lowET.timeSeries[2];
  const arena = CartCytometryEngine.buildArenaParticles(earlyState, 320, 300);
  const sampleCell = arena.particles[0];
  const hitCell = CartCytometryEngine.hitTestArena(sampleCell.x, sampleCell.y, earlyState, 320, 300);
  assert(
    '2D Micro-Tumor Arena Synapse Generation & Spatial Hit-Testing',
    arena.particles.length > 20 && arena.synapses.length > 0 && hitCell !== null,
    'Particles > 20, Synapses > 0, HitTest != null',
    `Particles=${arena.particles.length}, Synapses=${arena.synapses.length}, Hit=${hitCell?.type}`
  );

  return results;
}

// Auto-execute test suite if run directly in Node.js
if (typeof process !== 'undefined' && process.argv && import.meta.url.endsWith(process.argv[1])) {
  const report = runCartCytometryTests();
  console.table(report);
  const failed = report.filter(r => r.status === 'FAIL');
  if (failed.length > 0) process.exit(1);
}