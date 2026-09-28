import React from 'react';
import RiskBadge from './RiskBadge';
import { ChevronRight, ShieldAlert, Sparkles } from 'lucide-react';

export default function ReportRow({ report, onSelect }) {
  const isDisguised = report.risk_band === 'High' && report.reporter_severity === 'Low';

  const getStatusBadge = (status) => {
    if (status === 'Escalated') return 'bg-red-100 text-red-800 border-red-200';
    if (status === 'Reviewed') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (status === 'Closed') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <tr
      onClick={() => onSelect(report)}
      className="hover:bg-blue-50/40 transition cursor-pointer border-b border-slate-200 group text-xs"
    >
      {/* Risk Badge (Glyph + Label + Color) */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <RiskBadge band={report.risk_band} score={report.risk_score} showScore={true} />
      </td>

      {/* Report ID */}
      <td className="py-3.5 px-3 font-mono font-bold text-primary-navy whitespace-nowrap">
        {report.display_id || 'REPORT'}
      </td>

      {/* Hazard Category */}
      <td className="py-3.5 px-3 whitespace-nowrap">
        <div className="flex items-center space-x-1.5">
          <span className="font-semibold text-slate-900">{report.hazard_category_primary || 'Undetermined'}</span>
          {report.hazard_category_secondary && report.hazard_category_secondary.length > 0 && (
            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
              +{report.hazard_category_secondary.length}
            </span>
          )}
        </div>
      </td>

      {/* Description Snippet with Disguised Warning Flag */}
      <td className="py-3.5 px-3 max-w-xs md:max-w-md truncate text-slate-700">
        <div className="flex items-center space-x-2">
          {isDisguised && (
            <span 
              className="px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded font-bold text-[10px] border border-amber-300 flex items-center space-x-0.5 shrink-0"
              title="Disguised High-Risk: Logged as Low severity, AI detected SIF Fatality Precursor"
            >
              <ShieldAlert className="w-3 h-3 text-amber-700" />
              <span>DISGUISED</span>
            </span>
          )}
          <span className="truncate">{report.description}</span>
        </div>
      </td>

      {/* Installation */}
      <td className="py-3.5 px-3 whitespace-nowrap text-slate-700 font-medium">
        {report.installation}
      </td>

      {/* Reporter Severity vs SIF Score */}
      <td className="py-3.5 px-3 whitespace-nowrap text-slate-600">
        <span className="font-semibold text-slate-800">{report.reporter_severity || 'Low'}</span>
      </td>

      {/* Status */}
      <td className="py-3.5 px-3 whitespace-nowrap">
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${getStatusBadge(report.status)}`}>
          {report.status}
        </span>
      </td>

      {/* Recency / Date */}
      <td className="py-3.5 px-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
        {new Date(report.observation_datetime).toLocaleDateString()}
      </td>

      {/* Action Chevron */}
      <td className="py-3.5 px-3 text-right whitespace-nowrap text-slate-400 group-hover:text-blue-600">
        <ChevronRight className="w-4 h-4 inline-block group-hover:translate-x-0.5 transition" />
      </td>
    </tr>
  );
}
