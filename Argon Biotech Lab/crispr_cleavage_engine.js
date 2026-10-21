/**
 * Virtual BioTech & BioChem Lab — Module 12: CRISPR Off-Target Genome Cleavage Engine
 * @module crispr_cleavage_engine
 * @version 12.0.0
 *
 * Pure mathematical solvers for CRISPR-Cas9 / Cas12a PAM validation, Hsu-Zhang & CFD
 * position-weighted thermodynamic mismatch scoring (seed vs. distal region), epigenetic
 * chromatin accessibility weighting, whole-genome MIT specificity indexing, NHEJ vs. HDR
 * double-strand break (DSB) repair pathway branching, and dual HTML5 Canvas visualizers
 * (24-Chromosome Radial Circos Karyotype Radar & 20-nt Duplex Bubble Aligner).
 * Zero external dependencies.
 */

export class CrisprCleavageEngine {
  /**
   * Empirically derived 20-nt position retention weights (Hsu et al. Nature Biotech / Doench CFD).
   * Index 0 = Position 1 (5'-most PAM-distal base, high tolerance to mismatch).
   * Index 19 = Position 20 (3'-most PAM-proximal "seed" base, extreme penalty on mismatch).
   */
  static POSITION_RETENTION_WEIGHTS = [
    0.88, 0.85, 0.82, 0.78, 0.75, // Pos 1-5:   Distal region (tolerant)
    0.70, 0.65, 0.60, 0.54, 0.48, // Pos 6-10:  Middle trunk
    0.40, 0.32, 0.22, 0.16, 0.12, // Pos 11-15: Transition to seed
    0.09, 0.06, 0.04, 0.025, 0.015 // Pos 16-20: PAM-proximal Seed Region (hypersensitive)
  ];

  /**
   * Epigenetic Chromatin Accessibility Modifiers (ATAC-seq / DNase-I hypersensitivity proxy)
   */
  static CHROMATIN_STATES = {
    euchromatin: {
      id: 'euchromatin',
      label: 'Open Euchromatin (H3K4me3 / Active Locus)',
      accessibilityFactor: 1.00
    },
    poised: {
      id: 'poised',
      label: 'Poised / Facultative Chromatin (H3K27me3)',
      accessibilityFactor: 0.65
    },
    heterochromatin: {
      id: 'heterochromatin',
      label: 'Condensed Heterochromatin (H3K9me3 / Silenced)',
      accessibilityFactor: 0.18
    }
  };

  /**
   * 24 Human Chromosomes (1-22, X, Y) Metadata for Karyotype & Circos Projection
   */
  static CHROMOSOMES = [
    'Chr1', 'Chr2', 'Chr3', 'Chr4', 'Chr5', 'Chr6', 'Chr7', 'Chr8',
    'Chr9', 'Chr10', 'Chr11', 'Chr12', 'Chr13', 'Chr14', 'Chr15', 'Chr16',
    'Chr17', 'Chr18', 'Chr19', 'Chr20', 'Chr21', 'Chr22', 'ChrX', 'ChrY'
  ];

