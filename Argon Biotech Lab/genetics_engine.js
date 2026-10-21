/**
 * Virtual BioTech & BioChem Lab — Module 2: Genetic Engineering & Mutagenesis Engine
 * @module genetics_engine
 * @version 2.0.0
 *
 * Pure computational molecular biology engine for multi-frame translation,
 * mutagenesis physicochemical scoring, and Type II restriction enzyme digestion
 * (linear & circular plasmid topologies). Zero external dependencies.
 */

export class GeneticsEngine {
  /** Standard IUPAC Codon Table */
  static CODON_TABLE = {
    TTT: 'F', TTC: 'F', TTA: 'L', TTG: 'L',
    CTT: 'L', CTC: 'L', CTA: 'L', CTG: 'L',
    ATT: 'I', ATC: 'I', ATA: 'I', ATG: 'M',
    GTT: 'V', GTC: 'V', GTA: 'V', GTG: 'V',
    TCT: 'S', TCC: 'S', TCA: 'S', TCG: 'S',
    CCT: 'P', CCC: 'P', CCA: 'P', CCG: 'P',
    ACT: 'T', ACC: 'T', ACA: 'T', ACG: 'T',
    GCT: 'A', GCC: 'A', GCA: 'A', GCG: 'A',
    TAT: 'Y', TAC: 'Y', TAA: '*', TAG: '*',
    CAT: 'H', CAC: 'H', CAA: 'Q', CAG: 'Q',
    AAT: 'N', AAC: 'N', AAA: 'K', AAG: 'K',
    GAT: 'D', GAC: 'D', GAA: 'E', GAG: 'E',
    TGT: 'C', TGC: 'C', TGA: '*', TGG: 'W',
    CGT: 'R', CGC: 'R', CGA: 'R', CGG: 'R',
    AGT: 'S', AGC: 'S', AGA: 'R', AGG: 'R',
    GGT: 'G', GGC: 'G', GGA: 'G', GGG: 'G'
  };

  /** Amino Acid Physicochemical Properties (Monoisotopic Mass in Da, Kyte-Doolittle Hydropathy, pKa) */
  static AA_PROPERTIES = {
    A: { name: 'Alanine',       mass: 71.08,  hydro:  1.8, charge74:  0.0 },
    R: { name: 'Arginine',      mass: 156.19, hydro: -4.5, charge74: +1.0 },
    N: { name: 'Asparagine',    mass: 114.10, hydro: -3.5, charge74:  0.0 },
    D: { name: 'Aspartate',     mass: 115.09, hydro: -3.5, charge74: -1.0 },
    C: { name: 'Cysteine',      mass: 103.14, hydro:  2.5, charge74: -0.1 },
    E: { name: 'Glutamate',     mass: 129.12, hydro: -3.5, charge74: -1.0 },
    Q: { name: 'Glutamine',     mass: 128.13, hydro: -3.5, charge74:  0.0 },
    G: { name: 'Glycine',       mass: 57.05,  hydro: -0.4, charge74:  0.0 },
    H: { name: 'Histidine',     mass: 137.14, hydro: -3.2, charge74: +0.1 },
    I: { name: 'Isoleucine',    mass: 113.16, hydro:  4.5, charge74:  0.0 },
    L: { name: 'Leucine',       mass: 113.16, hydro:  3.8, charge74:  0.0 },
    K: { name: 'Lysine',        mass: 128.17, hydro: -3.9, charge74: +1.0 },
    M: { name: 'Methionine',    mass: 131.20, hydro:  1.9, charge74:  0.0 },
    F: { name: 'Phenylalanine', mass: 147.18, hydro:  2.8, charge74:  0.0 },
    P: { name: 'Proline',       mass: 97.12,  hydro: -1.6, charge74:  0.0 },
    S: { name: 'Serine',        mass: 87.08,  hydro: -0.8, charge74:  0.0 },
    T: { name: 'Threonine',     mass: 101.11, hydro: -0.7, charge74:  0.0 },
    W: { name: 'Tryptophan',    mass: 186.21, hydro: -0.9, charge74:  0.0 },
    Y: { name: 'Tyrosine',      mass: 163.18, hydro: -1.3, charge74:  0.0 },
    V: { name: 'Valine',        mass: 99.13,  hydro:  4.2, charge74:  0.0 },
    '*': { name: 'Stop',        mass: 0.0,    hydro:  0.0, charge74:  0.0 }
  };

