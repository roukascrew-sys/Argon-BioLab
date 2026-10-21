/**
 * Virtual BioTech & BioChem Lab — Module 4: 3D Molecular Graphics & Structural Biology Adapter
 * @module molecular_viewer
 * @version 4.0.0
 *
 * Wraps 3Dmol.js for hardware-accelerated WebGL macromolecular rendering while
 * providing pure 3D structural coordinate geometry (Euclidean bond distances,
 * active-site binding pocket contact shells, and PDB record parsing) that can
 * be verified in both browser and headless Node.js environments.
 */

export class MolecularViewer {
  /** Curated Structural Biology & Biotech Reference Library */
  static PRESET_STRUCTURES = {
    '1EMA': { title: 'Green Fluorescent Protein (GFP)', organism: 'Aequorea victoria', highlightLigand: 'CRO' },
    '4OO8': { title: 'CRISPR-Cas9 Endonuclease + sgRNA + Target DNA', organism: 'Streptococcus pyogenes', highlightLigand: null },
    '6LU7': { title: 'SARS-CoV-2 Main Protease (Mpro) + N3 Inhibitor', organism: 'SARS-CoV-2', highlightLigand: 'PRD_002214' },
    '1BNA': { title: 'B-DNA Dodecamer Double Helix', organism: 'Synthetic Construct', highlightLigand: null },
    '4INS': { title: 'Human Insulin Hexamer (Zn2+ Coordinated)', organism: 'Homo sapiens', highlightLigand: 'ZN' }
  };

  /**
   * @param {HTMLElement|null} containerElement - DOM element to mount the WebGL canvas
   * @param {Object} [options]
   * @param {Function} [options.onAtomPicked] - Callback fired when an atom is clicked
   * @param {Function} [options.onDistanceMeasured] - Callback fired when two atoms are measured
   * @param {Function} [options.onLog] - Optional logger callback
   * @param {Object} [options.glViewerInstance] - Optional injected viewer (for headless unit testing)
   */
  constructor(containerElement = null, options = {}) {
    this.container = containerElement;
    this.onAtomPicked = options.onAtomPicked || (() => {});
    this.onDistanceMeasured = options.onDistanceMeasured || (() => {});
    this.onLog = options.onLog || (() => {});

    this.viewer = options.glViewerInstance || null;
    this.currentPdbId = null;
    this.rawPdbText = '';
    this.parsedAtoms = [];
    this.surfaceActive = false;
    this.spinActive = false;
    this.measurementQueue = [];

    if (this.container && !this.viewer && typeof globalThis.$3Dmol !== 'undefined') {
      this.viewer = globalThis.$3Dmol.createViewer(this.container, {
        backgroundColor: '#05070b',
        antialias: true
      });
    }
  }

  // =========================================================================
  // PURE 3D STRUCTURAL GEOMETRY & PDB PARSING METHODS (Headless-Testable)
  // =========================================================================

  /**
   * Computes exact 3D Euclidean distance in Angstroms (Å) between two atomic coordinates.
   * d = sqrt((x2 - x1)^2 + (y2 - y1)^2 + (z2 - z1)^2)
   *
   * @param {Object} atomA - { x: number, y: number, z: number }
   * @param {Object} atomB - { x: number, y: number, z: number }
   * @returns {number} Distance in Angstroms (Å)
   */
  static computeDistance(atomA, atomB) {
    if (!atomA || !atomB) throw new TypeError('Both atomA and atomB coordinates are required.');
    const dx = atomB.x - atomA.x;
    const dy = atomB.y - atomA.y;
    const dz = atomB.z - atomA.z;
    return Number(Math.sqrt(dx * dx + dy * dy + dz * dz).toFixed(3));
  }

