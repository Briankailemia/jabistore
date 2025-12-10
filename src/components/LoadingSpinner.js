'use client';

import { memo } from 'react';

const LoadingSpinner = memo(function LoadingSpinner({
  size = 'md',
  color = 'sky',
  text = 'Loading...',
  className = '',
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    sky: 'border-brand-sky',
    indigo: 'border-brand-indigo',
    slate: 'border-slate-600',
    white: 'border-white'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`} role="status" aria-live="polite">
      <div
        className={`
          ${sizeClasses[size] || sizeClasses.md} 
          ${colorClasses[color] || colorClasses.sky} 
          border-2 border-t-transparent rounded-full animate-spin
        `}
      />
      {text && (
        <p className="mt-2 text-sm text-slate-400 animate-pulse">{text}</p>
      )}
    </div>
  );
});

export { LoadingSpinner };
export default LoadingSpinner;