  /**
   * Type II Restriction Endonuclease Library
   * cutTop: cleavage index relative to 5' start of recognition motif on top strand
   * cutBottom: cleavage index relative to 5' start of motif on top strand (for bottom strand)
   */
  static RESTRICTION_ENZYMES = {
    EcoRI:   { site: 'GAATTC',   cutTop: 1, cutBottom: 5, overhangType: "5'-sticky" },
    BamHI:   { site: 'GGATCC',   cutTop: 1, cutBottom: 5, overhangType: "5'-sticky" },
    HindIII: { site: 'AAGCTT',   cutTop: 1, cutBottom: 5, overhangType: "5'-sticky" },
    XhoI:    { site: 'CTCGAG',   cutTop: 1, cutBottom: 5, overhangType: "5'-sticky" },
    NdeI:    { site: 'CATATG',   cutTop: 2, cutBottom: 4, overhangType: "5'-sticky" },
    NotI:    { site: 'GCGGCCGC', cutTop: 2, cutBottom: 6, overhangType: "5'-sticky" },
    KpnI:    { site: 'GGTACC',   cutTop: 5, cutBottom: 1, overhangType: "3'-sticky" },
    PstI:    { site: 'CTGCAG',   cutTop: 5, cutBottom: 1, overhangType: "3'-sticky" },
    SacI:    { site: 'GAGCTC',   cutTop: 5, cutBottom: 1, overhangType: "3'-sticky" },
    SmaI:    { site: 'CCCGGG',   cutTop: 3, cutBottom: 3, overhangType: 'blunt' }
  };

  /**
   * Sanitizes a raw FASTA or nucleotide string into uppercase DNA (converts U -> T).
   */
  static sanitizeDNA(rawSeq) {
    if (typeof rawSeq !== 'string') throw new TypeError('DNA sequence must be a string.');
    return rawSeq
      .replace(/^>.*$/gm, '') // Strip FASTA headers
      .toUpperCase()
      .replace(/U/g, 'T')
      .replace(/[^ATGC]/g, '');
  }

  /**
   * Generates the antiparallel 5'->3' reverse complement of a DNA sequence.
   */
  static reverseComplement(dnaSeq) {
    const clean = this.sanitizeDNA(dnaSeq);
    const compMap = { A: 'T', T: 'A', G: 'C', C: 'G' };
    let revComp = '';
    for (let i = clean.length - 1; i >= 0; i--) {
      revComp += compMap[clean[i]];
    }
    return revComp;
  }

  /**
   * Translates a DNA sequence in a specified reading frame (0, 1, or 2).
   */
  static translate(dnaSeq, frame = 0) {
    const cleanDNA = this.sanitizeDNA(dnaSeq);
    if (frame < 0 || frame > 2) throw new RangeError('Reading frame must be 0, 1, or 2.');

    let protein = '';
    const codons = [];
    for (let i = frame; i <= cleanDNA.length - 3; i += 3) {
      const codon = cleanDNA.slice(i, i + 3);
      codons.push(codon);
      protein += this.CODON_TABLE[codon] || 'X';
    }
    return { cleanDNA, frame, codons, protein };
  }

  /**
   * Translates a DNA sequence across all 6 reading frames (+1, +2, +3, -1, -2, -3).
   */
  static translateSixFrames(dnaSeq) {
    const clean = this.sanitizeDNA(dnaSeq);
    const rev = this.reverseComplement(clean);
    return {
      '+1': this.translate(clean, 0).protein,
      '+2': this.translate(clean, 1).protein,
      '+3': this.translate(clean, 2).protein,
      '-1': this.translate(rev, 0).protein,
      '-2': this.translate(rev, 1).protein,
      '-3': this.translate(rev, 2).protein
    };
  }

