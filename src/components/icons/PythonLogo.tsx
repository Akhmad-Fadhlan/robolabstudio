import React from 'react';

interface PythonLogoProps {
  className?: string;
  size?: number;
}

/**
 * Official two-tone Python Programming Language Logo (Blue & Yellow interlocking icon)
 */
export const PythonLogo: React.FC<PythonLogoProps> = ({ className = 'w-4 h-4', size }) => {
  return (
    <svg
      viewBox="0 0 110 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block flex-shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pyBlueGrad" x1="15%" y1="12%" x2="78%" y2="78%">
          <stop offset="0%" stopColor="#387EB8" />
          <stop offset="100%" stopColor="#366994" />
        </linearGradient>
        <linearGradient id="pyYellowGrad" x1="25%" y1="22%" x2="88%" y2="88%">
          <stop offset="0%" stopColor="#FFE052" />
          <stop offset="100%" stopColor="#FFC331" />
        </linearGradient>
      </defs>
      {/* Top / Left Blue Python Half */}
      <path
        d="M54.5 7C39.2 7 40.2 13.6 40.2 13.6L40.22 27.2H54.8V31.3H28.3C28.3 31.3 15.6 29.8 15.6 49.9C15.6 70 26.7 69.3 26.7 69.3H33.3V55.7C33.3 55.7 32.9 44.6 44.2 44.6H63.1C63.1 44.6 73.7 44.8 73.7 34.4V17.1C73.7 17.1 75.3 7 54.5 7ZM44.1 12.9C46 12.9 47.5 14.4 47.5 16.3C47.5 18.2 46 19.7 44.1 19.7C42.2 19.7 40.7 18.2 40.7 16.3C40.7 14.4 42.2 12.9 44.1 12.9Z"
        fill="url(#pyBlueGrad)"
      />
      {/* Bottom / Right Yellow Python Half */}
      <path
        d="M55.5 103C70.8 103 69.8 96.4 69.8 96.4L69.78 82.8H55.2V78.7H81.7C81.7 78.7 94.4 80.2 94.4 60.1C94.4 40 83.3 40.7 83.3 40.7H76.7V54.3C76.7 54.3 77.1 65.4 65.8 65.4H46.9C46.9 65.4 36.3 65.2 36.3 75.6V92.9C36.3 92.9 34.7 103 55.5 103ZM65.9 97.1C64 97.1 62.5 95.6 62.5 93.7C62.5 91.8 64 90.3 65.9 90.3C67.8 90.3 69.3 91.8 69.3 93.7C69.3 95.6 67.8 97.1 65.9 97.1Z"
        fill="url(#pyYellowGrad)"
      />
    </svg>
  );
};

export default PythonLogo;
