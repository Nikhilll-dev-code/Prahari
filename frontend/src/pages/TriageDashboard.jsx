import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import ReportRow from '../components/ReportRow';
import ReportDetailModal from '../components/ReportDetailModal';
import BulkImportModal from '../components/BulkImportModal';
import { 
  Search, Filter, UploadCloud, RefreshCw, AlertTriangle, 
  ArrowUpDown, X, Sparkles, CheckCircle2, ChevronDown, Eye, ShieldAlert, FileText 
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

export default function TriageDashboard({ onStatsUpdate, initialRiskFilter = 'All' }) {
  const toast = useToast();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State (UI/UX Section 5.2: combinable and always visible above queue)
  const [hazardFilter, setHazardFilter] = useState('All');
  const [installationFilter, setInstallationFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState(initialRiskFilter);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sort State (BR-5: default is fixed to Risk Score descending)
  const [sortBy, setSortBy] = useState('risk_score');
  const [sortDir, setSortDir] = useState('desc');

  // Modals & Detail
  const [selectedReport, setSelectedReport] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Keep a ref to onStatsUpdate to avoid recreating fetchReports when onStatsUpdate changes
  const onStatsUpdateRef = useRef(onStatsUpdate);
  useEffect(() => {
    onStatsUpdateRef.current = onStatsUpdate;
  }, [onStatsUpdate]);

  // Sync initialRiskFilter if prop changes (e.g. clicking Review badge in Navbar)
  useEffect(() => {
    setRiskFilter(initialRiskFilter);
  }, [initialRiskFilter]);

  const fetchReports = useCallback(async () => {
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
    } catch (err) {
      setError(err.message || 'Failed to load triage reports');
    } finally {
      setLoading(false);
    }
  }, [hazardFilter, installationFilter, riskFilter, statusFilter, searchQuery, sortBy, sortDir]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleSelectReport = async (report) => {
    setSelectedReport(report);
    try {
      const detail = await api.getReportById(report.report_id);
      setSelectedReport(detail.report);
      setAuditLogs(detail.auditHistory || []);
    } catch (err) {
      console.error('Failed to load audit history for report:', err);
    }
  };

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      const res = await api.updateReportStatus(reportId, newStatus);
      setSelectedReport(res.report);
      toast.success(`Report ${res.report.display_id || ''} status updated to ${newStatus}`);
      fetchReports();
      if (onStatsUpdateRef.current) {
        onStatsUpdateRef.current();
      }
      const detail = await api.getReportById(reportId);
      setAuditLogs(detail.auditHistory || []);
    } catch (err) {
      toast.error(err.message || 'Failed to update report status');
      throw err;
    }
  };

  const handleReclassify = async (reportId, reclassificationData) => {
    try {
      const res = await api.reclassifyReport(reportId, reclassificationData);
      setSelectedReport(res.report);
      toast.success(`Report ${res.report.display_id || ''} reclassified as ${res.report.risk_band} Risk`);
      fetchReports();
      if (onStatsUpdateRef.current) {
        onStatsUpdateRef.current();
      }
      const detail = await api.getReportById(reportId);
      setAuditLogs(detail.auditHistory || []);
    } catch (err) {
      toast.error(err.message || 'Failed to reclassify report');
      throw err;
    }
  };

  const clearFilters = () => {
    setHazardFilter('All');
    setInstallationFilter('All');
    setRiskFilter('All');
    setStatusFilter('All');
    setSearchQuery('');
  };

  const hasActiveFilters = 
    hazardFilter !== 'All' || 
    installationFilter !== 'All' || 
    riskFilter !== 'All' || 
    statusFilter !== 'All' || 
    searchQuery.trim() !== '';

  const isManualReviewMode = riskFilter === 'Needs Manual Review';

  return (
    <div className="space-y-4 animate-fadeIn text-slate-900 dark:text-slate-100">
      
      {/* Triage Dashboard Header (UI/UX 5.2) */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-cyan-glow/25 shadow-glass flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl sm:text-2xl font-black font-heading text-slate-900 dark:text-white tracking-tight">
              {isManualReviewMode ? 'Manual Review & HSE Quality Gate' : 'Triage Dashboard'}
            </h1>
            <span className="text-xs bg-blue-100 text-accent-blue dark:bg-blue-950/80 dark:text-cyan-bright font-mono font-bold px-2 py-0.5 rounded border border-blue-200 dark:border-cyan-glow/30">
              {isManualReviewMode ? 'Inspection Queue' : 'BR-5 Risk Ranked'}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-sans">
            {isManualReviewMode 
              ? 'Observations awaiting human safety verification due to brief text (<10 words per Rule FR-2.6) or offline fallback.'
              : 'Ranked by PRAHARI AI SIF-Precursor Risk Score (Highest energetic exposure surfaced first)'}
          </p>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center space-x-2">
          {isManualReviewMode && (
            <button
              onClick={() => setRiskFilter('All')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-accent-blue dark:text-cyan-bright" />
              <span>View All Triage</span>
            </button>
          )}

          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="btn-premium px-4 py-2 bg-gradient-to-r from-primary-navy via-accent-blue to-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md hover:shadow-cyan-glow/30 min-h-[38px] cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-cyan-200" />
            <span>Bulk Ingestion (CSV)</span>
          </button>

          <button
            onClick={() => {
              fetchReports();
              if (onStatsUpdateRef.current) onStatsUpdateRef.current();
            }}
            className="p-2.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs transition cursor-pointer"
            title="Refresh queue"
            aria-label="Refresh queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-accent-blue dark:text-cyan-bright' : ''}`} />
          </button>
        </div>
      </div>

      {/* Manual Review Context Callout Banner (when in Needs Manual Review filter) */}
      {isManualReviewMode && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-500/50 rounded-2xl flex items-start space-x-3 text-amber-900 dark:text-amber-200 shadow-xs animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-xs font-bold font-heading text-amber-950 dark:text-amber-100 uppercase tracking-wider font-mono">
              HSE Officer Manual Inspection Protocol (Priyanka Borah • Duliajan)
            </h3>
            <p className="text-xs leading-relaxed font-sans text-amber-800 dark:text-amber-200/90">
              The AI classifier flags reports as <strong>Needs Manual Review</strong> when field engineers submit very short descriptions (fewer than 10 words per Rule FR-2.6 / EC-1) or during degraded offline service. Click any row below to review the original field log and assign the verified SIF hazard category and risk band.
            </p>
          </div>
        </div>
      )}

      {/* Combinable Filter & Search Bar (UI/UX 5.2) */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-glass space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search keyword or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-blue transition"
              aria-label="Search reports by keyword or ID"
            />
          </div>

          {/* Hazard Filter */}
          <div>
            <select
              value={hazardFilter}
              onChange={(e) => setHazardFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-accent-blue transition"
              aria-label="Filter by Hazard Category"
            >
              <option value="All">All Hazard Categories</option>
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
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-accent-blue transition"
              aria-label="Filter by Installation Site"
            >
              <option value="All">All OIL Field Sites</option>
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
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-accent-blue transition"
              aria-label="Filter by Risk Band"
            >
              <option value="All">All Risk Levels</option>
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
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-accent-blue transition"
              aria-label="Filter by Workflow Status"
            >
              <option value="All">All Workflow Statuses</option>
              {STATUSES.filter(s => s !== 'All').map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Chips & Sort Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2 flex-wrap gap-1">
            <span>Showing <strong className="text-slate-900 dark:text-white font-mono">{reports.length}</strong> observations</span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-accent-blue dark:text-cyan-bright hover:underline font-bold flex items-center space-x-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset filters</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono text-slate-400">Sort:</span>
            <button
              onClick={() => {
                if (sortBy === 'risk_score') {
                  setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
                } else {
                  setSortBy('risk_score');
                  setSortDir('desc');
                }
              }}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold font-mono flex items-center space-x-1.5 transition cursor-pointer ${
                sortBy === 'risk_score' 
                  ? 'bg-blue-50 dark:bg-blue-950/80 border-accent-blue dark:border-cyan-glow/50 text-accent-blue dark:text-cyan-bright shadow-2xs' 
                  : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span>SIF Risk Score ({sortDir === 'desc' ? 'High→Low' : 'Low→High'})</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Reports Table Queue */}
      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 shadow-glass overflow-hidden">
        {loading && reports.length === 0 ? (
          /* Skeleton Loader (UI/UX 9.1) */
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse flex items-center justify-between p-3.5 bg-slate-100 dark:bg-slate-900/60 rounded-xl">
                <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-20"></div>
                <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-16"></div>
                <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-32"></div>
                <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-64"></div>
                <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-20"></div>
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          /* Empty States (UI/UX 9.3) */
          <div className="p-12 text-center space-y-4">
            {hasActiveFilters ? (
              <div className="space-y-3">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-900 text-slate-400 rounded-2xl flex items-center justify-center mx-auto border border-slate-200 dark:border-slate-800">
                  <Filter className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base font-heading">
                  {isManualReviewMode ? 'No observations need manual review' : 'No observations match these filters'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {isManualReviewMode 
                    ? 'All reports have been confidently classified by the PRAHARI AI NLP engine.'
                    : 'Try adjusting or clearing your active filters to see matching safety observations.'}
                </p>
                <button
                  onClick={clearFilters}
                  className="btn-premium px-5 py-2.5 bg-accent-blue text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition shadow-md cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/80 text-accent-blue dark:text-cyan-bright rounded-2xl flex items-center justify-center mx-auto border border-blue-200 dark:border-cyan-glow/30">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base font-heading">
                  No reports in the system yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Load the pre-curated synthetic Oil India Limited dataset to test the classifier on realistic upstream field logs.
                </p>
                <button
                  onClick={() => setIsBulkModalOpen(true)}
                  className="btn-premium px-5 py-2.5 bg-gradient-to-r from-primary-navy via-accent-blue to-cyan-500 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
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
                <tr className="bg-slate-100/75 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono">
                  <th className="py-3.5 px-4">SIF Risk Level</th>
                  <th className="py-3.5 px-3">Report ID</th>
                  <th className="py-3.5 px-3">Hazard Category</th>
                  <th className="py-3.5 px-3">Observation Description</th>
                  <th className="py-3.5 px-3">OIL Installation</th>
                  <th className="py-3.5 px-3">Reporter Severity</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3">Observed Date</th>
                  <th className="py-3.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 font-sans">
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
          onReclassify={handleReclassify}
          isHSE={true}
        />
      )}

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onImportSuccess={() => {
          fetchReports();
          if (onStatsUpdateRef.current) onStatsUpdateRef.current();
        }}
      />
    </div>
  );
}
