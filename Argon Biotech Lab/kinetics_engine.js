/**
 * Virtual BioTech & BioChem Lab — Module 1: Biochemical & Fermentation Kinetics Engine
 * @module kinetics_engine
 * @version 1.0.0
 *
 * Pure numerical solvers for enzyme kinetics and microbial bioreactor dynamics
 * using 4th-Order Runge-Kutta (RK4) integration. Zero external dependencies.
 */

export class KineticsEngine {
  /**
   * Computes apparent kinetic parameters (Vmax_app, Km_app) and instantaneous
   * reaction velocity (v) under generalized reversible Michaelis-Menten kinetics.
   *
   * Rate Law:
   *   v = (Vmax * [S]) / (Km * alpha + [S] * alpha_prime)
   *   where alpha = 1 + [I]/Kic, and alpha_prime = 1 + [I]/Kiu
   *
   * @param {Object} params
   * @param {number} params.S - Substrate concentration (mM)
   * @param {number} params.E - Enzyme concentration (µM)
   * @param {number} params.kcat - Catalytic turnover number (s^-1)
   * @param {number} params.Km - Michaelis constant (mM)
   * @param {string} [params.inhibitorType='none'] - 'none' | 'competitive' | 'noncompetitive' | 'uncompetitive' | 'mixed'
   * @param {number} [params.I=0] - Inhibitor concentration (mM)
   * @param {number} [params.Kic=1.0] - Competitive inhibition dissociation constant (mM)
   * @param {number} [params.Kiu=1.0] - Uncompetitive inhibition dissociation constant (mM)
   * @returns {Object} { v, Vmax, Vmax_app, Km_app, alpha, alphaPrime }
   */
  static computeEnzymeRate({
    S,
    E,
    kcat,
    Km,
    inhibitorType = 'none',
    I = 0,
    Kic = 1.0,
    Kiu = 1.0
  }) {
    if (S < 0 || E < 0 || kcat < 0 || Km <= 0) {
      throw new RangeError('Concentrations and kinetic constants must be non-negative (Km > 0).');
    }

    // Convert E from µM to mM so Vmax is expressed in mM/s
    const E_mM = E * 1e-3;
    const Vmax = kcat * E_mM;

    let alpha = 1.0;
    let alphaPrime = 1.0;

    if (I > 0) {
      switch (inhibitorType.toLowerCase()) {
        case 'competitive':
          alpha = 1.0 + I / Kic;
          break;
        case 'uncompetitive':
          alphaPrime = 1.0 + I / Kiu;
          break;
        case 'noncompetitive':
          // Pure non-competitive: Kic = Kiu
          alpha = 1.0 + I / Kic;
          alphaPrime = 1.0 + I / Kic;
          break;
        case 'mixed':
          alpha = 1.0 + I / Kic;
          alphaPrime = 1.0 + I / Kiu;
          break;
        case 'none':
        default:
          break;
      }
    }

    const Vmax_app = Vmax / alphaPrime;
    const Km_app = (Km * alpha) / alphaPrime;
    const v = S > 0 ? (Vmax_app * S) / (Km_app + S) : 0;

    return {
      v,          // Instantaneous velocity (mM/s)
      Vmax,       // Uninhibited Vmax (mM/s)
      Vmax_app,   // Apparent Vmax (mM/s)
      Km_app,     // Apparent Km (mM)
      alpha,
      alphaPrime
    };
  }

  /**
   * Computes optical absorbance via the Beer-Lambert Law: A = epsilon * c * l
   *
   * @param {number} concentration_mM - Analyte concentration (mM)
   * @param {number} [epsilon=0.082] - Extinction coefficient (mM^-1 cm^-1)
   * @param {number} [pathLength_cm=1.0] - Cuvette optical path length (cm)
   * @returns {number} Absorbance units (AU)
   */
  static computeAbsorbance(concentration_mM, epsilon = 0.082, pathLength_cm = 1.0) {
    return Math.max(0, concentration_mM * epsilon * pathLength_cm);
  }

  /**
   * Advances an enzyme-catalyzed reaction by time step dt using 4th-order Runge-Kutta (RK4)
   * and enforces strict 1:1 stoichiometric mass balance ([S]_0 + [P]_0 = [S]_t + [P]_t).
   *
   * @param {Object} state - { S: number, P: number, t: number }
   * @param {Object} params - Kinetic parameters passed to computeEnzymeRate
   * @param {number} dt - Time step (seconds)
   * @returns {Object} Updated state { t, S, P, v, absorbance, Vmax_app, Km_app }
   */
  static stepEnzymeReaction(state, params, dt = 0.5) {
    const { S, P, t = 0 } = state;
    const totalMass = S + P;

    const rateFn = (sVal) => {
      const clampedS = Math.max(0, sVal);
      return this.computeEnzymeRate({ ...params, S: clampedS }).v;
    };

    // 4th-Order Runge-Kutta integration for dS/dt = -v(S)
    const k1 = -rateFn(S);
    const k2 = -rateFn(S + 0.5 * dt * k1);
    const k3 = -rateFn(S + 0.5 * dt * k2);
    const k4 = -rateFn(S + dt * k3);

    const deltaS = (dt / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4);
    const nextS = Math.max(0, Math.min(totalMass, S + deltaS));
    const nextP = totalMass - nextS; // Strict mass conservation

    const currentKinetics = this.computeEnzymeRate({ ...params, S: nextS });
    const absorbance = this.computeAbsorbance(
      nextP,
      params.epsilon ?? 0.082,
      params.pathLength ?? 1.0
    );

    return {
      t: Number((t + dt).toFixed(6)),
      S: nextS,
      P: nextP,
      v: currentKinetics.v,
      absorbance,
      Vmax_app: currentKinetics.Vmax_app,
      Km_app: currentKinetics.Km_app
    };
  }

