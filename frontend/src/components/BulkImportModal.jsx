import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  UploadCloud, FileText, AlertCircle, CheckCircle2, 
  Download, X, Sparkles, FileWarning 
} from 'lucide-react';

export default function BulkImportModal({ isOpen, onClose, onImportSuccess }) {
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (!selected.name.toLowerCase().endsWith('.csv')) {
        setError('Invalid file type: Please select a standard .csv file.');
        return;
      }
      if (selected.size > 10 * 1024 * 1024) {
        setError('File size exceeds the 10MB limit.');
        return;
      }
      setFile(selected);
      setError(null);
      setResult(null);
      setProgress(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file to ingest.');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress({ processed: 'Reading file...', percent: 25 });

    try {
      setProgress({ processed: 'Parsing rows & running AI NLP models...', percent: 60 });
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await api.bulkImport(formData);
      setProgress({ processed: 'Finalizing database records...', percent: 100 });
      setResult(res);
      toast.success(`Import complete: ${res.imported_count} imported, ${res.skipped_count} skipped`);
      
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err) {
      setError(err.message || 'Bulk ingestion failed. Please verify CSV schema.');
      toast.error(err.message || 'Bulk ingestion failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleLoadSampleDataset = async () => {
    setUploading(true);
    setError(null);
    setProgress({ processed: 'Loading synthetic Oil India Limited dataset...', percent: 50 });
    try {
      const res = await api.seedData();
      setProgress({ processed: 'Complete!', percent: 100 });
      const summary = {
        imported_count: res.count || 26,
        skipped_count: 0,
        errors: [],
        message: 'Successfully ingested 26+ synthetic Oil India Limited safety reports.'
      };
      setResult(summary);
      toast.success('Successfully loaded Oil India Limited evaluation dataset!');
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err) {
      setError(err.message || 'Failed to seed sample dataset.');
      toast.error('Failed to load dataset.');
    } finally {
      setUploading(false);
    }
  };

  const downloadErrorReport = () => {
    if (!result?.errors || result.errors.length === 0) return;

    let csvContent = 'row,reason,details\n';
    result.errors.forEach(err => {
      const details = typeof err.errors === 'object' ? JSON.stringify(err.errors).replace(/"/g, '""') : (err.message || '');
      csvContent += `${err.row || 'N/A'},"Validation Error","${details}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `skipped_rows_error_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSampleTemplate = () => {
    const csvContent = `installation,report_type,description,reporter_severity,observation_datetime\nDuliajan,Unsafe Condition,"Found scaffolding without a guardrail near tank 4; contractor was standing on it while no harness was worn.",Low,2026-09-27 14:10:00\nNaharkatiya,Unsafe Act,"Electrician worked on 415V MCC feeder without applying lockout tagout padlock as isolation switch was stiff.",Low,2026-09-27 09:30:00\nBaghjan,Near Miss,"Observed weeping valve gland packing with continuous hydrocarbon gas hiss on high pressure wellhead Christmas tree at 3000 PSI.",Low,2026-09-27 11:15:00\nMoran,Unsafe Act,"Roughneck was standing directly in rotary table swing radius while drill string was being hoisted under heavy tension.",Medium,2026-09-26 16:45:00\nDigboi,Unsafe Condition,"Loose cable tray bracket rusted through above main personnel walkway adjacent to separator pump house.",Low,2026-09-25 10:20:00`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'prahari_sample_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-modal-title"
    >
      <div className="bg-white dark:bg-[#0E1A38] rounded-2xl shadow-2xl border border-slate-200 dark:border-cyan-glow/30 w-full max-w-xl overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-primary-navy via-navy-deep to-accent-blue text-white flex items-center justify-between border-b border-cyan-glow/20">
          <div className="flex items-center space-x-2.5">
            <UploadCloud className="w-5 h-5 text-cyan-200 dark:text-cyan-bright" />
            <h3 id="bulk-modal-title" className="font-bold text-base font-heading">Bulk Report Ingestion (CSV)</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-300 hover:text-white transition p-1 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* Quick Demo Dataset Loader */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-cyan-glow/30 rounded-xl flex items-center justify-between gap-3 shadow-xs">
            <div>
              <div className="text-xs font-bold text-accent-blue dark:text-cyan-bright flex items-center space-x-1.5 font-mono">
                <Sparkles className="w-4 h-4 text-accent-blue dark:text-cyan-bright" />
                <span>1-Click OIL Synthetic Demo Dataset</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed font-sans">
                Ingest 26+ synthetic Oil India Limited logs featuring disguised high-risk precursors (LOTO, Line-of-Fire, High-Pressure gas).
              </p>
            </div>
            <button
              onClick={handleLoadSampleDataset}
              disabled={uploading}
              className="btn-premium px-3.5 py-2 bg-accent-blue hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition shadow-sm shrink-0 disabled:opacity-50 min-h-[36px] cursor-pointer"
            >
              {uploading ? 'Ingesting...' : 'Load Dataset'}
            </button>
          </div>

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
              file 
                ? 'border-accent-blue dark:border-cyan-glow bg-blue-50/50 dark:bg-blue-950/40' 
                : 'border-slate-300 dark:border-slate-700 hover:border-accent-blue dark:hover:border-cyan-glow/60 bg-slate-50 dark:bg-slate-900/60'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            <FileText className="w-9 h-9 text-accent-blue dark:text-cyan-bright mx-auto mb-2" />
            {file ? (
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{file.name}</p>
                <p className="text-[11px] text-accent-blue dark:text-cyan-bright font-mono mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB • Ready for AI triage
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-white">
                  Click to browse or drop CSV report file
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Required columns: installation, report_type, description, reporter_severity, observation_datetime
                </p>
              </div>
            )}
          </div>

          {/* Download CSV Template Affordance */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 font-mono">
            <span>Need a formatted CSV template?</span>
            <button
              onClick={downloadSampleTemplate}
              className="text-accent-blue dark:text-cyan-bright hover:underline font-bold flex items-center space-x-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Sample CSV</span>
            </button>
          </div>

          {/* Upload Progress Indicator */}
          {uploading && progress && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/90 border border-blue-200 dark:border-cyan-glow/30 rounded-xl space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-semibold text-accent-blue dark:text-cyan-bright font-mono">
                <span>{progress.processed}</span>
                <span>{progress.percent}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-accent-blue to-cyan-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-500/60 rounded-xl text-xs text-red-800 dark:text-red-200 flex items-start space-x-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Completion Summary */}
          {result && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-500/60 rounded-xl space-y-3 animate-fadeIn">
              <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Ingestion Completed Successfully</span>
              </div>
              
              <div className="text-xs text-emerald-900 dark:text-emerald-200 grid grid-cols-2 gap-2 font-mono bg-white dark:bg-slate-900/90 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-500/40">
                <div>Imported &amp; Scored: <strong className="text-slate-900 dark:text-white">{result.imported_count}</strong></div>
                <div>Skipped / Invalid: <strong className="text-slate-900 dark:text-white">{result.skipped_count}</strong></div>
              </div>

              {result.skipped_count > 0 && (
                <div className="pt-1 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                  <span className="flex items-center space-x-1 font-semibold font-mono">
                    <FileWarning className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>{result.skipped_count} skipped rows detected</span>
                  </span>
                  <button
                    onClick={downloadErrorReport}
                    className="text-amber-800 dark:text-amber-300 hover:underline font-bold flex items-center space-x-1 text-xs cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download error report</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-[#081026] border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="btn-premium px-4 py-2 bg-gradient-to-r from-primary-navy via-accent-blue to-cyan-500 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 min-h-[36px] cursor-pointer"
          >
            {uploading ? 'Processing & Scoring...' : 'Upload & Classify'}
          </button>
        </div>
      </div>
    </div>
  );
}
