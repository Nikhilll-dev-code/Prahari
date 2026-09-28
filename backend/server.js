const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');
const db = require('./database');
const auth = require('./auth');
const reportService = require('./reportService');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(cors());
app.use(express.json());

// Seed default users if empty
function ensureSeedData() {
  const users = db.getUsers();
  if (users.length === 0) {
    const demoUsers = [
      {
        user_id: uuidv4(),
        username: 'reporter@oilindia.in',
        name: 'Rahul Sarma (Field Engineer)',
        role: config.ROLES.REPORTER,
        installation: 'Duliajan',
        password_hash: auth.hashPassword('oil123'),
        account_status: 'Active'
      },
      {
        user_id: uuidv4(),
        username: 'hse@oilindia.in',
        name: 'Priyanka Borah (HSE Manager)',
        role: config.ROLES.HSE_OFFICER,
        installation: 'Duliajan',
        password_hash: auth.hashPassword('oil123'),
        account_status: 'Active'
      },
      {
        user_id: uuidv4(),
        username: 'head@oilindia.in',
        name: 'Anupam Dutta (HSSE Corporate Head)',
        role: config.ROLES.DIVISIONAL_HEAD,
        installation: 'Duliajan',
        password_hash: auth.hashPassword('oil123'),
        account_status: 'Active'
      }
    ];
    db.saveUsers(demoUsers);
    console.log('Default demo users seeded successfully.');
  }
}
ensureSeedData();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'sif-sentinel-backend',
    timestamp: new Date().toISOString()
  });
});

// Config Metadata Endpoint (Installations, Categories, Severities)
app.get('/api/config', (req, res) => {
  res.json({
    installations: config.INSTALLATIONS,
    report_types: config.REPORT_TYPES,
    severities: config.REPORTER_SEVERITIES,
    hazard_categories: config.HAZARD_CATEGORIES,
    roles: config.ROLES
  });
});

// Auth: Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const result = auth.login(username, password);
  if (!result.success) {
    return res.status(result.status).json({ error: result.error });
  }

  res.json({
    token: result.token,
    user: result.user
  });
});

