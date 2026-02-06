
import React from 'react';

interface TimerDisplayProps {
  seconds: number;
  totalSeconds: number;
  label: string;
  isFocus: boolean;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ seconds, totalSeconds, label, isFocus }) => {
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((totalSeconds - seconds) / totalSeconds) * 100;

  return (
    <div className="relative flex flex-col items-center justify-center py-10">
      {/* Tomato Body */}
      <div className={`relative w-[280px] h-[260px] md:w-[400px] md:h-[380px] rounded-[40%] flex items-center justify-center transition-all duration-500 floating ${isFocus ? 'bg-red-500 shadow-[0_15px_0_0_#b91c1c]' : 'bg-green-500 shadow-[0_15px_0_0_#15803d]'}`}>
        
        {/* Stem */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-12 h-12 md:w-20 md:h-20 flex justify-center items-end">
           <div className="w-4 md:w-6 h-10 md:h-14 bg-green-700 rounded-full rotate-12"></div>
           <div className="absolute -bottom-2 w-16 md:w-24 h-4 md:h-6 bg-green-700 rounded-full flex gap-2">
              <div className="w-full h-full bg-green-600 rounded-full scale-90"></div>
           </div>
        </div>

        {/* Progress Ring Overlay */}
        <svg className="absolute w-[300px] h-[280px] md:w-[420px] md:h-[400px] -rotate-90 pointer-events-none">
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="white"
            strokeWidth="8"
            strokeOpacity="0.2"
          />
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="white"
            strokeWidth="8"
            strokeDasharray="100 100"
            className="transition-all duration-1000 ease-linear"
            style={{
                strokeDasharray: '282%', 
                strokeDashoffset: `${282 - (progress / 100) * 282}%`
            }}
          />
        </svg>

        <div className="text-center z-10 space-y-2">
          <span className="text-white/80 uppercase tracking-widest font-bold text-xs md:text-sm bg-black/10 px-4 py-1 rounded-full">
            {label}
          </span>
          <div className="text-6xl md:text-8xl font-black tracking-tight text-white drop-shadow-lg">
            {formatTime(seconds)}
          </div>
        </div>
      </div>
    </div>
  );
};
