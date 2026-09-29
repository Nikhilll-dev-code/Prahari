import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Shield, AlertTriangle, LogOut, Eye, ArrowRightLeft, 
  Inbox, BarChart2, PlusCircle, Info, Sun, Moon,
  ChevronDown, Menu, X, User as UserIcon
} from 'lucide-react';

export default function Navbar({ manualReviewCount = 0, currentView, onViewChange, onRefreshData }) {
  const { user, logout, login, isHSE, isReporter } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [grayscaleMode, setGrayscaleMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleGrayscale = () => {
    const nextState = !grayscaleMode;
    setGrayscaleMode(nextState);
    if (nextState) {
      document.body.classList.add('demo-grayscale');
    } else {
      document.body.classList.remove('demo-grayscale');
    }
  };

  const handleRoleQuickSwitch = async (targetRole) => {
    try {
      if (targetRole === 'HSE') {
        await login('hse@oilindia.in', 'oil123');
        onViewChange('triage');
      } else {
        await login('reporter@oilindia.in', 'oil123');
        onViewChange('report_form');
      }
      setMobileMenuOpen(false);
    } catch (err) {
      console.error('Failed to switch role:', err);
    }
  };

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 dark:bg-[#0B132B]/95 backdrop-blur-xl border-b border-slate-200 dark:border-cyan-glow/20 shadow-lg py-2' 
          : 'bg-white/85 dark:bg-[#0B132B]/85 backdrop-blur-md border-b border-slate-200/80 dark:border-blue-900/50 py-3'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
          
          {/* ================= LEFT: Brand identity ================= */}
          <div 
            onClick={() => {
              onViewChange('welcome');
              setMobileMenuOpen(false);
            }}
            className="flex items-center space-x-3 cursor-pointer select-none group flex-shrink-0"
            title="PRAHARI - Return to Welcome & System Overview"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-navy via-accent-blue to-cyan-500 p-[1.5px] shadow-sm group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-heading font-black text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-accent-blue dark:group-hover:text-cyan-bright transition">
                  PRAHARI
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-blue-950 dark:text-cyan-bright dark:border-cyan-glow/40">
                  OIL
                </span>
                {user && (
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider font-mono ${
                    isHSE 
                      ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-400/20 dark:text-amber-300 dark:border-amber-400/40'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-400/20 dark:text-emerald-300 dark:border-emerald-400/40'
                  }`}>
                    {user.role}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-tight hidden sm:block">
                PRAHARI • SIF Precursor Detection
              </p>
            </div>
          </div>

          {/* ================= CENTER: Clean Segmented Navigation ================= */}
          {user && (
            <nav className="hidden lg:flex items-center p-1 rounded-xl bg-slate-100/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-inner">
              
              {/* Overview / Welcome */}
              <button
                onClick={() => onViewChange('welcome')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
                  currentView === 'welcome'
                    ? 'bg-white text-primary-navy shadow-sm font-bold dark:bg-accent-blue dark:text-white dark:shadow-glow-cyan'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <Info className="w-3.5 h-3.5 text-accent-blue dark:text-cyan-bright" />
                <span>Overview</span>
              </button>

              {isHSE ? (
                <>
                  <button
                    onClick={() => onViewChange('triage')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
                      currentView === 'triage'
                        ? 'bg-white text-primary-navy shadow-sm font-bold dark:bg-accent-blue dark:text-white dark:shadow-glow-cyan'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    <Inbox className="w-3.5 h-3.5 text-accent-blue dark:text-cyan-bright" />
                    <span>Triage Queue</span>
                  </button>

                  <button
                    onClick={() => onViewChange('analytics')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
                      currentView === 'analytics'
                        ? 'bg-white text-primary-navy shadow-sm font-bold dark:bg-accent-blue dark:text-white dark:shadow-glow-cyan'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-accent-blue dark:text-cyan-bright" />
                    <span>SIF Analytics</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onViewChange('report_form')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
                    currentView === 'report_form'
                      ? 'bg-white text-primary-navy shadow-sm font-bold dark:bg-accent-blue dark:text-white dark:shadow-glow-cyan'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5 text-accent-blue dark:text-cyan-bright" />
                  <span>Reporter Portal</span>
                </button>
              )}
            </nav>
          )}

          {/* ================= RIGHT: Controls & Profile ================= */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            
            {/* HSE Officer only: Needs Manual Review Alert Badge */}
            {user && isHSE && (
              <button
                onClick={() => onViewChange('manual_review')}
                className={`flex items-center space-x-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition ${
                  manualReviewCount > 0
                    ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/50 dark:hover:bg-amber-500/30 shadow-xs'
                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900/70 dark:text-slate-400 dark:border-slate-800'
                }`}
                title="Observations flagged for manual HSE inspection (short text or low confidence)"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="hidden md:inline">Review:</span>
                <span className={`font-bold font-mono px-1.5 py-0.2 rounded text-[11px] ${
                  manualReviewCount > 0
                    ? 'bg-amber-200 text-amber-900 dark:bg-amber-400/40 dark:text-amber-200'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {manualReviewCount}
                </span>
              </button>
            )}

            {/* Light / Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200 dark:text-slate-300 dark:bg-slate-900/80 dark:border-slate-800 dark:hover:bg-slate-800 dark:hover:text-yellow-300 transition-all shadow-xs"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme mode"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 animate-pulse" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Quick Role Swapper for Hackathon Jury */}
            {user && (
              <button
                onClick={() => handleRoleQuickSwitch(isHSE ? 'Reporter' : 'HSE')}
                className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 dark:bg-slate-900/90 dark:hover:bg-slate-800 dark:text-cyan-bright dark:border-cyan-glow/40 transition group shadow-xs"
                title={`Quick toggle to ${isHSE ? 'Field Reporter' : 'HSE Officer'} role`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-accent-blue dark:text-cyan-bright group-hover:rotate-180 transition-transform duration-300" />
                <span>{isHSE ? 'To Reporter' : 'To HSE'}</span>
              </button>
            )}

            {/* WCAG Grayscale Toggle (Color-blindness test) */}
            <button
              onClick={toggleGrayscale}
              className={`hidden md:flex p-1.5 px-2 rounded-lg text-xs font-medium border items-center space-x-1 transition shadow-xs ${
                grayscaleMode 
                  ? 'bg-amber-400 text-slate-950 border-amber-500 font-bold'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:bg-slate-900/80 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800'
              }`}
              title="WCAG 2.1 AA Grayscale Contrast Verification"
              aria-label="Toggle Grayscale Mode"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="text-[11px]">{grayscaleMode ? 'Gray: ON' : 'WCAG'}</span>
            </button>

            {/* User Profile & Logout */}
            {user && (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-300 dark:border-slate-800">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                    {user.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-accent-blue dark:text-cyan-bright font-mono leading-tight">
                    {user.installation}
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/30 transition border border-transparent hover:border-red-200 dark:hover:border-red-900/50"
                  title="Sign out of PRAHARI"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && user && (
          <div className="lg:hidden pt-3 pb-4 border-t border-slate-200 dark:border-slate-800 flex flex-col space-y-2 animate-fadeIn">
            <button
              onClick={() => {
                onViewChange('welcome');
                setMobileMenuOpen(false);
              }}
              className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2.5 text-left transition ${
                currentView === 'welcome'
                  ? 'bg-accent-blue text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>System Overview (About PRAHARI)</span>
            </button>

            {isHSE ? (
              <>
                <button
                  onClick={() => {
                    onViewChange('triage');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2.5 text-left transition ${
                    currentView === 'triage'
                      ? 'bg-accent-blue text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Inbox className="w-4 h-4" />
                  <span>Triage Dashboard Queue</span>
                </button>

                <button
                  onClick={() => {
                    onViewChange('analytics');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2.5 text-left transition ${
                    currentView === 'analytics'
                      ? 'bg-accent-blue text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <BarChart2 className="w-4 h-4" />
                  <span>SIF Analytics &amp; Trends</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onViewChange('report_form');
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2.5 text-left transition ${
                  currentView === 'report_form'
                    ? 'bg-accent-blue text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit Field Report</span>
              </button>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-1">
              <button
                onClick={() => handleRoleQuickSwitch(isHSE ? 'Reporter' : 'HSE')}
                className="text-xs text-accent-blue dark:text-cyan-bright font-semibold flex items-center space-x-1.5 py-1"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Switch to {isHSE ? 'Field Reporter' : 'HSE Officer'}</span>
              </button>

              <button
                onClick={toggleGrayscale}
                className="text-xs text-slate-500 dark:text-slate-400 py-1"
              >
                {grayscaleMode ? 'Grayscale: ON' : 'Grayscale Test'}
              </button>
            </div>
          </div>
        )}

      </div>
    </header>
  );
}