  /**
   * Computes instantaneous specific growth rate (mu) and environmental modulation
   * factors for a microbial bioreactor using the Monod equation coupled with
   * Gaussian temperature and pH fitness profiles.
   *
   * @param {Object} params
   * @param {number} params.S - Limiting substrate concentration (g/L)
   * @param {number} [params.muMax=0.8] - Maximum specific growth rate (h^-1)
   * @param {number} [params.Ks=0.5] - Monod half-saturation constant (g/L)
   * @param {number} [params.temp=37.0] - Bioreactor temperature (°C)
   * @param {number} [params.tempOpt=37.0] - Optimal growth temperature (°C)
   * @param {number} [params.tempWidth=6.32] - Thermal tolerance standard width (°C)
   * @param {number} [params.pH=7.0] - Medium pH
   * @param {number} [params.pHOpt=7.0] - Optimal growth pH
   * @param {number} [params.pHWidth=1.22] - pH tolerance standard width
   * @returns {Object} { mu, muEffMax, tempFactor, phFactor, doublingTime }
   */
  static computeMonodRate({
    S,
    muMax = 0.8,
    Ks = 0.5,
    temp = 37.0,
    tempOpt = 37.0,
    tempWidth = 6.32,
    pH = 7.0,
    pHOpt = 7.0,
    pHWidth = 1.22
  }) {
    if (S < 0 || muMax < 0 || Ks <= 0) {
      throw new RangeError('Substrate and Monod parameters must be non-negative (Ks > 0).');
    }

    const tempFactor = Math.exp(-Math.pow(temp - tempOpt, 2) / (2 * Math.pow(tempWidth, 2)));
    const phFactor = Math.exp(-Math.pow(pH - pHOpt, 2) / (2 * Math.pow(pHWidth, 2)));

    const muEffMax = muMax * tempFactor * phFactor;
    const mu = S > 0 ? muEffMax * (S / (Ks + S)) : 0;
    const doublingTime = mu > 1e-6 ? Math.LN2 / mu : Infinity;

    return {
      mu,
      muEffMax,
      tempFactor,
      phFactor,
      doublingTime
    };
  }

  /**
   * Advances microbial batch fermentation by dt (hours) using coupled RK4 integration.
   *
   * Coupled ODEs:
   *   dX/dt = (mu(S) - kd) * X
   *   dS/dt = -(mu(S) / Yxs) * X
   *
   * @param {Object} state - { X: number (Biomass g/L or OD600), S: number (Substrate g/L), t: number (hours) }
   * @param {Object} params - Bioreactor parameters (muMax, Ks, Yxs, kd, temp, pH)
   * @param {number} [dt=0.1] - Time step in hours
   * @returns {Object} Updated state { t, X, S, mu, doublingTime }
   */
  static stepBioreactor(state, params, dt = 0.1) {
    const { X, S, t = 0 } = state;
    const Yxs = params.Yxs ?? 0.5; // Biomass yield coefficient (g biomass / g substrate)
    const kd = params.kd ?? 0.01;  // Endogenous decay rate (h^-1)

    const derivatives = (xVal, sVal) => {
      const curX = Math.max(0, xVal);
      const curS = Math.max(0, sVal);
      const { mu } = this.computeMonodRate({ ...params, S: curS });

      const dXdt = (mu - kd) * curX;
      const dSdt = curS > 0 ? -(mu / Yxs) * curX : 0;
      return { dXdt, dSdt };
    };

    const k1 = derivatives(X, S);
    const k2 = derivatives(X + 0.5 * dt * k1.dXdt, S + 0.5 * dt * k1.dSdt);
    const k3 = derivatives(X + 0.5 * dt * k2.dXdt, S + 0.5 * dt * k2.dSdt);
    const k4 = derivatives(X + dt * k3.dXdt, S + dt * k3.dSdt);

    let nextS = S + (dt / 6.0) * (k1.dSdt + 2 * k2.dSdt + 2 * k3.dSdt + k4.dSdt);
    let nextX = X + (dt / 6.0) * (k1.dXdt + 2 * k2.dXdt + 2 * k3.dXdt + k4.dXdt);

    // Prevent substrate underflow and cap biomass gain to remaining substrate yield
    if (nextS < 0) {
      const maxBiomassGain = S * Yxs;
      nextX = X + maxBiomassGain - kd * X * dt;
      nextS = 0;
    }

    nextX = Math.max(0, nextX);
    const currentMonod = this.computeMonodRate({ ...params, S: nextS });

    return {
      t: Number((t + dt).toFixed(6)),
      X: nextX,
      S: nextS,
      mu: currentMonod.mu,
      doublingTime: currentMonod.doublingTime
    };
  }
}