  /**
   * Computes physicochemical metrics (Molecular Weight, GRAVY Hydropathy, Net Charge at pH 7.4)
   * for a translated polypeptide chain (stops at first termination codon '*').
   */
  static analyzePeptide(proteinSeq) {
    const codingRegion = proteinSeq.split('*')[0];
    if (codingRegion.length === 0) {
      return { length: 0, molecularWeightDa: 0, gravy: 0, netCharge74: 0 };
    }

    let mass = 18.015; // N-terminal H and C-terminal OH (H2O)
    let hydroSum = 0;
    let netCharge = 0;

    for (const aa of codingRegion) {
      const props = this.AA_PROPERTIES[aa];
      if (props) {
        mass += props.mass;
        hydroSum += props.hydro;
        netCharge += props.charge74;
      }
    }

    return {
      length: codingRegion.length,
      molecularWeightDa: Number(mass.toFixed(2)),
      gravy: Number((hydroSum / codingRegion.length).toFixed(3)),
      netCharge74: Number(netCharge.toFixed(2))
    };
  }

  /**
   * Performs in silico mutagenesis (point substitution, insertion, or deletion)
   * and computes structural & physicochemical shifts.
   *
   * @param {string} dnaSeq - Wild-type coding DNA sequence
   * @param {number} position - 1-based nucleotide index
   * @param {string} newBases - Replacement nucleotide(s) (or '' for deletion)
   * @param {string} [mode='substitution'] - 'substitution' | 'insertion' | 'deletion'
   * @param {number} [deleteLength=1] - Number of bases to delete if mode === 'deletion'
   */
  static introduceMutation(dnaSeq, position, newBases = '', mode = 'substitution', deleteLength = 1) {
    const cleanWT = this.sanitizeDNA(dnaSeq);
    if (position < 1 || position > cleanWT.length) {
      throw new RangeError(`Position ${position} out of bounds (1 to ${cleanWT.length}).`);
    }

    const idx = position - 1;
    const cleanNew = this.sanitizeDNA(newBases);
    let mutatedDNA = '';

    if (mode === 'substitution') {
      if (cleanNew.length !== 1) throw new Error('Point substitution requires a single nucleotide base.');
      mutatedDNA = cleanWT.slice(0, idx) + cleanNew + cleanWT.slice(idx + 1);
    } else if (mode === 'insertion') {
      mutatedDNA = cleanWT.slice(0, idx) + cleanNew + cleanWT.slice(idx);
    } else if (mode === 'deletion') {
      mutatedDNA = cleanWT.slice(0, idx) + cleanWT.slice(idx + deleteLength);
    } else {
      throw new Error(`Unsupported mutation mode: ${mode}`);
    }

    const wtTrans = this.translate(cleanWT, 0);
    const mutTrans = this.translate(mutatedDNA, 0);

    const codonNumber = Math.floor(idx / 3) + 1;
    const wtAA = wtTrans.protein[codonNumber - 1] || '-';
    const mutAA = mutTrans.protein[codonNumber - 1] || '-';

    let classification = 'Missense';
    const lengthDiff = mutatedDNA.length - cleanWT.length;

    if (mode !== 'substitution') {
      classification = Math.abs(lengthDiff) % 3 !== 0 ? 'Frameshift' : 'In-Frame Indel';
    } else if (wtAA === mutAA) {
      classification = 'Silent (Synonymous)';
    } else if (mutAA === '*') {
      classification = 'Nonsense (Premature Stop)';
    } else if (wtAA === '*') {
      classification = 'Stop-Loss (Readthrough)';
    }

    const wtProps = this.AA_PROPERTIES[wtAA] || { hydro: 0, charge74: 0, mass: 0 };
    const mutProps = this.AA_PROPERTIES[mutAA] || { hydro: 0, charge74: 0, mass: 0 };

    const wtPeptideMetrics = this.analyzePeptide(wtTrans.protein);
    const mutPeptideMetrics = this.analyzePeptide(mutTrans.protein);

    return {
      mode,
      position,
      codonNumber,
      mutationNotation: `c.${position}${cleanWT[idx]}>${cleanNew || 'del'} (p.${wtAA}${codonNumber}${mutAA})`,
      classification,
      wildTypeResidue: wtAA,
      mutatedResidue: mutAA,
      deltaHydropathy: Number((mutProps.hydro - wtProps.hydro).toFixed(2)),
      deltaCharge: Number((mutProps.charge74 - wtProps.charge74).toFixed(2)),
      deltaMassDa: Number((mutPeptideMetrics.molecularWeightDa - wtPeptideMetrics.molecularWeightDa).toFixed(2)),
      mutatedDNA,
      wildTypeProtein: wtTrans.protein,
      mutatedProtein: mutTrans.protein
    };
  }

