/**
 * Virtual BioTech & BioChem Lab — Module 5: Instrument Telemetry & Electronic Lab Notebook (ELN)
 * @module lab_notebook
 * @version 5.0.0
 *
 * Event-driven state management, tamper-evident hash-chained audit logging,
 * multi-channel sensor telemetry storage, and CSV/JSON data exporters.
 * Zero external dependencies.
 */

export class LabNotebook {
  /**
   * @param {Object} [options]
   * @param {string} [options.sessionId] - Custom session identifier
   * @param {string} [options.researcher='Principal Investigator'] - Operator name
   */
  constructor(options = {}) {
    this.sessionId = options.sessionId || `ELN-${Date.now().toString(36).toUpperCase()}`;
    this.researcher = options.researcher || 'Principal Investigator';
    this.createdAt = new Date().toISOString();

    // Centralized instrument & reagent state store
    this.state = {
      activeBench: 'molecular',
      instrumentStatus: 'IDLE', // 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAULT'
      activeProtocol: '1EMA_INSPECTION',
      parameters: {}
    };

    // Hash-chained audit log entries
    this.auditLog = [];

    // Named time-series telemetry channels: { [channelName]: Array<Object> }
    this.telemetryChannels = {
      kinetics: [],
      bioreactor: [],
      pcr: []
    };

    // Pub/Sub listeners: Map<eventType, Set<Function>>
    this.listeners = new Map();

    // Initialize genesis audit block
    this.logEvent('SYSTEM', 'ELN Session Initialized', {
      sessionId: this.sessionId,
      researcher: this.researcher
    });
  }

  // =========================================================================
  // 1. DETERMINISTIC HASH CHAINING & AUDIT TRAIL INTEGRITY
  // =========================================================================

  /**
   * Computes a deterministic 64-bit hex digest (dual FNV-1a / DJB2) for synchronous
   * tamper-evident audit chaining across browser and Node environments.
   *
   * @param {string} payload - String payload to hash
   * @returns {string} 16-character hexadecimal hash digest
   */
  static computeHash(payload) {
    let h1 = 0x811c9dc5;
    let h2 = 0x01000193;
    for (let i = 0; i < payload.length; i++) {
      const charCode = payload.charCodeAt(i);
      h1 ^= charCode;
      h1 = Math.imul(h1, 0x01000193);
      h2 = Math.imul(h2 ^ charCode, 0x5bd1e995);
    }
    const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
    const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
    return `${hex1}${hex2}`;
  }

  /**
   * Appends a timestamped, hash-chained entry to the Electronic Lab Notebook.
   *
   * @param {string} category - 'SYSTEM' | 'KINETICS' | 'BIOREACTOR' | 'GENETICS' | 'PCR' | 'MOLECULAR'
   * @param {string} message - Human-readable description of the event
   * @param {Object} [metadata={}] - Structured parameters or experimental results
   * @returns {Object} The newly created audit log entry
   */
  logEvent(category, message, metadata = {}) {
    const index = this.auditLog.length;
    const timestamp = new Date().toISOString();
    const prevHash = index === 0 ? '0000000000000000' : this.auditLog[index - 1].hash;

    const canonicalPayload = JSON.stringify({
      index,
      timestamp,
      category: category.toUpperCase(),
      message,
      metadata,
      prevHash
    });

    const hash = LabNotebook.computeHash(canonicalPayload);

    const entry = {
      index,
      timestamp,
      category: category.toUpperCase(),
      message,
      metadata: structuredClone ? structuredClone(metadata) : JSON.parse(JSON.stringify(metadata)),
      prevHash,
      hash
    };

    this.auditLog.push(entry);
    this._emit('log', entry);
    return entry;
  }

  /**
   * Verifies the cryptographic hash chain across the entire audit log to detect
   * any unauthorized modification or deletion of historical records.
   *
   * @returns {Object} { valid: boolean, checkedCount: number, tamperedIndex: number|null }
   */
  verifyIntegrity() {
    for (let i = 0; i < this.auditLog.length; i++) {
      const entry = this.auditLog[i];
      const expectedPrevHash = i === 0 ? '0000000000000000' : this.auditLog[i - 1].hash;

      if (entry.prevHash !== expectedPrevHash) {
        return { valid: false, checkedCount: i, tamperedIndex: i };
      }

      const canonicalPayload = JSON.stringify({
        index: entry.index,
        timestamp: entry.timestamp,
        category: entry.category,
        message: entry.message,
        metadata: entry.metadata,
        prevHash: entry.prevHash
      });

      const recalculatedHash = LabNotebook.computeHash(canonicalPayload);
      if (entry.hash !== recalculatedHash) {
        return { valid: false, checkedCount: i, tamperedIndex: i };
      }
    }

    return { valid: true, checkedCount: this.auditLog.length, tamperedIndex: null };
  }

