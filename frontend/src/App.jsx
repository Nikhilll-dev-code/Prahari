import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import ReporterHome from './pages/ReporterHome';
import TriageDashboard from './pages/TriageDashboard';
import AnalyticsView from './components/AnalyticsView';

export default function App() {
  const { user, loading, isHSE, isReporter } = useAuth();
  const [currentView, setCurrentView] = useState('triage'); // 'triage' | 'analytics' | 'report_form' | 'manual_review'
  const [stats, setStats] = useState(null);

  const fetchStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
      if (isReporter) {
        setCurrentView('report_form');
      } else {
        setCurrentView('triage');
      }
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-blue-200">Initializing Prahari (प्रहरी)...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const manualReviewCount = stats?.manualReview || 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        manualReviewCount={manualReviewCount}
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
        onRefreshData={fetchStats}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isReporter ? (
          <ReporterHome />
        ) : (
          <>
            {currentView === 'triage' && (
              <TriageDashboard onStatsUpdate={fetchStats} />
            )}
            {currentView === 'manual_review' && (
              <TriageDashboard onStatsUpdate={fetchStats} />
            )}
            {currentView === 'analytics' && (
              <AnalyticsView stats={stats} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Prahari (प्रहरी) • AI/NLP SIF Precursor Detection Engine • SIH26165</span>
          <span className="font-mono text-[11px] text-slate-400">Oil India Limited HSE Division • KAVACH</span>
        </div>
      </footer>
    </div>
  );
}
