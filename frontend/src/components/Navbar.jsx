import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, AlertTriangle, User, LogOut, RefreshCw, BarChart2, PlusCircle, Inbox } from 'lucide-react';

export default function Navbar({ manualReviewCount = 0, currentView, onViewChange, onRefreshData }) {
  const { user, logout, isHSE, isReporter } = useAuth();

  return (
    <header className="bg-primary-navy text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand + Role Badge */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/30 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight">Prahari (प्रहरी)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-900 text-blue-200 border border-blue-700 font-mono font-medium">
                  OIL-HSE
                </span>
                {user && (
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                    user.role === 'HSE Officer' 
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-500/40'
                      : user.role === 'Divisional Head'
                      ? 'bg-purple-400/20 text-purple-300 border border-purple-500/40'
                      : 'bg-emerald-400/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {user.role}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-blue-200/70 leading-none mt-0.5 hidden sm:block">
                AI/NLP Precursor Detection Engine • Oil India Limited
              </p>
            </div>
          </div>

          {/* Center / Navigation Links */}
          {user && (
            <div className="hidden md:flex items-center space-x-1">
              {isHSE && (
                <>
                  <button
                    onClick={() => onViewChange('triage')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition ${
                      currentView === 'triage'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-blue-100 hover:bg-blue-900/50'
                    }`}
                  >
                    <Inbox className="w-3.5 h-3.5" />
                    <span>Triage Queue</span>
                  </button>

                  <button
                    onClick={() => onViewChange('analytics')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition ${
                      currentView === 'analytics'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-blue-100 hover:bg-blue-900/50'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Trend Analytics</span>
                  </button>
                </>
              )}

              {isReporter && (
                <button
                  onClick={() => onViewChange('report_form')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition ${
                    currentView === 'report_form'
                      ? 'bg-blue-600 text-white'
                      : 'text-blue-100 hover:bg-blue-900/50'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Submit Safety Report</span>
                </button>
              )}
            </div>
          )}

          {/* Right: Counter badge + User details + Logout */}
          <div className="flex items-center space-x-3">
            {/* HSE Officer only: Needs Manual Review counter badge (SRS BR-7 & UI/UX 2.1) */}
            {isHSE && (
              <div 
                className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded border font-medium cursor-pointer transition ${
                  manualReviewCount > 0
                    ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-slate-700/50 text-slate-300 border-slate-600'
                }`}
                onClick={() => onViewChange('manual_review')}
                title="Reports flagged for manual HSE inspection (short description or low confidence)"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Needs Manual Review:</span>
                <span className="font-bold bg-amber-500/40 px-1.5 py-0.2 rounded text-white">
                  {manualReviewCount}
                </span>
              </div>
            )}

            {user && (
              <div className="flex items-center space-x-2 pl-2 border-l border-blue-800/80">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-white leading-tight">{user.name}</div>
                  <div className="text-[11px] text-blue-300 leading-tight">{user.installation} Field</div>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-md text-blue-200 hover:text-white hover:bg-blue-900/60 transition"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
