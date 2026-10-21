/**
 * Virtual BioTech & BioChem Lab — Module 3: In Silico PCR & Agarose Gel Engine
 * @module pcr_gel_engine
 * @version 3.0.0
 *
 * Pure mathematical solvers for SantaLucia nearest-neighbor primer thermodynamics,
 * multi-cycle PCR amplification kinetics (with enzyme decay & reagent depletion),
 * and logarithmic agarose gel electrophoresis migration. Zero external dependencies.
 */

export class PcrGelEngine {
  /**
   * SantaLucia (1998) Unified Nearest-Neighbor Thermodynamic Parameters
   * dH: Enthalpy in kcal/mol | dS: Entropy in cal/(K·mol)
   */
  static NN_PARAMS = {
    AA: { dH: -7.9, dS: -22.2 }, TT: { dH: -7.9, dS: -22.2 },
    AT: { dH: -7.2, dS: -20.4 }, TA: { dH: -7.2, dS: -21.3 },
    CA: { dH: -8.5, dS: -22.7 }, TG: { dH: -8.5, dS: -22.7 },
    GT: { dH: -8.4, dS: -22.4 }, AC: { dH: -8.4, dS: -22.4 },
    CT: { dH: -7.8, dS: -21.0 }, AG: { dH: -7.8, dS: -21.0 },
    GA: { dH: -8.2, dS: -22.2 }, TC: { dH: -8.2, dS: -22.2 },
    CG: { dH: -10.6, dS: -27.2 }, GC: { dH: -9.8, dS: -24.4 },
    GG: { dH: -8.0, dS: -19.9 }, CC: { dH: -8.0, dS: -19.9 }
  };

  /** Standard Reference DNA Ladders (base pairs) */
  static LADDERS = {
    '1kb': [10000, 8000, 6000, 5000, 4000, 3000, 2000, 1500, 1000, 750, 500, 250],
    '100bp': [1500, 1200, 1000, 900, 800, 700, 600, 500, 400, 300, 200, 100]
  };

  /** Sanitizes nucleotide sequence */
  static sanitize(seq) {
    if (typeof seq !== 'string') throw new TypeError('Sequence must be a string.');
    return seq.toUpperCase().replace(/[^ATGC]/g, '');
  }

  /** Returns antiparallel 5'->3' reverse complement */
  static reverseComplement(seq) {
    const clean = this.sanitize(seq);
    const map = { A: 'T', T: 'A', G: 'C', C: 'G' };
    let out = '';
    for (let i = clean.length - 1; i >= 0; i--) out += map[clean[i]];
    return out;
  }