  /**
   * Parses raw RCSB PDB coordinate text (`ATOM` and `HETATM` records) into
   * structured atom objects according to standard PDB fixed-column formatting.
   *
   * @param {string} pdbText - Raw PDB file contents
   * @returns {Object[]} Array of parsed atom objects
   */
  static parsePDBAtoms(pdbText) {
    if (typeof pdbText !== 'string') throw new TypeError('PDB input must be a string.');
    const lines = pdbText.split(/\r?\n/);
    const atoms = [];

    for (const line of lines) {
      const recordType = line.slice(0, 6).trim();
      if (recordType === 'ATOM' || recordType === 'HETATM') {
        const serial = parseInt(line.slice(6, 11).trim(), 10);
        const atomName = line.slice(12, 16).trim();
        const resn = line.slice(17, 20).trim();
        const chain = line.slice(21, 22).trim() || 'A';
        const resi = parseInt(line.slice(22, 26).trim(), 10);
        const x = parseFloat(line.slice(30, 38).trim());
        const y = parseFloat(line.slice(38, 46).trim());
        const z = parseFloat(line.slice(46, 54).trim());
        const elem = line.slice(76, 78).trim() || atomName.replace(/[0-9]/g, '')[0] || 'C';

        if (!Number.isNaN(x) && !Number.isNaN(y) && !Number.isNaN(z)) {
          atoms.push({
            serial,
            atom: atomName,
            resn,
            chain,
            resi,
            x,
            y,
            z,
            elem,
            hetflag: recordType === 'HETATM'
          });
        }
      }
    }
    return atoms;
  }

  /**
   * Computes macromolecular structural metrics (total atoms, chains, residues,
   * non-water heteroatoms, and distinct ligand identifiers).
   *
   * @param {Object[]} atoms - Array of atom objects from parsePDBAtoms or 3Dmol
   * @returns {Object} Structural summary
   */
  static summarizeStructure(atoms) {
    const chains = new Set();
    const polymerResidues = new Set();
    const ligandNames = new Set();
    let polymerAtomCount = 0;
    let hetAtomCount = 0;
    let waterCount = 0;

    for (const a of atoms) {
      if (a.chain) chains.add(a.chain);
      if (!a.hetflag) {
        polymerAtomCount++;
        polymerResidues.add(`${a.chain}:${a.resi}:${a.resn}`);
      } else if (a.resn === 'HOH' || a.resn === 'WAT') {
        waterCount++;
      } else {
        hetAtomCount++;
        ligandNames.add(a.resn);
      }
    }

    return {
      totalAtoms: atoms.length,
      polymerAtomCount,
      hetAtomCount,
      waterCount,
      chainCount: chains.size,
      chains: Array.from(chains),
      residueCount: polymerResidues.size,
      ligands: Array.from(ligandNames)
    };
  }

  /**
   * Identifies all macromolecular binding-pocket residues that have at least one
   * atom within `cutoffAngstroms` (typically 4.0–5.0 Å) of any target ligand atom.
   *
   * @param {Object[]} atoms - Full structure atom list
   * @param {string} [ligandResn] - Optional specific ligand residue name (if omitted, uses all non-water HETATMs)
   * @param {number} [cutoffAngstroms=4.5] - Contact shell distance threshold in Å
   * @returns {Object} { cutoffAngstroms, ligandAtomsCount, pocketResidues, closestContacts }
   */
  static findBindingPocketResidues(atoms, ligandResn = null, cutoffAngstroms = 4.5) {
    const ligandAtoms = atoms.filter(a =>
      a.hetflag &&
      a.resn !== 'HOH' &&
      a.resn !== 'WAT' &&
      (!ligandResn || a.resn === ligandResn)
    );
    const polymerAtoms = atoms.filter(a => !a.hetflag);

    if (ligandAtoms.length === 0) {
      return { cutoffAngstroms, ligandAtomsCount: 0, pocketResidues: [], closestContacts: [] };
    }

    const cutoffSq = cutoffAngstroms * cutoffAngstroms;
    const residueMap = new Map();

    for (const pAtom of polymerAtoms) {
      for (const lAtom of ligandAtoms) {
        const dx = pAtom.x - lAtom.x;
        const dy = pAtom.y - lAtom.y;
        const dz = pAtom.z - lAtom.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq <= cutoffSq) {
          const dist = Number(Math.sqrt(distSq).toFixed(2));
          const key = `${pAtom.chain}:${pAtom.resi}`;
          const existing = residueMap.get(key);

          if (!existing || dist < existing.minDistance) {
            residueMap.set(key, {
              chain: pAtom.chain,
              resi: pAtom.resi,
              resn: pAtom.resn,
              closestPolymerAtom: pAtom.atom,
              closestLigandAtom: `${lAtom.resn}:${lAtom.atom}`,
              minDistance: dist
            });
          }
        }
      }
    }

