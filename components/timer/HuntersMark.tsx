import React from 'react';

interface HuntersMarkProps {
  seconds: number;
  totalSeconds: number;
  label: string;
  isFocus: boolean;
}

export const HuntersMark: React.FC<HuntersMarkProps> = ({ seconds, totalSeconds, label, isFocus }) => {
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((totalSeconds - seconds) / totalSeconds) * 100;
  const strokeColor = isFocus ? '#8b0000' : '#1e3a5e';
  const glowColor = isFocus ? 'rgba(139, 0, 0, 0.5)' : 'rgba(30, 58, 94, 0.5)';

  return (
    <div className="relative flex flex-col items-center justify-center py-10">
      {/* Hunter's Mark Container */}
      <div className="relative w-[280px] h-[280px] md:w-[360px] md:h-[360px] flex items-center justify-center pulse-glow">
        {/* Background circle with dark styling */}
        <svg className="absolute w-full h-full" viewBox="0 0 200 200">
          {/* Outer ring - dark */}
          <circle
            cx="100"
            cy="100"
            r="95"
            fill="none"
            stroke="#374151"
            strokeWidth="1"
            strokeOpacity="0.3"
          />
          {/* Track ring */}
          <circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            stroke="#374151"
            strokeWidth="4"
            strokeOpacity="0.3"
          />
          {/* Progress ring */}
          <circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            stroke={strokeColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 88}`}
            strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
            transform="rotate(-90 100 100)"
            className="transition-all duration-1000 ease-linear"
            style={{
              filter: `drop-shadow(0 0 6px ${glowColor})`
            }}
          />
        </svg>

        {/* Hunter's Mark SVG - simplified rune shape */}
        <svg
          className="absolute w-[120px] h-[120px] md:w-[160px] md:h-[160px] opacity-25"
          viewBox="0 0 100 100"
          fill="none"
          stroke={isFocus ? '#dc143c' : '#6b7280'}
          strokeWidth="1.5"
        >
          {/* Vertical line */}
          <line x1="50" y1="10" x2="50" y2="90" />
          {/* Cross bar */}
          <line x1="30" y1="35" x2="70" y2="35" />
          {/* Lower V shape */}
          <line x1="35" y1="55" x2="50" y2="75" />
          <line x1="65" y1="55" x2="50" y2="75" />
          {/* Upper curves */}
          <path d="M 35 20 Q 50 30 65 20" />
          {/* Circle at top */}
          <circle cx="50" cy="15" r="5" />
        </svg>

        {/* Time display */}
        <div className="text-center z-10 space-y-3">
          <span className={`uppercase tracking-[0.3em] font-bold text-[10px] md:text-xs px-3 py-1 rounded-full ${
            isFocus ? 'text-red-400/80 bg-red-900/30' : 'text-blue-300/80 bg-blue-900/30'
          }`}>
            {label}
          </span>
          <div className="text-5xl md:text-7xl font-black tracking-tight text-zinc-100 font-gothic"
            style={{ textShadow: `0 0 20px ${glowColor}` }}>
            {formatTime(seconds)}
          </div>
        </div>
      </div>
    </div>
  );
};
