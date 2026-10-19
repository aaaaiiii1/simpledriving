/**
 * In-game HUD overlay.
 * Low-occlusion, world-matched warm desert palette, zero backdrop-filter.
 */

import React from 'react';
import type { GameScoreState } from '../game/physics';

interface HUDProps {
  scoreState: GameScoreState;
  speed: number;
  isDrifting: boolean;
  isAirborne: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onResetCar: () => void;
  onTriggerHorn: (active: boolean) => void;
  // Touch inputs for mobile
  onTouchInput?: (forward: number, steer: number, handbrake: boolean) => void;
}

export const HUD: React.FC<HUDProps> = ({
  scoreState,
  speed,
  isDrifting,
  isAirborne,
  isMuted,
  onToggleMute,
  onPause,
  onResetCar,
  onTriggerHorn,
}) => {
  const speedKmh = Math.round(speed * 3.6);

  return (
    <div
      data-testid="game-hud"
      className="absolute inset-0 z-10 pointer-events-none select-none p-4 md:p-6 flex flex-col justify-between"
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between">
        {/* Top-Left: Score, Mayhem, and Combo Cluster */}
        <div className="flex flex-col gap-1.5">
          {/* Score & Multiplier */}
          <div className="flex items-center gap-3 bg-[#1e130c]/85 text-amber-50 px-4 py-2.5 rounded-2xl border border-amber-900/60 shadow-lg pointer-events-auto">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                Mayhem Score
              </span>
              <span className="text-2xl md:text-3xl font-black tabular-nums tracking-tight text-amber-200">
                {scoreState.score.toLocaleString()}
              </span>
            </div>

            {/* Mayhem Multiplier Badge */}
            <div
              className={`px-2.5 py-1 rounded-xl font-black text-sm md:text-base border transition-transform ${
                scoreState.mayhemMultiplier > 1
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white border-amber-300 shadow-md scale-105'
                  : 'bg-stone-800 text-stone-300 border-stone-700'
              }`}
            >
              x{scoreState.mayhemMultiplier}
            </div>
          </div>

          {/* Mayhem Meter Bar */}
          <div className="w-48 md:w-56 h-2 bg-stone-900/90 rounded-full overflow-hidden border border-amber-900/40 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-full transition-all duration-100"
              style={{ width: `${Math.round(scoreState.mayhemMeter * 100)}%` }}
            />
          </div>

          {/* Combo Badge */}
          {scoreState.comboCount > 1 && (
            <div className="animate-bounce inline-flex items-center gap-1.5 self-start bg-red-600/90 text-white font-extrabold text-xs px-3 py-1 rounded-full border border-amber-300 shadow-lg">
              <span>🔥 COMBO x{scoreState.comboCount}</span>
            </div>
          )}
        </div>

        {/* Top-Center Smash Alert Notification */}
        {scoreState.lastSmashTimer > 0 && (
          <div className="self-start mt-2 px-4 py-1.5 rounded-full bg-[#3d1908]/90 border border-orange-500 text-orange-200 font-black text-xs md:text-sm tracking-wide shadow-xl drop-shadow animate-pulse">
            💥 {scoreState.lastSmashText}
          </div>
        )}

        {/* Top-Right: Utility Controls Cluster */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Reset Car Flip Button */}
          <button
            type="button"
            onClick={onResetCar}
            title="Reset Car Flip (R)"
            aria-label="Reset Car Flip"
            className="w-10 h-10 rounded-xl bg-[#26170d]/85 text-amber-200 hover:text-white hover:bg-[#3d2415] border border-amber-900/50 flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-md"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
          </button>

          {/* Mute Toggle */}
          <button
            type="button"
            onClick={onToggleMute}
            title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            className="w-10 h-10 rounded-xl bg-[#26170d]/85 text-amber-200 hover:text-white hover:bg-[#3d2415] border border-amber-900/50 flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-md"
          >
            {isMuted ? (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </button>

          {/* Pause Button */}
          <button
            type="button"
            onClick={onPause}
            title="Pause Game (P / ESC)"
            aria-label="Pause game"
            className="w-10 h-10 rounded-xl bg-[#26170d]/85 text-amber-200 hover:text-white hover:bg-[#3d2415] border border-amber-900/50 flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-md"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom Footer Row */}
      <div className="flex items-end justify-between pointer-events-none mb-14 md:mb-0">
        {/* Bottom-Left: Speedometer & Drift Status */}
        <div className="bg-[#1e130c]/90 text-amber-50 p-2.5 md:p-3.5 rounded-2xl border border-amber-900/60 shadow-lg pointer-events-auto flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest text-amber-400">
              Speed
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl md:text-4xl font-black tabular-nums tracking-tight text-amber-100">
                {speedKmh}
              </span>
              <span className="text-[10px] md:text-xs font-bold text-amber-400">KM/H</span>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-col gap-1">
            {isDrifting && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500 text-amber-950 font-black text-[10px] tracking-wider animate-pulse">
                DRIFTING
              </span>
            )}
            {isAirborne && (
              <span className="px-2 py-0.5 rounded-md bg-cyan-500 text-cyan-950 font-black text-[10px] tracking-wider animate-bounce">
                AIRBORNE
              </span>
            )}
            {!isDrifting && !isAirborne && (
              <span className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-400 font-bold text-[9px] tracking-wider">
                TRACTION
              </span>
            )}
          </div>

          {/* Horn button */}
          <button
            type="button"
            onMouseDown={() => onTriggerHorn(true)}
            onMouseUp={() => onTriggerHorn(false)}
            onTouchStart={() => onTriggerHorn(true)}
            onTouchEnd={() => onTriggerHorn(false)}
            className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-amber-600/80 hover:bg-amber-500 text-white font-bold text-[10px] md:text-xs flex items-center justify-center cursor-pointer active:scale-90 border border-amber-400/40"
            title="Honk Horn (H)"
            aria-label="Honk Horn"
          >
            HORN
          </button>
        </div>

        {/* Bottom-Right: Sandbox Demolition Objectives */}
        <div className="bg-[#1e130c]/85 text-amber-100 p-3.5 rounded-2xl border border-amber-900/60 shadow-lg pointer-events-auto max-w-xs hidden sm:block">
          <div className="text-[10px] uppercase font-bold tracking-widest text-amber-400 mb-1.5 flex items-center justify-between">
            <span>Demolition Log</span>
            <span className="text-[9px] text-amber-300/80">Sandbox</span>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <div className="flex justify-between items-center text-stone-300">
              <span>🌵 Cacti:</span>
              <span className="font-bold tabular-nums text-amber-300">
                {scoreState.cactiSmashed}
              </span>
            </div>
            <div className="flex justify-between items-center text-stone-300">
              <span>📦 Crates:</span>
              <span className="font-bold tabular-nums text-amber-300">
                {scoreState.cratesSmashed}
              </span>
            </div>
            <div className="flex justify-between items-center text-stone-300">
              <span>🪵 Fences:</span>
              <span className="font-bold tabular-nums text-amber-300">
                {scoreState.fencesSmashed}
              </span>
            </div>
            <div className="flex justify-between items-center text-stone-300">
              <span>🫏 Mule Bumps:</span>
              <span className="font-bold tabular-nums text-amber-300">
                {scoreState.donkeysBumped}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