  /**
   * Performs in silico Type II restriction enzyme digestion on linear or circular DNA.
   *
   * @param {string} dnaSeq - Input DNA sequence
   * @param {string[]} enzymeNames - Array of enzyme names (e.g., ['EcoRI', 'BamHI'])
   * @param {boolean} [isCircular=false] - True for circular plasmids, false for linear DNA
   * @returns {Object} { totalLength, isCircular, cutSites, fragments }
   */
  static digestDNA(dnaSeq, enzymeNames = [], isCircular = false) {
    const cleanDNA = this.sanitizeDNA(dnaSeq);
    const seqLen = cleanDNA.length;
    if (seqLen === 0) throw new Error('Cannot digest an empty DNA sequence.');

    // For circular plasmids, append first 10 bp to detect motifs spanning the 0-index origin
    const searchSeq = isCircular ? cleanDNA + cleanDNA.slice(0, 10) : cleanDNA;
    const cutSites = [];

    for (const enzName of enzymeNames) {
      const enz = this.RESTRICTION_ENZYMES[enzName];
      if (!enz) throw new Error(`Unknown restriction enzyme: ${enzName}`);

      const motif = enz.site;
      let pos = searchSeq.indexOf(motif, 0);

      while (pos !== -1 && pos < seqLen) {
        const cutPos = (pos + enz.cutTop) % seqLen;
        const overhangLen = Math.abs(enz.cutBottom - enz.cutTop);
        const overhangStart = pos + Math.min(enz.cutTop, enz.cutBottom);
        const overhangSeq = searchSeq.slice(overhangStart, overhangStart + overhangLen);

        cutSites.push({
          enzyme: enzName,
          recognitionSite: motif,
          motifStart: pos + 1, // 1-based index
          cutIndex: cutPos,    // 0-based cleavage coordinate after which cut occurs
          overhangType: enz.overhangType,
          overhangSeq
        });

        pos = searchSeq.indexOf(motif, pos + 1);
      }
    }

    // Sort cut sites by cleavage position and deduplicate identical cut coordinates
    cutSites.sort((a, b) => a.cutIndex - b.cutIndex);
    const uniqueCuts = [];
    for (const cut of cutSites) {
      if (uniqueCuts.length === 0 || uniqueCuts[uniqueCuts.length - 1].cutIndex !== cut.cutIndex) {
        uniqueCuts.push(cut);
      }
    }

    const fragments = [];

    if (uniqueCuts.length === 0) {
      fragments.push({
        fragmentNumber: 1,
        length: seqLen,
        topology: isCircular ? 'supercoiled/uncut circular' : 'linear',
        start: 1,
        end: seqLen,
        leftEnd: isCircular ? 'none' : '5\'-blunt/native',
        rightEnd: isCircular ? 'none' : '3\'-blunt/native',
        sequence: cleanDNA
      });
    } else if (!isCircular) {
      // Linear DNA: N cuts produce N + 1 fragments
      let prevIdx = 0;
      let prevEnz = '5\'-native';

      for (let i = 0; i < uniqueCuts.length; i++) {
        const cut = uniqueCuts[i];
        const fragSeq = cleanDNA.slice(prevIdx, cut.cutIndex);
        fragments.push({
          fragmentNumber: i + 1,
          length: fragSeq.length,
          topology: 'linear',
          start: prevIdx + 1,
          end: cut.cutIndex,
          leftEnd: prevEnz,
          rightEnd: `${cut.enzyme} (${cut.overhangType})`,
          sequence: fragSeq
        });
        prevIdx = cut.cutIndex;
        prevEnz = `${cut.enzyme} (${cut.overhangType})`;
      }

      // Terminal fragment
      const tailSeq = cleanDNA.slice(prevIdx);
      fragments.push({
        fragmentNumber: uniqueCuts.length + 1,
        length: tailSeq.length,
        topology: 'linear',
        start: prevIdx + 1,
        end: seqLen,
        leftEnd: prevEnz,
        rightEnd: '3\'-native',
        sequence: tailSeq
      });
    } else {
      // Circular Plasmid DNA: N cuts (N >= 1) produce N linear fragments
      for (let i = 0; i < uniqueCuts.length; i++) {
        const currentCut = uniqueCuts[i];
        const nextCut = uniqueCuts[(i + 1) % uniqueCuts.length];

        let fragSeq = '';
        if (nextCut.cutIndex > currentCut.cutIndex) {
          fragSeq = cleanDNA.slice(currentCut.cutIndex, nextCut.cutIndex);
        } else {
          // Wraps around plasmid origin
          fragSeq = cleanDNA.slice(currentCut.cutIndex) + cleanDNA.slice(0, nextCut.cutIndex);
        }

        fragments.push({
          fragmentNumber: i + 1,
          length: fragSeq.length,
          topology: 'linearized',
          start: currentCut.cutIndex + 1,
          end: nextCut.cutIndex,
          leftEnd: `${currentCut.enzyme} (${currentCut.overhangType})`,
          rightEnd: `${nextCut.enzyme} (${nextCut.overhangType})`,
          sequence: fragSeq
        });
      }
    }

    // Sort fragments descending by base-pair length (standard gel electrophoresis order)
    const sortedFragments = [...fragments].sort((a, b) => b.length - a.length);

    return {
      totalLength: seqLen,
      isCircular,
      cutCount: uniqueCuts.length,
      cutSites: uniqueCuts,
      fragments: sortedFragments
    };
  }
}

