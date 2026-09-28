import React, { useState } from 'react';
import RiskBadge from './RiskBadge';
import { 
  X, CheckCircle, AlertOctagon, Archive, ShieldAlert, 
  Clock, MapPin, Tag, User, History, ArrowRight, Zap 
} from 'lucide-react';

export default function ReportDetailModal({ report, auditLogs = [], onClose, onStatusChange, isHSE = true }) {
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'audit'
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!report) return null;

  const handleStatusUpdate = async (newStatus) => {
    setErrorMsg(null);
    setUpdating(true);
    try {
      await onStatusChange(report.report_id, newStatus);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  // Inline highlighter function that highlights explainability terms inside original text
  const renderHighlightedText = (text, terms = []) => {
    if (!terms || terms.length === 0 || !text) return text;

    // Build regex from terms safely
    const escapedTerms = terms
      .filter(t => t && t.trim().length > 1)
      .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    if (escapedTerms.length === 0) return text;

    const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      const isMatch = terms.some(t => t.toLowerCase() === part.toLowerCase());
      if (isMatch) {
        return (
          <span key={index} className="explain-highlight" title="SIF Precursor Contributing Term">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const getSeverityBadge = (sev) => {
    if (sev === 'High') return 'bg-red-100 text-red-800 border-red-300';
    if (sev === 'Medium') return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-slate-100 text-slate-800 border-slate-300';
  };

  const getStatusBadge = (status) => {
    if (status === 'Escalated') return 'bg-red-100 text-red-800 border-red-200';
    if (status === 'Reviewed') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (status === 'Closed') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-sm font-bold bg-blue-600/40 text-blue-200 px-2.5 py-1 rounded border border-blue-500/30">
              {report.display_id || 'REPORT'}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${getStatusBadge(report.status)}`}>
              {report.status}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex bg-slate-800 rounded-lg p-0.5 text-xs font-medium">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-3 py-1 rounded-md transition ${
                  activeTab === 'details' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Report & AI Analysis
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1 rounded-md transition flex items-center space-x-1 ${
                  activeTab === 'audit' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Audit Trail ({auditLogs.length})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="px-6 py-2.5 bg-red-50 border-b border-red-200 text-red-700 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertOctagon className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'details' ? (
            <>
              {/* PRIMARY VISUAL MOMENT: Side-by-Side Reporter Severity vs AI Risk Score (Equal Visual Weight) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Reporter-Assigned Severity Card */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-semibold text-text-secondary">
                      Reporter-Assigned Severity
                    </span>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className={`px-3 py-1 text-sm font-bold rounded border ${getSeverityBadge(report.reporter_severity)}`}>
                        {report.reporter_severity || 'Low'}
                      </span>
                      <span className="text-xs text-text-secondary">
                        (Reported by field staff)
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-slate-500 border-t border-slate-200 pt-2 flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>{report.reporter_name || 'Field Engineer'}</span>
                  </div>
                </div>

                {/* SIF-Sentinel AI Risk Score Card */}
                <div className="p-4 rounded-lg bg-blue-50/60 border-2 border-blue-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider font-semibold text-blue-900 flex items-center space-x-1">
                        <Zap className="w-3.5 h-3.5 text-blue-600" />
                        <span>SIF-Sentinel Risk Score</span>
                      </span>
                      <RiskBadge band={report.risk_band} score={report.risk_score} showScore={false} />
                    </div>
                    <div className="mt-2 flex items-baseline space-x-2">
                      <span className="text-3xl font-extrabold text-primary-navy font-mono">
                        {report.risk_score !== null ? report.risk_score : '—'}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">/ 100</span>
                      {report.risk_band === 'High' && (
                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                          Precursor Alert
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-blue-900/80 border-t border-blue-200 pt-2 flex items-center justify-between">
                    <span>Model Confidence: <strong>{report.confidence ? `${Math.round(report.confidence * 100)}%` : 'High'}</strong></span>
                    <span className="font-semibold text-blue-700">SIF Fatality Mode</span>
                  </div>
                </div>
              </div>

              {/* Disagreement Callout Banner if High AI risk but Low Reporter severity */}
              {report.risk_band === 'High' && report.reporter_severity === 'Low' && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs flex items-start space-x-2.5">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold text-amber-950">High-Potential SIF Precursor Disguised in Low-Severity Log:</strong>
                    <p className="mt-0.5 text-amber-800">
                      While recorded as 'Low' by the reporter because no immediate injury occurred, this incident carries fatal energy potential under SIF safety theory.
                    </p>
                  </div>
                </div>
              )}

              {/* Hazard Classification */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Hazard Classification & SIF Category
                </span>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center space-x-1 text-xs font-semibold bg-primary-navy text-white px-3 py-1 rounded">
                    <Tag className="w-3.5 h-3.5 text-blue-300" />
                    <span>Primary: {report.hazard_category_primary || 'Undetermined'}</span>
                  </span>
                  {report.hazard_category_secondary && report.hazard_category_secondary.map((cat, idx) => (
                    <span key={idx} className="text-xs font-medium bg-slate-200 text-slate-800 px-2.5 py-1 rounded">
                      Secondary: {cat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Report Description with Explainability Highlights */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Report Description & Explainability Evidence
                  </span>
                  <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                    Highlighted words triggered the risk score
                  </span>
                </div>
                <div className="p-4 bg-white rounded-lg border border-slate-300 text-sm leading-relaxed text-slate-800 font-sans shadow-inner">
                  "{renderHighlightedText(report.description, report.explainability_terms)}"
                </div>
              </div>

              {/* Contributing Keywords List */}
              {report.explainability_terms && report.explainability_terms.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Model Extracted Key Risk Phrases
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {report.explainability_terms.map((term, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 bg-yellow-100 text-yellow-900 border border-yellow-300 rounded-md font-mono font-medium"
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Report Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-text-secondary block">Installation</span>
                  <span className="font-semibold text-slate-800">{report.installation}</span>
                </div>
                <div>
                  <span className="text-text-secondary block">Report Type</span>
                  <span className="font-semibold text-slate-800">{report.report_type}</span>
                </div>
                <div>
                  <span className="text-text-secondary block">Observed Time</span>
                  <span className="font-medium text-slate-800">{new Date(report.observation_datetime).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-text-secondary block">Submitted Time</span>
                  <span className="font-medium text-slate-800">{new Date(report.submitted_datetime).toLocaleString()}</span>
                </div>
              </div>
            </>
          ) : (
            /* Audit Trail Tab */
            <div className="space-y-4">
              <div className="text-xs text-text-secondary pb-2 border-b border-slate-200 flex items-center justify-between">
                <span>Append-Only Compliance Log (SRS FR-5.1 & SEC-5)</span>
                <span>{auditLogs.length} Records</span>
              </div>
              <div className="space-y-3">
                {auditLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No audit records found.</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.log_id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary-navy">{log.action}</span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-slate-700">
                        Actor: <strong>{log.actor_name || 'System'}</strong>
                      </div>
                      {log.after_state && (
                        <div className="mt-1 bg-white p-2 rounded border border-slate-200 font-mono text-[11px] text-slate-600 overflow-x-auto">
                          {JSON.stringify(log.after_state)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (Status Progression Enforcing BR-3) */}
        {isHSE && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Current Status: <strong className="text-slate-800">{report.status}</strong>
            </div>

            <div className="flex items-center space-x-2">
              {/* If status is Submitted: only 'Mark Reviewed' is valid */}
              {report.status === 'Submitted' && (
                <button
                  onClick={() => handleStatusUpdate('Reviewed')}
                  disabled={updating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Mark as Reviewed</span>
                </button>
              )}

              {/* If status is Reviewed: 'Escalate' and 'Close' become available */}
              {report.status === 'Reviewed' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate('Escalated')}
                    disabled={updating}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                  >
                    <AlertOctagon className="w-4 h-4" />
                    <span>Escalate Incident</span>
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('Closed')}
                    disabled={updating}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                  >
                    <Archive className="w-4 h-4" />
                    <span>Close Report</span>
                  </button>
                </>
              )}

              {/* If status is Escalated: allow Closing once corrective action is completed */}
              {report.status === 'Escalated' && (
                <button
                  onClick={() => handleStatusUpdate('Closed')}
                  disabled={updating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                >
                  <Archive className="w-4 h-4" />
                  <span>Resolve & Close</span>
                </button>
              )}

              {report.status === 'Closed' && (
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded border border-emerald-200">
                  Report Closed & Documented
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