    const pocketResidues = Array.from(residueMap.values()).sort((a, b) => a.minDistance - b.minDistance);
    return {
      cutoffAngstroms,
      ligandAtomsCount: ligandAtoms.length,
      pocketResidues
    };
  }

  // =========================================================================
  // WEBGL VIEWER ORCHESTRATION METHODS
  // =========================================================================

  /**
   * Fetches a PDB file by its 4-character RCSB ID and loads it into the viewer.
   *
   * @param {string} pdbId - 4-character RCSB identifier (e.g., '1EMA', '6LU7')
   * @param {Function} [customFetch] - Optional fetch override for offline/unit test mocking
   * @returns {Promise<Object>} Structural summary
   */
  async fetchAndLoadPDB(pdbId, customFetch = globalThis.fetch) {
    const cleanId = pdbId.trim().toUpperCase();
    if (!/^[A-Z0-9]{4}$/.test(cleanId)) {
      throw new Error(`Invalid PDB ID "${pdbId}". Must be 4 alphanumeric characters.`);
    }

    this.onLog(`Fetching atomic coordinate structure ${cleanId} from RCSB PDB...`);
    const url = `https://files.rcsb.org/download/${cleanId}.pdb`;
    const response = await customFetch(url);
    if (!response.ok) {
      throw new Error(`RCSB PDB server returned HTTP ${response.status} for ${cleanId}.`);
    }

    const pdbText = await response.text();
    return this.loadFromPDBText(pdbText, cleanId);
  }

  /**
   * Loads raw PDB coordinate text directly into the parser and WebGL viewport.
   */
  loadFromPDBText(pdbText, pdbId = 'CUSTOM') {
    this.currentPdbId = pdbId;
    this.rawPdbText = pdbText;
    this.parsedAtoms = MolecularViewer.parsePDBAtoms(pdbText);
    this.surfaceActive = false;
    this.measurementQueue = [];

    const summary = MolecularViewer.summarizeStructure(this.parsedAtoms);

    if (this.viewer) {
      this.viewer.clear();
      this.viewer.addModel(pdbText, 'pdb');
      this.applyStyle({ backboneStyle: 'cartoon', colorScheme: 'spectrum', ligandStyle: 'ballstick' });
      this._bindInteractivePicking();
      this.viewer.zoomTo();
      this.viewer.render();
    }

    this.onLog(
      `Loaded ${pdbId}: ${summary.totalAtoms.toLocaleString()} atoms, ` +
      `${summary.residueCount} residues across ${summary.chainCount} chain(s). ` +
      `Ligands: ${summary.ligands.length ? summary.ligands.join(', ') : 'None'}.`
    );

    return summary;
  }

  /**
   * Applies macromolecular polymer and heteroatom ligand rendering styles.
   *
   * @param {Object} styleConfig
   * @param {string} [styleConfig.backboneStyle='cartoon'] - 'cartoon' | 'stick' | 'sphere' | 'line'
   * @param {string} [styleConfig.colorScheme='spectrum'] - 'spectrum' | 'ssJmol' | 'chain' | 'Jmol'
   * @param {string} [styleConfig.ligandStyle='ballstick'] - 'ballstick' | 'sphere' | 'hidden'
   */
  applyStyle({
    backboneStyle = 'cartoon',
    colorScheme = 'spectrum',
    ligandStyle = 'ballstick'
  } = {}) {
    if (!this.viewer) return;

    this.viewer.setStyle({}, {}); // Reset all representations

    const polymerStyle = {};
    polymerStyle[backboneStyle] = colorScheme === 'spectrum'
      ? { color: 'spectrum' }
      : { colorscheme: colorScheme };

    // 1. Style primary polymer chains
    this.viewer.setStyle({ hetflag: false }, polymerStyle);

    // 2. Style active-site ligands & cofactors (excluding crystallographic water)
    if (ligandStyle === 'ballstick') {
      this.viewer.setStyle(
        { hetflag: true, not: { resn: ['HOH', 'WAT'] } },
        {
          stick: { radius: 0.22, colorscheme: 'yellowCarbon' },
          sphere: { scale: 0.32, colorscheme: 'yellowCarbon' }
        }
      );
    } else if (ligandStyle === 'sphere') {
      this.viewer.setStyle(
        { hetflag: true, not: { resn: ['HOH', 'WAT'] } },
        { sphere: { colorscheme: 'yellowCarbon' } }
      );
    }

    this.viewer.render();
  }

  /**
   * Highlights all catalytic pocket residues within `cutoffAngstroms` of bound ligands
   * as cyan covalent sticks overlaid on a translucent ribbon backbone.
   */
  highlightBindingPocket(cutoffAngstroms = 4.5) {
    const pocketData = MolecularViewer.findBindingPocketResidues(this.parsedAtoms, null, cutoffAngstroms);
    if (!this.viewer || pocketData.pocketResidues.length === 0) {
      return pocketData;
    }

    // Group residue numbers by chain for 3Dmol selection
    const byChain = {};
    for (const res of pocketData.pocketResidues) {
      if (!byChain[res.chain]) byChain[res.chain] = [];
      byChain[res.chain].push(res.resi);
    }

    for (const [chain, resiList] of Object.entries(byChain)) {
      this.viewer.addStyle(
        { chain, resi: resiList, hetflag: false },
        { stick: { radius: 0.16, colorscheme: 'cyanCarbon' } }
      );
    }

    this.viewer.render();
    this.onLog(
      `Highlighted ${pocketData.pocketResidues.length} binding-pocket residues within ${cutoffAngstroms} Å of ligand.`
    );
    return pocketData;
  }

  /**
   * Toggles a translucent Van der Waals Solvent-Accessible Surface (SAS) mesh.
   */
  toggleSurface(opacity = 0.68) {
    if (!this.viewer) return false;
    if (this.surfaceActive) {
      this.viewer.removeAllSurfaces();
      this.surfaceActive = false;
      this.onLog('Removed Van der Waals molecular surface.');
    } else {
      const surfType = globalThis.$3Dmol ? globalThis.$3Dmol.SurfaceType.VDW : 1;
      this.viewer.addSurface(surfType, { opacity, colorscheme: 'whiteCarbon' }, { hetflag: false });
      this.surfaceActive = true;
      this.onLog(`Rendered Van der Waals surface mesh (opacity: ${Math.round(opacity * 100)}%).`);
    }
    this.viewer.render();
    return this.surfaceActive;
  }

  /**
   * Toggles continuous Y-axis turntable rotation.
   */
  toggleSpin() {
    if (!this.viewer) return false;
    this.spinActive = !this.spinActive;
    this.viewer.spin(this.spinActive ? 'y' : false);
    return this.spinActive;
  }

  /**
   * Internal handler for raycast atom clicking and two-atom distance measurement.
   */
  _bindInteractivePicking() {
    if (!this.viewer) return;
    this.viewer.setClickable({}, true, (atom) => {
      if (!atom) return;

      const pickedInfo = {
        serial: atom.serial,
        atom: atom.atom,
        resn: atom.resn,
        resi: atom.resi,
        chain: atom.chain || 'A',
        elem: atom.elem,
        hetflag: Boolean(atom.hetflag),
        x: Number(atom.x.toFixed(3)),
        y: Number(atom.y.toFixed(3)),
        z: Number(atom.z.toFixed(3))
      };

      this.viewer.addLabel(`${pickedInfo.resn}${pickedInfo.resi}:${pickedInfo.atom}`, {
        position: atom,
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        fontColor: '#58a6ff',
        fontSize: 12,
        borderThickness: 1,
        borderColor: '#58a6ff'
      });

      this.onAtomPicked(pickedInfo);

      // Pairwise distance measurement queue
      this.measurementQueue.push(pickedInfo);
      if (this.measurementQueue.length === 2) {
        const [a1, a2] = this.measurementQueue;
        const dist = MolecularViewer.computeDistance(a1, a2);
        this.onDistanceMeasured({ atom1: a1, atom2: a2, distanceAngstroms: dist });
        this.onLog(
          `Measured interatomic distance [${a1.resn}${a1.resi}:${a1.atom} ↔ ${a2.resn}${a2.resi}:${a2.atom}] = ${dist} Å`
        );
        this.measurementQueue = [];
      }

      this.viewer.render();
    });
  }
}