  /**
   * Computes oligonucleotide thermodynamic parameters (dH, dS, dG37) and salt-adjusted
   * melting temperature (Tm) using SantaLucia (1998) nearest-neighbor rules and
   * Owczarzy/von Ahsen magnesium-dNTP effective ionic strength corrections.
   *
   * @param {string} primerSeq - Oligonucleotide sequence (5'->3')
   * @param {Object} [conditions]
   * @param {number} [conditions.primerConc_nM=250] - Total primer strand concentration (nM)
   * @param {number} [conditions.Na_mM=50] - Monovalent cation [Na+ / K+] concentration (mM)
   * @param {number} [conditions.Mg_mM=1.5] - Divalent [Mg2+] concentration (mM)
   * @param {number} [conditions.dNTP_mM=0.2] - Total dNTP concentration (mM)
   * @returns {Object} { length, gcPercent, dH_kcal, dS_cal, dG37_kcal, Tm_Basic, Tm_NN }
   */
  static computePrimerTm(primerSeq, {
    primerConc_nM = 250,
    Na_mM = 50,
    Mg_mM = 1.5,
    dNTP_mM = 0.2
  } = {}) {
    const seq = this.sanitize(primerSeq);
    if (seq.length < 6) {
      throw new RangeError('Primer sequence must be at least 6 nucleotides long.');
    }

    const len = seq.length;
    const gcCount = (seq.match(/[GC]/g) || []).length;
    const gcPercent = Number(((gcCount / len) * 100).toFixed(1));

    // 1. Wallace / Marmur-Doty basic rule (for comparison)
    const atCount = len - gcCount;
    const Tm_Basic = len < 14
      ? 2 * atCount + 4 * gcCount
      : 64.9 + 41 * ((gcCount - 16.4) / len);

    // 2. SantaLucia Nearest-Neighbor Initiation Penalties
    let dH = 0.0; // kcal/mol
    let dS = 0.0; // cal/(K·mol)

    const firstBase = seq[0];
    const lastBase = seq[len - 1];

    // Terminal G·C vs A·T initiation parameters
    if (firstBase === 'G' || firstBase === 'C') { dH += 0.1; dS += -2.8; }
    else { dH += 2.3; dS += 4.1; }

    if (lastBase === 'G' || lastBase === 'C') { dH += 0.1; dS += -2.8; }
    else { dH += 2.3; dS += 4.1; }

    // Sum adjacent dinucleotide steps
    for (let i = 0; i < len - 1; i++) {
      const step = seq.slice(i, i + 2);
      const param = this.NN_PARAMS[step];
      if (param) {
        dH += param.dH;
        dS += param.dS;
      }
    }

    // 3. Effective Monovalent Cation Correction (von Ahsen et al. 2001)
    // Free Mg2+ after dNTP chelation:
    const freeMg_mM = Math.max(0, Mg_mM - dNTP_mM);
    const Na_eq_M = (Na_mM + 120 * Math.sqrt(freeMg_mM)) * 1e-3;

    // Salt entropy adjustment: dS(salt) = dS(1M Na+) + 0.368 * (N - 1) * ln([Na+_eq])
    const dS_salt = dS + 0.368 * (len - 1) * Math.log( Math.max(1e-5, Na_eq_M) );

    // 4. Melting temperature equation: Tm = (dH * 1000) / (dS_salt + R * ln(Ct / 4)) - 273.15
    const R = 1.987; // Universal gas constant in cal/(K·mol)
    const Ct_M = primerConc_nM * 1e-9;
    const Tm_NN = (dH * 1000) / (dS_salt + R * Math.log(Ct_M / 4)) - 273.15;

    // Gibbs free energy at 37°C (310.15 K): dG = dH - T * dS
    const dG37 = dH - (310.15 * dS_salt) / 1000;

    return {
      sequence: seq,
      length: len,
      gcPercent,
      dH_kcal: Number(dH.toFixed(2)),
      dS_cal: Number(dS_salt.toFixed(2)),
      dG37_kcal: Number(dG37.toFixed(2)),
      Tm_Basic: Number(Tm_Basic.toFixed(1)),
      Tm_NN: Number(Tm_NN.toFixed(2))
    };
  }

  /**
   * Locates forward and reverse primer annealing coordinates on a template DNA
   * sequence and extracts the amplified PCR product.
   *
   * @param {string} templateSeq - Template DNA sequence (5'->3')
   * @param {string} fwdPrimer - Forward primer sequence (5'->3')
   * @param {string} revPrimer - Reverse primer sequence (5'->3')
   * @param {Object} [reactionConditions] - Ionic conditions passed to computePrimerTm
   */
  static findAmplicon(templateSeq, fwdPrimer, revPrimer, reactionConditions = {}) {
    const template = this.sanitize(templateSeq);
    const fwd = this.sanitize(fwdPrimer);
    const rev = this.sanitize(revPrimer);
    const revBindSite = this.reverseComplement(rev);

    const fwdIdx = template.indexOf(fwd);
    const revIdx = template.indexOf(revBindSite);

    if (fwdIdx === -1) {
      throw new Error('Forward primer does not anneal to the sense strand of the template.');
    }
    if (revIdx === -1) {
      throw new Error('Reverse primer does not anneal to the antisense strand of the template.');
    }
    if (revIdx < fwdIdx) {
      throw new Error('Primer orientation error: Reverse primer binds upstream of Forward primer.');
    }

    const ampliconStart = fwdIdx + 1; // 1-based coordinate
    const ampliconEnd = revIdx + rev.length;
    const ampliconSeq = template.slice(fwdIdx, ampliconEnd);

    const fwdMetrics = this.computePrimerTm(fwd, reactionConditions);
    const revMetrics = this.computePrimerTm(rev, reactionConditions);
    const minTm = Math.min(fwdMetrics.Tm_NN, revMetrics.Tm_NN);
    const tmDiff = Math.abs(fwdMetrics.Tm_NN - revMetrics.Tm_NN);

    return {
      ampliconLength: ampliconSeq.length,
      ampliconStart,
      ampliconEnd,
      ampliconSequence: ampliconSeq,
      forwardPrimer: fwdMetrics,
      reversePrimer: revMetrics,
      recommendedAnnealingTemp: Number((minTm - 3.0).toFixed(1)),
      tmMismatchWarning: tmDiff > 5.0
    };
  }

