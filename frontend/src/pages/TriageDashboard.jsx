import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import ReportRow from '../components/ReportRow';
import ReportDetailModal from '../components/ReportDetailModal';
import BulkImportModal from '../components/BulkImportModal';
import { 
  Search, Filter, UploadCloud, RefreshCw, AlertTriangle, 
  CheckCircle2, ShieldAlert, ArrowUpDown, X, Sparkles 
} from 'lucide-react';

const INSTALLATIONS = ['All', 'Duliajan', 'Naharkatiya', 'Moran', 'Digboi', 'Jorhat', 'Kumchai', 'Baghjan', 'Barekuri'];
const HAZARD_CATEGORIES = [
  'All',
  'Work at Height',
  'Line-of-Fire',
  'Confined Space',
  'LOTO Bypass',
  'Struck-By',
  'Uncontrolled Energy',
  'PPE Non-Compliance',
  'Housekeeping'
];
const RISK_BANDS = ['All', 'High', 'Medium', 'Low', 'Needs Manual Review'];
const STATUSES = ['All', 'Submitted', 'Reviewed', 'Escalated', 'Closed'];

export default function TriageDashboard({ onStatsUpdate }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [hazardFilter, setHazardFilter] = useState('All');
  const [installationFilter, setInstallationFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('risk_score');
  const [sortDir, setSortDir] = useState('desc');

  // Modals
  const [selectedReport, setSelectedReport] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getReports({
        hazard_category: hazardFilter,
        installation: installationFilter,
        risk_band: riskFilter,
        status: statusFilter,
        search: searchQuery,
        sort_by: sortBy,
        sort_dir: sortDir
      });
      setReports(data.reports || []);

      if (onStatsUpdate) {
        onStatsUpdate();
      }
    } catch (err) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [hazardFilter, installationFilter, riskFilter, statusFilter, sortBy, sortDir]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchReports();
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleSelectReport = async (report) => {
    setSelectedReport(report);
    try {
      const detail = await api.getReportById(report.report_id);
      setSelectedReport(detail.report);
      setAuditLogs(detail.auditHistory || []);
    } catch (err) {
      console.error('Failed to load audit history:', err);
    }
  };

  const handleStatusChange = async (reportId, newStatus) => {
    const res = await api.updateReportStatus(reportId, newStatus);
    setSelectedReport(res.report);
    // Refresh list and audit history
    fetchReports();
    const detail = await api.getReportById(reportId);
    setAuditLogs(detail.auditHistory || []);
  };

  const clearFilters = () => {
    setHazardFilter('All');
    setInstallationFilter('All');
    setRiskFilter('All');
    setStatusFilter('All');
    setSearchQuery('');
  };

  const hasActiveFilters = hazardFilter !== 'All' || installationFilter !== 'All' || riskFilter !== 'All' || statusFilter !== 'All' || searchQuery.trim() !== '';

  return (
    <div className="space-y-4">
      {/* Triage Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-primary-navy tracking-tight">
            HSE Officer Triage Queue
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Ranked by AI SIF-Precursor Risk (Highest energy exposure prioritized first)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="px-3.5 py-2 bg-primary-navy hover:bg-blue-900 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center space-x-1.5"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Bulk Ingestion (CSV)</span>
          </button>

          <button
            onClick={fetchReports}
            className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs transition"
            title="Refresh queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Combinable Filter & Search Bar (UI/UX 5.2) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search keyword or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-accent-blue bg-white"
            />
          </div>

          {/* Hazard Filter */}
          <div>
            <select
              value={hazardFilter}
              onChange={(e) => setHazardFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-accent-blue bg-white font-medium"
            >
              <option value="All">All Hazards</option>
              {HAZARD_CATEGORIES.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Installation Filter */}
          <div>
            <select
              value={installationFilter}
              onChange={(e) => setInstallationFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-accent-blue bg-white font-medium"
            >
              <option value="All">All Installations</option>
              {INSTALLATIONS.filter(i => i !== 'All').map(i => (
                <option key={i} value={i}>{i} Field</option>
              ))}
            </select>
          </div>

          {/* Risk Band Filter */}
          <div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-accent-blue bg-white font-medium"
            >
              <option value="All">All Risk Bands</option>
              {RISK_BANDS.filter(r => r !== 'All').map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-accent-blue bg-white font-medium"
            >
              <option value="All">All Statuses</option>
              {STATUSES.filter(s => s !== 'All').map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Chips & Active Count */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div className="flex items-center space-x-2">
            <span>Showing <strong>{reports.length}</strong> reports</span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-accent-blue hover:underline font-semibold flex items-center space-x-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear filters</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-400">Sort by:</span>
            <button
              onClick={() => {
                if (sortBy === 'risk_score') {
                  setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
                } else {
                  setSortBy('risk_score');
                  setSortDir('desc');
                }
              }}
              className={`px-2 py-0.5 rounded border text-[11px] font-semibold flex items-center space-x-1 ${
                sortBy === 'risk_score' ? 'bg-blue-50 border-blue-300 text-blue-900' : 'border-slate-200 text-slate-600'
              }`}
            >
              <span>SIF Risk Score ({sortDir === 'desc' ? 'High→Low' : 'Low→High'})</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Reports Table Queue */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading && reports.length === 0 ? (
          /* Skeleton Loader (UI/UX 9.1) */
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="h-4 bg-slate-200 rounded w-20"></div>
                <div className="h-4 bg-slate-200 rounded w-16"></div>
                <div className="h-4 bg-slate-200 rounded w-32"></div>
                <div className="h-4 bg-slate-200 rounded w-64"></div>
                <div className="h-4 bg-slate-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          /* Empty States (UI/UX 9.3) */
          <div className="p-12 text-center space-y-4">
            {hasActiveFilters ? (
              <div className="space-y-3">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                  <Filter className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">No reports match these filters</h3>
                <p className="text-xs text-text-secondary max-w-sm mx-auto">
                  Try adjusting or clearing your active filters to see matching safety observations.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">No reports in the system yet</h3>
                <p className="text-xs text-text-secondary max-w-sm mx-auto">
                  Submit a report from the Reporter view or load the synthetic OIL sample dataset to test the classifier.
                </p>
                <button
                  onClick={() => setIsBulkModalOpen(true)}
                  className="px-4 py-2 bg-primary-navy text-white rounded-lg text-xs font-bold hover:bg-blue-900 transition"
                >
                  Load OIL Demo Dataset
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                  <th className="py-3 px-4">SIF Risk</th>
                  <th className="py-3 px-3">Report ID</th>
                  <th className="py-3 px-3">Hazard Category</th>
                  <th className="py-3 px-3">Observation Description</th>
                  <th className="py-3 px-3">Installation</th>
                  <th className="py-3 px-3">Reporter Severity</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reports.map((report) => (
                  <ReportRow
                    key={report.report_id}
                    report={report}
                    onSelect={handleSelectReport}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          auditLogs={auditLogs}
          onClose={() => setSelectedReport(null)}
          onStatusChange={handleStatusChange}
          isHSE={true}
        />
      )}

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onImportSuccess={fetchReports}
      />
    </div>
  );
}
