import React, { useState } from 'react';
import RiskBadge from './RiskBadge';
import { 
  X, CheckCircle, AlertOctagon, Archive, ShieldAlert, 
  ArrowLeft, Clock, MapPin, Tag, User, History, ArrowRight, Zap, AlertTriangle, Sparkles 
} from 'lucide-react';

const HAZARD_OPTIONS = [
  'Work at Height',
  'Line-of-Fire',
  'Confined Space',
  'LOTO Bypass',
  'Struck-By',
  'Uncontrolled Energy',
  'PPE Non-Compliance',
  'Housekeeping'
];

export default function ReportDetailModal({ 
  report, 
  auditLogs = [], 
  onClose, 
  onStatusChange, 
  onReclassify,
  isHSE = true 
}) {
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'audit'
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Manual Review Override State
  const [overrideHazard, setOverrideHazard] = useState(report?.hazard_category_primary !== 'Undetermined' ? report?.hazard_category_primary : 'Work at Height');
  const [overrideRiskBand, setOverrideRiskBand] = useState(report?.risk_band === 'High' ? 'High' : report?.risk_band === 'Medium' ? 'Medium' : 'High');
  const [overrideScore, setOverrideScore] = useState(report?.risk_score || 85);
  const [overrideNotes, setOverrideNotes] = useState('');
  const [reclassifying, setReclassifying] = useState(false);

  // Modal confirmation state for Escalate action (UI/UX Section 7)
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateNotes, setEscalateNotes] = useState('');

  if (!report) return null;

  const handleStatusUpdate = async (newStatus) => {
    setErrorMsg(null);
    setUpdating(true);
    try {
      await onStatusChange(report.report_id, newStatus);
      if (newStatus === 'Escalated') {
        setShowEscalateModal(false);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update report status');
    } finally {
      setUpdating(false);
    }
  };

  const handleManualReclassifySubmit = async (e) => {
    e.preventDefault();
    if (!onReclassify) return;
    setReclassifying(true);
    setErrorMsg(null);
    try {
      let score = parseInt(overrideScore, 10);
      if (overrideRiskBand === 'High' && score < 70) score = 85;
      if (overrideRiskBand === 'Medium' && (score < 40 || score >= 70)) score = 55;
      if (overrideRiskBand === 'Low' && score >= 40) score = 20;

      await onReclassify(report.report_id, {
        risk_score: score,
        risk_band: overrideRiskBand,
        hazard_category_primary: overrideHazard,
        notes: overrideNotes
      });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reclassify report');
    } finally {
      setReclassifying(false);
    }
  };

  // Inline highlighter function that highlights explainability terms inside original text
  const renderHighlightedText = (text, terms = []) => {
    if (!terms || terms.length === 0 || !text) return text;

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
          <span 
            key={index} 
            className="explain-highlight" 
            title="SIF Fatality Precursor Contributing Term"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const getSeverityBadge = (sev) => {
    if (sev === 'High') return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/80 dark:text-red-200 dark:border-red-500/60';
    if (sev === 'Medium') return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-500/60';
    return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600';
  };

  const getStatusBadge = (status) => {
    if (status === 'Escalated') return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/80 dark:text-red-200 dark:border-red-500/50';
    if (status === 'Reviewed') return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-500/50';
    if (status === 'Closed') return 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/90 dark:text-slate-200 dark:border-slate-600';
  };

  const isDisguisedPrecursor = report.risk_band === 'High' && report.reporter_severity === 'Low';
  const isNeedsManualReview = report.risk_band === 'Needs Manual Review' || report.is_manual_review;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-detail-title"
    >
      <div className="bg-white dark:bg-[#0E1A38] rounded-2xl shadow-2xl border border-slate-200 dark:border-cyan-glow/30 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-fadeIn text-slate-900 dark:text-slate-100 transition-colors">
        
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-primary-navy via-navy-deep to-accent-blue text-white flex items-center justify-between border-b border-cyan-glow/20">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="text-cyan-200 hover:text-white flex items-center space-x-1 text-xs font-semibold py-1 px-2 rounded-lg hover:bg-white/10 transition cursor-pointer"
              aria-label="Back to triage queue"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span>Queue</span>
            </button>

            <span className="font-mono text-xs sm:text-sm font-bold bg-white/10 text-cyan-200 px-3 py-1 rounded-lg border border-cyan-glow/30">
              {report.display_id || 'REPORT'}
            </span>

            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono border ${getStatusBadge(report.status)}`}>
              {report.status}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex bg-slate-900/60 p-0.5 rounded-xl border border-white/10 text-xs font-bold">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  activeTab === 'details' ? 'bg-accent-blue text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                Analysis
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1 rounded-lg transition flex items-center space-x-1 cursor-pointer ${
                  activeTab === 'audit' ? 'bg-accent-blue text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Audit ({auditLogs.length})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Inline Error Message */}
        {errorMsg && (
          <div className="px-6 py-3 bg-red-50 dark:bg-red-950/80 border-b border-red-200 dark:border-red-500/50 text-red-700 dark:text-red-300 text-xs font-medium flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2">
              <AlertOctagon className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">
          {activeTab === 'details' ? (
            <>
              {/* Manual Review Alert Card if unclassified */}
              {isNeedsManualReview && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-500/60 rounded-xl space-y-3">
                  <div className="flex items-start space-x-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 font-heading">
                        Awaiting HSE Officer Review (KAVACH Gate)
                      </h4>
                      <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5 leading-relaxed font-sans">
                        {report.reason || 'This observation was routed to manual review because description text is brief (<10 words) or required human safety verification per Rule FR-2.6 / EC-1.'}
                      </p>
                    </div>
                  </div>

                  {/* HSE Quick Classification Form */}
                  {isHSE && onReclassify && (
                    <form onSubmit={handleManualReclassifySubmit} className="pt-2 border-t border-amber-200 dark:border-amber-500/40 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-200 uppercase font-mono mb-1">
                          Assign Hazard Category:
                        </label>
                        <select
                          value={overrideHazard}
                          onChange={(e) => setOverrideHazard(e.target.value)}
                          className="w-full text-xs py-1.5 px-2 rounded-lg border border-amber-300 dark:border-amber-500/60 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                        >
                          {HAZARD_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-200 uppercase font-mono mb-1">
                          Assign SIF Risk Level:
                        </label>
                        <select
                          value={overrideRiskBand}
                          onChange={(e) => setOverrideRiskBand(e.target.value)}
                          className="w-full text-xs py-1.5 px-2 rounded-lg border border-amber-300 dark:border-amber-500/60 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                        >
                          <option value="High">● HIGH (Score: 85)</option>
                          <option value="Medium">◐ MEDIUM (Score: 55)</option>
                          <option value="Low">○ LOW (Score: 20)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-4">
                        <button
                          type="submit"
                          disabled={reclassifying}
                          className="w-full py-1.5 px-3 bg-primary-navy hover:bg-blue-900 dark:bg-accent-blue dark:hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{reclassifying ? 'Updating...' : 'Classify & Confirm'}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* CORE DIFFERENTIATOR: Side-by-Side Reporter Severity vs AI Risk Score */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Reporter-Assigned Severity Card */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 font-mono">
                      Reporter-Assigned Severity
                    </span>
                    <div className="mt-2.5 flex items-center space-x-2">
                      <span className={`px-3 py-1 text-sm font-bold rounded-lg border font-mono ${getSeverityBadge(report.reporter_severity)}`}>
                        {report.reporter_severity || 'Low'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        (Reported by field personnel)
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-2 flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-accent-blue dark:text-cyan-bright" />
                    <span>Reported by: <strong className="text-slate-800 dark:text-white">{report.reporter_name || 'Field Engineer'}</strong></span>
                  </div>
                </div>

                {/* 2. PRAHARI SIF Risk Score Card (Equal visual weight) */}
                <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-gradient-to-br dark:from-primary-navy/80 dark:to-blue-900/60 border-2 border-accent-blue/40 dark:border-cyan-glow/50 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider font-bold text-accent-blue dark:text-cyan-bright flex items-center space-x-1 font-mono">
                        <Zap className="w-3.5 h-3.5 text-accent-blue dark:text-cyan-bright" />
                        <span>PRAHARI Risk Score</span>
                      </span>
                      <RiskBadge band={report.risk_band} score={report.risk_score} showScore={false} />
                    </div>
                    <div className="mt-2 flex items-baseline space-x-2">
                      <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                        {report.risk_score !== null ? report.risk_score : '—'}
                      </span>
                      <span className="text-xs font-bold text-accent-blue dark:text-cyan-bright font-mono">/ 100</span>
                      {report.risk_band === 'High' && (
                        <span className="text-xs font-bold text-red-700 bg-red-100 border border-red-300 dark:text-red-200 dark:bg-red-950/80 dark:border-red-500/60 px-2 py-0.5 rounded font-mono">
                          Precursor Alert
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-accent-blue dark:text-cyan-bright border-t border-blue-200 dark:border-cyan-glow/30 pt-2 flex items-center justify-between">
                    <span>Model Confidence: <strong className="text-slate-900 dark:text-white">{report.confidence ? `${Math.round(report.confidence * 100)}%` : 'Calibrated'}</strong></span>
                    <span className="font-bold font-mono">SIF Fatality Mode</span>
                  </div>
                </div>
              </div>

              {/* Disguised High-Risk Contrast Banner (Section 5.3 & BR-2) */}
              {isDisguisedPrecursor && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-500/60 rounded-xl text-amber-900 dark:text-amber-200 text-xs flex items-start space-x-2.5 animate-fadeIn shadow-xs">
                  <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-amber-800 dark:text-amber-300">
                      High-Potential SIF Precursor Disguised in Low-Severity Log:
                    </strong>
                    <p className="mt-0.5 text-amber-800 dark:text-amber-200/90 leading-relaxed font-sans">
                      While recorded as 'Low' by the reporter because no immediate injury occurred, this incident carries fatal energy potential under SIF safety theory.
                    </p>
                  </div>
                </div>
              )}

              {/* Hazard Classification Badges */}
              <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                  Hazard Classification &amp; SIF Precursor Category
                </span>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center space-x-1.5 text-xs font-bold bg-accent-blue text-white px-3 py-1.5 rounded-lg shadow-2xs">
                    <Tag className="w-3.5 h-3.5 text-white" />
                    <span>Primary: {report.hazard_category_primary || 'Undetermined'}</span>
                  </span>
                  {report.hazard_category_secondary && report.hazard_category_secondary.map((cat, idx) => (
                    <span key={idx} className="text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      Secondary: {cat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Explainability Highlights in Original Text */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                    Observation Description &amp; Explainability Evidence
                  </span>
                  <span className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-500/50 font-semibold font-mono">
                    Highlighted words triggered the risk score
                  </span>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900/90 rounded-xl border border-slate-300 dark:border-slate-700/80 text-sm leading-relaxed text-slate-800 dark:text-slate-100 font-sans shadow-inner">
                  "{renderHighlightedText(report.description, report.explainability_terms)}"
                </div>
              </div>

              {/* Contributing Keywords List */}
              {report.explainability_terms && report.explainability_terms.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                    Model Contributing Key Phrases
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {report.explainability_terms.map((term, i) => (
                      <span
                        key={i}
                        className="text-xs px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-500/50 rounded-lg font-mono font-bold shadow-2xs"
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Report Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-mono block">Installation Site</span>
                  <span className="font-bold text-slate-900 dark:text-white">{report.installation} Field</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-mono block">Report Type</span>
                  <span className="font-bold text-slate-900 dark:text-white">{report.report_type}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-mono block">Observed Time</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{new Date(report.observation_datetime).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-mono block">Submitted Server Time</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{new Date(report.submitted_datetime).toLocaleString()}</span>
                </div>
              </div>
            </>
          ) : (
            /* Audit Trail Tab */
            <div className="space-y-4 animate-fadeIn">
              <div className="text-xs text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between font-mono">
                <span>Append-Only Compliance Log (SRS FR-5.1 &amp; SEC-5)</span>
                <span>{auditLogs.length} Records</span>
              </div>
              <div className="space-y-3">
                {auditLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center font-mono">No audit records logged yet.</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.log_id} className="p-3.5 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-accent-blue dark:text-cyan-bright font-mono uppercase tracking-wider">{log.action}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-slate-700 dark:text-slate-300">
                        Actor: <strong className="text-slate-900 dark:text-white">{log.actor_name || 'System Auto'}</strong>
                      </div>
                      {log.after_state && (
                        <div className="mt-1 bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-300 overflow-x-auto">
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

        {/* Modal Footer (BR-3 Status Workflow Controls) */}
        {isHSE && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">
              Current Status: <strong className="text-slate-900 dark:text-white uppercase font-bold">{report.status}</strong>
            </div>

            <div className="flex items-center space-x-2">
              {/* If status is Submitted: only 'Mark Reviewed' is valid */}
              {report.status === 'Submitted' && (
                <button
                  onClick={() => handleStatusUpdate('Reviewed')}
                  disabled={updating}
                  className="btn-premium px-4 py-2 bg-accent-blue hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md disabled:opacity-50 min-h-[38px] cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span>Mark as Reviewed</span>
                </button>
              )}

              {/* From Reviewed -> 'Escalate' (triggers modal) and 'Close' */}
              {report.status === 'Reviewed' && (
                <>
                  <button
                    onClick={() => setShowEscalateModal(true)}
                    disabled={updating}
                    className="btn-premium px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md disabled:opacity-50 min-h-[38px] cursor-pointer"
                  >
                    <AlertOctagon className="w-4 h-4" />
                    <span>Escalate Incident...</span>
                  </button>

                  <button
                    onClick={() => handleStatusUpdate('Closed')}
                    disabled={updating}
                    className="btn-premium px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md disabled:opacity-50 min-h-[38px] cursor-pointer"
                  >
                    <Archive className="w-4 h-4" />
                    <span>Close Report</span>
                  </button>
                </>
              )}

              {/* From Escalated -> 'Resolve & Close' */}
              {report.status === 'Escalated' && (
                <button
                  onClick={() => handleStatusUpdate('Closed')}
                  disabled={updating}
                  className="btn-premium px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md disabled:opacity-50 min-h-[38px] cursor-pointer"
                >
                  <Archive className="w-4 h-4" />
                  <span>Resolve &amp; Close</span>
                </button>
              )}

              {report.status === 'Closed' && (
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-500/50 font-mono">
                  Closed &amp; Archived
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Escalate */}
      {showEscalateModal && (
        <div 
          className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="escalate-modal-title"
        >
          <div className="bg-white dark:bg-[#0E1A38] rounded-2xl shadow-2xl border border-red-300 dark:border-red-500/50 max-w-md w-full p-6 space-y-4 text-slate-900 dark:text-slate-100">
            <div className="flex items-center space-x-3 text-red-600 dark:text-red-400">
              <div className="p-2.5 bg-red-100 dark:bg-red-950/80 border border-red-200 dark:border-red-500/40 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 id="escalate-modal-title" className="text-base font-bold text-slate-900 dark:text-white font-heading">
                  Confirm Incident Escalation
                </h3>
                <p className="text-xs text-red-600 dark:text-red-300 font-mono">Formal Safety Escalation Protocol</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              Escalating report <strong className="font-mono text-accent-blue dark:text-cyan-bright">{report.display_id}</strong> will notify the Installation HSE Manager and initiate a mandatory 24-hour Root Cause Analysis (RCA).
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono">
                Escalation Directives / Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={escalateNotes}
                onChange={(e) => setEscalateNotes(e.target.value)}
                placeholder="Specify required corrective actions, immediate work stoppage directives, or notes..."
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowEscalateModal(false)}
                disabled={updating}
                className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStatusUpdate('Escalated')}
                disabled={updating}
                className="btn-premium px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50 cursor-pointer"
              >
                {updating ? 'Escalating...' : 'Confirm Escalation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