  /**
   * Simulates cycle-by-cycle PCR amplification yield factoring in thermal annealing
   * efficiency, Taq polymerase thermal denaturation half-life, and primer/dNTP
   * stoichiometric exhaustion (plateau effect).
   *
   * @param {Object} params
   * @param {number} params.ampliconLength - Length of amplified dsDNA product (bp)
   * @param {number} [params.cycles=30] - Number of thermal cycles (1 to 50)
   * @param {number} [params.initialTemplateCopies=1e4] - Starting template molecules
   * @param {number} [params.reactionVolume_uL=50] - Total PCR reaction volume (µL)
   * @param {number} [params.primerConc_nM=250] - Concentration of each primer (nM)
   * @param {number} [params.dNTP_mM=0.2] - Total dNTP concentration (mM)
   * @param {number} [params.annealingTemp=58.0] - Programmed thermal cycler Ta (°C)
   * @param {number} [params.primerMinTm=60.0] - Lowest primer Tm (°C)
   * @param {number} [params.polymeraseHalfLifeCycles=40] - Enzyme half-life in cycles
   * @returns {Object} { finalYield_ng, finalCopies, amplificationFactor, cycleHistory }
   */
  static simulatePCR({
    ampliconLength,
    cycles = 30,
    initialTemplateCopies = 1e4,
    reactionVolume_uL = 50,
    primerConc_nM = 250,
    dNTP_mM = 0.2,
    annealingTemp = 58.0,
    primerMinTm = 60.0,
    polymeraseHalfLifeCycles = 40
  }) {
    if (ampliconLength <= 0 || cycles < 1) {
      throw new RangeError('Amplicon length and cycle count must be positive.');
    }

    const AVOGADRO = 6.02214076e23;
    const vol_L = reactionVolume_uL * 1e-6;

    // Total limiting molecules of primer and dNTPs in the tube
    const initialPrimerMolecules = primerConc_nM * 1e-9 * vol_L * AVOGADRO;
    const initialDntpMolecules = dNTP_mM * 1e-3 * vol_L * AVOGADRO;

    // Each new dsDNA copy consumes 2 primers and (2 * ampliconLength) dNTPs
    const maxCopiesByPrimer = initialPrimerMolecules;
    const maxCopiesByDntp = initialDntpMolecules / (2 * ampliconLength);
    const stoichiometricCeiling = Math.min(maxCopiesByPrimer, maxCopiesByDntp);

    // Thermal annealing efficiency penalty if Ta is above Primer Tm
    let thermalEfficiency = 0.96;
    if (annealingTemp > primerMinTm) {
      // Steep sigmoidal drop-off when Ta exceeds Tm
      thermalEfficiency *= 1 / (1 + Math.exp((annealingTemp - primerMinTm) * 0.8));
    } else if (primerMinTm - annealingTemp > 10) {
      // Mispriming penalty when Ta is far too low
      thermalEfficiency *= 0.75;
    }

    let currentCopies = initialTemplateCopies;
    const cycleHistory = [];

    for (let c = 1; c <= cycles; c++) {
      // Enzyme thermal decay factor: 0.5^(c / halfLife)
      const enzymeActivity = Math.pow(0.5, (c - 1) / polymeraseHalfLifeCycles);

      // Available fraction of limiting reagents (Monod-like saturation towards plateau)
      const remainingFraction = Math.max(0, (stoichiometricCeiling - currentCopies) / stoichiometricCeiling);
      const saturationFactor = remainingFraction / (0.08 + remainingFraction);

      const effectiveEfficiency = thermalEfficiency * enzymeActivity * saturationFactor;
      const newCopies = Math.min(
         currentCopies * effectiveEfficiency,
        Math.max(0, stoichiometricCeiling - currentCopies)
      );

      currentCopies += newCopies;

      // Convert copy number to mass in nanograms: Mass (ng) = (Copies * bp * 650 Da) / Avogadro * 1e9
      const mass_ng = (currentCopies * ampliconLength * 650 * 1e9) / AVOGADRO;

      cycleHistory.push({
        cycle: c,
        efficiency: Number(effectiveEfficiency.toFixed(4)),
        copies: Math.round(currentCopies),
        mass_ng: Number(mass_ng.toFixed(3))
      });
    }

    const finalState = cycleHistory[cycleHistory.length - 1];
    return {
      ampliconLength,
      cycles,
      finalCopies: finalState.copies,
      finalYield_ng: finalState.mass_ng,
      concentration_ng_uL: Number((finalState.mass_ng / reactionVolume_uL).toFixed(2)),
      amplificationFactor: Number((finalState.copies / initialTemplateCopies).toExponential(2)),
      cycleHistory
    };
  }

