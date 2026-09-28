const { v4: uuidv4 } = require('uuid');
const db = require('./database');
const config = require('./config');
const mlClient = require('./mlClient');

// Validation function adhering to V-1 through V-5
function validateReportData(data) {
  const errors = {};

  // V-1: description required; 10 to 2000 characters
  if (!data.description || typeof data.description !== 'string') {
    errors.description = 'Description is required.';
  } else {
    const trimmed = data.description.trim();
    if (trimmed.length < 10) {
      errors.description = 'Description must be at least 10 characters.';
    } else if (trimmed.length > 2000) {
      errors.description = 'Description must not exceed 2000 characters.';
    }
  }

  // V-2: installation must match one of pre-configured values
  if (!data.installation || !config.INSTALLATIONS.includes(data.installation)) {
    errors.installation = `Installation must be one of: ${config.INSTALLATIONS.join(', ')}`;
  }

  // V-3: report_type must be valid enum
  if (!data.report_type || !config.REPORT_TYPES.includes(data.report_type)) {
    errors.report_type = `Report type must be one of: ${config.REPORT_TYPES.join(', ')}`;
  }

  // V-4: reporter_severity must be Low | Medium | High
  if (!data.reporter_severity || !config.REPORTER_SEVERITIES.includes(data.reporter_severity)) {
    errors.reporter_severity = `Reporter severity must be one of: ${config.REPORTER_SEVERITIES.join(', ')}`;
  }

  // V-5 & EC-7: observation_datetime must not be future date (with 5 min grace window)
  if (!data.observation_datetime) {
    errors.observation_datetime = 'Observation date/time is required.';
  } else {
    const obsTime = new Date(data.observation_datetime).getTime();
    const serverTime = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    if (isNaN(obsTime)) {
      errors.observation_datetime = 'Invalid observation date/time format.';
    } else if (obsTime > serverTime + fiveMinutes) {
      errors.observation_datetime = 'Observation date/time cannot be in the future.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Generate human-friendly reference ID e.g. OIL-2049
function generateHumanId() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `OIL-${num}`;
}

// Check for duplicate submission within 60s per ERR-6
function checkDuplicateReport(description, installation, observation_datetime) {
  const reports = db.getReports();
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  return reports.find(r => {
    const submittedTime = new Date(r.submitted_datetime).getTime();
    return (
      submittedTime >= oneMinuteAgo &&
      r.installation === installation &&
      r.observation_datetime === observation_datetime &&
      r.description.trim() === description.trim()
    );
  });
}

// Create single report with ML classification
async function createReport(reportData, user) {
  const validation = validateReportData(reportData);
  if (!validation.isValid) {
    return { success: false, status: 400, errors: validation.errors };
  }

  // Check duplicate submission
  const duplicate = checkDuplicateReport(
    reportData.description,
    reportData.installation,
    reportData.observation_datetime
  );
  if (duplicate && !reportData.confirm_duplicate) {
    return {
      success: false,
      status: 409,
      isDuplicate: true,
      error: 'A duplicate report was already submitted within the last 60 seconds. Confirm if you wish to submit again.'
    };
  }

  const reportId = uuidv4();
  const displayId = generateHumanId();
  const nowIso = new Date().toISOString();

  // Initialize report entity matching SRS 5.1
  const newReport = {
    report_id: reportId,
    display_id: displayId,
    installation: reportData.installation,
    report_type: reportData.report_type,
    description: reportData.description.trim(),
    reporter_severity: reportData.reporter_severity,
    observation_datetime: new Date(reportData.observation_datetime).toISOString(),
    submitted_datetime: nowIso,
    risk_score: null,
    risk_band: 'Pending',
    hazard_category_primary: 'Undetermined',
    hazard_category_secondary: [],
    explainability_terms: [],
    is_manual_review: false,
    status: 'Submitted',
    reporter_id: user ? user.user_id : 'anonymous-field-user',
    reporter_name: user ? user.name : 'Field Engineer'
  };

  // Persist immediately with status Submitted
  db.addReport(newReport);

  // Log Created audit event (FR-5.1)
  db.appendAuditLog({
    log_id: uuidv4(),
    report_id: reportId,
    actor_id: user ? user.user_id : null,
    actor_name: user ? user.name : 'Field Reporter',
    action: 'Created',
    before_state: null,
    after_state: { status: 'Submitted', risk_band: 'Pending' },
    timestamp: nowIso
  });

  // Call FastAPI ML Classifier
  try {
    const mlResponse = await mlClient.classifyText(
      newReport.description,
      newReport.installation,
      newReport.report_type
    );

    if (mlResponse.success && mlResponse.data) {
      const ml = mlResponse.data;
      const updates = {
        risk_score: ml.risk_score,
        risk_band: ml.risk_band,
        hazard_category_primary: ml.hazard_primary,
        hazard_category_secondary: ml.hazard_secondary || [],
        explainability_terms: ml.explainability_terms || [],
        is_manual_review: ml.is_manual_review || false,
        confidence: ml.confidence || null
      };
      
      const updated = db.updateReport(reportId, updates);

      // Log Classified audit event (BR-6)
      db.appendAuditLog({
        log_id: uuidv4(),
        report_id: reportId,
        actor_id: null, // System event
        actor_name: 'SIF-Sentinel ML Engine',
        action: 'Classified',
        before_state: { risk_band: 'Pending' },
        after_state: updates,
        timestamp: new Date().toISOString()
      });

      return { success: true, report: updated };
    } else {
      // Degraded path per ERR-2 & BR-7: mark Needs Manual Review
      const fallbackUpdates = {
        risk_score: null,
        risk_band: 'Needs Manual Review',
        hazard_category_primary: 'Undetermined',
        hazard_category_secondary: [],
        explainability_terms: [],
        is_manual_review: true,
        reason: mlResponse.error || 'ML Service unavailable. Routed to manual review.'
      };
      const updated = db.updateReport(reportId, fallbackUpdates);

      db.appendAuditLog({
        log_id: uuidv4(),
        report_id: reportId,
        actor_id: null,
        actor_name: 'SIF-Sentinel System Fallback',
        action: 'Classified',
        before_state: { risk_band: 'Pending' },
        after_state: fallbackUpdates,
        timestamp: new Date().toISOString()
      });

      return { success: true, report: updated };
    }
  } catch (err) {
    console.error('Classification exception:', err);
    return { success: true, report: newReport };
  }
}

// Bulk Import processing (FR-1.2, V-6, ERR-5)
async function processBulkImport(rows, user) {
  const validRows = [];
  const skippedErrors = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2; // account for 1-based header
    const data = {
      installation: (row.installation || '').trim(),
      report_type: (row.report_type || '').trim(),
      description: (row.description || '').trim(),
      reporter_severity: (row.reporter_severity || '').trim(),
      observation_datetime: (row.observation_datetime || '').trim()
    };

    const val = validateReportData(data);
    if (val.isValid) {
      validRows.push(data);
    } else {
      skippedErrors.push({
        row: rowNum,
        errors: val.errors,
        raw: data
      });
    }
  });

  if (validRows.length === 0) {
    return {
      imported_count: 0,
      skipped_count: skippedErrors.length,
      errors: skippedErrors,
      reports: []
    };
  }

  // Batch classify with ML Service for throughput (PERF-3)
  let mlResults = [];
  try {
    const batchRes = await mlClient.classifyBatch(validRows);
    if (batchRes.success && batchRes.results) {
      mlResults = batchRes.results;
    }
  } catch (err) {
    console.warn('Batch ML classification fallback:', err.message);
  }

  const createdReports = [];
  const nowIso = new Date().toISOString();

  validRows.forEach((row, idx) => {
    const reportId = uuidv4();
    const ml = mlResults[idx] || {};

    const report = {
      report_id: reportId,
      display_id: generateHumanId(),
      installation: row.installation,
      report_type: row.report_type,
      description: row.description,
      reporter_severity: row.reporter_severity,
      observation_datetime: new Date(row.observation_datetime).toISOString(),
      submitted_datetime: nowIso,
      risk_score: ml.risk_score !== undefined ? ml.risk_score : null,
      risk_band: ml.risk_band || 'Needs Manual Review',
      hazard_category_primary: ml.hazard_primary || 'Undetermined',
      hazard_category_secondary: ml.hazard_secondary || [],
      explainability_terms: ml.explainability_terms || [],
      is_manual_review: ml.is_manual_review || false,
      status: 'Submitted',
      reporter_id: user ? user.user_id : 'bulk-import-actor',
      reporter_name: user ? user.name : 'Bulk Importer'
    };

    createdReports.push(report);

    // Audit log
    db.appendAuditLog({
      log_id: uuidv4(),
      report_id: reportId,
      actor_id: user ? user.user_id : null,
      actor_name: user ? user.name : 'Bulk CSV Importer',
      action: 'Created',
      before_state: null,
      after_state: { status: 'Submitted', risk_band: report.risk_band },
      timestamp: nowIso
    });
  });

  db.addReportsBulk(createdReports);

  return {
    imported_count: createdReports.length,
    skipped_count: skippedErrors.length,
    errors: skippedErrors,
    reports: createdReports
  };
}

