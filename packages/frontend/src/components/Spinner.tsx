import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'sm' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`animate-spin rounded-full border-brand-primary/50 border-t-brand-primary ${sizeClasses[size]}`}
      style={{
        filter: 'drop-shadow(0 0 5px rgba(var(--brand-primary-rgb), 0.5))',
      }}
    ></div>
  );
};

export default Spinner;