  /**
   * Curated Clinical CRISPR Gene Surgery Presets (On-Target + Genomic Off-Target Homologs)
   */
  static GENE_PRESETS = {
    hbb_sickle: {
      id: 'hbb_sickle',
      name: 'HBB — β-Globin Sickle Cell E6V Locus (Chr11p15.4)',
      nuclease: 'SpCas9',
      sgRNA: 'CTTGCCCCACAGGGCAGTAA',
      onTargetChr: 'Chr11',
      onTargetGene: 'HBB (Exon 1)',
      donorTemplateAvailable: true,
      candidateLoci: [
        {
          id: 'hbb_on',
          chr: 'Chr11',
          coordMb: 5.22,
          gene: 'HBB (On-Target Exon 1)',
          isOnTarget: true,
          protospacer: 'CTTGCCCCACAGGGCAGTAA',
          pam: 'CGG',
          chromatin: 'euchromatin'
        },
        {
          id: 'hbd_off1',
          chr: 'Chr11',
          coordMb: 5.25,
          gene: 'HBD (δ-Globin Paralog — 1 Distal Mismatch)',
          isOnTarget: false,
          protospacer: 'TTTGCCCCACAGGGCAGTAA',
          pam: 'CGG',
          chromatin: 'euchromatin'
        },
        {
          id: 'chr4_off2',
          chr: 'Chr4',
          coordMb: 88.4,
          gene: 'Intergenic Region (2 Distal Mismatches)',
          isOnTarget: false,
          protospacer: 'ATTGCTCCACAGGGCAGTAA',
          pam: 'AGG',
          chromatin: 'poised'
        },
        {
          id: 'chr9_off3',
          chr: 'Chr9',
          coordMb: 131.2,
          gene: 'ZNF79 Intron (1 Seed Mismatch Pos 19)',
          isOnTarget: false,
          protospacer: 'CTTGCCCCACAGGGCAGTTA',
          pam: 'TGG',
          chromatin: 'euchromatin'
        },
        {
          id: 'chr17_off4',
          chr: 'Chr17',
          coordMb: 41.2,
          gene: 'Heterochromatic Repeat (3 Mismatches)',
          isOnTarget: false,
          protospacer: 'CATGCCCCACAGGTCAGTCA',
          pam: 'GGG',
          chromatin: 'heterochromatin'
        }
      ]
    },
    ccr5_hiv: {
      id: 'ccr5_hiv',
      name: 'CCR5 — HIV-1 Coreceptor Δ32 Knockout Locus (Chr3p21.31)',
      nuclease: 'SpCas9',
      sgRNA: 'GCAGCATAGTGAGCCCAGAA',
      onTargetChr: 'Chr3',
      onTargetGene: 'CCR5 (TM-Helix)',
      donorTemplateAvailable: false,
      candidateLoci: [
        {
          id: 'ccr5_on',
          chr: 'Chr3',
          coordMb: 46.37,
          gene: 'CCR5 (On-Target Coding)',
          isOnTarget: true,
          protospacer: 'GCAGCATAGTGAGCCCAGAA',
          pam: 'GGG',
          chromatin: 'euchromatin'
        },
        {
          id: 'ccr2_off1',
          chr: 'Chr3',
          coordMb: 46.35,
          gene: 'CCR2 Homolog (2 Mismatches: Pos 3 & 18)',
          isOnTarget: false,
          protospacer: 'GCTGCATAGTGAGCCCATAA',
          pam: 'TGG',
          chromatin: 'euchromatin'
        },
        {
          id: 'chr12_off2',
          chr: 'Chr12',
          coordMb: 64.1,
          gene: 'TBK1 Intron (Non-Canonical NAG PAM)',
          isOnTarget: false,
          protospacer: 'TCAGCATAGTGAGCCCAGAA',
          pam: 'CAG',
          chromatin: 'poised'
        },
        {
          id: 'chrX_off3',
          chr: 'ChrX',
          coordMb: 119.5,
          gene: 'Intergenic Locus (PAM Mutated)',
          isOnTarget: false,
          protospacer: 'GCAGCATAGTGAGCCCAGAA',
          pam: 'CTC',
          chromatin: 'euchromatin'
        }
      ]
    },
    pcsk9_lipid: {
      id: 'pcsk9_lipid',
      name: 'PCSK9 — Hepatic LDL Cholesterol Regulator (Chr1p32.3)',
      nuclease: 'SpCas9',
      sgRNA: 'GGTGCTAGCCTTGCGTTCCG',
      onTargetChr: 'Chr1',
      onTargetGene: 'PCSK9 (Exon 1)',
      donorTemplateAvailable: false,
      candidateLoci: [
        {
          id: 'pcsk9_on',
          chr: 'Chr1',
          coordMb: 55.04,
          gene: 'PCSK9 (On-Target Exon 1)',
          isOnTarget: true,
          protospacer: 'GGTGCTAGCCTTGCGTTCCG',
          pam: 'AGG',
          chromatin: 'euchromatin'
        },
        {
          id: 'chr6_off1',
          chr: 'Chr6',
          coordMb: 31.8,
          gene: 'HLA-Distal Noncoding (2 Seed Mismatches)',
          isOnTarget: false,
          protospacer: 'GGTGCTAGCCTTGCGTTAAG',
          pam: 'TGG',
          chromatin: 'poised'
        },
        {
          id: 'chr19_off2',
          chr: 'Chr19',
          coordMb: 11.1,
          gene: 'LDLR Upstream (2 Distal Mismatches)',
          isOnTarget: false,
          protospacer: 'TATGCTAGCCTTGCGTTCCG',
          pam: 'GGG',
          chromatin: 'heterochromatin'
        }
      ]
    }
  };

