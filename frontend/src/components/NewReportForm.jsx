import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Send, CheckCircle2, AlertCircle, PlusCircle, Sparkles, Calendar, MapPin, List } from 'lucide-react';

const INSTALLATIONS = [
  'Duliajan',
  'Naharkatiya',
  'Moran',
  'Digboi',
  'Jorhat',
  'Kumchai',
  'Baghjan',
  'Barekuri'
];

const REPORT_TYPES = [
  'Unsafe Act',
  'Unsafe Condition',
  'Near Miss'
];

export default function NewReportForm({ onReportSubmitted, onViewMyReports }) {
  const { user } = useAuth();
  const toast = useToast();

  const [installation, setInstallation] = useState(user?.installation || 'Duliajan');
  const [reportType, setReportType] = useState('Unsafe Condition');
  const [observationDatetime, setObservationDatetime] = useState('');
  const [description, setDescription] = useState('');
  const [reporterSeverity, setReporterSeverity] = useState('Low');

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [generalError, setGeneralError] = useState(null);

  // Field element refs for smooth scroll to first error (UI-4 & Section 5.1)
  const installationRef = useRef(null);
  const reportTypeRef = useRef(null);
  const datetimeRef = useRef(null);
  const descriptionRef = useRef(null);
  const severityRef = useRef(null);

  // Future date limitation string (local ISO format YYYY-MM-DDTHH:MM)
  const [maxDatetime, setMaxDatetime] = useState('');

  useEffect(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    setObservationDatetime(localISOTime);
    setMaxDatetime(localISOTime);
  }, []);

  // Word counter calculation (min 10 words per FR-2.6/EC-1)
  const words = description.trim().split(/\s+/).filter(Boolean);
  const wordCount = description.trim() === '' ? 0 : words.length;
  const isBelowMinWords = wordCount < 10;

  // Validation function enforcing naming the fix (Section 8)
  const validateForm = () => {
    const newErrors = {};

    if (!installation) {
      newErrors.installation = 'Select an installation.';
    }

    if (!reportType) {
      newErrors.report_type = 'Select a report type.';
    }

    if (!observationDatetime) {
      newErrors.observation_datetime = 'Select observation date and time.';
    } else {
      const selected = new Date(observationDatetime).getTime();
      const current = Date.now() + 60 * 1000;
      if (selected > current) {
        newErrors.observation_datetime = 'Observation date/time cannot be in the future.';
      }
    }

    if (!description || description.trim().length === 0) {
      newErrors.description = 'Describe what you saw in the field.';
    } else if (wordCount < 10) {
      newErrors.description = `Description must be at least 10 words (currently ${wordCount} words).`;
    }

    if (!reporterSeverity) {
      newErrors.reporter_severity = 'Select your perceived severity.';
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateForm();
  };

  const handleSubmit = async (e, forceDuplicate = false) => {
    if (e) e.preventDefault();

    setTouched({
      installation: true,
      report_type: true,
      observation_datetime: true,
      description: true,
      reporter_severity: true
    });

    const activeErrors = validateForm();
    const errorKeys = Object.keys(activeErrors);

    if (errorKeys.length > 0) {
      const firstError = errorKeys[0];
      if (firstError === 'installation' && installationRef.current) {
        installationRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        installationRef.current.focus();
      } else if (firstError === 'observation_datetime' && datetimeRef.current) {
        datetimeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        datetimeRef.current.focus();
      } else if (firstError === 'description' && descriptionRef.current) {
        descriptionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        descriptionRef.current.focus();
      }
      return;
    }

    setSubmitting(true);
    setGeneralError(null);
    setDuplicateWarning(null);

    try {
      const payload = {
        installation,
        report_type: reportType,
        observation_datetime: new Date(observationDatetime).toISOString(),
        description: description.trim(),
        reporter_severity: reporterSeverity,
        confirm_duplicate: forceDuplicate
      };

      const res = await api.createReport(payload);
      setSubmittedReport(res.report);
      toast.success(`Report received successfully (Ref: ${res.report.display_id || 'OIL-CONFIRMED'})`);

      if (onReportSubmitted) {
        onReportSubmitted(res.report);
      }
    } catch (err) {
      if (err.isDuplicate) {
        setDuplicateWarning(err.message);
      } else if (err.errors) {
        setErrors(err.errors);
      } else {
        const errorText = err.message || "Couldn't submit — check your connection and try again";
        setGeneralError(errorText);
        toast.error(errorText);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setDescription('');
    setReporterSeverity('Low');
    setSubmittedReport(null);
    setDuplicateWarning(null);
    setGeneralError(null);
    setTouched({});
    setErrors({});
  };

  const applyPreset = (presetText, presetType, presetSeverity) => {
    setDescription(presetText);
    setReportType(presetType);
    setReporterSeverity(presetSeverity);
    setTouched(prev => ({ ...prev, description: true }));
    setErrors({});
  };

  // SUCCESS CONFIRMATION STATE (UI/UX 3.1 & 6.1: Deliberately simple, NO risk score shown to Reporter)
  if (submittedReport) {
    return (
      <div 
        className="max-w-2xl mx-auto glass-panel p-8 sm:p-10 rounded-2xl shadow-glass border border-slate-200 dark:border-cyan-glow/40 text-center space-y-6 animate-fadeIn text-slate-900 dark:text-slate-100 transition-colors"
        role="status"
        aria-live="polite"
      >
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-emerald-300 dark:border-emerald-500/50">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black font-heading text-slate-900 dark:text-white tracking-tight">Report Received</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Thank you for reporting this safety observation. Your log has been recorded in the PRAHARI Oil India Limited safety repository.
          </p>
        </div>

        {/* Deliberately simple reference box per UI/UX Section 3.1 & 6.1 */}
        <div className="p-5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-xl max-w-sm mx-auto space-y-1.5 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider block font-mono">
            Reference Number
          </span>
          <span className="text-2xl sm:text-3xl font-black font-mono text-accent-blue dark:text-cyan-bright tracking-wider block">
            {submittedReport.display_id || 'OIL-CONFIRMED'}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono block">
            Status: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{submittedReport.status}</span>
          </span>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={handleResetForm}
            className="btn-premium px-6 py-3 bg-gradient-to-r from-primary-navy via-accent-blue to-cyan-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit Another Report</span>
          </button>

          {onViewMyReports && (
            <button
              onClick={onViewMyReports}
              className="btn-premium px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900/80 dark:hover:bg-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 border border-slate-300 dark:border-slate-700 cursor-pointer"
            >
              <List className="w-4 h-4 text-accent-blue dark:text-cyan-bright" />
              <span>View My Reports</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto glass-panel rounded-2xl shadow-glass border border-slate-200 dark:border-cyan-glow/30 overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-primary-navy via-navy-deep to-accent-blue text-white flex items-center justify-between border-b border-cyan-glow/20">
        <div>
          <h2 className="font-extrabold text-base tracking-tight font-heading">New Safety Observation Report</h2>
          <p className="text-xs text-blue-200 dark:text-cyan-bright/90 font-mono">PRAHARI • Oil India Limited Field Incident Reporting (KAVACH)</p>
        </div>
        <span className="text-[11px] font-mono bg-blue-950 text-cyan-bright px-2.5 py-1 rounded border border-cyan-glow/40">
          Form S3
        </span>
      </div>

      {/* Preset Scenarios for Hackathon Evaluation */}
      <div className="px-6 py-3.5 bg-slate-50 dark:bg-blue-950/40 border-b border-slate-200 dark:border-cyan-glow/20">
        <div className="flex items-center space-x-1.5 mb-2 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-accent-blue dark:text-cyan-bright" />
          <span className="text-[11px] font-bold text-accent-blue dark:text-cyan-bright uppercase tracking-wider">
            Quick Evaluation Presets (Click to load):
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset(
              "Found scaffolding without a guardrail near tank 4; contractor was standing on it while no harness was worn.",
              "Unsafe Condition",
              "Low"
            )}
            className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900/80 hover:bg-blue-50 dark:hover:bg-slate-800 text-accent-blue dark:text-cyan-bright border border-slate-300 dark:border-cyan-glow/30 font-semibold transition shadow-xs cursor-pointer"
          >
            Disguised High Risk (Height)
          </button>
          <button
            type="button"
            onClick={() => applyPreset(
              "Electrician worked on 415V MCC feeder without applying lockout tagout padlock as isolation switch was stiff.",
              "Unsafe Act",
              "Low"
            )}
            className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900/80 hover:bg-blue-50 dark:hover:bg-slate-800 text-accent-blue dark:text-cyan-bright border border-slate-300 dark:border-cyan-glow/30 font-semibold transition shadow-xs cursor-pointer"
          >
            LOTO Bypass Precursor
          </button>
          <button
            type="button"
            onClick={() => applyPreset(
              "Small water puddle noticed near administrative corridor entrance due to AC drain overflow.",
              "Unsafe Condition",
              "Low"
            )}
            className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900/80 hover:bg-blue-50 dark:hover:bg-slate-800 text-accent-blue dark:text-cyan-bright border border-slate-300 dark:border-cyan-glow/30 font-semibold transition shadow-xs cursor-pointer"
          >
            Routine Housekeeping
          </button>
          <button
            type="button"
            onClick={() => applyPreset(
              "Spill on floor",
              "Unsafe Condition",
              "Low"
            )}
            className="text-[11px] px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:hover:bg-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 font-semibold transition shadow-xs cursor-pointer"
          >
            &lt; 10 Words (Edge Case)
          </button>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="p-6 space-y-5" noValidate>
        
        {/* General Error Banner */}
        {generalError && (
          <div 
            className="p-3.5 bg-red-950/80 border border-red-500/60 rounded-xl text-xs text-red-200 flex items-start justify-between space-x-2 animate-fadeIn"
            role="alert"
          >
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
            <button
              type="button"
              onClick={() => handleSubmit(null, false)}
              className="px-2.5 py-1 bg-red-600 text-white rounded text-[11px] font-bold hover:bg-red-700 transition shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Duplicate Warning Dialog (ERR-6) */}
        {duplicateWarning && (
          <div className="p-4 bg-amber-950/80 border border-amber-500/60 rounded-xl text-xs text-amber-200 space-y-2 animate-fadeIn">
            <div className="flex items-center space-x-2 font-bold font-mono">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Duplicate Report Alert</span>
            </div>
            <p className="font-sans leading-relaxed">{duplicateWarning}</p>
            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition"
              >
                Yes, Submit Duplicate
              </button>
              <button
                type="button"
                onClick={() => setDuplicateWarning(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-xs transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Installation Dropdown */}
        <div>
          <label 
            htmlFor="installation-select" 
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono"
          >
            Installation <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <select
              id="installation-select"
              ref={installationRef}
              value={installation}
              onChange={(e) => setInstallation(e.target.value)}
              onBlur={() => handleBlur('installation')}
              aria-describedby={touched.installation && errors.installation ? 'installation-error' : undefined}
              className={`w-full text-sm rounded-xl border px-3 py-2.5 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-accent-blue dark:focus:ring-cyan-glow focus:border-accent-blue dark:focus:border-cyan-glow min-h-[44px] ${
                touched.installation && errors.installation ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-slate-300 dark:border-slate-700'
              }`}
            >
              {INSTALLATIONS.map(inst => (
                <option key={inst} value={inst}>{inst} Field Installation</option>
              ))}
            </select>
          </div>
          {touched.installation && errors.installation && (
            <p id="installation-error" className="mt-1 text-xs text-red-500 dark:text-red-400 font-medium flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.installation}</span>
            </p>
          )}
        </div>

        {/* Report Type Radios */}
        <fieldset ref={reportTypeRef}>
          <legend className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
            Report Type <span className="text-red-500" aria-hidden="true">*</span>
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {REPORT_TYPES.map(type => (
              <label
                key={type}
                className={`flex items-center justify-center p-3 rounded-xl border text-xs font-bold cursor-pointer transition min-h-[44px] ${
                  reportType === type
                    ? 'bg-blue-50 border-accent-blue text-accent-blue dark:bg-blue-950 dark:border-cyan-glow dark:text-cyan-bright shadow-xs'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="report_type"
                  value={type}
                  checked={reportType === type}
                  onChange={(e) => setReportType(e.target.value)}
                  className="mr-2 text-accent-blue dark:text-cyan-glow"
                />
                <span>{type}</span>
              </label>
            ))}
          </div>
          {touched.report_type && errors.report_type && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400 font-medium">{errors.report_type}</p>
          )}
        </fieldset>

        {/* Observation Date/Time */}
        <div>
          <label 
            htmlFor="observation-datetime" 
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono"
          >
            Date/time observed <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="observation-datetime"
            ref={datetimeRef}
            type="datetime-local"
            max={maxDatetime}
            value={observationDatetime}
            onChange={(e) => setObservationDatetime(e.target.value)}
            onBlur={() => handleBlur('observation_datetime')}
            aria-describedby={touched.observation_datetime && errors.observation_datetime ? 'datetime-error' : undefined}
            className={`w-full text-sm rounded-xl border px-3 py-2 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-accent-blue dark:focus:ring-cyan-glow focus:border-accent-blue dark:focus:border-cyan-glow min-h-[44px] font-mono ${
              touched.observation_datetime && errors.observation_datetime ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-slate-300 dark:border-slate-700'
            }`}
          />
          {touched.observation_datetime && errors.observation_datetime && (
            <p id="datetime-error" className="mt-1 text-xs text-red-500 dark:text-red-400 font-medium flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.observation_datetime}</span>
            </p>
          )}
        </div>

        {/* "What did you see? *" Textarea with Live Word Counter */}
        <div>
          <div className="flex items-center justify-between mb-1 font-mono">
            <label 
              htmlFor="description-textarea" 
              className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
            >
              What did you see? <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <span 
              className={`text-xs font-mono font-bold ${
                isBelowMinWords ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
              aria-live="polite"
            >
              {wordCount} words {isBelowMinWords ? '(10 words minimum)' : '✓'}
            </span>
          </div>

          <textarea
            id="description-textarea"
            ref={descriptionRef}
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => handleBlur('description')}
            aria-describedby="description-feedback"
            placeholder="Describe the condition, equipment, or actions observed..."
            className={`w-full text-sm rounded-xl border p-3 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-accent-blue dark:focus:ring-cyan-glow focus:border-accent-blue dark:focus:border-cyan-glow ${
              touched.description && errors.description ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-slate-300 dark:border-slate-700'
            }`}
          />

          <div id="description-feedback">
            {isBelowMinWords && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-medium italic">
                A few more words helps us route this correctly.
              </p>
            )}

            {touched.description && errors.description && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400 font-medium flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.description}</span>
              </p>
            )}
          </div>
        </div>

        {/* Reporter-Assigned Severity Radio */}
        <fieldset ref={severityRef}>
          <legend className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
            How severe would you call this? <span className="text-red-500" aria-hidden="true">*</span>
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { val: 'Low', desc: 'No immediate harm or loss' },
              { val: 'Medium', desc: 'Moderate injury or damage' },
              { val: 'High', desc: 'Critical exposure' }
            ].map(item => (
              <label
                key={item.val}
                className={`flex flex-col p-3 rounded-xl border cursor-pointer transition min-h-[44px] ${
                  reporterSeverity === item.val
                    ? 'bg-blue-50 border-accent-blue text-accent-blue dark:bg-blue-950 dark:border-cyan-glow dark:text-cyan-bright shadow-xs'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="reporter_severity"
                    value={item.val}
                    checked={reporterSeverity === item.val}
                    onChange={(e) => setReporterSeverity(e.target.value)}
                    className="text-accent-blue dark:text-cyan-glow"
                  />
                  <span className="text-xs font-bold font-mono">{item.val}</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 pl-5">{item.desc}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting || isBelowMinWords}
            className="btn-premium w-full py-3.5 bg-gradient-to-r from-primary-navy via-accent-blue to-cyan-glow text-white rounded-xl text-sm font-bold transition shadow-glass flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] group"
          >
            {submitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting Report...</span>
              </div>
            ) : (
              <>
                <Send className="w-4 h-4 text-cyan-bright transition-transform duration-300 group-hover:translate-x-1" />
                <span>Submit Report</span>
              </>
            )}
          </button>
          {isBelowMinWords && (
            <p className="text-center text-[11px] text-slate-400 mt-1.5 font-mono">
              Submit activates when 10-word minimum is met ({wordCount}/10 words)
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
