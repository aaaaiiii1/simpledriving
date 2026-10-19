/**
 * Pause Modal for game suspension, stat inspection, and resuming.
 */

import React from 'react';
import type { GameScoreState } from '../game/physics';

interface PauseModalProps {
  scoreState: GameScoreState;
  onResume: () => void;
  onRestart: () => void;
  onExitTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  scoreState,
  onResume,
  onRestart,
  onExitTitle,
}) => {
  return (
    <div
      data-testid="pause-modal"
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4 select-none"
    >
      <div className="bg-[#24170f] border-2 border-amber-800/80 text-amber-100 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
        <h2 className="text-2xl font-black uppercase tracking-wider text-amber-400 mb-1">
          GAME PAUSED
        </h2>
        <p className="text-xs text-amber-300/70 mb-5">Take a breather in the desert shade</p>

        {/* Current Run Metrics */}
        <div className="grid grid-cols-2 gap-3 w-full mb-6">
          <div className="bg-[#180e08] p-3 rounded-xl border border-amber-950">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">
              Total Score
            </span>
            <span className="text-xl font-black tabular-nums text-amber-100">
              {scoreState.score.toLocaleString()}
            </span>
          </div>

          <div className="bg-[#180e08] p-3 rounded-xl border border-amber-950">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">
              Max Mayhem
            </span>
            <span className="text-xl font-black tabular-nums text-amber-100">
              x{scoreState.mayhemMultiplier}
            </span>
          </div>

          <div className="bg-[#180e08] p-3 rounded-xl border border-amber-950">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">
              Cacti Smashed
            </span>
            <span className="text-xl font-black tabular-nums text-amber-100">
              {scoreState.cactiSmashed}
            </span>
          </div>

          <div className="bg-[#180e08] p-3 rounded-xl border border-amber-950">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">
              Crates Broken
            </span>
            <span className="text-xl font-black tabular-nums text-amber-100">
              {scoreState.cratesSmashed}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-sm tracking-wide shadow-lg cursor-pointer transition-transform active:scale-95 border border-amber-400/40"
          >
            RESUME (ESC / P)
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs tracking-wide cursor-pointer transition-transform active:scale-95 border border-stone-700"
          >
            RESTART SANDBOX
          </button>

          <button
            type="button"
            onClick={onExitTitle}
            className="w-full py-2.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-stone-400 hover:text-stone-200 font-bold text-xs tracking-wide cursor-pointer transition-transform active:scale-95 border border-stone-800"
          >
            BACK TO TITLE
          </button>
        </div>
      </div>
    </div>
  );
};