  // =========================================================================
  // 1. MATHEMATICAL BIOPHYSICS & GENOMIC SCORING SOLVERS (Substep 7)
  // =========================================================================

  static sanitize(seq) {
    if (typeof seq !== 'string') return '';
    return seq.toUpperCase().replace(/U/g, 'T').replace(/[^ATGC]/g, '');
  }

  static evaluatePam(pamSeq, nuclease = 'SpCas9') {
    const clean = this.sanitize(pamSeq);
    if (nuclease === 'Cas12a') {
      if (clean.length < 4) return { valid: false, weight: 0.0, motifClass: 'INVALID_PAM' };
      const prefix = clean.slice(0, 3);
      const fourth = clean[3];
      if (prefix === 'TTT' && (fourth === 'A' || fourth === 'C' || fourth === 'G')) {
        return { valid: true, weight: 1.0, motifClass: 'CANONICAL_TTTV' };
      }
      if (prefix === 'TTT' && fourth === 'T') {
        return { valid: true, weight: 0.15, motifClass: 'SUBOPTIMAL_TTTT' };
      }
      return { valid: false, weight: 0.0, motifClass: 'PAM_ABLATED' };
    }

    if (clean.length < 3) return { valid: false, weight: 0.0, motifClass: 'INVALID_PAM' };
    const dinuc = clean.slice(1, 3);
    if (dinuc === 'GG') {
      return { valid: true, weight: 1.0, motifClass: 'CANONICAL_NGG' };
    }
    if (dinuc === 'AG') {
      return { valid: true, weight: 0.20, motifClass: 'NONCANONICAL_NAG' };
    }
    return { valid: false, weight: 0.0, motifClass: 'PAM_ABLATED' };
  }

  static scoreDuplexCleavage(sgRnaSeq, targetProtospacer, {
    pam = 'AGG',
    nuclease = 'SpCas9',
    chromatin = 'euchromatin'
  } = {}) {
    const guide = this.sanitize(sgRnaSeq).slice(0, 20);
    const target = this.sanitize(targetProtospacer).slice(0, 20);

    if (guide.length !== 20 || target.length !== 20) {
      throw new RangeError('Both sgRNA spacer and target protospacer must be exactly 20 nucleotides.');
    }

    const pamEval = this.evaluatePam(pam, nuclease);
    const chromState = this.CHROMATIN_STATES[chromatin] || this.CHROMATIN_STATES.euchromatin;

    const baseAlignment = [];
    const mismatchPositions = [];
    let productRetention = 1.0;

    for (let i = 0; i < 20; i++) {
      const gBase = guide[i];
      const tBase = target[i];
      const pos1 = i + 1;
      const isSeedRegion = pos1 >= 13;
      const matched = gBase === tBase;
      const retentionWeight = matched ? 1.0 : this.POSITION_RETENTION_WEIGHTS[i];

      if (!matched) {
        mismatchPositions.push(pos1);
        productRetention *= retentionWeight;
      }

      baseAlignment.push({
        position: pos1,
        guideBase: gBase,
        targetBase: tBase,
        matched,
        isSeedRegion,
        retentionWeight: Number(retentionWeight.toFixed(3))
      });
    }

    let clusteringFactor = 1.0;
    const mCount = mismatchPositions.length;
    if (mCount >= 2) {
      const span = mismatchPositions[mCount - 1] - mismatchPositions[0];
      const avgDist = span / (mCount - 1);
      const distPenalty = 1.0 / (((19.0 - avgDist) / 19.0) * 4.0 + 1.0);
      const countDamping = 1.0 / Math.pow(mCount, 0.65);
      clusteringFactor = distPenalty * countDamping;
    }

    const rawScore =
      100.0 *
      pamEval.weight *
      chromState.accessibilityFactor *
      productRetention *
      clusteringFactor;

    const cleavageScorePct = Number(Math.max(0, Math.min(100, rawScore)).toFixed(2));

    return {
      guideSequence: guide,
      targetSequence: target,
      pam: this.sanitize(pam),
      pamClass: pamEval.motifClass,
      pamValid: pamEval.valid,
      chromatinState: chromState.id,
      chromatinFactor: chromState.accessibilityFactor,
      mismatchCount: mCount,
      seedMismatchCount: mismatchPositions.filter(p => p >= 13).length,
      mismatchPositions,
      cleavageScorePct,
      baseAlignment
    };
  }

