import React from 'react';

/**
 * Cartoon fluffy clouds floating along the bottom edge of the screen
 */
export const CloudFooter: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 sm:h-24 md:h-28 pointer-events-none z-[2] overflow-hidden select-none">
      <svg 
        viewBox="0 0 1440 120" 
        preserveAspectRatio="none" 
        className="w-full h-full"
      >
        {/* Back cloud layer with soft blue tint */}
        <path
          d="M0,70 
             C100,50 180,75 280,60 
             C360,48 440,65 520,50 
             C620,35 700,55 800,45 
             C900,35 980,55 1080,40 
             C1180,25 1260,50 1360,35 
             C1410,28 1430,32 1440,35 
             L1440,120 L0,120 Z"
          fill="rgba(255, 255, 255, 0.65)"
        />
        {/* Front puffy cloud layer */}
        <path
          d="M0,85 
             C60,70 120,68 180,78 
             C240,88 300,65 370,68 
             C440,70 510,55 580,62 
             C660,70 730,50 820,58 
             C900,65 970,48 1060,54 
             C1150,60 1220,45 1310,56 
             C1380,65 1420,52 1440,55 
             L1440,120 L0,120 Z"
          fill="#ffffff"
        />
      </svg>
    </div>
  );
};

/**
 * Floating cute stars and sparkles scattered across the background
 */
export const TwinklingStars: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden select-none">
      {/* Star 1 - Top Left */}
      <div className="absolute top-16 left-12 text-amber-300 text-lg animate-pulse" style={{ animationDuration: '3s' }}>
        ✦
      </div>
      {/* Star 2 - Top Center-Left */}
      <div className="absolute top-28 left-[28%] text-white text-xl opacity-90 animate-bounce" style={{ animationDuration: '4s' }}>
        ⭐
      </div>
      {/* Star 3 - Top Center-Right */}
      <div className="absolute top-20 right-[35%] text-sky-200 text-sm opacity-80 animate-pulse" style={{ animationDuration: '2.5s' }}>
        ✦
      </div>
      {/* Star 4 - Mid Right */}
      <div className="absolute top-36 right-16 text-amber-300 text-xl animate-pulse" style={{ animationDuration: '3.5s' }}>
        ⭐
      </div>
      {/* Star 5 - Mid Left */}
      <div className="absolute top-64 left-6 text-white text-base opacity-75">
        ✧
      </div>
      {/* Star 6 - Bottom Left near mascot */}
      <div className="absolute bottom-28 left-[18%] text-amber-200 text-sm opacity-85 animate-pulse" style={{ animationDuration: '2s' }}>
        ✦
      </div>
      {/* Star 7 - Bottom Right near rocket */}
      <div className="absolute bottom-32 right-[25%] text-white text-lg opacity-90 animate-bounce" style={{ animationDuration: '3s' }}>
        ⭐
      </div>
    </div>
  );
};

/**
 * Cute friendly mascot robot waving hello at bottom-left
 */
