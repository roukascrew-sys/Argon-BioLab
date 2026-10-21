/**
 * Virtual BioTech & BioChem Lab — Module 7: Interactive Circular Plasmid Vector Map Engine
 * @module plasmid_map_engine
 * @version 7.0.0
 *
 * Pure polar-coordinate geometry and HTML5 Canvas renderer for circular plasmid maps,
 * directional gene feature chevrons, radial restriction enzyme cut sites, and
 * cursor hit-testing. Zero external dependencies.
 */

export class PlasmidMapEngine {
  /**
   * Default Reference Plasmid: pGFP-UV (2,686 bp)
   * Contains origin of replication (ori), Ampicillin resistance (AmpR),
   * lac promoter, and Green Fluorescent Protein (GFP) coding sequence.
   */
  static DEFAULT_PLASMID = {
    name: 'pGFP-UV',
    lengthBp: 2686,
    topology: 'circular',
    features: [
      {
        id: 'prom_lac',
        name: 'P_lac Promoter',
        type: 'promoter',
        startBp: 95,
        endBp: 215,
        direction: 'fwd',
        color: '#f0883e'
      },
      {
        id: 'cds_gfp',
        name: 'GFP (Green Fluorescent Protein)',
        type: 'CDS',
        startBp: 250,
        endBp: 969,
        direction: 'fwd',
        color: '#3fb950'
      },
      {
        id: 'rep_ori',
        name: 'pMB1 ori (Origin)',
        type: 'origin',
        startBp: 1150,
        endBp: 1740,
        direction: 'none',
        color: '#58a6ff'
      },
      {
        id: 'cds_ampr',
        name: 'AmpR (Beta-Lactamase)',
        type: 'CDS',
        startBp: 1860,
        endBp: 2620,
        direction: 'rev',
        color: '#d29922'
      }
    ],
    cutSites: [
      { enzyme: 'EcoRI',   cutBp: 232,  overhang: "5'-AATT" },
      { enzyme: 'BamHI',   cutBp: 244,  overhang: "5'-GATC" },
      { enzyme: 'XhoI',    cutBp: 625,  overhang: "5'-TCGA" },
      { enzyme: 'HindIII', cutBp: 978,  overhang: "5'-AGCT" },
      { enzyme: 'PstI',    cutBp: 1510, overhang: "3'-TGCA" },
      { enzyme: 'KpnI',    cutBp: 2195, overhang: "3'-CATG" }
    ]
  };

  // =========================================================================
  // 1. PURE POLAR COORDINATE & HIT-TESTING MATH (Headless-Testable)
  // =========================================================================

  /**
   * Converts a base-pair coordinate [1..lengthBp] into a canvas angle in radians.
   * Standard convention: 0/lengthBp is at 12 o'clock (-PI / 2), increasing clockwise.
   *
   * @param {number} bp - Base-pair coordinate
   * @param {number} totalLengthBp - Total plasmid length in bp
   * @returns {number} Angle in radians [-PI/2 .. 3*PI/2)
   */
  static bpToAngle(bp, totalLengthBp) {
    if (totalLengthBp <= 0) throw new RangeError('totalLengthBp must be positive.');
    const normalizedBp = ((bp % totalLengthBp) + totalLengthBp) % totalLengthBp;
    const fraction = normalizedBp / totalLengthBp;
    return -Math.PI / 2 + fraction * (2 * Math.PI);
  }