  static scanGenomicLoci(sgRnaSeq, candidateLoci = [], {
    nuclease = 'SpCas9',
    globalChromatinOverride = null
  } = {}) {
    const cleanGuide = this.sanitize(sgRnaSeq).slice(0, 20);
    const scoredLoci = candidateLoci.map((locus) => {
      const chrom = globalChromatinOverride || locus.chromatin || 'euchromatin';
      const duplex = this.scoreDuplexCleavage(cleanGuide, locus.protospacer, {
        pam: locus.pam,
        nuclease,
        chromatin: chrom
      });

      return {
        ...locus,
        ...duplex,
        riskLevel: locus.isOnTarget
          ? 'ON_TARGET'
          : (duplex.cleavageScorePct >= 15.0
              ? 'HIGH_RISK'
              : (duplex.cleavageScorePct >= 2.0 ? 'MODERATE_RISK' : 'LOW_RISK'))
      };
    });

    const onTargetHit = scoredLoci.find(l => l.isOnTarget) || scoredLoci[0] || { cleavageScorePct: 0 };
    const offTargetSum = scoredLoci
      .filter(l => !l.isOnTarget)
      .reduce((acc, l) => acc + l.cleavageScorePct, 0);

    const specificityScore = Number(((100.0 / (100.0 + offTargetSum)) * 100.0).toFixed(1));

    return {
      sgRNA: cleanGuide,
      nuclease,
      onTargetScorePct: onTargetHit.cleavageScorePct,
      specificityScore,
      offTargetTotalRisk: Number(offTargetSum.toFixed(2)),
      safetyClassification:
        specificityScore >= 85 ? 'CLINICAL_GRADE' : (specificityScore >= 65 ? 'MODERATE_OFF_TARGET' : 'UNSAFE_PROMISCUOUS'),
      loci: scoredLoci
    };
  }

  static predictRepairPathway(onTargetCleavagePct, {
    donorTemplatePresent = true,
    nhejInhibitorAdded = false,
    sG2PhaseFraction = 0.42
  } = {}) {
    const cutFrac = Math.max(0, Math.min(100, onTargetCleavagePct)) / 100.0;
    const uncutPct = Number(((1.0 - cutFrac) * 100.0).toFixed(2));

    if (!donorTemplatePresent || cutFrac === 0) {
      const nhejOnly = Number((100.0 - uncutPct).toFixed(2));
      return {
        hdrPct: 0.0,
        nhejPct: nhejOnly,
        uncutPct,
        totalPct: Number((nhejOnly + uncutPct).toFixed(2))
      };
    }

    const hdrBranchRatio = Math.min(
      0.85,
      sG2PhaseFraction * (nhejInhibitorAdded ? 1.55 : 0.78)
    );

    const hdrPct = Number((cutFrac * hdrBranchRatio * 100.0).toFixed(2));
    const nhejPct = Number(Math.max(0, 100.0 - uncutPct - hdrPct).toFixed(2));

    return {
      hdrPct,
      nhejPct,
      uncutPct,
      totalPct: Number((hdrPct + nhejPct + uncutPct).toFixed(2))
    };
  }

  // =========================================================================
  // 2. 24-CHROMOSOME CIRCOS RADAR & DUPLEX BUBBLE ALIGNER (Substep 8)
  // =========================================================================

