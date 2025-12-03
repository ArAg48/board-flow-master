import React from 'react';

interface EyeWithLashesProps {
  className?: string;
  size?: number;
}

const EyeWithLashes: React.FC<EyeWithLashesProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Top eyelashes */}
      <line x1="4" y1="6" x2="5" y2="8" />
      <line x1="7" y1="4" x2="7.5" y2="6.5" />
      <line x1="10" y1="3" x2="10.5" y2="5.5" />
      <line x1="12" y1="2.5" x2="12" y2="5" />
      <line x1="14" y1="3" x2="13.5" y2="5.5" />
      <line x1="17" y1="4" x2="16.5" y2="6.5" />
      <line x1="20" y1="6" x2="19" y2="8" />
      
      {/* Eye shape */}
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      
      {/* Pupil */}
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
};

export default EyeWithLashes;