  // =========================================================================
  // 2. CENTRALIZED INSTRUMENT STATE MANAGEMENT & PUB/SUB
  // =========================================================================

  /**
   * Updates the centralized workbench state and automatically logs parameter changes.
   *
   * @param {Object} partialState - Key-value pairs to merge into current state
   * @param {boolean} [recordInAudit=true] - Whether to write an audit log entry
   */
  setState(partialState, recordInAudit = true) {
    const prevState = { ...this.state };
    this.state = {
      ...this.state,
      ...partialState,
      parameters: {
        ...this.state.parameters,
        ...(partialState.parameters || {})
      }
    };

    if (recordInAudit) {
      this.logEvent('STATE_CHANGE', 'Updated workbench state parameters', {
        from: prevState.instrumentStatus,
        to: this.state.instrumentStatus,
        changes: partialState
      });
    }

    this._emit('stateChange', this.state);
    return this.state;
  }

  /** Returns a deep copy of the current state */
  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Subscribes a listener callback to notebook events ('log', 'stateChange', 'telemetry').
   * @returns {Function} Unsubscribe function
   */
  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);
    return () => this.listeners.get(eventType)?.delete(callback);
  }

  _emit(eventType, payload) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      for (const cb of callbacks) cb(payload);
    }
  }

  // =========================================================================
  // 3. MULTI-CHANNEL SENSOR TELEMETRY STORAGE
  // =========================================================================

  /**
   * Appends a single data point to a named telemetry channel ('kinetics', 'bioreactor', 'pcr').
   *
   * @param {string} channel - Channel identifier
   * @param {Object} dataPoint - Sensor telemetry dictionary (e.g., { t: 1.0, S: 9.2, P: 0.8, v: 0.45 })
   */
  recordTelemetry(channel, dataPoint) {
    if (!this.telemetryChannels[channel]) {
      this.telemetryChannels[channel] = [];
    }
    const pointWithTimestamp = {
      stepIndex: this.telemetryChannels[channel].length + 1,
      ...dataPoint
    };
    this.telemetryChannels[channel].push(pointWithTimestamp);
    this._emit('telemetry', { channel, dataPoint: pointWithTimestamp });
    return pointWithTimestamp;
  }

  /** Retrieves all recorded telemetry points for a given channel */
  getTelemetry(channel) {
    return this.telemetryChannels[channel] ? [...this.telemetryChannels[channel]] : [];
  }

  /** Clears a telemetry channel and logs the chamber flush */
  clearTelemetry(channel) {
    if (this.telemetryChannels[channel]) {
      this.telemetryChannels[channel] = [];
      this.logEvent('SYSTEM', `Flushed telemetry channel: ${channel}`);
    }
  }

  // =========================================================================
  // 4. FORMATTING & DATA EXPORTERS (TERMINAL, CSV, JSON)
  // =========================================================================

  /**
   * Formats recent audit log entries for display in the UI terminal console.
   *
   * @param {number} [limit=50] - Maximum number of recent entries to format
   * @returns {string} Multi-line formatted terminal output
   */
  formatTerminalOutput(limit = 50) {
    const slice = this.auditLog.slice(-limit);
    return slice.map(entry => {
      const timeStr = entry.timestamp.slice(11, 19);
      return `[${timeStr}] [${entry.category}] ${entry.message} (#${entry.hash.slice(0, 6)})`;
    }).join('\n');
  }

  /**
   * Exports a telemetry channel to RFC-4180 compliant CSV format.
   *
   * @param {string} channel - Channel name ('kinetics', 'bioreactor', 'pcr')
   * @returns {string} CSV string with header row and escaped values
   */
  exportTelemetryCSV(channel) {
    const rows = this.telemetryChannels[channel] || [];
    if (rows.length === 0) return '';

    const headers = Object.keys(rows[0]);
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvLines = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => headers.map(h => escapeCSV(row[h])).join(','))
    ];

    return csvLines.join('\n');
  }

  /**
   * Serializes the entire laboratory session (state, telemetry, and hash-chained audit trail)
   * into a formatted JSON snapshot.
   */
  exportSessionJSON() {
    const integrity = this.verifyIntegrity();
    return JSON.stringify({
      sessionId: this.sessionId,
      researcher: this.researcher,
      createdAt: this.createdAt,
      exportedAt: new Date().toISOString(),
      integrityVerified: integrity.valid,
      state: this.state,
      telemetryChannels: this.telemetryChannels,
      auditLog: this.auditLog
    }, null, 2);
  }

  /**
   * Restores a laboratory session from a JSON snapshot and validates its audit hash chain.
   */
  importSessionJSON(jsonString) {
    const parsed = JSON.parse(jsonString);
    this.sessionId = parsed.sessionId;
    this.researcher = parsed.researcher;
    this.createdAt = parsed.createdAt;
    this.state = parsed.state;
    this.telemetryChannels = parsed.telemetryChannels;
    this.auditLog = parsed.auditLog;

    const integrity = this.verifyIntegrity();
    if (!integrity.valid) {
      throw new Error(
        `Session import aborted: Audit log hash chain corrupted at record #${integrity.tamperedIndex}.`
      );
    }
    return integrity;
  }
}