export const MascotRobot: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div 
      className={`fixed bottom-2 left-3 sm:left-6 z-20 pointer-events-none select-none flex items-end gap-1.5 transition-transform hover:scale-105 duration-300 ${className}`}
      title="Halo! Aku RoboBuddy!"
    >
      <svg width="72" height="78" viewBox="0 0 80 88" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
        {/* Antenna */}
        <line x1="40" y1="18" x2="40" y2="6" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
        <circle cx="40" cy="5" r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
        <circle cx="40" cy="5" r="2" fill="#fef08a" />

        {/* Ears / Side Bolts */}
        <rect x="14" y="27" width="4" height="12" rx="2" fill="#0284c7" />
        <rect x="62" y="27" width="4" height="12" rx="2" fill="#0284c7" />

        {/* Head */}
        <rect x="17" y="16" width="46" height="34" rx="10" fill="#ffffff" stroke="#0284c7" strokeWidth="2.5" />
        
        {/* Face Screen */}
        <rect x="23" y="22" width="34" height="22" rx="6" fill="#0f172a" />
        
        {/* Smiling Eyes */}
        <path d="M28 32 C30 28, 34 28, 36 32" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M44 32 C46 28, 50 28, 52 32" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        
        {/* Cheeks */}
        <circle cx="27" cy="38" r="2" fill="#f43f5e" opacity="0.8" />
        <circle cx="53" cy="38" r="2" fill="#f43f5e" opacity="0.8" />

        {/* Smile mouth */}
        <path d="M36 37 Q40 40 44 37" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Neck */}
        <rect x="36" y="50" width="8" height="4" rx="1" fill="#94a3b8" />

        {/* Body */}
        <rect x="22" y="54" width="36" height="28" rx="8" fill="#ffffff" stroke="#0284c7" strokeWidth="2.5" />
        {/* Chest screen / heart */}
        <rect x="28" y="60" width="24" height="15" rx="4" fill="#f0f9ff" stroke="#bae6fd" strokeWidth="1" />
        <path d="M38 65 L40 68 L44 63" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* Left Arm (Waving!) */}
        <g className="animate-pulse" style={{ transformOrigin: '20px 58px', animationDuration: '1.5s' }}>
          <path d="M22 58 C14 54, 8 46, 10 38" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" fill="none" />
          <circle cx="10" cy="36" r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
        </g>

        {/* Right Arm */}
        <path d="M58 58 C64 62, 68 68, 66 74" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" fill="none" />
        <circle cx="66" cy="74" r="3.5" fill="#0284c7" />

        {/* Little Legs */}
        <rect x="29" y="81" width="7" height="6" rx="2" fill="#0284c7" />
        <rect x="44" y="81" width="7" height="6" rx="2" fill="#0284c7" />
      </svg>
    </div>
  );
};

/**
 * Cute 3D cartoon rocket launching with pill banner at bottom-right
 * "Let's Build Something Amazing! ⭐"
 */
export const RocketBanner: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div 
      className={`fixed bottom-3 right-3 sm:right-6 z-20 pointer-events-none select-none flex items-center gap-2 transition-transform hover:scale-105 duration-300 ${className}`}
    >
      {/* Banner Pill */}
      <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 text-white font-extrabold text-xs shadow-lg shadow-sky-500/25 border-2 border-white/80 tracking-wide">
        <span>🚀 Let's Build Something Amazing!</span>
        <span className="text-yellow-300 text-sm animate-spin" style={{ animationDuration: '6s' }}>⭐</span>
      </div>

      {/* 3D Cartoon Rocket */}
      <div className="relative w-12 h-14 sm:w-14 sm:h-16 flex-shrink-0 animate-bounce" style={{ animationDuration: '2.5s' }}>
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl">
          {/* Rocket Fire Exhaust */}
          <path d="M26 48 Q32 62 32 64 Q32 62 38 48 Z" fill="#f97316" />
          <path d="M28 48 Q32 58 32 60 Q32 58 36 48 Z" fill="#fde047" />
          
          {/* Rocket Wings */}
          <path d="M16 46 C16 38 22 36 22 36 L22 48 L16 46 Z" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
          <path d="M48 46 C48 38 42 36 42 36 L42 48 L48 46 Z" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />

          {/* Rocket Main Body */}
          <path 
            d="M32 6 
               C42 16, 44 32, 42 48 
               L22 48 
               C20 32, 22 16, 32 6 Z" 
            fill="#ffffff" 
            stroke="#0284c7" 
            strokeWidth="2" 
          />

          {/* Red Nose Cone Tip */}
          <path 
            d="M32 6 
               C36 10, 38 15, 39 19 
               L25 19 
               C26 15, 28 10, 32 6 Z" 
            fill="#ef4444" 
          />

          {/* Porthole Window */}
          <circle cx="32" cy="28" r="6" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="32" cy="28" r="4.5" fill="#38bdf8" />
          <circle cx="30.5" cy="26.5" r="1.5" fill="#ffffff" />

          {/* Body Stripes */}
          <path d="M23 40 L41 40" stroke="#0284c7" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
};
