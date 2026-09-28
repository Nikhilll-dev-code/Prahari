const path = require('path');
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'sif-sentinel-oil-secret-key-2026',
  JWT_EXPIRY: '60m', // FR-4.3: 60 minutes inactivity
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001',
  DATA_DIR: path.join(__dirname, 'data'),
  
  // Pre-configured OIL Installations for validation (SRS V-2)
  INSTALLATIONS: [
    'Duliajan',
    'Naharkatiya',
    'Moran',
    'Digboi',
    'Jorhat',
    'Kumchai',
    'Baghjan',
    'Barekuri'
  ],

  // Report Types (SRS V-3)
  REPORT_TYPES: [
    'Unsafe Act',
    'Unsafe Condition',
    'Near Miss'
  ],

  // Reporter Severities (SRS V-4)
  REPORTER_SEVERITIES: [
    'Low',
    'Medium',
    'High'
  ],

  // SIF Hazard Categories (SRS Section 1.3)
  HAZARD_CATEGORIES: [
    'Work at Height',
    'Line-of-Fire',
    'Confined Space',
    'LOTO Bypass',
    'Struck-By',
    'Uncontrolled Energy',
    'PPE Non-Compliance',
    'Housekeeping',
    'Undetermined'
  ],

  // Valid Report Statuses (SRS Section 5.1 & BR-3)
  STATUS_SEQUENCE: ['Submitted', 'Reviewed', 'Escalated', 'Closed'],

  // Roles (SRS Section 2)
  ROLES: {
    REPORTER: 'Reporter',
    HSE_OFFICER: 'HSE Officer',
    DIVISIONAL_HEAD: 'Divisional Head',
    ADMIN: 'Admin'
  }
};