/**
 * Zero-Dependency Verification Test Suite for Module 5
 */
export function runLabNotebookTests() {
  const results = [];
  const assert = (name, condition, expected, actual) => {
    results.push({
      test: name,
      expected,
      actual,
      status: condition ? 'PASS' : 'FAIL'
    });
  };

  const eln = new LabNotebook({ sessionId: 'ELN-TEST-01', researcher: 'Dr. Rosalind Franklin' });

  // Test 1: Pub/Sub State Notification & Audit Logging
  let stateCallbackFired = false;
  eln.subscribe('stateChange', (newState) => {
    if (newState.instrumentStatus === 'RUNNING') stateCallbackFired = true;
  });
  eln.setState({ activeBench: 'kinetics', instrumentStatus: 'RUNNING', parameters: { S0: 15.0 } });

  assert(
    'Event-Driven State Store & Pub/Sub Notification',
    stateCallbackFired && eln.getState().parameters.S0 === 15.0,
    'Status=RUNNING, S0=15.0',
    `Status=${eln.getState().instrumentStatus}, S0=${eln.getState().parameters.S0}`
  );

  // Test 2: Multi-Point Telemetry Recording & RFC-4180 CSV Export
  eln.recordTelemetry('kinetics', { t: 0.5, S: 14.2, P: 0.8, v: 1.6 });
  eln.recordTelemetry('kinetics', { t: 1.0, S: 13.5, P: 1.5, v: 1.4 });
  const csv = eln.exportTelemetryCSV('kinetics');
  const csvLines = csv.split('\n');
  assert(
    'Multi-Channel Telemetry Storage & CSV Serialization',
    csvLines.length === 3 && csvLines[0] === 'stepIndex,t,S,P,v' && csvLines[2] === '2,1,13.5,1.5,1.4',
    '3 lines (header + 2 rows)',
    `${csvLines.length} lines (${csvLines[0]} | ${csvLines[2]})`
  );

  // Test 3: Cryptographic Hash-Chain Integrity Verification (Untampered)
  eln.logEvent('PCR', 'Completed 30-cycle amplification', { yield_ng: 412.5 });
  const checkBefore = eln.verifyIntegrity();
  assert(
    'Audit Trail Hash-Chain Verification (Valid Chain)',
    checkBefore.valid === true && checkBefore.checkedCount === 3,
    'valid=true, count=3',
    `valid=${checkBefore.valid}, count=${checkBefore.checkedCount}`
  );

  // Test 4: JSON Snapshot Round-Trip Serialization & Restoration
  const snapshot = eln.exportSessionJSON();
  const restoredEln = new LabNotebook();
  const restoreCheck = restoredEln.importSessionJSON(snapshot);
  assert(
    'JSON Session Export & Validated Restoration',
    restoreCheck.valid === true && restoredEln.getTelemetry('kinetics').length === 2,
    'valid=true, telemetryRows=2',
    `valid=${restoreCheck.valid}, telemetryRows=${restoredEln.getTelemetry('kinetics').length}`
  );

  // Test 5: Tamper Detection (Retroactive Modification of Historical Log Record)
  eln.auditLog[1].message = 'TAMPERED_ENTRY';
  const checkAfterTamper = eln.verifyIntegrity();
  assert(
    'Retroactive Audit Log Tamper Detection',
    checkAfterTamper.valid === false && checkAfterTamper.tamperedIndex === 1,
    'valid=false, tamperedIndex=1',
    `valid=${checkAfterTamper.valid}, tamperedIndex=${checkAfterTamper.tamperedIndex}`
  );

  return results;
}

// Auto-execute test suite if run directly in Node.js
if (typeof process !== 'undefined' && process.argv && import.meta.url.endsWith(process.argv[1])) {
  const report = runLabNotebookTests();
  console.table(report);
  const failed = report.filter(r => r.status === 'FAIL');
  if (failed.length > 0) process.exit(1);
}