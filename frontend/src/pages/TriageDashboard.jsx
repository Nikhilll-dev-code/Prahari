import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import ReportRow from '../components/ReportRow';
import ReportDetailModal from '../components/ReportDetailModal';
import BulkImportModal from '../components/BulkImportModal';
import { 
  Search, Filter, UploadCloud, RefreshCw, AlertTriangle, 
  ArrowUpDown, X, Sparkles, CheckCircle2, ChevronDown 
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

      if (onStatsUpdate) {
        onStatsUpdate();
      }
    } catch (err) {
      setError(err.message || 'Failed to load triage reports');
    } finally {
      setLoading(false);
    }
  }, [hazardFilter, installationFilter, riskFilter, statusFilter, searchQuery, sortBy, sortDir, onStatsUpdate]);

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
      const detail = await api.getReportById(reportId);
      setAuditLogs(detail.auditHistory || []);
    } catch (err) {
      toast.error(err.message || 'Failed to update report status');
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

  return (
    <div className="space-y-4 animate-fadeIn text-slate-900 dark:text-slate-100">
      
      {/* Triage Dashboard Header (UI/UX 5.2) */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-cyan-glow/25 shadow-glass flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl sm:text-2xl font-black font-heading text-slate-900 dark:text-white tracking-tight">
              Triage Dashboard
            </h1>
            <span className="text-xs bg-blue-100 text-accent-blue dark:bg-blue-950/80 dark:text-cyan-bright font-mono font-bold px-2 py-0.5 rounded border border-blue-200 dark:border-cyan-glow/30">
              BR-5 Risk Ranked
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
            Real-time queue ranked by AI SIF Precursor Risk (High fatality potential prioritized first)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="btn-premium px-3.5 py-2 bg-gradient-to-r from-primary-navy via-accent-blue to-cyan-500 hover:brightness-110 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center space-x-1.5 min-h-[38px] cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-cyan-200 dark:text-cyan-bright" />
            <span>Bulk Import (CSV)</span>
          </button>

          <button
            onClick={fetchReports}
            className="p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs transition min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer shadow-xs"
            title="Refresh queue"
            aria-label="Refresh triage queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-accent-blue dark:text-cyan-bright' : ''}`} />
          </button>
        </div>
      </div>

      {/* Combinable Filter & Search Bar (UI/UX 5.2: Always visible above queue) */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-cyan-glow/20 shadow-glass space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search keyword or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-blue dark:focus:ring-cyan-glow focus:border-accent-blue dark:focus:border-cyan-glow min-h-[36px]"
            />
          </div>

          {/* Hazard Type Filter */}
          <div>
            <select
              value={hazardFilter}
              onChange={(e) => setHazardFilter(e.target.value)}
              aria-label="Filter by Hazard Type"
              className="w-full py-1.5 px-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-blue dark:focus:ring-cyan-glow focus:border-accent-blue dark:focus:border-cyan-glow font-medium min-h-[36px]"
            >
              <option value="All">All Hazard Types</option>
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
              aria-label="Filter by Installation"
              className="w-full py-1.5 px-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-blue dark:focus:ring-cyan-glow focus:border-accent-blue dark:focus:border-cyan-glow font-medium min-h-[36px]"
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
              aria-label="Filter by Risk Band"
              className="w-full py-1.5 px-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-blue dark:focus:ring-cyan-glow focus:border-accent-blue dark:focus:border-cyan-glow font-medium min-h-[36px]"
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
              aria-label="Filter by Status"
              className="w-full py-1.5 px-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-blue dark:focus:ring-cyan-glow focus:border-accent-blue dark:focus:border-cyan-glow font-medium min-h-[36px]"
            >
              <option value="All">All Statuses</option>
              {STATUSES.filter(s => s !== 'All').map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Removable Active Chips & Sort Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
          
          {/* Active Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Showing <strong className="text-slate-900 dark:text-white">{reports.length}</strong> reports
            </span>

            {hazardFilter !== 'All' && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-accent-blue border border-blue-200 dark:bg-blue-950 dark:text-cyan-bright dark:border-cyan-glow/40 text-[11px] font-semibold">
                <span>Hazard: {hazardFilter}</span>
                <button onClick={() => setHazardFilter('All')} aria-label="Remove hazard filter"><X className="w-3 h-3" /></button>
              </span>
            )}

            {installationFilter !== 'All' && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-accent-blue border border-blue-200 dark:bg-blue-950 dark:text-cyan-bright dark:border-cyan-glow/40 text-[11px] font-semibold">
                <span>Site: {installationFilter}</span>
                <button onClick={() => setInstallationFilter('All')} aria-label="Remove site filter"><X className="w-3 h-3" /></button>
              </span>
            )}

            {riskFilter !== 'All' && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-accent-blue border border-blue-200 dark:bg-blue-950 dark:text-cyan-bright dark:border-cyan-glow/40 text-[11px] font-semibold">
                <span>Risk: {riskFilter}</span>
                <button onClick={() => setRiskFilter('All')} aria-label="Remove risk filter"><X className="w-3 h-3" /></button>
              </span>
            )}

            {statusFilter !== 'All' && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-accent-blue border border-blue-200 dark:bg-blue-950 dark:text-cyan-bright dark:border-cyan-glow/40 text-[11px] font-semibold">
                <span>Status: {statusFilter}</span>
                <button onClick={() => setStatusFilter('All')} aria-label="Remove status filter"><X className="w-3 h-3" /></button>
              </span>
            )}

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-accent-blue dark:text-cyan-bright hover:underline font-bold text-[11px] ml-1 cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">Sort:</span>
            <button
              onClick={() => {
                if (sortBy === 'risk_score') {
                  setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
                } else {
                  setSortBy('risk_score');
                  setSortDir('desc');
                }
              }}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center space-x-1 transition cursor-pointer ${
                sortBy === 'risk_score' 
                  ? 'bg-blue-50 border-accent-blue text-accent-blue dark:bg-blue-950 dark:border-cyan-glow/60 dark:text-cyan-bright' 
                  : 'border-slate-300 text-slate-600 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <span>SIF Risk Score ({sortDir === 'desc' ? 'High→Low' : 'Low→High'})</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
            
            <button
              onClick={() => {
                if (sortBy === 'observation_datetime') {
                  setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
                } else {
                  setSortBy('observation_datetime');
                  setSortDir('desc');
                }
              }}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center space-x-1 transition cursor-pointer ${
                sortBy === 'observation_datetime' 
                  ? 'bg-blue-50 border-accent-blue text-accent-blue dark:bg-blue-950 dark:border-cyan-glow/60 dark:text-cyan-bright' 
                  : 'border-slate-300 text-slate-600 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <span>Date Observed</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Reports Table Queue */}
      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-cyan-glow/20 shadow-glass overflow-hidden">
        
        {/* Loading State: Skeleton Rows per UI/UX Section 9.1 */}
        {loading && reports.length === 0 ? (
          <div className="p-6 space-y-3" role="status" aria-label="Loading reports queue">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse flex items-center justify-between p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
                <div className="h-5 bg-slate-800 rounded w-24" />
                <div className="h-5 bg-slate-800 rounded w-20" />
                <div className="h-5 bg-slate-800 rounded w-36" />
                <div className="h-5 bg-slate-800 rounded w-64 hidden md:block" />
                <div className="h-5 bg-slate-800 rounded w-20" />
                <div className="h-5 bg-slate-800 rounded w-16" />
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          
          /* Three Distinct Empty States (UI/UX Section 9.3 & UI-5) */
          <div className="p-12 text-center space-y-4">
            {hasActiveFilters ? (
              /* Empty State 2: Filtered queue with zero matches */
              <div className="space-y-3">
                <div className="w-12 h-12 bg-slate-800/80 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-slate-700">
                  <Filter className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-base">
                  No reports match these filters
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Try adjusting or resetting your hazard type, installation, or risk band filters.
                </p>
                <button
                  onClick={clearFilters}
                  className="btn-premium px-4 py-2 bg-accent-blue text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition shadow-glass"
                >
                  Clear filters
                </button>
              </div>
            ) : riskFilter === 'Needs Manual Review' ? (
              /* Empty State 3: Manual Review backlog clear */
              <div className="space-y-3">
                <div className="w-12 h-12 bg-emerald-950/80 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-base">
                  All low-confidence reports reviewed
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  There are currently no reports flagged for manual HSE inspection backlog.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition border border-slate-700"
                >
                  Return to Full Queue
                </button>
              </div>
            ) : (
              /* Empty State 1: Fresh demo state (0 reports in DB) */
              <div className="space-y-3">
                <div className="w-12 h-12 bg-blue-950 text-cyan-bright rounded-full flex items-center justify-center mx-auto border border-cyan-glow/40">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-base">
                  No reports yet — submit one from the Reporter view or import a demo dataset
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Load the synthetic Oil India Limited dataset to evaluate automated SIF risk scoring and explainability.
                </p>
                <button
                  onClick={() => setIsBulkModalOpen(true)}
                  className="btn-premium px-4 py-2 bg-gradient-to-r from-primary-navy via-accent-blue to-cyan-glow text-white rounded-xl text-xs font-bold transition shadow-glass"
                >
                  Bulk Import Demo Data
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-700/80 text-[11px] font-bold text-accent-blue dark:text-cyan-bright uppercase tracking-wider font-mono">
                  <th className="py-3.5 px-4">SIF Risk</th>
                  <th className="py-3.5 px-3">Report ID</th>
                  <th className="py-3.5 px-3">Hazard Category</th>
                  <th className="py-3.5 px-3">Observation Description</th>
                  <th className="py-3.5 px-3">Installation</th>
                  <th className="py-3.5 px-3">Reporter Severity</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3">Date</th>
                  <th className="py-3.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
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

      {/* Screen S6: Report Detail Drill-In Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          auditLogs={auditLogs}
          onClose={() => setSelectedReport(null)}
          onStatusChange={handleStatusChange}
          isHSE={true}
        />
      )}

      {/* Screen S7: Bulk Import Modal */}
      <BulkImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onImportSuccess={fetchReports}
      />
    </div>
  );
}
