import React from 'react';

interface MicroPythonLogoProps {
  className?: string;
  size?: number;
}

/**
 * Official MicroPython Logo (Exact official 24x24 geometric M block mark)
 */
export const MicroPythonLogo: React.FC<MicroPythonLogoProps> = ({ className = 'w-4 h-4', size }) => {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block flex-shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      {/* Official MicroPython high-contrast square badge */}
      <rect x="0.75" y="0.75" width="26.5" height="26.5" rx="4" fill="#222222" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
      <g transform="translate(2, 2)">
        {/* Official MicroPython M geometric blocks */}
        <path
          d="M0 0h11.509v18.737h.982V0H24v24h-5.263V5.263h-.983V24H6.246V5.263l-.983.035V24H0zm22.246 19.509h-1.404v2.386h1.404z"
          fill="#FFFFFF"
        />
      </g>
    </svg>
  );
};

export default MicroPythonLogo;