// Status transition state-machine enforcing BR-3
// Transition Rule: Submitted -> Reviewed -> Escalated / Closed
function updateReportStatus(reportId, newStatus, user) {
  const report = db.getReportById(reportId);
  if (!report) {
    return { success: false, status: 404, error: 'Report not found' };
  }

  const validStatuses = config.STATUS_SEQUENCE;
  if (!validStatuses.includes(newStatus)) {
    return { success: false, status: 400, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` };
  }

  const currentStatus = report.status;

  // BR-3: A report cannot be marked Closed unless its status has passed through Reviewed first
  if (newStatus === 'Closed' && currentStatus === 'Submitted') {
    return {
      success: false,
      status: 400,
      error: 'Business Rule BR-3 Violation: A report cannot be Closed directly from Submitted status. It must be Reviewed first.'
    };
  }

  if (newStatus === 'Escalated' && currentStatus === 'Submitted') {
    return {
      success: false,
      status: 400,
      error: 'Business Rule BR-3 Violation: A report cannot be Escalated directly from Submitted status. It must be Reviewed first.'
    };
  }

  const updated = db.updateReport(reportId, {
    status: newStatus,
    last_updated_at: new Date().toISOString(),
    last_updated_by: user.name
  });

  // Log status change audit event
  db.appendAuditLog({
    log_id: uuidv4(),
    report_id: reportId,
    actor_id: user.user_id,
    actor_name: user.name,
    action: 'Status Changed',
    before_state: { status: currentStatus },
    after_state: { status: newStatus },
    timestamp: new Date().toISOString()
  });

  return { success: true, report: updated };
}

// Query and Filter reports
function getReports(filters = {}, user = null) {
  let reports = db.getReports();

  // AUTHZ-2: If Reporter, scope only to their submissions
  if (user && user.role === config.ROLES.REPORTER) {
    reports = reports.filter(r => r.reporter_id === user.user_id);
  }

  // Filter by Hazard Category
  if (filters.hazard_category && filters.hazard_category !== 'All') {
    reports = reports.filter(r => 
      r.hazard_category_primary === filters.hazard_category ||
      (r.hazard_category_secondary && r.hazard_category_secondary.includes(filters.hazard_category))
    );
  }

  // Filter by Installation
  if (filters.installation && filters.installation !== 'All') {
    reports = reports.filter(r => r.installation === filters.installation);
  }

  // Filter by Risk Band
  if (filters.risk_band && filters.risk_band !== 'All') {
    reports = reports.filter(r => r.risk_band === filters.risk_band);
  }

  // Filter by Status
  if (filters.status && filters.status !== 'All') {
    reports = reports.filter(r => r.status === filters.status);
  }

  // Free-text keyword search within description (FR-3.3)
  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    reports = reports.filter(r => 
      (r.description && r.description.toLowerCase().includes(q)) ||
      (r.display_id && r.display_id.toLowerCase().includes(q)) ||
      (r.installation && r.installation.toLowerCase().includes(q))
    );
  }

  // Sort: Default is Risk Score descending (BR-5), with Needs Manual Review placed intentionally
  const sortBy = filters.sort_by || 'risk_score';
  const sortDir = filters.sort_dir || 'desc';

  reports.sort((a, b) => {
    if (sortBy === 'risk_score') {
      const scoreA = a.risk_score !== null ? a.risk_score : -1;
      const scoreB = b.risk_score !== null ? b.risk_score : -1;
      return sortDir === 'desc' ? scoreB - scoreA : scoreA - scoreB;
    } else if (sortBy === 'observation_datetime') {
      const dateA = new Date(a.observation_datetime).getTime();
      const dateB = new Date(b.observation_datetime).getTime();
      return sortDir === 'desc' ? dateB - dateA : dateA - dateB;
    } else {
      const dateA = new Date(a.submitted_datetime).getTime();
      const dateB = new Date(b.submitted_datetime).getTime();
      return sortDir === 'desc' ? dateB - dateA : dateA - dateB;
    }
  });

  return reports;
}

module.exports = {
  validateReportData,
  createReport,
  processBulkImport,
  updateReportStatus,
  getReports
};