  /**
   * Computes agarose gel electrophoresis band migration coordinates using
   * logarithmic Ferguson-plot sieving kinetics: Rf = a - b * log10(bp).
   *
   * @param {number[]} fragmentSizesBp - Array of DNA fragment lengths in bp
   * @param {Object} [gelParams]
   * @param {number} [gelParams.agarosePercent=1.0] - Gel percentage (0.5% to 3.0%)
   * @param {number} [gelParams.voltage=100] - Applied voltage (V)
   * @param {number} [gelParams.runTimeMinutes=45] - Electrophoresis duration (min)
   * @param {number} [gelParams.gelLengthPx=400] - Virtual gel lane height in pixels
   * @param {number} [gelParams.wellOffsetPx=25] - Top well Y-offset in pixels
   */
  static simulateGelMigration(fragmentSizesBp, {
    agarosePercent = 1.0,
    voltage = 100,
    runTimeMinutes = 45,
    gelLengthPx = 400,
    wellOffsetPx = 25
  } = {}) {
    if (!Array.isArray(fragmentSizesBp)) {
      throw new TypeError('fragmentSizesBp must be an array of base-pair integers.');
    }

    // Effective migration scaling relative to standard 100V, 45 min run
    const fieldProgress = Math.min(1.25, (voltage / 100) * (runTimeMinutes / 45));
    const effectiveLaneSpan = gelLengthPx - wellOffsetPx - 20;

    // Higher agarose % shifts resolution window toward smaller fragments
    const logMaxBp = 4.35 - 0.28 * (agarosePercent - 1.0); // ~22,000 bp at 1% gel
    const logMinBp = 1.70 - 0.20 * (agarosePercent - 1.0); // ~50 bp at 1% gel

    return fragmentSizesBp.map((bp) => {
      const clampedBp = Math.max(20, bp);
      const logBp = Math.log10(clampedBp);

      // Normalized relative mobility (Rf) in [0.02, 0.98]
      const rawRf = (logMaxBp - logBp) / (logMaxBp - logMinBp);
      const rf = Math.max(0.02, Math.min(0.98, rawRf * fieldProgress));
      const yPixel = Number((wellOffsetPx + rf * effectiveLaneSpan).toFixed(1));

      // Higher molecular weight bands bind proportionally more intercalating dye (EtBr / SYBR Safe)
      const relativeIntensity = Number(Math.min(1.0, Math.log10(clampedBp) / 4.0).toFixed(2));

      return {
        bp: clampedBp,
        logBp: Number(logBp.toFixed(3)),
        rf: Number(rf.toFixed(4)),
        yPixel,
        relativeIntensity
      };
    });
  }
}

/**
 * Zero-Dependency Verification Test Suite for Module 3
 */
