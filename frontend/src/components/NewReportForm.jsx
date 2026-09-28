import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Send, CheckCircle2, AlertCircle, PlusCircle, Clock, MapPin, Sparkles } from 'lucide-react';

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

export default function NewReportForm({ onReportSubmitted }) {
  const { user } = useAuth();

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

  // Set default observation time to now (local format for datetime-local input)
  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setObservationDatetime(now.toISOString().slice(0, 16));
  }, []);

  // Word counter calculation
  const words = description.trim().split(/\s+/).filter(Boolean);
  const wordCount = description.trim() === '' ? 0 : words.length;
  const isBelowMinWords = wordCount < 10;

  // Validation logic
  const validate = () => {
    const newErrors = {};

    if (!installation) newErrors.installation = 'Select an installation.';
    if (!reportType) newErrors.report_type = 'Select a report type.';
    if (!reporterSeverity) newErrors.reporter_severity = 'Select reporter severity.';

    if (!observationDatetime) {
      newErrors.observation_datetime = 'Observation date/time is required.';
    } else {
      const selectedTime = new Date(observationDatetime).getTime();
      const nowTime = Date.now() + 5 * 60 * 1000;
      if (selectedTime > nowTime) {
        newErrors.observation_datetime = 'Observation date/time cannot be in the future.';
      }
    }

    if (!description || description.trim().length === 0) {
      newErrors.description = 'What did you see? Description is required.';
    } else if (description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validate();
  };

  const handleSubmit = async (e, forceDuplicate = false) => {
    e.preventDefault();
    setTouched({
      installation: true,
      report_type: true,
      observation_datetime: true,
      description: true,
      reporter_severity: true
    });

    if (!validate()) return;

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
      if (onReportSubmitted) {
        onReportSubmitted(res.report);
      }
    } catch (err) {
      if (err.isDuplicate) {
        setDuplicateWarning(err.message);
      } else if (err.errors) {
        setErrors(err.errors);
      } else {
        setGeneralError(err.message || 'Submission failed. Please check connection.');
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

  // Quick Preset Samples for Live Demo Testing
  const applyPreset = (presetText, presetType, presetSeverity) => {
    setDescription(presetText);
    setReportType(presetType);
    setReporterSeverity(presetSeverity);
    setTouched(prev => ({ ...prev, description: true }));
  };

  // Success Confirmation Screen (No risk score shown to Reporter per SRS / UI/UX 3.1)
  if (submittedReport) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md border border-slate-200 text-center space-y-5 animate-fadeIn">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Safety Report Received</h2>
          <p className="text-sm text-text-secondary">
            Thank you for contributing to OIL's safety culture (KAVACH).
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg max-w-sm mx-auto font-mono text-sm space-y-1">
          <span className="text-xs text-text-secondary uppercase font-semibold block">Reference Number</span>
          <span className="text-xl font-extrabold text-primary-navy tracking-wider block">
            {submittedReport.display_id || 'OIL-CONFIRMED'}
          </span>
          <span className="text-[11px] text-slate-500 block">
            Status: {submittedReport.status}
          </span>
        </div>

        <div className="pt-2 flex justify-center space-x-3">
          <button
            onClick={handleResetForm}
            className="px-5 py-2.5 bg-primary-navy hover:bg-blue-900 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit Another Report</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      {/* Form Header */}
      <div className="px-6 py-4 bg-primary-navy text-white flex items-center justify-between">
        <div>
          <h2 className="font-bold text-base">New Safety Observation Report</h2>
          <p className="text-xs text-blue-200">Oil India Limited Field Incident Reporting (KAVACH Initiative)</p>
        </div>
        <span className="text-xs font-mono bg-blue-900 text-blue-200 px-2.5 py-1 rounded border border-blue-700">
          SRS FR-1.1
        </span>
      </div>

      {/* Demo Test Presets */}
      <div className="px-6 pt-4 pb-1 bg-blue-50/50 border-b border-blue-100">
        <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center space-x-1 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Quick Demo Test Scenarios:</span>
        </span>
        <div className="flex flex-wrap gap-2 pb-3">
          <button
            type="button"
            onClick={() => applyPreset(
              "Found scaffolding without a guardrail near tank 4; contractor was standing on it while no harness was worn.",
              "Unsafe Condition",
              "Low"
            )}
            className="text-[11px] px-2.5 py-1 rounded bg-white hover:bg-blue-100 text-blue-900 border border-blue-200 font-medium transition shadow-2xs"
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
            className="text-[11px] px-2.5 py-1 rounded bg-white hover:bg-blue-100 text-blue-900 border border-blue-200 font-medium transition shadow-2xs"
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
            className="text-[11px] px-2.5 py-1 rounded bg-white hover:bg-blue-100 text-blue-900 border border-blue-200 font-medium transition shadow-2xs"
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
            className="text-[11px] px-2.5 py-1 rounded bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-medium transition shadow-2xs"
          >
            &lt; 10 Words (Edge Case)
          </button>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="p-6 space-y-5">
        {/* General Error Banner */}
        {generalError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Duplicate Warning Prompt (ERR-6) */}
        {duplicateWarning && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 space-y-2">
            <div className="flex items-center space-x-2 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Duplicate Report Alert</span>
            </div>
            <p>{duplicateWarning}</p>
            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded text-xs transition"
              >
                Yes, Submit Duplicate
              </button>
              <button
                type="button"
                onClick={() => setDuplicateWarning(null)}
                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded text-xs transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Installation Dropdown (V-2) */}
        <div>
          <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1">
            Installation / Field Site <span className="text-red-600">*</span>
          </label>
          <select
            value={installation}
            onChange={(e) => setInstallation(e.target.value)}
            onBlur={() => handleBlur('installation')}
            className={`w-full text-sm rounded-lg border px-3 py-2 bg-white transition focus:outline-none focus:ring-2 focus:ring-accent-blue ${
              touched.installation && errors.installation ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
            }`}
          >
            {INSTALLATIONS.map(inst => (
              <option key={inst} value={inst}>{inst} Field</option>
            ))}
          </select>
          {touched.installation && errors.installation && (
            <p className="mt-1 text-xs text-red-600">{errors.installation}</p>
          )}
        </div>

        {/* Report Type Radios (V-3) */}
        <div>
          <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
            Report Type <span className="text-red-600">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {REPORT_TYPES.map(type => (
              <label
                key={type}
                className={`flex items-center justify-center p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                  reportType === type
                    ? 'bg-blue-50 border-blue-600 text-primary-navy shadow-2xs'
                    : 'border-slate-300 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="report_type"
                  value={type}
                  checked={reportType === type}
                  onChange={(e) => setReportType(e.target.value)}
                  className="hidden"
                />
                <span>{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Observation DateTime (V-5) */}
        <div>
          <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1">
            Date & Time Observed <span className="text-red-600">*</span>
          </label>
          <input
            type="datetime-local"
            value={observationDatetime}
            onChange={(e) => setObservationDatetime(e.target.value)}
            onBlur={() => handleBlur('observation_datetime')}
            className={`w-full text-sm rounded-lg border px-3 py-2 bg-white transition focus:outline-none focus:ring-2 focus:ring-accent-blue ${
              touched.observation_datetime && errors.observation_datetime ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
            }`}
          />
          {touched.observation_datetime && errors.observation_datetime && (
            <p className="mt-1 text-xs text-red-600">{errors.observation_datetime}</p>
          )}
        </div>

        {/* Free-Text Description (V-1, FR-2.6, UI/UX 5.1 & 8) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              What did you see? <span className="text-red-600">*</span>
            </label>
            <span className={`text-xs font-mono font-medium ${
              isBelowMinWords ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              {wordCount} words {isBelowMinWords ? '(min 10 words)' : '✓'}
            </span>
          </div>

          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => handleBlur('description')}
            placeholder="Describe the condition or behavior observed in detail..."
            className={`w-full text-sm rounded-lg border p-3 transition focus:outline-none focus:ring-2 focus:ring-accent-blue ${
              touched.description && errors.description ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
            }`}
          />

          {isBelowMinWords && (
            <p className="mt-1 text-xs text-amber-700 italic">
              A few more words helps us route this correctly.
            </p>
          )}

          {touched.description && errors.description && (
            <p className="mt-1 text-xs text-red-600">{errors.description}</p>
          )}
        </div>

        {/* Reporter-Assigned Severity (V-4) */}
        <div>
          <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
            How severe would you call this? <span className="text-red-600">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Low', desc: 'No immediate harm or damage' },
              { label: 'Medium', desc: 'Moderate property or injury risk' },
              { label: 'High', desc: 'Critical or severe exposure' }
            ].map(sev => (
              <label
                key={sev.label}
                className={`flex flex-col p-2.5 rounded-lg border cursor-pointer transition ${
                  reporterSeverity === sev.label
                    ? 'bg-blue-50 border-blue-600 text-primary-navy shadow-2xs'
                    : 'border-slate-300 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="reporter_severity"
                    value={sev.label}
                    checked={reporterSeverity === sev.label}
                    onChange={(e) => setReporterSeverity(e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="text-xs font-bold">{sev.label}</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1">{sev.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-primary-navy hover:bg-blue-900 text-white rounded-lg text-sm font-bold transition shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {submitting ? (
              <span>Classifying & Submitting...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Safety Report</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
