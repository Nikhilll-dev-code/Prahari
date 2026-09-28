import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User, AlertCircle, ArrowRight, CheckCircle, Flame, Building2 } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('hse@oilindia.in');
  const [password, setPassword] = useState('oil123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
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
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background styling elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#2E74B5_1px,transparent_1px)] [background-size:16px_16px]"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-700 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg border border-blue-400/30">
            <Shield className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-black text-white tracking-tight">
          Prahari (प्रहरी)
        </h2>
        <p className="mt-1 text-center text-xs text-blue-200 font-medium">
          AI/NLP Engine for Serious Injury & Fatality (SIF) Precursor Detection
        </p>
        <p className="text-center text-[11px] text-blue-300/70 font-mono mt-0.5">
          Oil India Limited • Problem SIH26165
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl border border-slate-200 space-y-6">
          {/* Quick Demo Role Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              1-Click Demo Quick Login
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('hse@oilindia.in')}
                className="p-2.5 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100/90 text-left transition flex flex-col justify-between"
              >
                <div className="text-xs font-bold text-blue-900">HSE Officer</div>
                <div className="text-[10px] text-blue-700 font-mono mt-1">Triage Queue</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('reporter@oilindia.in')}
                className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/90 text-left transition flex flex-col justify-between"
              >
                <div className="text-xs font-bold text-emerald-900">Field Reporter</div>
                <div className="text-[10px] text-emerald-700 font-mono mt-1">Submit Form</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('head@oilindia.in')}
                className="p-2.5 rounded-lg border border-purple-200 bg-purple-50/70 hover:bg-purple-100/90 text-left transition flex flex-col justify-between"
              >
                <div className="text-xs font-bold text-purple-900">HSSE Head</div>
                <div className="text-[10px] text-purple-700 font-mono mt-1">Analytics</div>
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-medium">Or log in manually</span>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Official Email ID / Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-accent-blue bg-white"
                  placeholder="hse@oilindia.in"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-accent-blue bg-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary-navy hover:bg-blue-900 text-white rounded-lg text-xs font-bold transition shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Prahari'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Security & Context Note */}
          <div className="text-center pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            Complies with OIL KAVACH HSE Framework & SIH26165 Specifications.
          </div>
        </div>
      </div>
    </div>
  );
}
