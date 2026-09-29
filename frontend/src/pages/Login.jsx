import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, Building2, Eye, EyeOff, Sun, Moon } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [username, setUsername] = useState('hse@oilindia.in');
  const [password, setPassword] = useState('oil123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

  useEffect(() => {
    // Check if redirected due to expired session (UI/UX Section 9.2)
    const hadExpired = sessionStorage.getItem('sif_session_expired');
    if (hadExpired) {
      setSessionExpiredNotice(true);
      sessionStorage.removeItem('sif_session_expired');
    }
  }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail, pass = 'oil123') => {
    setUsername(userEmail);
    setPassword(pass);
    setError(null);
    setLoading(true);
    try {
      await login(userEmail, pass);
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B132B] text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      
      {/* Top right theme toggle */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-accent-blue dark:hover:text-cyan-bright shadow-sm backdrop-blur-md transition-all cursor-pointer"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle theme mode"
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
        </button>
      </div>

      {/* Background Ambient Glows */}
      <div 
        className="absolute top-1/4 left-1/3 w-96 h-96 bg-accent-blue/10 dark:bg-primary-navy/35 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />
      <div 
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 dark:bg-accent-blue/20 rounded-full blur-[100px] pointer-events-none"
        aria-hidden="true"
      />
      <div 
        className="absolute inset-0 opacity-10 dark:opacity-15 pointer-events-none bg-[radial-gradient(#2E74B5_1px,transparent_1px)] dark:bg-[radial-gradient(#00B4D8_1px,transparent_1px)] [background-size:24px_24px]"
        aria-hidden="true"
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        {/* Emblem */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-navy via-accent-blue to-cyan-500 p-0.5 shadow-md mb-4">
          <div className="w-full h-full rounded-[14px] bg-white dark:bg-[#0B132B] flex items-center justify-center">
            <Shield className="w-8 h-8 text-accent-blue dark:text-cyan-bright" />
          </div>
        </div>

        <h1 className="text-3xl font-black font-heading text-slate-900 dark:text-white tracking-tight">
          PRAHARI
        </h1>
        <p className="mt-1 text-sm text-accent-blue dark:text-cyan-bright font-mono font-medium">
          AI/NLP SIF Precursor Detection Engine
        </p>
        <div className="inline-flex items-center space-x-2 mt-2 px-3 py-1 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-cyan-glow/30 rounded-full text-xs font-mono text-slate-600 dark:text-slate-300 backdrop-blur-md shadow-xs">
          <Building2 className="w-3.5 h-3.5 text-accent-blue dark:text-cyan-bright" />
          <span>Oil India Limited (OIL) • PS SIH26165</span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl py-8 px-6 sm:px-8 rounded-2xl border border-slate-200/90 dark:border-cyan-glow/30 shadow-xl space-y-6">
          
          {/* Session Expiry Notice (UI/UX Section 9.2) */}
          {sessionExpiredNotice && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-500/50 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-center space-x-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Your session expired — please log in again.</span>
            </div>
          )}

          {/* 1-Click Role Logins for SIH Hackathon Evaluation */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-accent-blue dark:text-cyan-bright uppercase tracking-wider block font-mono">
              1-Click Demo Evaluation Sign-In:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('hse@oilindia.in')}
                className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-500/40 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 hover:border-accent-blue dark:hover:border-cyan-glow/60 text-left transition flex flex-col justify-between group cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-blue"
              >
                <div className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-accent-blue dark:group-hover:text-cyan-bright">HSE Officer</div>
                <div className="text-[10px] text-accent-blue dark:text-cyan-glow font-mono mt-1 font-semibold">Triage Queue</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('reporter@oilindia.in')}
                className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 hover:border-emerald-500 dark:hover:border-emerald-400 text-left transition flex flex-col justify-between group cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-blue"
              >
                <div className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300">Field Reporter</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-1 font-semibold">Submit Form</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('head@oilindia.in')}
                className="p-2.5 rounded-xl border border-purple-200 dark:border-purple-500/40 bg-purple-50/60 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 hover:border-purple-500 dark:hover:border-purple-400 text-left transition flex flex-col justify-between group cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-blue"
              >
                <div className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300">HSSE Head</div>
                <div className="text-[10px] text-purple-600 dark:text-purple-300 font-mono mt-1 font-semibold">Analytics</div>
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-[#0f1e3d] px-3 text-slate-500 dark:text-slate-400 font-medium rounded">Or enter credentials</span>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {error && (
              <div 
                className="p-3 rounded-xl bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-500/60 text-xs text-red-700 dark:text-red-200 flex items-start space-x-2 animate-fadeIn"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label 
                htmlFor="username-input" 
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
              >
                Official Email / Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" aria-hidden="true" />
                <input
                  id="username-input"
                  type="email"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-blue dark:focus:ring-cyan-glow focus:border-accent-blue dark:focus:border-cyan-glow transition"
                  placeholder="hse@oilindia.in"
                />
              </div>
            </div>

            <div>
              <label 
                htmlFor="password-input" 
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" aria-hidden="true" />
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-blue dark:focus:ring-cyan-glow focus:border-accent-blue dark:focus:border-cyan-glow transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-cyan-bright focus:outline-none cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-premium w-full py-3.5 bg-gradient-to-r from-primary-navy via-accent-blue to-cyan-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 group cursor-pointer"
            >
              <span>{loading ? 'Authenticating Officer...' : 'Sign In to PRAHARI'}</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </form>

          {/* Compliance Footer */}
          <div className="text-center pt-2 border-t border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Complies with Oil India Limited HSE Framework (KAVACH) &amp; SIH26165.
          </div>
        </div>
      </div>
    </div>
  );
}
