import React from 'react';

interface MicroPythonLogoProps {
  className?: string;
  size?: number;
}

/**
 * Official MicroPython Logo (Stylized circuit M badge with terminal dot)
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
      {/* Official dark graphite chip badge */}
      <rect width="28" height="28" rx="5.5" fill="#2B2728" />
      {/* MicroPython stylized M circuit path */}
      <g transform="translate(2, 2)">
        <path
          d="M0 0h11.509v18.737h.982V0H24v24h-5.263V5.263h-.983V24H6.246V5.263l-.983.035V24H0z"
          fill="#FFFFFF"
        />
        {/* Terminal pin indicator */}
        <path
          d="M22.246 19.509h-1.404v2.386h1.404z"
          fill="#E03A3E"
        />
      </g>
    </svg>
  );
};

export default MicroPythonLogo;
