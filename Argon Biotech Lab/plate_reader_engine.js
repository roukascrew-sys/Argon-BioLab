/**
 * Virtual BioTech & BioChem Lab — Module 8: 96-Well Microplate Reader & Lineweaver-Burk Engine
 * @module plate_reader_engine
 * @version 8.0.0
 *
 * Simulates an 8x12 (96-well) optical absorbance microplate reader, serial dilution
 * liquid handling, and Lineweaver-Burk double-reciprocal linear regression (1/v vs 1/[S])
 * for empirical recovery of Vmax and Km. Zero external dependencies.
 */

export class PlateReaderEngine {
  static ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  static COLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  /**
   * Generates a 12-column serial dilution array of substrate concentrations (mM).
   * Column 12 can optionally be reserved as a 0 mM blank control well.
   *
   * @param {number} [startConc_mM=40.0] - Concentration in Column 1 (mM)
   * @param {number} [dilutionFactor=1.6] - Stepwise fold-dilution factor (> 1.0)
   * @param {boolean} [col12Blank=true] - Whether Column 12 is a 0 mM reagent blank
   * @returns {number[]} Array of 12 substrate concentrations (mM)
   */
  static generateSerialDilution(startConc_mM = 40.0, dilutionFactor = 1.6, col12Blank = true) {
    if (startConc_mM <= 0 || dilutionFactor <= 0) {
      throw new RangeError('Start concentration and dilution factor must be positive.');
    }
    const concs = [];
    for (let c = 0; c < 12; c++) {
      if (col12Blank && c === 11) {
        concs.push(0.0);
      } else {
        const val = startConc_mM / Math.pow(dilutionFactor, c);
        concs.push(Number(val.toFixed(4)));
      }
    }
    return concs;
  }

  /**
   * Simulates an entire 96-well microplate assay (8 rows x 12 columns), computing
   * initial reaction velocity (v0), product accumulated over incubation time,
   * optical density (OD405 nm for p-nitrophenol chromophore), and visual RGB well color.
   *
   * Row Regimen Assignment:
   *  - Row A & E: Uninhibited Control
   *  - Row B & F: Competitive Inhibitor ([I] = 3.0 mM)
   *  - Row C & G: Non-Competitive Inhibitor ([I] = 3.0 mM)
   *  - Row D & H: Uncompetitive Inhibitor ([I] = 3.0 mM)
   *
   * @param {Object} [params]
   * @param {number} [params.startS_mM=40.0] - Starting substrate in Col 1 (mM)
   * @param {number} [params.dilutionFactor=1.55] - Serial dilution factor across Cols 1-11
   * @param {number} [params.E_uM=50.0] - Enzyme concentration (µM)
   * @param {number} [params.kcat=15.0] - Turnover number (s^-1)
   * @param {number} [params.Km=3.0] - True Michaelis constant (mM)
   * @param {number} [params.I_mM=3.0] - Inhibitor concentration for inhibited rows (mM)
   * @param {number} [params.Kic=2.0] - Competitive Ki (mM)
   * @param {number} [params.Kiu=2.0] - Uncompetitive Ki (mM)
   * @param {number} [params.incubationSec=3.5] - Assay incubation time before reading (s)
   * @param {string} [params.dye='pnp'] - 'pnp' (405nm yellow) | 'bradford' (595nm blue)
   */
  static simulateMicroplateAssay({
    startS_mM = 40.0,
    dilutionFactor = 1.55,
    E_uM = 50.0,
    kcat = 15.0,
    Km = 3.0,
    I_mM = 3.0,
    Kic = 2.0,
    Kiu = 2.0,
    incubationSec = 3.5,
    dye = 'pnp'
  } = {}) {
    const substrateGradient = this.generateSerialDilution(startS_mM, dilutionFactor, true);
    const Vmax = kcat * (E_uM * 1e-3); // mM/s

    const rowModes = [
      { row: 'A', mode: 'none',           label: 'Uninhibited Control (Rep 1)' },
      { row: 'B', mode: 'competitive',    label: 'Competitive Inhibitor (Rep 1)' },
      { row: 'C', mode: 'noncompetitive', label: 'Non-Competitive Inhibitor (Rep 1)' },
      { row: 'D', mode: 'uncompetitive',  label: 'Uncompetitive Inhibitor (Rep 1)' },
      { row: 'E', mode: 'none',           label: 'Uninhibited Control (Rep 2)' },
      { row: 'F', mode: 'competitive',    label: 'Competitive Inhibitor (Rep 2)' },
      { row: 'G', mode: 'noncompetitive', label: 'Non-Competitive Inhibitor (Rep 2)' },
      { row: 'H', mode: 'uncompetitive',  label: 'Uncompetitive Inhibitor (Rep 2)' }
    ];

    const wells = [];
    const matrix = [];

    for (let rIdx = 0; rIdx < 8; rIdx++) {
      const { row, mode, label } = rowModes[rIdx];
      const rowWells = [];

      let alpha = 1.0;
      let alphaPrime = 1.0;
      if (mode === 'competitive') alpha = 1.0 + I_mM / Kic;
      else if (mode === 'noncompetitive') { alpha = 1.0 + I_mM / Kic; alphaPrime = 1.0 + I_mM / Kic; }
      else if (mode === 'uncompetitive') alphaPrime = 1.0 + I_mM / Kiu;

      const Vmax_app = Vmax / alphaPrime;
      const Km_app = (Km * alpha) / alphaPrime;

      for (let cIdx = 0; cIdx < 12; cIdx++) {
        const col = cIdx + 1;
        const wellId = `${row}${String(col).padStart(2, '0')}`;
        const S = substrateGradient[cIdx];

        const v0 = S > 0 ? (Vmax_app * S) / (Km_app + S) : 0;
        const product_mM = Math.min(S, v0 * incubationSec);

        // Beer-Lambert OD (epsilon = 0.45 mM^-1 cm^-1 for chromogenic assay, path = 0.5 cm well depth)
        const od = Number((0.042 + product_mM * 0.45).toFixed(4)); // 0.042 background plate blank
        const netOd = Number(Math.max(0, od - 0.042).toFixed(4));
        const colorCss = this.odToColor(netOd, dye);

        const wellObj = {
          wellId,
          row,
          col,
          rowIndex: rIdx,
          colIndex: cIdx,
          regimen: mode,
          regimenLabel: label,
          S_mM: S,
          v0_mM_s: Number(v0.toFixed(5)),
          product_mM: Number(product_mM.toFixed(4)),
          od,
          netOd,
          colorCss
        };

        wells.push(wellObj);
        rowWells.push(wellObj);
      }
      matrix.push(rowWells);
    }

    return {
      substrateGradient,
      trueVmax: Number(Vmax.toFixed(4)),
      trueKm: Number(Km.toFixed(4)),
      wells,
      matrix
    };
  }