/**
 * Zero-Dependency Verification Test Suite for Module 2
 */
export function runGeneticsTests() {
  const results = [];
  const assert = (name, condition, expected, actual) => {
    results.push({
      test: name,
      expected,
      actual,
      status: condition ? 'PASS' : 'FAIL'
    });
  };

  // Test 1: Reverse Complement Identity
  const rc = GeneticsEngine.reverseComplement('5\'-GAATTC-GGATCC-3\'');
  assert('Antiparallel Reverse Complement', rc === 'GGATCCGAATTC', 'GGATCCGAATTC', rc);

  // Test 2: 6-Frame Translation
  const frames = GeneticsEngine.translateSixFrames('ATGGCTGATTAA');
  assert('Forward +1 Reading Frame Translation', frames['+1'] === 'MAD*', 'MAD*', frames['+1']);

  // Test 3: Silent vs. Missense vs. Nonsense Classification
  const silent = GeneticsEngine.introduceMutation('ATGGCTGATTAA', 6, 'C', 'substitution'); // GCT -> GCC (Ala)
  const nonsense = GeneticsEngine.introduceMutation('ATGGCTGATTAA', 7, 'T', 'substitution'); // GAT -> TAT (Tyr) -> Wait: GAA -> TAA is Stop
  const stopMut = GeneticsEngine.introduceMutation('ATGGAAGATTAA', 4, 'T', 'substitution'); // GAA (Glu) -> TAA (*)
  assert(
    'Mutagenesis Classifier (Silent & Nonsense)',
    silent.classification === 'Silent (Synonymous)' && stopMut.classification === 'Nonsense (Premature Stop)',
    'Silent & Nonsense',
    `${silent.classification} & ${stopMut.classification}`
  );

  // Test 4: Physicochemical Charge & Hydropathy Shift (Glu [E, -1, -3.5] -> Lys [K, +1, -3.9])
  // GAA (Glu) -> AAA (Lys) at position 4 of ATGGAAGATTAA
  const chargeMut = GeneticsEngine.introduceMutation('ATGGAAGATTAA', 4, 'A', 'substitution');
  assert(
    'Physicochemical Delta Charge (Glu -> Lys = +2.0)',
    chargeMut.deltaCharge === 2.0 && chargeMut.deltaHydropathy === -0.4,
    'dCharge=2.0, dHydro=-0.4',
    `dCharge=${chargeMut.deltaCharge}, dHydro=${chargeMut.deltaHydropathy}`
  );

  // Test 5: Frameshift Indel Detection
  const frameshift = GeneticsEngine.introduceMutation('ATGGCTGATTAA', 4, 'A', 'insertion');
  assert(
    'Single-Base Insertion Frameshift Detection',
    frameshift.classification === 'Frameshift',
    'Frameshift',
    frameshift.classification
  );

  // Test 6: Linear DNA Double Digestion Fragment Sum Conservation
  // 10 bp + EcoRI (GAATTC, cut after G => +1 left, +5 right) + 10 bp + BamHI (GGATCC, cut after G => +1 left, +5 right) + 10 bp = 42 bp total
  const linearSeq = 'AAAAAAAAAA' + 'GAATTC' + 'AAAAAAAAAA' + 'GGATCC' + 'AAAAAAAAAA';
  const linDigest = GeneticsEngine.digestDNA(linearSeq, ['EcoRI', 'BamHI'], false);
  const linLengths = linDigest.fragments.map(f => f.length).join(', ');
  const sumLin = linDigest.fragments.reduce((acc, f) => acc + f.length, 0);
  // Cut 1 at index 11, Cut 2 at index 27 => Fragments: 11 bp, 16 bp, 15 bp => Sorted: 16, 15, 11
  assert(
    'Linear Double Digest (EcoRI + BamHI) Fragment Sizes & Conservation',
    sumLin === 42 && linLengths === '16, 15, 11',
    'Total=42 (16, 15, 11)',
    `Total=${sumLin} (${linLengths})`
  );

  // Test 7: Circular Plasmid Digestion (2 Cuts = 2 Fragments Wrapping Origin)
  const plasmidDigest = GeneticsEngine.digestDNA(linearSeq, ['EcoRI', 'BamHI'], true);
  const plasmidLengths = plasmidDigest.fragments.map(f => f.length).join(', ');
  const sumPlasmid = plasmidDigest.fragments.reduce((acc, f) => acc + f.length, 0);
  // Cut 1 at 11, Cut 2 at 27 => Fragment A: 27 - 11 = 16 bp; Fragment B (wraps origin): (42 - 27) + 11 = 26 bp
  assert(
    'Circular Plasmid Double Digest Origin-Wrapping Fragment Math',
    sumPlasmid === 42 && plasmidLengths === '26, 16',
    'Total=42 (26, 16)',
    `Total=${sumPlasmid} (${plasmidLengths})`
  );

  return results;
}

// Auto-execute test suite if run directly in Node.js
if (typeof process !== 'undefined' && process.argv && import.meta.url.endsWith(process.argv[1])) {
  const report = runGeneticsTests();
  console.table(report);
  const failed = report.filter(r => r.status === 'FAIL');
  if (failed.length > 0) process.exit(1);
}