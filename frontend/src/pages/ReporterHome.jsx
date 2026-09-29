import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import NewReportForm from '../components/NewReportForm';
import { 
  PlusCircle, ListOrdered, Clock, CheckCircle2, 
  AlertCircle, Shield, Search, RefreshCw, FileText, ChevronRight, Activity 
} from 'lucide-react';

export default function ReporterHome() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('new'); // 'new' (S3) | 'my_reports' (S4)
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchMyReports = async () => {
    setLoading(true);
    try {
      const data = await api.getReports();
      setMyReports(data.reports || []);
    } catch (err) {
      console.error('Failed to load reporter reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReports();
  }, []);

  const handleReportSubmitted = () => {
    fetchMyReports();
  };

  // Status badges in neutral slate/zinc tones per UI/UX Section 7
  const getStatusBadge = (status) => {
    if (status === 'Escalated') {
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/80 dark:text-red-200 dark:border-red-500/50';
    }
    if (status === 'Reviewed') {
      return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-500/50';
    }
    if (status === 'Closed') {
      return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
    return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/90 dark:text-slate-200 dark:border-slate-600';
  };

  const filteredReports = myReports.filter((report) => {
    const matchesSearch = searchQuery === '' || 
      report.display_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.report_type?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const countSubmitted = myReports.filter(r => r.status === 'Submitted').length;
  const countReviewed = myReports.filter(r => r.status === 'Reviewed').length;
  const countEscalated = myReports.filter(r => r.status === 'Escalated').length;
  const countClosed = myReports.filter(r => r.status === 'Closed').length;

  return (
    <div className="space-y-6 animate-fadeIn text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* S2 Reporter Home Header */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-cyan-glow/30 shadow-glass flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black font-heading text-slate-900 dark:text-white tracking-tight">
              Field Safety Reporting Portal
            </h1>
            <span className="text-[11px] font-mono bg-blue-100 text-accent-blue dark:bg-blue-950 dark:text-cyan-bright border border-blue-200 dark:border-cyan-glow/40 px-2 py-0.5 rounded font-semibold">
              PRAHARI
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Logged in as <strong className="text-slate-900 dark:text-white">{user?.name}</strong> • <strong className="text-accent-blue dark:text-cyan-bright">{user?.installation} Field Installation</strong>
          </p>
        </div>

        {/* Tab Controls (S3 New Report vs S4 My Reports) */}
        <div className="flex bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('new')}
            className={`btn-premium px-4 py-2 rounded-lg transition flex items-center space-x-2 min-h-[38px] cursor-pointer ${
              activeTab === 'new' 
                ? 'bg-gradient-to-r from-primary-navy via-accent-blue to-cyan-500 text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-cyan-200 dark:text-cyan-bright" />
            <span>New Report</span>
          </button>
          
          <button
            onClick={() => {
              setActiveTab('my_reports');
              fetchMyReports();
            }}
            className={`btn-premium px-4 py-2 rounded-lg transition flex items-center space-x-2 min-h-[38px] cursor-pointer ${
              activeTab === 'my_reports' 
                ? 'bg-gradient-to-r from-primary-navy via-accent-blue to-cyan-500 text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <ListOrdered className="w-4 h-4 text-cyan-200 dark:text-cyan-bright" />
            <span>My Reports ({myReports.length})</span>
          </button>
        </div>
      </div>

      {/* Reporter Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-blue-500/30 shadow-xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block font-mono">Submitted</span>
          <span className="text-2xl font-bold font-mono text-accent-blue dark:text-cyan-bright">{countSubmitted}</span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-blue-500/30 shadow-xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block font-mono">Under Review</span>
          <span className="text-2xl font-bold font-mono text-slate-700 dark:text-slate-200">{countReviewed}</span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-red-200 dark:border-red-500/30 shadow-xs">
          <span className="text-[11px] text-red-600 dark:text-red-300 font-semibold uppercase tracking-wider block font-mono">Escalated</span>
          <span className="text-2xl font-bold font-mono text-red-600 dark:text-red-400">{countEscalated}</span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/30 shadow-xs">
          <span className="text-[11px] text-emerald-600 dark:text-emerald-300 font-semibold uppercase tracking-wider block font-mono">Closed &amp; Resolved</span>
          <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{countClosed}</span>
        </div>
      </div>

      {/* Main View Content */}
      {activeTab === 'new' ? (
        /* Screen S3 — New Report Form */
        <NewReportForm 
          onReportSubmitted={handleReportSubmitted}
          onViewMyReports={() => {
            setActiveTab('my_reports');
            fetchMyReports();
          }}
        />
      ) : (
        /* Screen S4 — My Reports (List, Read-Only) */
        <div className="glass-panel rounded-2xl border border-slate-200 dark:border-cyan-glow/25 shadow-glass space-y-4 p-5 sm:p-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold font-heading text-slate-900 dark:text-white">
                My Submitted Safety Observations
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Track status and review progress of past observations filed from your installation.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={fetchMyReports}
                className="p-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs transition cursor-pointer"
                title="Refresh reports"
                aria-label="Refresh reports"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent-blue dark:text-cyan-bright' : ''}`} />
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search observation text or reference ID..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-blue dark:focus:ring-cyan-glow focus:border-accent-blue dark:focus:border-cyan-glow"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full py-1.5 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-blue dark:focus:ring-cyan-glow font-medium"
              >
                <option value="All">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Reviewed">Reviewed</option>
                <option value="Escalated">Escalated</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Table or Empty State */}
          {loading && myReports.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
              Loading your submitted reports...
            </div>
          ) : myReports.length === 0 ? (
            /* Distinct Empty State 3 (UI/UX Section 9.3 & UI-5) */
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto border border-slate-300 dark:border-slate-700">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                You haven't submitted a report yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Your submitted safety observations and near-miss logs will appear here with live review tracking.
              </p>
              <button
                onClick={() => setActiveTab('new')}
                className="btn-premium px-5 py-2.5 bg-gradient-to-r from-primary-navy via-accent-blue to-cyan-500 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
              >
                Submit Your First Report
              </button>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
              No reports match your search query or status filter.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-accent-blue dark:text-cyan-bright font-bold uppercase tracking-wider text-[11px] font-mono">
                    <th className="py-3.5 px-4">Reference ID</th>
                    <th className="py-3.5 px-3">Report Type</th>
                    <th className="py-3.5 px-3">Observation Description</th>
                    <th className="py-3.5 px-3">Reported Severity</th>
                    <th className="py-3.5 px-3">Status</th>
                    <th className="py-3.5 px-3">Observed Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                  {filteredReports.map((report) => (
                    <tr key={report.report_id} className="hover:bg-slate-50 dark:hover:bg-cyan-glow/[0.08] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-accent-blue dark:text-cyan-bright whitespace-nowrap">
                        {report.display_id || 'REPORT'}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {report.report_type}
                      </td>
                      <td className="py-3.5 px-3 max-w-md truncate text-slate-600 dark:text-slate-300 font-sans">
                        {report.description}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200 font-mono">
                        {report.reporter_severity || 'Low'}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(report.status)}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {new Date(report.observation_datetime).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
