import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Welcome from './pages/Welcome';
import ReporterHome from './pages/ReporterHome';
import TriageDashboard from './pages/TriageDashboard';
import AnalyticsView from './components/AnalyticsView';

export default function App() {
  const { user, loading, isHSE, isReporter } = useAuth();
  const [currentView, setCurrentView] = useState('welcome'); // 'welcome' | 'triage' | 'analytics' | 'report_form' | 'manual_review'
  const [stats, setStats] = useState(null);

  // Memoized fetchStats to prevent infinite re-render loops / screen flickering
  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  // STEP 1: NEW USER FLOW — After successful login, redirect to Welcome page (view: 'welcome')
  useEffect(() => {
    if (user) {
      fetchStats();
      setCurrentView('welcome');
    }
  }, [user, fetchStats]);

  const handleGetStarted = () => {
    if (isReporter) {
      setCurrentView('report_form');
    } else {
      setCurrentView('triage');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B132B] flex items-center justify-center text-slate-800 dark:text-white transition-colors duration-300">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-accent-blue/20 dark:border-cyan-glow/30" />
            <div className="w-12 h-12 border-4 border-accent-blue dark:border-cyan-bright border-t-transparent rounded-full animate-spin" />
          </div>
          <span className="text-xs font-mono text-accent-blue dark:text-cyan-bright tracking-widest uppercase">
            Initializing PRAHARI AI Engine...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const manualReviewCount = stats?.manualReview || 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0B132B] dark:text-slate-100 flex flex-col font-sans selection:bg-accent-blue selection:text-white transition-colors duration-300">
      
      {/* Dynamic Navbar */}
      <Navbar
        manualReviewCount={manualReviewCount}
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
        onRefreshData={fetchStats}
      />

      {/* Main Content with Framer Motion Page Transitions */}
      <main className="flex-1 w-full">
        <AnimatePresence mode="wait">
          {currentView === 'welcome' && (
            <motion.div
              key="welcome-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <Welcome onGetStarted={handleGetStarted} />
            </motion.div>
          )}

          {currentView === 'report_form' && isReporter && (
            <motion.div
              key="reporter-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
            >
              <ReporterHome />
            </motion.div>
          )}

          {currentView === 'triage' && isHSE && (
            <motion.div
              key="triage-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
            >
              <TriageDashboard 
                key="triage-all"
                onStatsUpdate={fetchStats} 
                initialRiskFilter="All"
              />
            </motion.div>
          )}

          {currentView === 'manual_review' && isHSE && (
            <motion.div
              key="manual-review-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
            >
              <TriageDashboard 
                key="triage-review"
                onStatsUpdate={fetchStats} 
                initialRiskFilter="Needs Manual Review"
              />
            </motion.div>
          )}

          {currentView === 'analytics' && isHSE && (
            <motion.div
              key="analytics-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
            >
              <AnalyticsView stats={stats} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-slate-100 dark:bg-[#080E21] border-t border-slate-200 dark:border-slate-800/80 py-4 text-xs text-slate-600 dark:text-slate-400 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="font-heading font-extrabold text-slate-900 dark:text-white">PRAHARI (प्रहरी)</span>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span>AI/NLP SIF Precursor Detection Engine</span>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span className="font-mono text-accent-blue dark:text-cyan-bright font-bold">PS SIH26165</span>
          </div>
          <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
            Oil India Limited (OIL) HSE Division • KAVACH Framework
          </div>
        </div>
      </footer>
    </div>
  );
}