/**
 * Zero-Dependency Verification Test Suite for Module 4
 */
export function runMolecularViewerTests() {
  const results = [];
  const assert = (name, condition, expected, actual) => {
    results.push({
      test: name,
      expected,
      actual,
      status: condition ? 'PASS' : 'FAIL'
    });
  };

  // Synthetic Mini-PDB with 2 Catalytic Residues (HIS 41, CYS 145), 1 Ligand (INH 301), and 1 Water (HOH 401)
  const SAMPLE_PDB = [
    'ATOM      1  N   HIS A  41       0.000   0.000   0.000  1.00 10.00           N',
    'ATOM      2  CA  HIS A  41       1.458   0.000   0.000  1.00 10.00           C',
    'ATOM      3  SG  CYS A 145       3.000   4.000   0.000  1.00 10.00           S',
    'ATOM      4  CA  ALA B  99      25.000  25.000  25.000  1.00 10.00           C',
    'HETATM    5  C1  INH A 301       3.000   1.000   0.000  1.00 15.00           C',
    'HETATM    6  O   HOH A 401       3.100   1.100   0.000  1.00 20.00           O'
  ].join('\n');

  // Test 1: 3D Euclidean Distance Identity (3-4-5 Right Triangle in Angstroms)
  const dist = MolecularViewer.computeDistance({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 });
  assert('3D Euclidean Interatomic Distance (3-4-5 Triangle)', dist === 5.0, 5.0, dist);

  // Test 2: PDB Fixed-Column Parser & Structural Summary
  const parsed = MolecularViewer.parsePDBAtoms(SAMPLE_PDB);
  const summary = MolecularViewer.summarizeStructure(parsed);
  assert(
    'PDB Atom/Hetatm Parser & Chain/Ligand Summary',
    summary.totalAtoms === 6 &&
      summary.polymerAtomCount === 4 &&
      summary.hetAtomCount === 1 &&
      summary.waterCount === 1 &&
      summary.chainCount === 2 &&
      summary.ligands[0] === 'INH',
    'Atoms=6, Chains=2, Ligand=INH',
    `Atoms=${summary.totalAtoms}, Chains=${summary.chainCount}, Ligand=${summary.ligands[0]}`
  );

  // Test 3: Active-Site Binding Pocket Contact Shell Discovery (Cutoff = 4.0 Å)
  // INH C1 is at (3,1,0):
  // - HIS 41 CA at (1.458,0,0) -> distance = sqrt(1.542^2 + 1^2) = 1.84 Å (INSIDE)
  // - CYS 145 SG at (3,4,0)    -> distance = 3.00 Å (INSIDE)
  // - ALA 99 CA at (25,25,25)  -> distance = 39.61 Å (OUTSIDE)
  const pocket = MolecularViewer.findBindingPocketResidues(parsed, 'INH', 4.0);
  const pocketIds = pocket.pocketResidues.map(r => `${r.resn}${r.resi}`).join(', ');
  assert(
    'Active-Site Binding Pocket Shell Identification (<= 4.0 Å)',
    pocket.pocketResidues.length === 2 && pocketIds === 'HIS41, CYS145',
    'HIS41, CYS145',
    pocketIds
  );

  // Test 4: Headless Mock WebGL Adapter & Raycast Distance Measurement Pipeline
  let measuredEvent = null;
  const mockGLViewer = {
    clear() {},
    addModel() {},
    setStyle() {},
    addStyle() {},
    zoomTo() {},
    render() {},
    addLabel() {},
    setClickable(_sel, _enable, callback) {
      this.clickCallback = callback;
    }
  };

  const adapter = new MolecularViewer(null, {
    glViewerInstance: mockGLViewer,
    onDistanceMeasured: (data) => { measuredEvent = data; }
  });

  adapter.loadFromPDBText(SAMPLE_PDB, 'TEST');
  // Simulate clicking Atom 1 (0,0,0) and Atom 3 (3,4,0) -> Distance = 5.0 Å
  mockGLViewer.clickCallback(parsed[0]);
  mockGLViewer.clickCallback(parsed[2]);

  assert(
    'Interactive Raycast Pairwise Atom Measurement Callback',
    measuredEvent !== null && measuredEvent.distanceAngstroms === 5.0,
    '5.0 Å between HIS41:N & CYS145:SG',
    measuredEvent ? `${measuredEvent.distanceAngstroms} Å between ${measuredEvent.atom1.resn}${measuredEvent.atom1.resi}:${measuredEvent.atom1.atom} & ${measuredEvent.atom2.resn}${measuredEvent.atom2.resi}:${measuredEvent.atom2.atom}` : 'null'
  );

  return results;
}

// Auto-execute test suite if run directly in Node.js
if (typeof process !== 'undefined' && process.argv && import.meta.url.endsWith(process.argv[1])) {
  const report = runMolecularViewerTests();
  console.table(report);
  const failed = report.filter(r => r.status === 'FAIL');
  if (failed.length > 0) process.exit(1);
}