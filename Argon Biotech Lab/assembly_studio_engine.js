/**
 * Virtual BioTech & BioChem Lab — Module 9: Golden Gate & Gibson DNA Assembly Studio
 * @module assembly_studio_engine
 * @version 9.1.0
 *
 * Simulates Type IIS Golden Gate assembly (BsaI/BsmBI 4-base overhang ligation)
 * and isothermal Gibson homologous overlap assembly. Zero external dependencies.
 */

export class AssemblyStudioEngine {
  /** Standard Type IIS Endonucleases (cleave outside recognition sequence) */
  static TYPE_IIS_ENZYMES = {
    BsaI: {
      site: 'GGTCTC',
      topOffset: 1,    // Cleaves 1 bp downstream of 5'-GGTCTC-3'
      bottomOffset: 5, // Generates a 4-bp 5' overhang
      overhangLen: 4,
      overhangType: "5'-sticky"
    },
    BsmBI: {
      site: 'CGTCTC',
      topOffset: 1,
      bottomOffset: 5,
      overhangLen: 4,
      overhangType: "5'-sticky"
    }
  };

  /** Built-in Ready-to-Run Presets for Both Golden Gate and Gibson Modes */
  static PRESETS = {
    goldengate: [
      {
        id: 'part1',
        name: 'Part 1 (Promoter)',
        // GGTCTC + G + [TACT] + promoter_body + [AATG] + C + GAGACC
        sequence: 'GGTCTCGTACTACCTGACGATCGTACTAATGCGAGACC'
      },
      {
        id: 'part2',
        name: 'Part 2 (GFP CDS)',
        // GGTCTC + G + [AATG] + gfp_body + [GCTT] + C + GAGACC
        sequence: 'GGTCTCGAATGATGAGTAAAGGAGAAGAACTTTTCACTGGAGCTTCCGAGACC'
      },
      {
        id: 'part3',
        name: 'Part 3 (Terminator)',
        // GGTCTC + G + [GCTT] + term_body + [TACT] + C + GAGACC (closes circle back to Part 1 [TACT])
        sequence: 'GGTCTCGGCTTTAAGCGTCAGTGACCATTACTCGAGACC'
      }
    ],
    gibson: [
      {
        id: 'part1',
        name: 'Part 1 (Vector Core)',
        // Starts with 22bp overlap_C1, ends with 22bp overlap_12
        sequence: 'CCTGTTCCATGGCCAACACTTG' + 'ACCTGACGATCGTACTGGATCC' + 'ATGGCTAGCAAAGGAGAAGAAC'
      },
      {
        id: 'part2',
        name: 'Part 2 (GFP Insert)',
        // Starts with 22bp overlap_12, ends with 22bp overlap_23
        sequence: 'ATGGCTAGCAAAGGAGAAGAAC' + 'TTTTCACTGGAGTTGTCCCAAT' + 'TAAGCGTCAGTGACCATGAGCT'
      },
      {
        id: 'part3',
        name: 'Part 3 (Terminator)',
        // Starts with 22bp overlap_23, ends with 22bp overlap_C1 (closes circle)
        sequence: 'TAAGCGTCAGTGACCATGAGCT' + 'CTACAAATAATGAATTCCCTGC' + 'CCTGTTCCATGGCCAACACTTG'
      }
    ]
  };

  static sanitize(seq) {
    if (typeof seq !== 'string') return '';
    return seq.replace(/^>.*$/gm, '').toUpperCase().replace(/[^ATGC]/g, '');
  }

  static reverseComplement(seq) {
    const clean = this.sanitize(seq);
    const map = { A: 'T', T: 'A', G: 'C', C: 'G' };
    let out = '';
    for (let i = clean.length - 1; i >= 0; i--) out += map[clean[i]];
    return out;
  }

