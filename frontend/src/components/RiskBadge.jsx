import React from 'react';

/**
 * RiskBadge component enforcing FR-3.6 / UI-3:
 * Always pairs a shape/glyph + text label + color together. Never relies on color alone.
 * Legible in full color, dark mode, light mode, and grayscale.
 */
export default function RiskBadge({ band, score, size = 'normal', showScore = false }) {
  let glyph = '○';
  let label = 'LOW';
  let colorClasses = 'bg-emerald-50 text-emerald-900 border-emerald-400 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-500/60';
  let dotColor = 'text-emerald-700 dark:text-emerald-400';

  if (band === 'High' || (score !== null && score !== undefined && score >= 70)) {
    glyph = '●';
    label = 'HIGH';
    colorClasses = 'bg-red-50 text-red-900 border-red-400 dark:bg-red-950/80 dark:text-red-200 dark:border-red-500/60';
    dotColor = 'text-red-700 dark:text-red-400';
  } else if (band === 'Medium' || (score !== null && score !== undefined && score >= 40 && score < 70)) {
    glyph = '◐';
    label = 'MEDIUM';
    colorClasses = 'bg-amber-50 text-amber-950 border-amber-400 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-500/60';
    dotColor = 'text-amber-700 dark:text-amber-400';
  } else if (band === 'Needs Manual Review' || band === 'Pending' || score === null) {
    glyph = '⚙';
    label = 'REVIEW';
    colorClasses = 'bg-slate-100 text-slate-800 border-slate-400 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600';
    dotColor = 'text-slate-600 dark:text-slate-400';
  }

  const isSmall = size === 'small';

  const fullDescription = score !== null && score !== undefined 
    ? `Risk level ${label}, SIF Risk Score ${score} out of 100` 
    : `Risk level ${label}, requires manual HSE review`;

  return (
    <span
      className={`inline-flex items-center font-mono font-semibold rounded border shadow-2xs ${colorClasses} ${
        isSmall ? 'px-1.5 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs tracking-wider'
      }`}
      aria-label={fullDescription}
      title={fullDescription}
    >
      <span className={`mr-1.5 font-bold ${dotColor}`} aria-hidden="true">
        {glyph}
      </span>
      <span className="font-bold tracking-tight">{label}</span>
      {showScore && score !== null && score !== undefined && (
        <span className="ml-1.5 font-bold opacity-90 border-l border-current/30 pl-1.5 font-mono">
          {score}
        </span>
      )}
    </span>
  );
}
