import React from 'react';
import RiskBadge from './RiskBadge';
import { ChevronRight, ShieldAlert } from 'lucide-react';

export default function ReportRow({ report, onSelect }) {
  const isDisguised = report.risk_band === 'High' && report.reporter_severity === 'Low';

  // Neutral status badges with light & dark mode support
  const getStatusBadge = (status) => {
    if (status === 'Escalated') {
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/80 dark:text-red-200 dark:border-red-500/50';
    }
    if (status === 'Reviewed') {
      return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-500/50';
    }
    if (status === 'Closed') {
      return 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
    return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/90 dark:text-slate-200 dark:border-slate-600';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(report);
    }
  };

  return (
    <>
      {/* Desktop / Tablet Row (>= 768px) */}
      <tr
        onClick={() => onSelect(report)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Report ${report.display_id || 'REPORT'}, Risk ${report.risk_band}, Hazard ${report.hazard_category_primary || 'Undetermined'}`}
        className="hidden md:table-row hover:bg-slate-100 dark:hover:bg-cyan-glow/[0.08] transition-colors duration-200 cursor-pointer border-b border-slate-200 dark:border-slate-800/80 group text-xs focus-visible:bg-blue-50 dark:focus-visible:bg-blue-900/40 focus-visible:outline-none"
      >
        {/* Risk Badge (Shape + Label + Color per FR-3.6 / UI-3) */}
        <td className="py-3.5 px-4 whitespace-nowrap">
          <RiskBadge band={report.risk_band} score={report.risk_score} showScore={true} />
        </td>

        {/* Report ID in JetBrains Mono font */}
        <td className="py-3.5 px-3 font-mono font-bold text-accent-blue dark:text-cyan-bright whitespace-nowrap">
          {report.display_id || 'REPORT'}
        </td>

        {/* Hazard Category */}
        <td className="py-3.5 px-3 whitespace-nowrap">
          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {report.hazard_category_primary || 'Undetermined'}
            </span>
            {report.hazard_category_secondary && report.hazard_category_secondary.length > 0 && (
              <span className="text-[10px] text-accent-blue dark:text-cyan-bright bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded font-mono border border-blue-200 dark:border-cyan-glow/30">
                +{report.hazard_category_secondary.length}
              </span>
            )}
          </div>
        </td>

        {/* Description Snippet with Disguised Precursor Tag */}
        <td className="py-3.5 px-3 max-w-xs lg:max-w-md truncate text-slate-600 dark:text-slate-300 font-sans">
          <div className="flex items-center space-x-2">
            {isDisguised && (
              <span 
                className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold text-[10px] rounded border border-amber-300 dark:border-amber-400/50 flex items-center space-x-1 shrink-0 shadow-2xs"
                title="Disguised High-Risk: Logged as Low severity by reporter, AI detected SIF Precursor"
              >
                <ShieldAlert className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>DISGUISED SIF</span>
              </span>
            )}
            <span className="truncate">{report.description}</span>
          </div>
        </td>

        {/* Installation */}
        <td className="py-3.5 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium">
          {report.installation}
        </td>

        {/* Reporter Severity */}
        <td className="py-3.5 px-3 whitespace-nowrap text-slate-800 dark:text-slate-200 font-semibold font-mono">
          {report.reporter_severity || 'Low'}
        </td>

        {/* Status Badge (Neutral tone) */}
        <td className="py-3.5 px-3 whitespace-nowrap">
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(report.status)}`}>
            {report.status}
          </span>
        </td>

        {/* Recency / Date */}
        <td className="py-3.5 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
          {new Date(report.observation_datetime).toLocaleDateString()}
        </td>

        {/* Chevron Affordance */}
        <td className="py-3.5 px-3 text-right whitespace-nowrap text-slate-400 dark:text-slate-500 group-hover:text-accent-blue dark:group-hover:text-cyan-bright transition-colors">
          <ChevronRight className="w-4 h-4 inline-block group-hover:translate-x-1 transition-transform" />
        </td>
      </tr>

      {/* Mobile Stacked Card (< 768px) per UI/UX Section 13 */}
      <tr className="table-row md:hidden border-b border-slate-200 dark:border-slate-800/80">
        <td colSpan={9} className="p-3">
          <div
            onClick={() => onSelect(report)}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
            className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60 shadow-xs space-y-2 cursor-pointer active:scale-[0.99] transition"
          >
            <div className="flex items-center justify-between">
              <RiskBadge band={report.risk_band} score={report.risk_score} showScore={true} size="small" />
              <span className="font-mono text-xs font-bold text-accent-blue dark:text-cyan-bright">
                {report.display_id || 'REPORT'}
              </span>
            </div>

            <div className="text-xs font-bold text-slate-800 dark:text-white">
              {report.hazard_category_primary || 'Undetermined'}
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
              {report.description}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800">
              <span>{report.installation} • {new Date(report.observation_datetime).toLocaleDateString()}</span>
              <span className={`px-2 py-0.5 rounded-full font-semibold border ${getStatusBadge(report.status)}`}>
                {report.status}
              </span>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}
