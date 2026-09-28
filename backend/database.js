const fs = require('fs');
const path = require('path');
const config = require('./config');

class PersistentStore {
  constructor() {
    this.dataDir = config.DATA_DIR;
    this._ensureDir();
    this.usersFile = path.join(this.dataDir, 'users.json');
    this.reportsFile = path.join(this.dataDir, 'reports.json');
    this.auditFile = path.join(this.dataDir, 'audit_log.json');
    this._initFiles();
  }

  _ensureDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  _initFiles() {
    if (!fs.existsSync(this.usersFile)) {
      fs.writeFileSync(this.usersFile, JSON.stringify([]), 'utf8');
    }
    if (!fs.existsSync(this.reportsFile)) {
      fs.writeFileSync(this.reportsFile, JSON.stringify([]), 'utf8');
    }
    if (!fs.existsSync(this.auditFile)) {
      fs.writeFileSync(this.auditFile, JSON.stringify([]), 'utf8');
    }
  }

  _read(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content || '[]');
    } catch (err) {
      console.error(`Error reading ${filePath}:`, err);
      return [];
    }
  }

  _writeAtomic(filePath, data) {
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempPath, filePath);
  }

  // Users Collection
  getUsers() {
    return this._read(this.usersFile);
  }

  getUserById(userId) {
    const users = this.getUsers();
    return users.find(u => u.user_id === userId);
  }

  getUserByUsername(username) {
    const users = this.getUsers();
    return users.find(u => u.username && u.username.toLowerCase() === username.toLowerCase());
  }

  saveUsers(users) {
    this._writeAtomic(this.usersFile, users);
  }

  addUser(user) {
    const users = this.getUsers();
    users.push(user);
    this.saveUsers(users);
    return user;
  }

  updateUser(userId, updates) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.user_id === userId);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      this.saveUsers(users);
      return users[idx];
    }
    return null;
  }

  // Reports Collection
  getReports() {
    return this._read(this.reportsFile);
  }

  getReportById(reportId) {
    const reports = this.getReports();
    return reports.find(r => r.report_id === reportId);
  }

  saveReports(reports) {
    this._writeAtomic(this.reportsFile, reports);
  }

  addReport(report) {
    const reports = this.getReports();
    reports.push(report);
    this.saveReports(reports);
    return report;
  }

  addReportsBulk(newReports) {
    const reports = this.getReports();
    reports.push(...newReports);
    this.saveReports(reports);
    return newReports;
  }

  updateReport(reportId, updates) {
    const reports = this.getReports();
    const idx = reports.findIndex(r => r.report_id === reportId);
    if (idx !== -1) {
      reports[idx] = { ...reports[idx], ...updates };
      this.saveReports(reports);
      return reports[idx];
    }
    return null;
  }

  // Audit Log Collection (Append-only per SEC-5)
  getAuditLogs(reportId = null) {
    const logs = this._read(this.auditFile);
    if (reportId) {
      return logs.filter(l => l.report_id === reportId);
    }
    return logs;
  }

  appendAuditLog(logEntry) {
    // Append-only write, no modifications or deletes allowed
    const logs = this.getAuditLogs();
    logs.push(logEntry);
    this._writeAtomic(this.auditFile, logs);
    return logEntry;
  }
}

module.exports = new PersistentStore();
