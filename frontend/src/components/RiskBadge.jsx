import React from 'react';

export default function RiskBadge({ band, score, size = 'normal', showScore = false }) {
  let glyph = '○';
  let label = 'LOW';
  let colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-300';
  let dotColor = 'text-emerald-600';

  if (band === 'High' || (score !== null && score >= 70)) {
    glyph = '●';
    label = 'HIGH';
    colorClasses = 'bg-red-50 text-red-800 border-red-300';
    dotColor = 'text-red-600';
  } else if (band === 'Medium' || (score !== null && score >= 40 && score < 70)) {
    glyph = '◐';
    label = 'MEDIUM';
    colorClasses = 'bg-amber-50 text-amber-900 border-amber-300';
    dotColor = 'text-amber-600';
  } else if (band === 'Needs Manual Review' || band === 'Pending' || score === null) {
    glyph = '⚙';
    label = 'REVIEW';
    colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';
    dotColor = 'text-slate-500';
  }

  const isSmall = size === 'small';

  return (
    <span
      className={`inline-flex items-center font-mono font-semibold rounded border ${colorClasses} ${
        isSmall ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-xs tracking-wide'
      }`}
      title={score !== null && score !== undefined ? `SIF Precursor Risk Score: ${score}/100` : 'Needs Manual Review'}
    >
      <span className={`mr-1 text-sm ${dotColor}`}>{glyph}</span>
      <span>{label}</span>
      {showScore && score !== null && score !== undefined && (
        <span className="ml-1.5 font-bold opacity-90 border-l border-current pl-1.5">
          {score}
        </span>
      )}
    </span>
  );
}