  static projectCircosNodes(scanResult, width = 320, height = 300) {
    const cx = width / 2;
    const cy = height / 2;
    const ringRadius = Math.min(width, height) * 0.37;
    const numChr = this.CHROMOSOMES.length;
    const sectorStep = (2 * Math.PI) / numChr;
    const gapRad = 0.025;

    const sectorNodes = this.CHROMOSOMES.map((chrName, idx) => {
      const startAngle = -Math.PI / 2 + idx * sectorStep + gapRad / 2;
      const endAngle = -Math.PI / 2 + (idx + 1) * sectorStep - gapRad / 2;
      const midAngle = (startAngle + endAngle) * 0.5;
      return {
        chr: chrName,
        index: idx,
        startAngle,
        endAngle,
        midAngle,
        labelX: Number((cx + (ringRadius + 19) * Math.cos(midAngle)).toFixed(1)),
        labelY: Number((cy + (ringRadius + 19) * Math.sin(midAngle)).toFixed(1))
      };
    });

    const loci = (scanResult && scanResult.loci) || [];
    const locusNodes = loci.map((locus, i) => {
      const chrIdx = Math.max(0, this.CHROMOSOMES.indexOf(locus.chr));
      const sec = sectorNodes[chrIdx];
      const offsetFrac = 0.25 + ((locus.coordMb * 7 + i * 31) % 50) / 100.0;
      const angle = sec.startAngle + offsetFrac * (sec.endAngle - sec.startAngle);
      const rBlip = ringRadius - 10;
      const x = Number((cx + rBlip * Math.cos(angle)).toFixed(1));
      const y = Number((cy + rBlip * Math.sin(angle)).toFixed(1));

      let color = '#8b949e';
      if (locus.isOnTarget) {
        color = '#3fb950';
      } else if (locus.cleavageScorePct >= 15.0) {
        color = '#f85149';
      } else if (locus.cleavageScorePct >= 1.0) {
        color = '#d29922';
      }

      return {
        ...locus,
        angle: Number(angle.toFixed(4)),
        x,
        y,
        blipRadius: locus.isOnTarget ? 7.0 : 5.5,
        color
      };
    });

    return {
      cx,
      cy,
      ringRadius: Number(ringRadius.toFixed(1)),
      sectorNodes,
      locusNodes
    };
  }

