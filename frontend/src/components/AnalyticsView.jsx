import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { ShieldAlert, AlertTriangle, CheckCircle, Zap, Building2, Flame } from 'lucide-react';

const HAZARD_COLORS = {
  'Work at Height': '#C0392B',
  'Line-of-Fire': '#D35400',
  'Confined Space': '#8E44AD',
  'LOTO Bypass': '#2980B9',
  'Struck-By': '#E67E22',
  'Uncontrolled Energy': '#E74C3C',
  'PPE Non-Compliance': '#F39C12',
  'Housekeeping': '#27AE60',
  'Undetermined': '#7F8C8D'
};

export default function AnalyticsView({ stats }) {
  const { isDark } = useTheme();

  if (!stats) return null;

  const total = stats.total || 0;
  const highRisk = stats.highRisk || 0;
  const mediumRisk = stats.mediumRisk || 0;
  const lowRisk = stats.lowRisk || 0;
  const manualReview = stats.manualReview || 0;
  const disguisedCount = stats.disguisedHighRisk || 0;

  // Pie Data for Risk Bands
  const riskPieData = [
    { name: 'High SIF Risk (≥70)', value: highRisk, color: '#C0392B' },
    { name: 'Medium Risk (40-69)', value: mediumRisk, color: '#E67E22' },
    { name: 'Low Risk (<40)', value: lowRisk, color: '#27AE60' },
    { name: 'Needs Manual Review', value: manualReview, color: '#7F8C8D' }
  ].filter(d => d.value > 0);

  // Bar Data for Hazard Categories
  const hazardData = Object.entries(stats.hazardCounts || {})
    .filter(([_, count]) => count > 0)
    .map(([name, count]) => ({
      name,
      count,
      color: HAZARD_COLORS[name] || '#2E74B5'
    }))
    .sort((a, b) => b.count - a.count);

  // Installation Data
  const installData = Object.entries(stats.installationCounts || {})
    .filter(([_, counts]) => counts.total > 0)
    .map(([name, counts]) => ({
      name,
      High: counts.high || 0,
      Medium: counts.medium || 0,
      Low: counts.low || 0,
      Total: counts.total || 0
    }))
    .sort((a, b) => b.Total - a.Total);

  const tooltipStyle = isDark ? {
    backgroundColor: '#0E1A38',
    borderColor: '#2E74B5',
    borderRadius: '8px',
    color: '#fff'
  } : {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderRadius: '8px',
    color: '#0f172a',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 animate-fadeIn transition-colors">
      
      {/* Top Headline KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ingested */}
        <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-cyan-glow/20 shadow-glass flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase font-mono">Total Observations</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">{total}</div>
            <span className="text-[11px] text-accent-blue dark:text-cyan-bright">Across 8 OIL Installations</span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/80 rounded-xl text-accent-blue dark:text-cyan-bright border border-blue-200 dark:border-cyan-glow/30">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* High SIF Precursor Count */}
        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-red-500 border border-red-200 dark:border-red-500/30 shadow-glass flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-red-600 dark:text-red-300 uppercase font-mono">High SIF Precursors</span>
            <div className="text-2xl font-extrabold text-red-600 dark:text-red-400 font-mono mt-1">{highRisk}</div>
            <span className="text-[11px] text-red-600/80 dark:text-red-300/80 font-medium">
              {total > 0 ? `${Math.round((highRisk / total) * 100)}% of total volume` : '0%'}
            </span>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950/80 rounded-xl text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/40">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Disguised High Risk */}
        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-amber-500 border border-amber-200 dark:border-amber-500/30 shadow-glass flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-300 uppercase font-mono">Disguised High-Risk</span>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-1">{disguisedCount}</div>
            <span className="text-[11px] text-amber-600 dark:text-amber-300 font-medium">Reported 'Low' / AI flagged High</span>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/80 rounded-xl text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/40">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        {/* Routine Housekeeping */}
        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-emerald-500 border border-emerald-200 dark:border-emerald-500/30 shadow-glass flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-300 uppercase font-mono">Routine / Non-SIF</span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">{lowRisk}</div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400">De-prioritized from triage</span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 rounded-xl text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/40">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Disguised SIF Value Proposition Spotlight */}
      <div className="p-5 bg-gradient-to-r from-primary-navy via-navy-deep to-accent-blue rounded-2xl border border-cyan-glow/40 shadow-glow-cyan flex flex-col md:flex-row items-center justify-between gap-4 text-white">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-cyan-bright" />
            <h4 className="font-bold text-sm tracking-wide text-white font-heading">
              The SIF Precursor Divergence Index
            </h4>
          </div>
          <p className="text-xs text-blue-100 max-w-2xl leading-relaxed font-sans">
            In standard HSE review pipelines, <strong className="text-white font-mono">{disguisedCount} high-consequence reports</strong> were categorized as 'Low Severity' because nobody was injured yet. PRAHARI successfully surfaced them to the top of the queue before potential escalation.
          </p>
        </div>
        <div className="bg-slate-900/80 px-5 py-2.5 rounded-xl text-center backdrop-blur-md border border-cyan-glow/30 shrink-0 shadow-glass">
          <div className="text-2xl font-black font-mono text-cyan-bright">
            {highRisk > 0 ? `${Math.round((disguisedCount / highRisk) * 100)}%` : '0%'}
          </div>
          <div className="text-[10px] text-slate-300 uppercase font-semibold font-mono">Of Precursors Were Disguised</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Risk Distribution Breakdown */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-cyan-glow/20 shadow-glass space-y-3">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider font-mono">
            PRAHARI Risk Band Distribution
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {riskPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hazard Category Frequency */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-cyan-glow/20 shadow-glass space-y-3">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider font-mono">
            Reports by SIF Hazard Category
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hazardData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} stroke={isDark ? '#334155' : '#cbd5e1'} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: isDark ? '#cbd5e1' : '#334155' }} width={120} stroke={isDark ? '#334155' : '#cbd5e1'} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#2E74B5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Installation Breakdown */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-cyan-glow/20 shadow-glass space-y-3 lg:col-span-2">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider font-mono">
            Risk Profile Across OIL Field Installations
          </h4>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={installData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? '#cbd5e1' : '#334155' }} stroke={isDark ? '#334155' : '#cbd5e1'} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} stroke={isDark ? '#334155' : '#cbd5e1'} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="High" stackId="a" fill="#C0392B" name="High SIF Risk" />
                <Bar dataKey="Medium" stackId="a" fill="#E67E22" name="Medium Risk" />
                <Bar dataKey="Low" stackId="a" fill="#27AE60" name="Low Risk" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
