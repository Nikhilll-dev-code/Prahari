import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import { UploadCloud, FileText, AlertCircle, CheckCircle2, Download, X, Sparkles } from 'lucide-react';

export default function BulkImportModal({ isOpen, onClose, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (!selected.name.endsWith('.csv')) {
        setError('Only .csv files are supported.');
        return;
      }
      setFile(selected);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file to upload.');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.bulkImport(formData);
      setResult(res);
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err) {
      setError(err.message || 'Import failed. Check file format.');
    } finally {
      setUploading(false);
    }
  };

  const handleLoadSampleDataset = async () => {
    setUploading(true);
    setError(null);
    try {
      const res = await api.seedData();
      setResult({
        imported_count: res.count || 26,
        skipped_count: 0,
        errors: [],
        message: 'Loaded OIL Synthetic Demo Dataset successfully!'
      });
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err) {
      setError(err.message || 'Failed to seed sample dataset.');
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent = `installation,report_type,description,reporter_severity,observation_datetime\nDuliajan,Unsafe Condition,"Found scaffolding without a guardrail near tank 4; contractor was standing on it while no harness was worn.",Low,2026-09-27 14:10:00\nNaharkatiya,Unsafe Act,"Electrician worked on 415V MCC feeder without applying lockout tagout padlock as isolation switch was stiff.",Low,2026-09-27 09:30:00\nBaghjan,Near Miss,"Observed weeping valve gland packing with continuous hydrocarbon gas hiss on high pressure wellhead Christmas tree at 3000 PSI.",Low,2026-09-27 11:15:00\nMoran,Unsafe Act,"Roughneck was standing directly in rotary table swing radius while drill string was being hoisted under heavy tension.",Medium,2026-09-26 16:45:00`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sif_sentinel_sample_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-primary-navy text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UploadCloud className="w-5 h-5 text-blue-300" />
            <h3 className="font-bold text-base">Bulk Report Ingestion (CSV)</h3>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Quick Demo Loader */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-blue-900 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>One-Click OIL Demo Dataset</span>
              </div>
              <p className="text-[11px] text-blue-800 mt-0.5">
                Load 26+ pre-curated synthetic Oil India Limited safety reports with disguised high-risk cases.
              </p>
            </div>
            <button
              onClick={handleLoadSampleDataset}
              disabled={uploading}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition shadow-sm shrink-0 disabled:opacity-50"
            >
              {uploading ? 'Loading...' : 'Load Dataset'}
            </button>
          </div>

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
              file ? 'border-blue-500 bg-blue-50/30' : 'border-slate-300 hover:border-blue-400 bg-slate-50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            {file ? (
              <div>
                <p className="text-xs font-bold text-blue-900">{file.name}</p>
                <p className="text-[11px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-slate-700">Click to browse or drop CSV report file</p>
                <p className="text-[11px] text-slate-400 mt-1">Columns: installation, report_type, description, reporter_severity, observation_datetime</p>
              </div>
            )}
          </div>

          {/* Template Download Link */}
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Need a formatted CSV template?</span>
            <button
              onClick={downloadSampleTemplate}
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Sample CSV</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Summary */}
          {result && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Import Complete</span>
              </div>
              <div className="text-xs text-emerald-900 grid grid-cols-2 gap-2 font-mono">
                <div>Imported & Classified: <strong>{result.imported_count}</strong></div>
                <div>Skipped / Invalid: <strong>{result.skipped_count}</strong></div>
              </div>
              {result.errors && result.errors.length > 0 && (
                <div className="mt-2 text-[11px] text-red-600 bg-white p-2 rounded border border-red-200 max-h-24 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <div key={i}>Row {err.row}: {JSON.stringify(err.errors)}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
          >
            Close
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-4 py-2 bg-primary-navy hover:bg-blue-900 text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            {uploading ? 'Processing & Classifying...' : 'Upload & Classify'}
          </button>
        </div>
      </div>
    </div>
  );
}