  /**
   * Converts a canvas angle in radians (from Math.atan2(dy, dx)) back into a
   * 1-based base-pair coordinate [1..totalLengthBp].
   *
   * @param {number} angleRad - Angle in radians
   * @param {number} totalLengthBp - Total plasmid length in bp
   * @returns {number} 1-indexed integer base-pair position
   */
  static angleToBp(angleRad, totalLengthBp) {
    if (totalLengthBp <= 0) throw new RangeError('totalLengthBp must be positive.');
    // Shift reference from 3 o'clock (0 rad) to 12 o'clock (-PI/2 rad)
    let shifted = angleRad + Math.PI / 2;
    shifted = ((shifted % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const bp = Math.round((shifted / (2 * Math.PI)) * totalLengthBp);
    return bp === 0 ? totalLengthBp : bp;
  }

  /**
   * Converts polar coordinates (center, radius, angleRad) to 2D Cartesian (x, y).
   */
  static polarToCartesian(cx, cy, radius, angleRad) {
    return {
      x: Number((cx + radius * Math.cos(angleRad)).toFixed(3)),
      y: Number((cy + radius * Math.sin(angleRad)).toFixed(3))
    };
  }

  /**
   * Determines whether a base-pair coordinate falls within a feature [startBp, endBp],
   * supporting circular features that wrap across the 0/totalLengthBp origin.
   */
  static isBpInFeature(bp, startBp, endBp, totalLengthBp) {
    const normBp = bp === totalLengthBp ? totalLengthBp : ((bp % totalLengthBp) + totalLengthBp) % totalLengthBp;
    if (startBp <= endBp) {
      return normBp >= startBp && normBp <= endBp;
    }
    // Origin-wrapping feature (e.g., 2500..150 on a 2686 bp plasmid)
    return normBp >= startBp || normBp <= endBp;
  }

  /**
   * Performs geometric hit-testing for a cursor point (x, y) against the plasmid ring,
   * features, and restriction enzyme cut sites.
   *
   * @param {number} x - Cursor X in canvas pixels
   * @param {number} y - Cursor Y in canvas pixels
   * @param {Object} plasmidData - Plasmid definition object
   * @param {Object} geometry - { cx, cy, backboneRadius, trackHalfWidth }
   * @returns {Object} Hit test result { onTrack, bp, distanceFromCenter, feature, cutSite }
   */
  static hitTestPlasmid(x, y, plasmidData, {
    cx = 160,
    cy = 160,
    backboneRadius = 96,
    trackHalfWidth = 22
  } = {}) {
    const dx = x - cx;
    const dy = y - cy;
    const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
    const angleRad = Math.atan2(dy, dx);
    const bp = this.angleToBp(angleRad, plasmidData.lengthBp);

    const onTrack = Math.abs(distanceFromCenter - backboneRadius) <= trackHalfWidth;

    let hoveredFeature = null;
    let hoveredCutSite = null;

    if (onTrack) {
      // Check restriction sites within +/- 1.5% of total plasmid length
      const bpTolerance = Math.max(12, Math.round(plasmidData.lengthBp * 0.015));
      for (const site of (plasmidData.cutSites || [])) {
        const diff = Math.min(
          Math.abs(bp - site.cutBp),
          plasmidData.lengthBp - Math.abs(bp - site.cutBp)
        );
        if (diff <= bpTolerance) {
          hoveredCutSite = site;
          break;
        }
      }

      // Check overlapping gene features
      for (const feat of (plasmidData.features || [])) {
        if (this.isBpInFeature(bp, feat.startBp, feat.endBp, plasmidData.lengthBp)) {
          hoveredFeature = feat;
          break;
        }
      }
    }

    return {
      onTrack,
      bp,
      angleRad: Number(angleRad.toFixed(4)),
      distanceFromCenter: Number(distanceFromCenter.toFixed(2)),
      feature: hoveredFeature,
      cutSite: hoveredCutSite
    };
  }

  // =========================================================================
  // 2. HTML5 CANVAS VECTOR RENDERER & INTERACTIVITY
  // =========================================================================

  /**
   * Renders the complete circular plasmid map onto an HTML5 Canvas element.
   *
   * @param {HTMLCanvasElement} canvas - Target canvas element
   * @param {Object} [plasmidData=PlasmidMapEngine.DEFAULT_PLASMID] - Plasmid structure
   * @param {Object} [options] - Rendering options and highlight state
   */
  static renderPlasmid(canvas, plasmidData = this.DEFAULT_PLASMID, options = {}) {
    if (!canvas || typeof canvas.getContext !== 'function') return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = options.backboneRadius || Math.min(width, height) * 0.31;
    const totalBp = plasmidData.lengthBp;

    ctx.clearRect(0, 0, width, height);

    // 1. Background subtle radial grid
    ctx.fillStyle = '#070a0f';
    ctx.fillRect(0, 0, width, height);

    // 2. Draw outer and inner double-stranded backbone rings
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 4;
    ctx.stroke();

    // 3. Draw inner degree/base-pair ruler ticks (every 500 bp)
    ctx.strokeStyle = '#21262d';
    ctx.fillStyle = '#6e7681';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let tickBp = 0; tickBp < totalBp; tickBp += 500) {
      const ang = this.bpToAngle(tickBp, totalBp);
      const pInner = this.polarToCartesian(cx, cy, radius - 14, ang);
      const pOuter = this.polarToCartesian(cx, cy, radius - 8, ang);
      ctx.beginPath();
      ctx.moveTo(pInner.x, pInner.y);
      ctx.lineTo(pOuter.x, pOuter.y);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 4. Render curved gene feature arcs & directional arrowheads
    for (const feat of (plasmidData.features || [])) {
      const isHighlighted = options.hoveredFeatureId === feat.id;
      this._drawFeatureArc(ctx, cx, cy, radius, feat, totalBp, isHighlighted);
    }

    // 5. Render radial restriction enzyme cleavage ticks and labels
    for (const cut of (plasmidData.cutSites || [])) {
      const isHighlighted = options.hoveredEnzyme === cut.enzyme && options.hoveredCutBp === cut.cutBp;
      this._drawRestrictionSite(ctx, cx, cy, radius, cut, totalBp, isHighlighted);
    }

    // 6. Render center plasmid title & base-pair readout
    ctx.fillStyle = '#f0f6fc';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(plasmidData.name, cx, cy - 8);

    ctx.fillStyle = '#8b949e';
    ctx.font = '11px monospace';
    ctx.fillText(`${totalBp.toLocaleString()} bp`, cx, cy + 10);

    if (options.cursorBp) {
      ctx.fillStyle = '#58a6ff';
      ctx.font = '10px monospace';
      ctx.fillText(`Pos: ${options.cursorBp} bp`, cx, cy + 26);
    }
  }

  /**
   * Draws an individual curved gene feature chevron with a directional arrowhead.
   */
  static _drawFeatureArc(ctx, cx, cy, radius, feat, totalBp, isHighlighted) {
    const startAngle = this.bpToAngle(feat.startBp, totalBp);
    let endAngle = this.bpToAngle(feat.endBp, totalBp);
    if (endAngle < startAngle) endAngle += 2 * Math.PI;

    const arcWidth = isHighlighted ? 14 : 11;
    const arrowAngleSpan = Math.min(0.14, (endAngle - startAngle) * 0.28);

    ctx.save();
    ctx.strokeStyle = feat.color || '#3fb950';
    ctx.fillStyle = feat.color || '#3fb950';
    ctx.lineWidth = arcWidth;
    ctx.lineCap = 'butt';

    if (isHighlighted) {
      ctx.shadowColor = feat.color;
      ctx.shadowBlur = 8;
    }

    // Main body of the arc (shortened slightly if directional arrowhead is present)
    const bodyStart = feat.direction === 'rev' ? startAngle + arrowAngleSpan : startAngle;
    const bodyEnd = feat.direction === 'fwd' ? endAngle - arrowAngleSpan : endAngle;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, bodyStart, bodyEnd);
    ctx.stroke();

    // Directional arrowhead triangle
    if (feat.direction === 'fwd' || feat.direction === 'rev') {
      const tipAngle = feat.direction === 'fwd' ? endAngle : startAngle;
      const baseAngle = feat.direction === 'fwd' ? bodyEnd : bodyStart;

      const tipPt = this.polarToCartesian(cx, cy, radius, tipAngle);
      const outerBase = this.polarToCartesian(cx, cy, radius + arcWidth * 0.85, baseAngle);
      const innerBase = this.polarToCartesian(cx, cy, radius - arcWidth * 0.85, baseAngle);

      ctx.beginPath();
      ctx.moveTo(tipPt.x, tipPt.y);
      ctx.lineTo(outerBase.x, outerBase.y);
      ctx.lineTo(innerBase.x, innerBase.y);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Draws a radial tick mark and external callout label for a restriction enzyme cut site.
   */
  static _drawRestrictionSite(ctx, cx, cy, radius, cut, totalBp, isHighlighted) {
    const angle = this.bpToAngle(cut.cutBp, totalBp);
    const pInner = this.polarToCartesian(cx, cy, radius - 8, angle);
    const pOuter = this.polarToCartesian(cx, cy, radius + 18, angle);
    const pLabel = this.polarToCartesian(cx, cy, radius + 24, angle);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pInner.x, pInner.y);
    ctx.lineTo(pOuter.x, pOuter.y);
    ctx.strokeStyle = isHighlighted ? '#ff7b72' : '#58a6ff';
    ctx.lineWidth = isHighlighted ? 2.2 : 1.2;
    ctx.stroke();

    const cos = Math.cos(angle);
    ctx.textAlign = cos >= 0 ? 'left' : 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isHighlighted ? '#ff7b72' : '#c9d1d9';
    ctx.font = isHighlighted ? 'bold 10px monospace' : '10px monospace';
    ctx.fillText(`${cut.enzyme} (${cut.cutBp})`, pLabel.x, pLabel.y);
    ctx.restore();
  }

  /**
   * Attaches mousemove and click listeners to a canvas for live interactive inspection.
   *
   * @param {HTMLCanvasElement} canvas - Target canvas element
   * @param {Object} plasmidData - Plasmid definition
   * @param {Object} callbacks - { onHover: Function, onSelect: Function }
   */
  static bindInteractiveCanvas(canvas, plasmidData = this.DEFAULT_PLASMID, callbacks = {}) {
    if (!canvas) return;
    const radius = Math.min(canvas.width, canvas.height) * 0.31;

    const getCanvasCoords = (evt) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (evt.clientX - rect.left) * scaleX,
        y: (evt.clientY - rect.top) * scaleY
      };
    };

    canvas.addEventListener('mousemove', (evt) => {
      const { x, y } = getCanvasCoords(evt);
      const hit = this.hitTestPlasmid(x, y, plasmidData, {
        cx: canvas.width / 2,
        cy: canvas.height / 2,
        backboneRadius: radius,
        trackHalfWidth: 24
      });

      canvas.style.cursor = hit.onTrack ? 'pointer' : 'default';

      this.renderPlasmid(canvas, plasmidData, {
        backboneRadius: radius,
        cursorBp: hit.onTrack ? hit.bp : null,
        hoveredFeatureId: hit.feature ? hit.feature.id : null,
        hoveredEnzyme: hit.cutSite ? hit.cutSite.enzyme : null,
        hoveredCutBp: hit.cutSite ? hit.cutSite.cutBp : null
      });

      if (callbacks.onHover) callbacks.onHover(hit);
    });

    canvas.addEventListener('click', (evt) => {
      const { x, y } = getCanvasCoords(evt);
      const hit = this.hitTestPlasmid(x, y, plasmidData, {
        cx: canvas.width / 2,
        cy: canvas.height / 2,
        backboneRadius: radius,
        trackHalfWidth: 24
      });
      if (hit.onTrack && callbacks.onSelect) {
        callbacks.onSelect(hit);
      }
    });
  }
}