  static hitTestCircos(x, y, scanResult, width = 320, height = 300) {
    const { locusNodes } = this.projectCircosNodes(scanResult, width, height);
    for (const node of locusNodes) {
      const dx = x - node.x;
      const dy = y - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= node.blipRadius + 5) {
        return { ...node, distancePx: Number(dist.toFixed(2)) };
      }
    }
    return null;
  }

  static renderCircosMap(canvas, scanResult, options = {}) {
    if (!canvas || typeof canvas.getContext !== 'function' || !scanResult) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#070a0f';
    ctx.fillRect(0, 0, w, h);

    const { cx, cy, ringRadius, sectorNodes, locusNodes } = this.projectCircosNodes(scanResult, w, h);

    ctx.save();
    ctx.strokeStyle = 'rgba(48, 54, 61, 0.45)';
    ctx.lineWidth = 1;
    [0.35, 0.68, 1.0].forEach(scale => {
      ctx.beginPath();
      ctx.arc(cx, cy, ringRadius * scale, 0, 2 * Math.PI);
      ctx.stroke();
    });
    ctx.restore();

    for (const sec of sectorNodes) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, ringRadius, sec.startAngle, sec.endAngle);
      ctx.lineWidth = 9;
      ctx.strokeStyle = sec.index % 2 === 0 ? '#1f2937' : '#2d3748';
      ctx.stroke();

      ctx.fillStyle = '#8b949e';
      ctx.font = '8.5px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const shortLabel = sec.chr.replace('Chr', '');
      ctx.fillText(shortLabel, sec.labelX, sec.labelY);
      ctx.restore();
    }

    for (const node of locusNodes) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      const ctrlAngle = node.angle - 0.25;
      const ctrlR = ringRadius * 0.48;
      ctx.quadraticCurveTo(
        cx + ctrlR * Math.cos(ctrlAngle),
        cy + ctrlR * Math.sin(ctrlAngle),
        node.x,
        node.y
      );

      ctx.strokeStyle = node.color;
      ctx.lineWidth = node.isOnTarget ? 2.4 : 1.5;
      if (!node.isOnTarget) {
        ctx.setLineDash([3, 3]);
      }
      ctx.stroke();
      ctx.restore();
    }

    for (const node of locusNodes) {
      const isSelected = options.selectedLocusId === node.id || options.hoveredLocusId === node.id;
      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, isSelected ? node.blipRadius + 2.5 : node.blipRadius, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.shadowColor = node.color;
      ctx.shadowBlur = isSelected ? 12 : 7;
      ctx.fill();

      ctx.lineWidth = isSelected ? 2.2 : 1.2;
      ctx.strokeStyle = isSelected ? '#ffffff' : '#0b0f17';
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#151b26';
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#58a6ff';
    ctx.stroke();

    ctx.fillStyle = '#f0f6fc';
    ctx.font = 'bold 9.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(scanResult.nuclease, cx, cy - 4);
    ctx.fillStyle = '#58a6ff';
    ctx.font = '8.5px monospace';
    ctx.fillText(`Spec:${scanResult.specificityScore}`, cx, cy + 8);
    ctx.restore();
  }

  static renderMismatchTrack(canvas, locusAlignment, repairSplit = null) {
    if (!canvas || typeof canvas.getContext !== 'function' || !locusAlignment) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#070a0f';
    ctx.fillRect(0, 0, w, h);

    const align = locusAlignment.baseAlignment || [];
    const padLeft = 46;
    const colW = Math.min(20, (w - padLeft - 68) / 20);
    const guideY = 58;
    const targetY = 112;

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    const title = locusAlignment.gene || 'Genomic Target Duplex';
    ctx.fillText(
      `${title} [${locusAlignment.chr || 'Chr'} | Cleavage: ${locusAlignment.cleavageScorePct}%]`,
      12,
      20
    );

    const seedStartX = padLeft + 12 * colW;
    const seedWidth = 8 * colW;
    ctx.fillStyle = 'rgba(88, 166, 255, 0.08)';
    ctx.strokeStyle = 'rgba(88, 166, 255, 0.28)';
    ctx.lineWidth = 1;
    ctx.fillRect(seedStartX - 2, 32, seedWidth + 2, 102);
    ctx.strokeRect(seedStartX - 2, 32, seedWidth + 2, 102);

    ctx.fillStyle = '#58a6ff';
    ctx.font = '8.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAM-PROXIMAL SEED (13-20)', seedStartX + seedWidth / 2, 42);

    ctx.fillStyle = '#8b949e';
    ctx.font = 'bold 9.5px monospace';
    ctx.textAlign = 'right';
    ctx.fillText("sgRNA 5'", padLeft - 6, guideY + 4);
    ctx.fillText("DNA   5'", padLeft - 6, targetY + 4);

    for (let i = 0; i < align.length; i++) {
      const b = align[i];
      const cx = padLeft + i * colW + colW * 0.5;

      if (b.matched) {
        ctx.strokeStyle = 'rgba(63, 185, 80, 0.55)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(cx, guideY + 9);
        ctx.lineTo(cx, targetY - 11);
        ctx.stroke();
      } else {
        const bubbleColor = b.isSeedRegion ? '#f85149' : '#d29922';
        ctx.save();
        ctx.fillStyle = b.isSeedRegion ? 'rgba(248, 81, 73, 0.25)' : 'rgba(210, 153, 34, 0.25)';
        ctx.strokeStyle = bubbleColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(cx, (guideY + targetY) * 0.5, colW * 0.46, 15, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = '7.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${b.retentionWeight}`, cx, (guideY + targetY) * 0.5 + 3);
        ctx.restore();
      }

      ctx.fillStyle = b.matched ? '#7ee787' : '#ff7b72';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(b.guideBase, cx, guideY + 4);

      ctx.fillStyle = b.matched ? '#c9d1d9' : '#ffa657';
      ctx.fillText(b.targetBase, cx, targetY + 4);

      if ((i + 1) % 5 === 0 || i === 0) {
        ctx.fillStyle = '#6e7681';
        ctx.font = '8px monospace';
        ctx.fillText(`${i + 1}`, cx, targetY + 18);
      }
    }

    const pamX = padLeft + 20 * colW + 6;
    const pamValid = locusAlignment.pamValid !== false;
    ctx.save();
    ctx.fillStyle = pamValid ? 'rgba(63, 185, 80, 0.18)' : 'rgba(248, 81, 73, 0.25)';
    ctx.strokeStyle = pamValid ? '#3fb950' : '#f85149';
    ctx.lineWidth = 1.5;
    ctx.fillRect(pamX, targetY - 14, 46, 22);
    ctx.strokeRect(pamX, targetY - 14, 46, 22);

    ctx.fillStyle = '#f0f6fc';
    ctx.font = 'bold 10.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(locusAlignment.pam || 'NGG', pamX + 23, targetY + 1);
    ctx.fillStyle = pamValid ? '#3fb950' : '#f85149';
    ctx.font = '8px monospace';
    ctx.fillText('PAM', pamX + 23, targetY - 18);
    ctx.restore();

    if (repairSplit) {
      const barY = h - 32;
      const barW = w - 24;
      const barH = 14;
      const wHdr = (repairSplit.hdrPct / 100.0) * barW;
      const wNhej = (repairSplit.nhejPct / 100.0) * barW;
      const wUncut = Math.max(0, barW - wHdr - wNhej);

      ctx.fillStyle = '#3fb950';
      ctx.fillRect(12, barY, wHdr, barH);
      ctx.fillStyle = '#d29922';
      ctx.fillRect(12 + wHdr, barY, wNhej, barH);
      ctx.fillStyle = '#30363d';
      ctx.fillRect(12 + wHdr + wNhej, barY, wUncut, barH);

      ctx.fillStyle = '#c9d1d9';
      ctx.font = '9.5px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `DSB Repair Split — Precision HDR: ${repairSplit.hdrPct}% | Error-Prone NHEJ Indels: ${repairSplit.nhejPct}% | Uncut WT: ${repairSplit.uncutPct}%`,
        12,
        barY - 5
      );
    }
  }

  static bindInteractiveCircos(canvas, getScanResultFn, callbacks = {}) {
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
      const scan = getScanResultFn();
      if (!scan) return;
      const hit = this.hitTestCircos(x, y, scan, canvas.width, canvas.height);

      canvas.style.cursor = hit ? 'pointer' : 'default';
      this.renderCircosMap(canvas, scan, { hoveredLocusId: hit ? hit.id : null });

      if (hit && callbacks.onHoverLocus) {
        callbacks.onHoverLocus(hit);
      }
    });

    canvas.addEventListener('click', (evt) => {
      const { x, y } = getCoords(evt);
      const scan = getScanResultFn();
      if (!scan) return;
      const hit = this.hitTestCircos(x, y, scan, canvas.width, canvas.height);
      if (hit && callbacks.onSelectLocus) {
        callbacks.onSelectLocus(hit);
      }
    });
  }
}