export function runPcrGelTests() {
  const results = [];
  const assert = (name, condition, expected, actual) => {
    results.push({
      test: name,
      expected,
      actual,
      status: condition ? 'PASS' : 'FAIL'
    });
  };

  // Test 1: GC-Rich Primer has Higher Nearest-Neighbor Tm than AT-Rich Primer of Equal Length
  const atRich = PcrGelEngine.computePrimerTm('ATATATATATATATATATAT'); // 20-mer, 0% GC
  const gcRich = PcrGelEngine.computePrimerTm('GCGCGCGCGCGCGCGCGCGC'); // 20-mer, 100% GC
  assert(
    'SantaLucia Nearest-Neighbor Tm Scaling (GC-Rich > AT-Rich)',
    gcRich.Tm_NN > atRich.Tm_NN + 25,
    'Tm(GC) > Tm(AT) + 25°C',
    `Tm(GC)=${gcRich.Tm_NN}°C vs Tm(AT)=${atRich.Tm_NN}°C`
  );

  // Test 2: Salt Dependence (Higher [Na+] and [Mg2+] Stabilize DNA Duplex and Increase Tm)
  const lowSalt = PcrGelEngine.computePrimerTm('GCTAGCTAGCTAGCTAGCTA', { Na_mM: 10, Mg_mM: 0.5 });
  const highSalt = PcrGelEngine.computePrimerTm('GCTAGCTAGCTAGCTAGCTA', { Na_mM: 100, Mg_mM: 3.0 });
  assert(
    'Ionic Strength Stabilization (High Salt Tm > Low Salt Tm)',
    highSalt.Tm_NN > lowSalt.Tm_NN,
    'HighSalt > LowSalt',
    `${highSalt.Tm_NN}°C > ${lowSalt.Tm_NN}°C`
  );

  // Test 3: In Silico Primer Annealing & Amplicon Extraction
  const template = 'TTTTT' + 'ATGGCTAGCAAAGGAGAA' + 'CCCCCCCCCC' + 'TTCTCCTTTGCTAGCCAT' + 'AAAAA';
  const fwd = 'ATGGCTAGCAAAGGAGAA'; // 18 bp
  const rev = 'ATGGCTAGCAAAGGAGAA'; // Reverse complement is TTCTCCTTTGCTAGCCAT (18 bp)
  const amp = PcrGelEngine.findAmplicon(template, fwd, rev);
  // Expected length: 18 (fwd) + 10 (C's) + 18 (revBind) = 46 bp
  assert(
    'In Silico Amplicon Coordinate & Length Extraction',
    amp.ampliconLength === 46 && amp.ampliconStart === 6 && amp.ampliconEnd === 51,
    'Length=46 (6..51)',
    `Length=${amp.ampliconLength} (${amp.ampliconStart}..${amp.ampliconEnd})`
  );

  // Test 4: PCR Exponential Phase vs. Stoichiometric Plateau Conservation
  const pcrRun = PcrGelEngine.simulatePCR({
    ampliconLength: 500,
    cycles: 35,
    initialTemplateCopies: 1e4,
    primerConc_nM: 250,
    reactionVolume_uL: 50
  });
  const earlyEff = pcrRun.cycleHistory[2].efficiency;  // Cycle 3 (exponential)
  const lateEff = pcrRun.cycleHistory[34].efficiency;  // Cycle 35 (plateau)
  assert(
    'PCR Plateau Kinetics (Cycle 3 Efficiency > Cycle 35 Efficiency)',
    earlyEff > 0.80 && lateEff < 0.25 && pcrRun.finalYield_ng > 100,
    'Eff(c3)>0.80 & Eff(c35)<0.25',
    `Eff(c3)=${earlyEff}, Eff(c35)=${lateEff}, Yield=${pcrRun.finalYield_ng}ng`
  );

  // Test 5: Agarose Gel Logarithmic Migration Monotonicity (Smaller bp Migrates Further Down Lane)
  const ladderBands = PcrGelEngine.simulateGelMigration([10000, 3000, 1000, 500, 100], { agarosePercent: 1.0 });
  const strictlyIncreasingMigration = ladderBands.every((band, idx) =>
    idx === 0 || band.yPixel > ladderBands[idx - 1].yPixel
  );
  assert(
    'Agarose Gel Ferguson Log-Migration Ordering (100bp yPx > 10kb yPx)',
    strictlyIncreasingMigration,
    'Monotonic Y-pixel increase',
    ladderBands.map(b => `${b.bp}bp:${b.yPixel}px`).join(' < ')
  );

  return results;
}

// Auto-execute test suite if run directly in Node.js
if (typeof process !== 'undefined' && process.argv && import.meta.url.endsWith(process.argv[1])) {
  const report = runPcrGelTests();
  console.table(report);
  const failed = report.filter(r => r.status === 'FAIL');
  if (failed.length > 0) process.exit(1);
}