  /**
   * Maps net optical density (OD) to realistic colorimetric RGB CSS strings.
   */
  static odToColor(netOd, dye = 'pnp') {
    const norm = Math.max(0, Math.min(1, netOd / 1.4));
    if (dye === 'bradford') {
      // Coomassie Brilliant Blue G-250 shift (brownish-red -> intense azure blue)
      const r = Math.round(95 * (1 - norm) + 25 * norm);
      const g = Math.round(75 * (1 - norm) + 115 * norm);
      const b = Math.round(85 * (1 - norm) + 245 * norm);
      const a = (0.28 + 0.68 * norm).toFixed(2);
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    // Default p-Nitrophenol (pNP) alkaline phosphatase / beta-galactosidase yellow chromophore
    const r = Math.round(45 + 210 * norm);
    const g = Math.round(50 + 185 * norm);
    const b = Math.round(65 * (1 - norm) + 15 * norm);
    const a = (0.22 + 0.75 * norm).toFixed(2);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  /**
   * Performs Lineweaver-Burk Double-Reciprocal Linear Regression:
   *   1 / v0 = (Km / Vmax) * (1 / [S]) + (1 / Vmax)
   *
   * Uses Ordinary Least Squares (OLS) on all non-zero substrate wells in a row
   * to algebraically extract apparent Vmax, Km, slope, y-intercept, x-intercept, and R^2.
   *
   * @param {number[]} substrateArray - Array of substrate concentrations [S] (mM)
   * @param {number[]} velocityArray - Array of corresponding initial rates v0 (mM/s)
   * @returns {Object} { Vmax_fit, Km_fit, slope, yIntercept, xIntercept, rSquared, points }
   */
  static fitLineweaverBurk(substrateArray, velocityArray) {
    if (!Array.isArray(substrateArray) || !Array.isArray(velocityArray)) {
      throw new TypeError('Substrate and velocity inputs must be arrays.');
    }

    const points = [];
    for (let i = 0; i < Math.min(substrateArray.length, velocityArray.length); i++) {
      const s = substrateArray[i];
      const v = velocityArray[i];
      if (s > 1e-6 && v > 1e-6) {
        points.push({
          invS: Number((1 / s).toFixed(5)),
          invV: Number((1 / v).toFixed(5)),
          S: s,
          v: v
        });
      }
    }

    if (points.length < 2) {
      throw new Error('At least 2 non-zero ([S], v0) data points are required for Lineweaver-Burk regression.');
    }

    const n = points.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;

    for (const p of points) {
      sumX += p.invS;
      sumY += p.invV;
      sumXY += p.invS * p.invV;
      sumXX += p.invS * p.invS;
      sumYY += p.invV * p.invV;
    }

    const denom = n * sumXX - sumX * sumX;
    const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
    const yIntercept = (sumY - slope * sumX) / n;

    // Coefficient of determination (R^2)
    const ssTot = sumYY - (sumY * sumY) / n;
    const ssRes = points.reduce((acc, p) => {
      const yPred = slope * p.invS + yIntercept;
      return acc + Math.pow(p.invV - yPred, 2);
    }, 0);
    const rSquared = ssTot > 1e-12 ? Math.max(0, 1 - ssRes / ssTot) : 1.0;

    // Recover kinetic constants: yIntercept = 1 / Vmax, slope = Km / Vmax
    const Vmax_fit = yIntercept > 0 ? 1 / yIntercept : 0;
    const Km_fit = slope * Vmax_fit;
    const xIntercept = Km_fit > 0 ? -1 / Km_fit : 0;

    // Sort points ascending by 1/[S] for clean plotting
    points.sort((a, b) => a.invS - b.invS);

    return {
      Vmax_fit: Number(Vmax_fit.toFixed(4)),
      Km_fit: Number(Km_fit.toFixed(4)),
      slope: Number(slope.toFixed(4)),
      yIntercept: Number(yIntercept.toFixed(4)),
      xIntercept: Number(xIntercept.toFixed(4)),
      rSquared: Number(rSquared.toFixed(5)),
      points
    };
  }

  /**
   * Renders the 96-well microplate onto an HTML5 Canvas and supports well hover detection.
   */
  static renderMicroplate(canvas, plateData, options = {}) {
    if (!canvas || typeof canvas.getContext !== 'function') return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#090d14';
    ctx.fillRect(0, 0, width, height);

    const padLeft = 28;
    const padTop = 26;
    const cellW = (width - padLeft - 10) / 12;
    const cellH = (height - padTop - 10) / 8;
    const radius = Math.min(cellW, cellH) * 0.39;

    // Column headers (1..12)
    ctx.fillStyle = '#8b949e';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let c = 0; c < 12; c++) {
      ctx.fillText(String(c + 1), padLeft + c * cellW + cellW / 2, 13);
    }

    // Row headers (A..H) & Wells
    for (let r = 0; r < 8; r++) {
      const cy = padTop + r * cellH + cellH / 2;
      ctx.fillStyle = '#8b949e';
      ctx.fillText(this.ROWS[r], 14, cy);

      for (let c = 0; c < 12; c++) {
        const cx = padLeft + c * cellW + cellW / 2;
        const well = plateData.matrix[r][c];
        const isSelected = options.hoveredWellId === well.wellId;

        // Liquid fill
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        ctx.fillStyle = well.colorCss;
        ctx.fill();

        // Well rim
        ctx.lineWidth = isSelected ? 2.2 : 1.1;
        ctx.strokeStyle = isSelected ? '#58a6ff' : '#30363d';
        ctx.stroke();
      }
    }
  }

  /**
   * Binds mouse hover and click events to a 96-well microplate canvas.
   */
  static bindInteractivePlate(canvas, getPlateDataFn, callbacks = {}) {
    if (!canvas) return;

    const hitTestWell = (evt) => {
      const plateData = getPlateDataFn();
      if (!plateData) return null;

      const rect = canvas.getBoundingClientRect();
      const x = (evt.clientX - rect.left) * (canvas.width / rect.width);
      const y = (evt.clientY - rect.top) * (canvas.height / rect.height);

      const padLeft = 28, padTop = 26;
      const cellW = (canvas.width - padLeft - 10) / 12;
      const cellH = (canvas.height - padTop - 10) / 8;

      const colIdx = Math.floor((x - padLeft) / cellW);
      const rowIdx = Math.floor((y - padTop) / cellH);

      if (rowIdx >= 0 && rowIdx < 8 && colIdx >= 0 && colIdx < 12) {
        return plateData.matrix[rowIdx][colIdx];
      }
      return null;
    };

    canvas.addEventListener('mousemove', (evt) => {
      const well = hitTestWell(evt);
      const plateData = getPlateDataFn();
      canvas.style.cursor = well ? 'pointer' : 'default';
      this.renderMicroplate(canvas, plateData, { hoveredWellId: well ? well.wellId : null });
      if (well && callbacks.onHover) callbacks.onHover(well);
    });

    canvas.addEventListener('click', (evt) => {
      const well = hitTestWell(evt);
      if (well && callbacks.onSelect) callbacks.onSelect(well);
    });
  }
}

/**
 * Zero-Dependency Verification Test Suite for Module 8
 */
export function runPlateReaderTests() {
  const results = [];
  const assert = (name, condition, expected, actual) => {
    results.push({
      test: name,
      expected,
      actual,
      status: condition ? 'PASS' : 'FAIL'
    });
  };

  // Test 1: 12-Column Serial Dilution & Blank Control Generation
  const dil = PlateReaderEngine.generateSerialDilution(32.0, 2.0, true);
  // Col 1 = 32.0, Col 2 = 16.0, Col 3 = 8.0 ... Col 12 = 0.0 (blank)
  assert(
    '12-Column 2-Fold Serial Dilution & Blank Control',
    dil.length === 12 && dil[0] === 32.0 && dil[2] === 8.0 && dil[11] === 0.0,
    'Col1=32, Col3=8, Col12=0',
    `Col1=${dil[0]}, Col3=${dil[2]}, Col12=${dil[11]}`
  );

  // Test 2: Full 96-Well Matrix Simulation Dimensions & Monotonic OD Gradient
  const plate = PlateReaderEngine.simulateMicroplateAssay({
    startS_mM: 40.0, E_uM: 50.0, kcat: 15.0, Km: 3.0
  });
  const rowA = plate.matrix[0];
  assert(
    '96-Well Plate Optical Density Gradient (Well A01 > Well A10 > Blank A12)',
    plate.wells.length === 96 && rowA[0].netOd > rowA[9].netOd && rowA[11].netOd === 0,
    '96 wells, A01 > A10 > A12(0)',
    `${plate.wells.length} wells, A01=${rowA[0].netOd} > A10=${rowA[9].netOd} > A12=${rowA[11].netOd}`
  );

  // Test 3: Lineweaver-Burk Algebraic Parameter Recovery (Uninhibited Control Row A)
  const sArr = rowA.map(w => w.S_mM);
  const vArr = rowA.map(w => w.v0_mM_s);
  const fitA = PlateReaderEngine.fitLineweaverBurk(sArr, vArr);
  // True Vmax = 15 * 0.05 = 0.75 mM/s, True Km = 3.0 mM
  assert(
    'Lineweaver-Burk OLS Regression Parameter Recovery (Vmax & Km)',
    Math.abs(fitA.Vmax_fit - 0.75) < 1e-2 && Math.abs(fitA.Km_fit - 3.0) < 1e-2 && fitA.rSquared > 0.999,
    'Vmax=0.75, Km=3.0, R²=1.0',
    `Vmax=${fitA.Vmax_fit}, Km=${fitA.Km_fit}, R²=${fitA.rSquared}`
  );

  // Test 4: Competitive vs. Non-Competitive Lineweaver-Burk Signature Verification
  const rowB = plate.matrix[1]; // Competitive: Same y-intercept (Vmax=0.75), steeper slope (Km_app > 3.0)
  const rowC = plate.matrix[2]; // Non-competitive: Higher y-intercept (Vmax_app < 0.75), same Km (3.0)
  const fitComp = PlateReaderEngine.fitLineweaverBurk(rowB.map(w => w.S_mM), rowB.map(w => w.v0_mM_s));
  const fitNonComp = PlateReaderEngine.fitLineweaverBurk(rowC.map(w => w.S_mM), rowC.map(w => w.v0_mM_s));

  assert(
    'Lineweaver-Burk Inhibition Signatures (Comp shifts Km; Non-Comp shifts Vmax)',
    Math.abs(fitComp.Vmax_fit - 0.75) < 1e-2 &&
      fitComp.Km_fit > 6.0 &&
      fitNonComp.Vmax_fit < 0.4 &&
      Math.abs(fitNonComp.Km_fit - 3.0) < 1e-2,
    'Comp:(Vmax=0.75, Km=7.5), NonComp:(Vmax=0.3, Km=3.0)',
    `Comp:(Vmax=${fitComp.Vmax_fit}, Km=${fitComp.Km_fit}), NonComp:(Vmax=${fitNonComp.Vmax_fit}, Km=${fitNonComp.Km_fit})`
  );

  return results;
}

// Auto-execute test suite if run directly in Node.js
if (typeof process !== 'undefined' && process.argv && import.meta.url.endsWith(process.argv[1])) {
  const report = runPlateReaderTests();
  console.table(report);
  const failed = report.filter(r => r.status === 'FAIL');
  if (failed.length > 0) process.exit(1);
}