  /**
   * Evaluates Golden Gate assembly for an ordered array of DNA parts flanked
   * by Type IIS restriction sites (e.g., BsaI: 5'-GGTCTC(N)1...[Overhang4]...-3'
   * and reverse 5'-...(Overhang4)(N)1GAGACC-3').
   */
  static simulateGoldenGate(parts, enzymeName = 'BsaI') {
    const enz = this.TYPE_IIS_ENZYMES[enzymeName];
    if (!enz) throw new Error(`Unsupported Type IIS enzyme: ${enzymeName}`);
    if (!Array.isArray(parts) || parts.length < 2) {
      return { success: false, errors: ['At least 2 DNA parts are required for Golden Gate assembly.'] };
    }

    const digestedParts = [];
    const errors = [];

    for (const part of parts) {
      const cleanSeq = this.sanitize(part.sequence);
      const site = enz.site;
      const revSite = this.reverseComplement(site);

      const fwdIdx = cleanSeq.indexOf(site);
      const revIdx = cleanSeq.lastIndexOf(revSite);

      if (fwdIdx === -1 || revIdx === -1 || revIdx <= fwdIdx) {
        errors.push(`Part "${part.name}" is missing properly oriented ${enzymeName} (${site} ... ${revSite}) sites.`);
        continue;
      }

      const leftOverhangStart = fwdIdx + site.length + enz.topOffset;
      const leftOverhang = cleanSeq.slice(leftOverhangStart, leftOverhangStart + enz.overhangLen);

      const rightOverhangEnd = revIdx - enz.topOffset;
      const rightOverhangStart = rightOverhangEnd - enz.overhangLen;
      const rightOverhang = cleanSeq.slice(rightOverhangStart, rightOverhangEnd);

      const insertSeq = cleanSeq.slice(leftOverhangStart + enz.overhangLen, rightOverhangStart);

      digestedParts.push({
        id: part.id,
        name: part.name,
        leftOverhang,
        rightOverhang,
        insertSeq,
        splicedLength: leftOverhang.length + insertSeq.length
      });
    }

    if (errors.length > 0) {
      return { success: false, errors, junctions: [], digestedParts: [] };
    }

    const junctions = [];
    let assembledDNA = '';

    for (let i = 0; i < digestedParts.length; i++) {
      const cur = digestedParts[i];
      const next = digestedParts[(i + 1) % digestedParts.length];

      const matchesNext = cur.rightOverhang === next.leftOverhang;
      junctions.push({
        fromPart: cur.name,
        toPart: next.name,
        overhang: cur.rightOverhang,
        matchingOverhang: next.leftOverhang,
        compatible: matchesNext
      });

      if (!matchesNext) {
        errors.push(
          `Overhang mismatch between ${cur.name} (3' [${cur.rightOverhang}]) and ${next.name} (5' [${next.leftOverhang}]).`
        );
      }

      assembledDNA += cur.leftOverhang + cur.insertSeq;
    }

    const success = errors.length === 0;
    return {
      success,
      enzyme: enzymeName,
      partCount: digestedParts.length,
      assembledLengthBp: success ? assembledDNA.length : 0,
      assembledSequence: success ? assembledDNA : '',
      digestedParts,
      junctions,
      errors
    };
  }

  /**
   * Simulates Isothermal Gibson Assembly across overlapping linear DNA fragments.
   */
  static simulateGibson(parts, minOverlapBp = 15, circularize = true) {
    if (!Array.isArray(parts) || parts.length < 2) {
      return { success: false, errors: ['At least 2 parts are required for Gibson assembly.'] };
    }

    const cleanParts = parts.map(p => ({
      id: p.id,
      name: p.name,
      seq: this.sanitize(p.sequence)
    }));

    const overlaps = [];
    const errors = [];
    const numJunctions = circularize ? cleanParts.length : cleanParts.length - 1;

    for (let i = 0; i < numJunctions; i++) {
      const p1 = cleanParts[i];
      const p2 = cleanParts[(i + 1) % cleanParts.length];

      let detectedOverlap = 0;
      let overlapSeq = '';

      const maxCheck = Math.min(60, p1.seq.length, p2.seq.length);
      for (let len = maxCheck; len >= minOverlapBp; len--) {
        const tail = p1.seq.slice(-len);
        if (p2.seq.startsWith(tail)) {
          detectedOverlap = len;
          overlapSeq = tail;
          break;
        }
      }

      if (detectedOverlap >= minOverlapBp) {
        overlaps.push({
          fromPart: p1.name,
          toPart: p2.name,
          overlapLengthBp: detectedOverlap,
          overlapSequence: overlapSeq,
          compatible: true,
          status: 'HOMOLOGY_VERIFIED'
        });
      } else {
        overlaps.push({
          fromPart: p1.name,
          toPart: p2.name,
          overlapLengthBp: detectedOverlap,
          overlapSequence: '',
          compatible: false,
          status: 'MISMATCH'
        });
        errors.push(
          `Insufficient homologous overlap between ${p1.name} and ${p2.name} (found ${detectedOverlap} bp, need >= ${minOverlapBp} bp).`
        );
      }
    }

    if (errors.length > 0) {
      return { success: false, assembledLengthBp: 0, assembledSequence: '', overlaps, errors };
    }

    let assembledDNA = cleanParts[0].seq;
    for (let i = 1; i < cleanParts.length; i++) {
      const overlapLen = overlaps[i - 1].overlapLengthBp;
      assembledDNA += cleanParts[i].seq.slice(overlapLen);
    }

    if (circularize && overlaps.length === cleanParts.length) {
      const wrapOverlap = overlaps[overlaps.length - 1].overlapLengthBp;
      assembledDNA = assembledDNA.slice(0, assembledDNA.length - wrapOverlap);
    }

    return {
      success: true,
      circularized: circularize,
      partCount: cleanParts.length,
      assembledLengthBp: assembledDNA.length,
      assembledSequence: assembledDNA,
      overlaps,
      errors: []
    };
  }

