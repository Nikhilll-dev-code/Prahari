import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import NewReportForm from '../components/NewReportForm';
import { PlusCircle, ListOrdered, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ReporterHome() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'my_reports'
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMyReports = async () => {
    setLoading(true);
    try {
      const data = await api.getReports();
      setMyReports(data.reports || []);
    } catch (err) {
      console.error('Failed to load my reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my_reports') {
      fetchMyReports();
    }
  }, [activeTab]);

  const handleReportSubmitted = () => {
    fetchMyReports();
  };

  const getStatusBadge = (status) => {
    if (status === 'Escalated') return 'bg-red-100 text-red-800 border-red-200';
    if (status === 'Reviewed') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (status === 'Closed') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Reporter Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-primary-navy">
            Field Safety Reporting Portal (KAVACH)
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Logged in as <strong>{user?.name}</strong> • {user?.installation} Field Installation
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 rounded-md transition flex items-center space-x-1.5 ${
              activeTab === 'new' ? 'bg-primary-navy text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Report</span>
          </button>
          <button
            onClick={() => setActiveTab('my_reports')}
            className={`px-4 py-2 rounded-md transition flex items-center space-x-1.5 ${
              activeTab === 'my_reports' ? 'bg-primary-navy text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>My Reports ({myReports.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'new' ? (
        <NewReportForm onReportSubmitted={handleReportSubmitted} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              My Submitted Safety Observations
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {myReports.length} Total Submissions
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading your reports...</div>
          ) : myReports.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-600 font-medium">You haven't submitted any safety reports yet.</p>
              <button
                onClick={() => setActiveTab('new')}
                className="px-4 py-2 bg-primary-navy text-white rounded-lg text-xs font-bold hover:bg-blue-900 transition"
              >
                Submit Your First Report
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
                    <th className="py-3 px-4">Reference ID</th>
                    <th className="py-3 px-3">Report Type</th>
                    <th className="py-3 px-3">Observation Description</th>
                    <th className="py-3 px-3">Reported Severity</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Observed Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {myReports.map((report) => (
                    <tr key={report.report_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-primary-navy">
                        {report.display_id || 'REPORT'}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">
                        {report.report_type}
                      </td>
                      <td className="py-3 px-3 max-w-md truncate text-slate-700">
                        {report.description}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-700">{report.reporter_severity || 'Low'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(report.status)}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
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