/**
 * Zero-Dependency Verification Test Suite for Module 12 (Substeps 7 & 8)
 */
export function runCrisprCleavageTests() {
  const results = [];
  const assert = (name, condition, expected, actual) => {
    results.push({
      test: name,
      expected,
      actual,
      status: condition ? 'PASS' : 'FAIL'
    });
  };

  const guide = 'CTTGCCCCACAGGGCAGTAA';

  // Test 1: Perfect 20/20 Match + Canonical NGG PAM in Open Euchromatin -> 100% Score
  const perfectMatch = CrisprCleavageEngine.scoreDuplexCleavage(guide, guide, {
    pam: 'CGG',
    nuclease: 'SpCas9',
    chromatin: 'euchromatin'
  });
  assert(
    'CRISPR On-Target Perfect 20/20 Match + NGG PAM Score (100%)',
    perfectMatch.cleavageScorePct === 100.0 && perfectMatch.mismatchCount === 0,
    'Score=100%, Mismatches=0',
    `Score=${perfectMatch.cleavageScorePct}%, Mismatches=${perfectMatch.mismatchCount}`
  );

  // Test 2: PAM-Proximal Seed Region Mismatch (Pos 19) Penalizes Much Harder Than 5'-Distal Mismatch (Pos 1)
  const distalMismatch = CrisprCleavageEngine.scoreDuplexCleavage(guide, 'TTTGCCCCACAGGGCAGTAA', {
    pam: 'CGG'
  });
  const seedMismatch = CrisprCleavageEngine.scoreDuplexCleavage(guide, 'CTTGCCCCACAGGGCAGTTA', {
    pam: 'CGG'
  });
  assert(
    'Hsu-Zhang Seed Region Hypersensitivity (Distal Pos 1 Score >> Seed Pos 19 Score)',
    distalMismatch.cleavageScorePct > 80.0 && seedMismatch.cleavageScorePct < 5.0,
    'Distal > 80% & Seed < 5%',
    `Distal(Pos1)=${distalMismatch.cleavageScorePct}% vs Seed(Pos19)=${seedMismatch.cleavageScorePct}%`
  );

  // Test 3: PAM Ablation Immunity (Mutated Non-NGG/NAG PAM Completely Blocks Cas9 Cleavage)
  const ablatedPam = CrisprCleavageEngine.scoreDuplexCleavage(guide, guide, {
    pam: 'CTC',
    nuclease: 'SpCas9'
  });
  assert(
    'PAM Ablation Immunity (Non-NGG/NAG Target Yields 0% Cleavage)',
    ablatedPam.cleavageScorePct === 0.0 && ablatedPam.pamValid === false,
    'Score=0.0%, pamValid=false',
    `Score=${ablatedPam.cleavageScorePct}%, pamValid=${ablatedPam.pamValid}`
  );

  // Test 4: Epigenetic Heterochromatin Compaction Damping
  const heteroMatch = CrisprCleavageEngine.scoreDuplexCleavage(guide, guide, {
    pam: 'CGG',
    chromatin: 'heterochromatin'
  });
  assert(
    'Epigenetic Chromatin Accessibility Weighting (Euchromatin > Heterochromatin)',
    perfectMatch.cleavageScorePct === 100.0 && heteroMatch.cleavageScorePct === 18.0,
    'Euchromatin=100% vs Heterochromatin=18%',
    `Euchromatin=${perfectMatch.cleavageScorePct}% vs Heterochromatin=${heteroMatch.cleavageScorePct}%`
  );

  // Test 5: DSB Repair Pathway Probability Conservation (HDR + NHEJ + Uncut = 100.0%)
  const repairWithDonor = CrisprCleavageEngine.predictRepairPathway(92.4, {
    donorTemplatePresent: true,
    nhejInhibitorAdded: true
  });
  assert(
    'DSB Repair Pathway Probability Conservation (HDR + NHEJ + Uncut = 100%)',
    Math.abs(repairWithDonor.totalPct - 100.0) < 1e-5 && repairWithDonor.hdrPct > 0 && repairWithDonor.nhejPct > 0,
    'Total=100.0% (HDR>0, NHEJ>0)',
    `Total=${repairWithDonor.totalPct}% (HDR=${repairWithDonor.hdrPct}%, NHEJ=${repairWithDonor.nhejPct}%, Uncut=${repairWithDonor.uncutPct}%)`
  );

  // Test 6: 24-Chromosome Radial Circos Projection & Coordinate Hit-Testing
  const presetHbb = CrisprCleavageEngine.GENE_PRESETS.hbb_sickle;
  const scanHbb = CrisprCleavageEngine.scanGenomicLoci(presetHbb.sgRNA, presetHbb.candidateLoci);
  const circos = CrisprCleavageEngine.projectCircosNodes(scanHbb, 320, 300);
  const onTargetNode = circos.locusNodes.find(n => n.isOnTarget);
  const hitLocus = CrisprCleavageEngine.hitTestCircos(onTargetNode.x, onTargetNode.y, scanHbb, 320, 300);
  assert(
    '24-Chromosome Radial Circos Projection & Locus Hit-Testing',
    circos.sectorNodes.length === 24 && hitLocus !== null && hitLocus.id === 'hbb_on',
    '24 Chromosomes & Hit=hbb_on (Chr11)',
    `Chrs=${circos.sectorNodes.length}, Hit=${hitLocus?.id} (${hitLocus?.chr})`
  );

  return results;
}

// Auto-execute test suite if run directly in Node.js
if (typeof process !== 'undefined' && process.argv && import.meta.url.endsWith(process.argv[1])) {
  const report = runCrisprCleavageTests();
  console.table(report);
  const failed = report.filter(r => r.status === 'FAIL');
  if (failed.length > 0) process.exit(1);
}
// === END OF CRISPR_CLEAVAGE_ENGINE.JS (v12.0) ===