// Auth: Me
app.get('/api/auth/me', auth.requireAuth, (req, res) => {
  const user = db.getUserById(req.user.user_id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({
    user_id: user.user_id,
    username: user.username,
    name: user.name,
    role: user.role,
    installation: user.installation
  });
});

// Reports: List with filters & search (FR-3.1, FR-3.2, FR-3.3, AUTHZ-2)
app.get('/api/reports', auth.requireAuth, (req, res) => {
  const filters = {
    hazard_category: req.query.hazard_category,
    installation: req.query.installation,
    risk_band: req.query.risk_band,
    status: req.query.status,
    search: req.query.search,
    sort_by: req.query.sort_by,
    sort_dir: req.query.sort_dir
  };

  const reports = reportService.getReports(filters, req.user);
  res.json({
    count: reports.length,
    reports
  });
});

// Reports: Get single report details (FR-3.4)
app.get('/api/reports/:id', auth.requireAuth, (req, res) => {
  const report = db.getReportById(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  // AUTHZ-2: Reporter can only view their own report
  if (req.user.role === config.ROLES.REPORTER && report.reporter_id !== req.user.user_id) {
    return res.status(403).json({ error: 'You do not have permission to view this report.' });
  }

  const auditHistory = db.getAuditLogs(report.report_id);

  res.json({
    report,
    auditHistory
  });
});

// Reports: Submit single report (FR-1.1, FR-1.3, FR-1.4, FR-1.5, BR-2)
app.post('/api/reports', auth.requireAuth, async (req, res) => {
  const result = await reportService.createReport(req.body, req.user);
  if (!result.success) {
    return res.status(result.status || 400).json({
      error: result.error || 'Validation failed',
      errors: result.errors,
      isDuplicate: result.isDuplicate
    });
  }

  res.status(201).json({
    message: 'Report received successfully.',
    report: result.report
  });
});

// Reports: Bulk Import CSV (FR-1.2, V-6, ERR-5)
app.post('/api/reports/bulk', auth.requireAuth, auth.requireRoles(config.ROLES.HSE_OFFICER, config.ROLES.DIVISIONAL_HEAD, config.ROLES.ADMIN), upload.single('file'), async (req, res) => {
  try {
    let csvText = '';
    if (req.file) {
      csvText = req.file.buffer.toString('utf8');
    } else if (req.body.csv_data) {
      csvText = req.body.csv_data;
    } else {
      return res.status(400).json({ error: 'Please upload a CSV file or provide csv_data.' });
    }

    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    if (!records || records.length === 0) {
      return res.status(400).json({ error: 'Uploaded CSV file contains no records.' });
    }

    const result = await reportService.processBulkImport(records, req.user);
    res.json({
      message: `Bulk import processed. ${result.imported_count} imported, ${result.skipped_count} skipped.`,
      imported_count: result.imported_count,
      skipped_count: result.skipped_count,
      errors: result.errors,
      reports: result.reports
    });
  } catch (err) {
    console.error('Bulk import error:', err);
    res.status(400).json({ error: `CSV parsing error: ${err.message}` });
  }
});

// Reports: Update Status (FR-3.5, BR-3, BR-4)
app.patch('/api/reports/:id/status', auth.requireAuth, auth.requireRoles(config.ROLES.HSE_OFFICER, config.ROLES.DIVISIONAL_HEAD, config.ROLES.ADMIN), (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const result = reportService.updateReportStatus(req.params.id, status, req.user);
  if (!result.success) {
    return res.status(result.status || 400).json({ error: result.error });
  }

  res.json({
    message: `Report status updated to ${status}`,
    report: result.report
  });
});

// Stats: Overall Summary Metrics & KPIs
app.get('/api/stats', auth.requireAuth, (req, res) => {
  let reports = db.getReports();
  if (req.user.role === config.ROLES.REPORTER) {
    reports = reports.filter(r => r.reporter_id === req.user.user_id);
  }

  const total = reports.length;
  const highRisk = reports.filter(r => r.risk_band === 'High').length;
  const mediumRisk = reports.filter(r => r.risk_band === 'Medium').length;
  const lowRisk = reports.filter(r => r.risk_band === 'Low').length;
  const manualReview = reports.filter(r => r.risk_band === 'Needs Manual Review' || r.is_manual_review).length;

  // Disguised High-Risk Count (Reporter marked Low, but AI detected High SIF Precursor)
  const disguisedHighRisk = reports.filter(r => r.risk_band === 'High' && r.reporter_severity === 'Low').length;

  // Hazard Breakdown
  const hazardCounts = {};
  config.HAZARD_CATEGORIES.forEach(cat => { hazardCounts[cat] = 0; });
  reports.forEach(r => {
    if (r.hazard_category_primary) {
      hazardCounts[r.hazard_category_primary] = (hazardCounts[r.hazard_category_primary] || 0) + 1;
    }
  });

  // Installation Breakdown
  const installationCounts = {};
  config.INSTALLATIONS.forEach(inst => { installationCounts[inst] = { high: 0, medium: 0, low: 0, total: 0 }; });
  reports.forEach(r => {
    if (installationCounts[r.installation]) {
      installationCounts[r.installation].total += 1;
      if (r.risk_band === 'High') installationCounts[r.installation].high += 1;
      else if (r.risk_band === 'Medium') installationCounts[r.installation].medium += 1;
      else if (r.risk_band === 'Low') installationCounts[r.installation].low += 1;
    }
  });

  // Status Breakdown
  const statusCounts = { Submitted: 0, Reviewed: 0, Escalated: 0, Closed: 0 };
  reports.forEach(r => {
    if (statusCounts[r.status] !== undefined) {
      statusCounts[r.status] += 1;
    }
  });

  res.json({
    total,
    highRisk,
    mediumRisk,
    lowRisk,
    manualReview,
    disguisedHighRisk,
    hazardCounts,
    installationCounts,
    statusCounts
  });
});

// Audit log view (FR-5.1)
app.get('/api/audit', auth.requireAuth, auth.requireRoles(config.ROLES.HSE_OFFICER, config.ROLES.DIVISIONAL_HEAD, config.ROLES.ADMIN), (req, res) => {
  const logs = db.getAuditLogs(req.query.report_id || null);
  res.json({
    count: logs.length,
    logs: logs.reverse()
  });
});

// Seed endpoint for demo reset
app.post('/api/seed', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const sampleCsvPath = path.join(__dirname, '..', 'sample_data', 'oil_sif_sample_reports.csv');
    
    if (fs.existsSync(sampleCsvPath)) {
      const csvText = fs.readFileSync(sampleCsvPath, 'utf8');
      const records = parse(csvText, { columns: true, skip_empty_lines: true, trim: true });
      
      // Clear previous reports
      db.saveReports([]);
      
      const result = await reportService.processBulkImport(records, {
        user_id: 'seed-system-admin',
        name: 'OIL HSE System Initializer'
      });

      return res.json({
        message: `System seeded successfully with ${result.imported_count} realistic OIL safety reports!`,
        count: result.imported_count
      });
    } else {
      return res.status(404).json({ error: 'Sample dataset not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const server = app.listen(config.PORT, () => {
  console.log(`SIF-Sentinel Backend API running on port ${config.PORT}`);
});