/**
 * Zero-Dependency Verification Test Suite
 * Validates analytical identities, inhibition scaling, and conservation of mass.
 */
export function runKineticsTests() {
  const results = [];
  const assertApprox = (name, actual, expected, tol = 1e-5) => {
    const passed = Math.abs(actual - expected) <= tol;
    results.push({
      test: name,
      expected: Number(expected.toFixed(6)),
      actual: Number(actual.toFixed(6)),
      status: passed ? 'PASS' : 'FAIL'
    });
  };

  // Test 1: Half-maximal velocity identity (When [S] == Km, v must equal 0.5 * Vmax)
  const r1 = KineticsEngine.computeEnzymeRate({ S: 2.5, E: 100, kcat: 20, Km: 2.5 });
  // E = 0.1 mM, kcat = 20 s^-1 => Vmax = 2.0 mM/s; at S = Km, v = 1.0 mM/s
  assertApprox('Michaelis-Menten Half-Max Velocity ([S] = Km)', r1.v, 1.0);

  // Test 2: Competitive Inhibition (I = Kic => alpha = 2 => Km_app = 2 * Km, Vmax_app = Vmax)
  const r2 = KineticsEngine.computeEnzymeRate({
    S: 5.0, E: 100, kcat: 20, Km: 2.5,
    inhibitorType: 'competitive', I: 2.0, Kic: 2.0
  });
  assertApprox('Competitive Inhibition Apparent Km Scaling (alpha=2)', r2.Km_app, 5.0);
  assertApprox('Competitive Inhibition Unchanged Vmax', r2.Vmax_app, 2.0);

  // Test 3: Non-Competitive Inhibition (I = Kic => Vmax_app = 0.5 * Vmax, Km_app = Km)
  const r3 = KineticsEngine.computeEnzymeRate({
    S: 2.5, E: 100, kcat: 20, Km: 2.5,
    inhibitorType: 'noncompetitive', I: 2.0, Kic: 2.0
  });
  assertApprox('Non-Competitive Inhibition Vmax Halving', r3.Vmax_app, 1.0);
  assertApprox('Non-Competitive Inhibition Unchanged Km', r3.Km_app, 2.5);

  // Test 4: Uncompetitive Inhibition (I = Kiu => both Vmax_app and Km_app halve)
  const r4 = KineticsEngine.computeEnzymeRate({
    S: 2.5, E: 100, kcat: 20, Km: 2.5,
    inhibitorType: 'uncompetitive', I: 2.0, Kiu: 2.0
  });
  assertApprox('Uncompetitive Inhibition Vmax_app Scaling', r4.Vmax_app, 1.0);
  assertApprox('Uncompetitive Inhibition Km_app Scaling', r4.Km_app, 1.25);

  // Test 5: Multi-step RK4 Stoichiometric Mass Balance ([S]_t + [P]_t === [S]_0 + [P]_0)
  let enzState = { S: 15.0, P: 0.0, t: 0 };
  const initialMass = enzState.S + enzState.P;
  for (let i = 0; i < 200; i++) {
    enzState = KineticsEngine.stepEnzymeReaction(
      enzState,
      { E: 50, kcat: 15, Km: 2.5, inhibitorType: 'none' },
      0.25
    );
  }
  assertApprox('RK4 Enzyme Reaction Mass Balance Conservation', enzState.S + enzState.P, initialMass, 1e-12);

  // Test 6: Beer-Lambert Photometry (c = 10 mM, epsilon = 0.082, l = 1.0 cm => A = 0.820)
  const abs = KineticsEngine.computeAbsorbance(10.0, 0.082, 1.0);
  assertApprox('Beer-Lambert Law Photometric Absorbance', abs, 0.82);

  // Test 7: Monod Bioreactor Stoichiometric Yield (With kd = 0, Delta_X / -Delta_S === Yxs)
  let bioState = { X: 0.1, S: 20.0, t: 0 };
  const Yxs = 0.5;
  for (let i = 0; i < 50; i++) {
    bioState = KineticsEngine.stepBioreactor(
      bioState,
      { muMax: 0.8, Ks: 0.5, Yxs, kd: 0.0, temp: 37.0, pH: 7.0 },
      0.1
    );
  }
  const actualYield = (bioState.X - 0.1) / (20.0 - bioState.S);
  assertApprox('Monod Bioreactor Yield Conservation (Delta_X / Delta_S = Yxs)', actualYield, Yxs, 1e-6);

  return results;
}

// Auto-execute test suite if run directly in Node.js or browser console
if (typeof process !== 'undefined' && process.argv && import.meta.url.endsWith(process.argv[1])) {
  const report = runKineticsTests();
  console.table(report);
  const failed = report.filter(r => r.status === 'FAIL');
  if (failed.length > 0) process.exit(1);
}