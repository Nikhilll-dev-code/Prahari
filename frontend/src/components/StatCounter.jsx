import React, { useEffect, useState, useRef } from 'react';

export default function StatCounter({ 
  endValue, 
  duration = 2000, 
  prefix = '', 
  suffix = '', 
  label, 
  sublabel,
  decimals = 0 
}) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const counterRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTime = null;

          const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            // Ease out cubic
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            const current = easeOutProgress * endValue;
            setCount(current);

            if (progress < 1) {
              window.requestAnimationFrame(step);
            } else {
              setCount(endValue);
            }
          };

          window.requestAnimationFrame(step);
        }
      },
      { threshold: 0.2 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => observer.disconnect();
  }, [endValue, duration, hasAnimated]);

  const displayValue = decimals > 0 
    ? count.toFixed(decimals) 
    : Math.floor(count).toLocaleString();

  return (
    <div ref={counterRef} className="text-center p-4 rounded-xl glass-panel border border-slate-200 dark:border-cyan-glow/20 shadow-xs">
      <div className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-slate-900 dark:text-white flex items-center justify-center space-x-1">
        {prefix && <span className="text-accent-blue dark:text-cyan-bright font-sans text-2xl sm:text-3xl">{prefix}</span>}
        <span className="text-primary-navy dark:bg-gradient-to-r dark:from-white dark:via-cyan-bright dark:to-cyan-glow dark:bg-clip-text dark:text-transparent">
          {displayValue}
        </span>
        {suffix && <span className="text-accent-blue dark:text-cyan-bright font-sans text-2xl sm:text-3xl">{suffix}</span>}
      </div>
      <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-2 uppercase tracking-wider font-heading">
        {label}
      </div>
      {sublabel && (
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          {sublabel}
        </div>
      )}
    </div>
  );
}