  /**
   * Renders the multi-part schematic and junction overhang badges onto an HTML5 Canvas.
   */
  static renderAssemblyMap(canvas, assemblyResult, parts) {
    if (!canvas || typeof canvas.getContext !== 'function') return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#090d14';
    ctx.fillRect(0, 0, width, height);

    if (!parts || parts.length === 0) return;

    const colors = ['#58a6ff', '#3fb950', '#d29922', '#bc8cff', '#f0883e'];
    const trackY = 72;
    const trackH = 30;
    const padX = 36;
    const availW = width - padX * 2;
    const partW = availW / parts.length;
    const junctions = assemblyResult.junctions || assemblyResult.overlaps || [];

    // Header banner
    ctx.fillStyle = assemblyResult.success ? '#3fb950' : '#ff7b72';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(
      assemblyResult.success
        ? `✓ SEAMLESS CONSTRUCT VERIFIED (${assemblyResult.assembledLengthBp} bp Circularized)`
        : `✗ ASSEMBLY HALTED (${assemblyResult.errors?.[0] || 'Incompatible Overhangs'})`,
      padX,
      24
    );

    parts.forEach((p, idx) => {
      const x = padX + idx * partW;
      const col = colors[idx % colors.length];

      // Part block
      ctx.fillStyle = col;
      ctx.fillRect(x + 4, trackY, partW - 8, trackH);

      // Part label above block
      ctx.fillStyle = '#f0f6fc';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.name, x + partW / 2, trackY - 10);

      // Length inside block
      ctx.fillStyle = '#070a0f';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`${this.sanitize(p.sequence).length} bp`, x + partW / 2, trackY + 19);

      // Draw junction node between part[idx] and part[(idx+1)%N]
      const junc = junctions[idx];
      if (junc) {
        const isWrap = idx === parts.length - 1;
        const juncX = isWrap ? width - padX + 4 : x + partW;
        const isOk = Boolean(junc.compatible);

        ctx.fillStyle = isOk ? '#3fb950' : '#f85149';
        ctx.beginPath();
        ctx.arc(juncX, trackY + trackH / 2, 6, 0, 2 * Math.PI);
        ctx.fill();

        const badge = junc.overhang
          ? `5'-${junc.overhang}`
          : `${junc.overlapLengthBp}bp Homology`;
        ctx.font = '10px monospace';
        ctx.fillText(isWrap ? `↺ ${badge}` : badge, juncX, trackY + trackH + 22);
      }
    });
  }
}

/**
 * Zero-Dependency Verification Test Suite for Module 9
 */
export function runAssemblyTests() {
  const results = [];
  const assert = (name, condition, expected, actual) => {
    results.push({
      test: name,
      expected,
      actual,
      status: condition ? 'PASS' : 'FAIL'
    });
  };

  // Test 1: 3-Part Golden Gate Circular Assembly (Default Preset)
  const ggRes = AssemblyStudioEngine.simulateGoldenGate(AssemblyStudioEngine.PRESETS.goldengate, 'BsaI');
  assert(
    'Golden Gate 3-Part Type IIS (BsaI) Scarless Circular Ligation',
    ggRes.success === true && ggRes.partCount === 3 && ggRes.junctions.every(j => j.compatible),
    'success=true, 3 compatible junctions',
    `success=${ggRes.success}, junctions=${ggRes.junctions.map(j => j.overhang).join('->')}`
  );

  // Test 2: Incompatible Golden Gate Overhang Detection
  const badParts = [
    AssemblyStudioEngine.PRESETS.goldengate[0],
    { id: 'bad', name: 'Corrupted_CDS', sequence: 'GGTCTCGGGGATGAGTAAAGGAGAAGAACTTTTACTCGAGACC' }
  ];
  const ggFail = AssemblyStudioEngine.simulateGoldenGate(badParts, 'BsaI');
  assert(
    'Golden Gate Non-Complementary Overhang Rejection (AATG != GGGG)',
    ggFail.success === false && ggFail.errors.length > 0,
    'success=false',
    `success=${ggFail.success} (${ggFail.errors.length} errors)`
  );

  // Test 3: 3-Part Isothermal Gibson Homology Assembly (Default Preset)
  const gibRes = AssemblyStudioEngine.simulateGibson(AssemblyStudioEngine.PRESETS.gibson, 18, true);
  assert(
    'Gibson Isothermal 3-Part Homologous Overlap Stitching',
    gibRes.success === true && gibRes.overlaps.every(o => o.overlapLengthBp === 22),
    'success=true, three 22bp overlaps',
    `success=${gibRes.success}, overlaps=${gibRes.overlaps.map(o => o.overlapLengthBp).join('/')}bp`
  );

  return results;
}

if (typeof process !== 'undefined' && process.argv && import.meta.url.endsWith(process.argv[1])) {
  const report = runAssemblyTests();
  console.table(report);
  const failed = report.filter(r => r.status === 'FAIL');
  if (failed.length > 0) process.exit(1);
}