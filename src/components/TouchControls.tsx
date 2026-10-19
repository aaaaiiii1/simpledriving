/**
 * On-screen touch controls for mobile driving.
 * Appears on touch devices or small screens.
 */

import React from 'react';

interface TouchControlsProps {
  onForwardChange: (val: number) => void;
  onSteerChange: (val: number) => void;
  onHandbrakeChange: (val: boolean) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onForwardChange,
  onSteerChange,
  onHandbrakeChange,
}) => {
  return (
    <div className="absolute inset-0 z-15 pointer-events-none md:hidden flex justify-between items-end p-4 pb-6 select-none">
      {/* Steering (Left / Right) */}
      <div className="flex gap-2 pointer-events-auto">
        <button
          type="button"
          onTouchStart={() => onSteerChange(-1)}
          onTouchEnd={() => onSteerChange(0)}
          onMouseDown={() => onSteerChange(-1)}
          onMouseUp={() => onSteerChange(0)}
          aria-label="Steer Left"
          className="w-14 h-14 rounded-2xl bg-[#1e130c]/80 border-2 border-amber-600/70 text-amber-200 font-black text-xl flex items-center justify-center active:bg-amber-600 active:text-white"
        >
          ◀
        </button>
        <button
          type="button"
          onTouchStart={() => onSteerChange(1)}
          onTouchEnd={() => onSteerChange(0)}
          onMouseDown={() => onSteerChange(1)}
          onMouseUp={() => onSteerChange(0)}
          aria-label="Steer Right"
          className="w-14 h-14 rounded-2xl bg-[#1e130c]/80 border-2 border-amber-600/70 text-amber-200 font-black text-xl flex items-center justify-center active:bg-amber-600 active:text-white"
        >
          ▶
        </button>
      </div>

      {/* Throttle, Reverse & Drift (Handbrake) */}
      <div className="flex flex-col gap-2 items-end pointer-events-auto">
        <button
          type="button"
          onTouchStart={() => onHandbrakeChange(true)}
          onTouchEnd={() => onHandbrakeChange(false)}
          onMouseDown={() => onHandbrakeChange(true)}
          onMouseUp={() => onHandbrakeChange(false)}
          aria-label="Handbrake / Drift"
          className="w-16 h-10 rounded-xl bg-orange-700/80 border-2 border-orange-500 text-white font-extrabold text-xs flex items-center justify-center active:bg-orange-500"
        >
          DRIFT
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onTouchStart={() => onForwardChange(-1)}
            onTouchEnd={() => onForwardChange(0)}
            onMouseDown={() => onForwardChange(-1)}
            onMouseUp={() => onForwardChange(0)}
            aria-label="Reverse / Brake"
            className="w-14 h-14 rounded-2xl bg-red-950/80 border-2 border-red-600/70 text-red-200 font-black text-sm flex items-center justify-center active:bg-red-600 active:text-white"
          >
            REV
          </button>
          <button
            type="button"
            onTouchStart={() => onForwardChange(1)}
            onTouchEnd={() => onForwardChange(0)}
            onMouseDown={() => onForwardChange(1)}
            onMouseUp={() => onForwardChange(0)}
            aria-label="Accelerate"
            className="w-14 h-14 rounded-2xl bg-amber-700/80 border-2 border-amber-400 text-white font-black text-sm flex items-center justify-center active:bg-amber-500"
          >
            GAS
          </button>
        </div>
      </div>
    </div>
  );
};