/**
 * Zero-Dependency Verification Test Suite for Module 7
 */
export function runPlasmidMapTests() {
  const results = [];
  const assert = (name, condition, expected, actual) => {
    results.push({
      test: name,
      expected,
      actual,
      status: condition ? 'PASS' : 'FAIL'
    });
  };

  const totalBp = 2686;

  // Test 1: Cardinal Polar Angle Mapping (0 bp = -PI/2 [12 o'clock], 50% bp = +PI/2 [6 o'clock])
  const ang0 = PlasmidMapEngine.bpToAngle(0, totalBp);
  const angHalf = PlasmidMapEngine.bpToAngle(totalBp / 2, totalBp);
  assert(
    'Polar Angle Mapping (0 bp at 12 o\'clock, N/2 bp at 6 o\'clock)',
    Math.abs(ang0 - (-Math.PI / 2)) < 1e-6 && Math.abs(angHalf - (Math.PI / 2)) < 1e-6,
    '-1.5708 rad & +1.5708 rad',
    `${ang0.toFixed(4)} rad & ${angHalf.toFixed(4)} rad`
  );

  // Test 2: Round-Trip Base-Pair <-> Radian Conversion Identity
  const testBp = 625; // XhoI site
  const rad = PlasmidMapEngine.bpToAngle(testBp, totalBp);
  const recoveredBp = PlasmidMapEngine.angleToBp(rad, totalBp);
  assert(
    'Round-Trip Base-Pair to Angle Inversion (bp -> rad -> bp)',
    recoveredBp === testBp,
    testBp,
    recoveredBp
  );

  // Test 3: Origin-Wrapping Feature Boundary Detection (e.g., Feature from 2500 bp to 150 bp)
  const wrapsOrigin = PlasmidMapEngine.isBpInFeature(50, 2500, 150, totalBp);
  const outsideWrap = PlasmidMapEngine.isBpInFeature(1000, 2500, 150, totalBp);
  assert(
    'Origin-Wrapping Feature Boundary Logic (2500..150 bp)',
    wrapsOrigin === true && outsideWrap === false,
    'in=true, out=false',
    `in=${wrapsOrigin}, out=${outsideWrap}`
  );

  // Test 4: 2D Cursor Hit-Testing on GFP CDS & XhoI Restriction Cut Site (at 625 bp)
  const cx = 160, cy = 160, r = 96;
  const xhoiAngle = PlasmidMapEngine.bpToAngle(625, totalBp);
  const cursorPt = PlasmidMapEngine.polarToCartesian(cx, cy, r, xhoiAngle);
  const hit = PlasmidMapEngine.hitTestPlasmid(
    cursorPt.x,
    cursorPt.y,
    PlasmidMapEngine.DEFAULT_PLASMID,
    { cx, cy, backboneRadius: r, trackHalfWidth: 20 }
  );
  assert(
    '2D Canvas Hit-Testing (Detects GFP Gene & XhoI Site at 625 bp)',
    hit.onTrack === true &&
      hit.feature?.id === 'cds_gfp' &&
      hit.cutSite?.enzyme === 'XhoI',
    'onTrack=true, feat=cds_gfp, cut=XhoI',
    `onTrack=${hit.onTrack}, feat=${hit.feature?.id}, cut=${hit.cutSite?.enzyme}`
  );

  return results;
}

// Auto-execute test suite if run directly in Node.js
if (typeof process !== 'undefined' && process.argv && import.meta.url.endsWith(process.argv[1])) {
  const report = runPlasmidMapTests();
  console.table(report);
  const failed = report.filter(r => r.status === 'FAIL');
  if (failed.length > 0) process.exit(1);
}