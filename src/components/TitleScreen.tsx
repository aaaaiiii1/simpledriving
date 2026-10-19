/**
 * Title Screen for Dust & Dunes.
 * Atmospheric title lockup, color picker, and start CTA over live 3D desert pan.
 */

import React from 'react';
import { CAR_COLORS } from '../game/models';

interface TitleScreenProps {
  onStartGame: () => void;
  selectedColorHex: number;
  onSelectColor: (hex: number) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  selectedColorHex,
  onSelectColor,
}) => {
  return (
    <div
      data-testid="title-screen"
      className="absolute inset-0 z-20 flex flex-col items-center justify-between pointer-events-none p-6 select-none"
    >
      {/* Top Banner / Negative Space */}
      <div className="h-6" />

      {/* Center Title Card */}
      <div className="flex flex-col items-center max-w-lg text-center pointer-events-auto bg-[#1c120b]/90 border-2 border-amber-800/70 shadow-2xl rounded-3xl p-6 md:p-8 backdrop-blur-none">
        {/* Bespoke inline SVG Title Emblem */}
        <div className="mb-2">
          <svg
            viewBox="0 0 420 110"
            className="w-72 md:w-88 drop-shadow-md"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Desert Sun */}
            <circle cx="210" cy="50" r="38" fill="#f4a261" fillOpacity="0.4" />
            <path
              d="M130 75 Q 170 55, 210 65 T 290 60 L 290 75 Z"
              fill="#e76f51"
              fillOpacity="0.5"
            />
            {/* Main Title Typography */}
            <text
              x="210"
              y="52"
              textAnchor="middle"
              className="font-black tracking-widest text-3xl uppercase"
              fill="#fff2db"
              stroke="#261c14"
              strokeWidth="5"
              paintOrder="stroke fill"
              style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}
            >
              DUST & DUNES
            </text>
            <text
              x="210"
              y="52"
              textAnchor="middle"
              className="font-black tracking-widest text-3xl uppercase"
              fill="#fff2db"
              style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}
            >
              DUST & DUNES
            </text>
            {/* Sub-label */}
            <text
              x="210"
              y="74"
              textAnchor="middle"
              className="font-bold tracking-widest text-xs uppercase"
              fill="#f4a261"
              letterSpacing="5"
            >
              ISOMETRIC DESERT DRIVER
            </text>
            {/* Speed accent lines */}
            <line x1="85" y1="70" x2="135" y2="70" stroke="#f4a261" strokeWidth="2" />
            <line x1="285" y1="70" x2="335" y2="70" stroke="#f4a261" strokeWidth="2" />
          </svg>
        </div>

        {/* Tagline */}
        <p className="text-amber-200/90 font-medium text-xs md:text-sm mb-5 px-2 leading-relaxed">
          Open sandbox desert driving: accelerate, drift, smash cacti & crates, push gates, and cause mayhem!
        </p>

        {/* Vehicle Paint Selector */}
        <div className="bg-[#120a06]/90 text-amber-100 rounded-2xl p-3.5 mb-5 shadow-inner border border-amber-900/60 w-full">
          <div className="text-[11px] uppercase font-bold tracking-wider text-amber-400 mb-2">
            Select Buggy Color
          </div>
          <div className="flex items-center justify-center gap-2.5">
            {CAR_COLORS.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => onSelectColor(c.hex)}
                title={c.name}
                aria-label={`Select ${c.name} paint`}
                className={`w-8 h-8 rounded-full transition-transform border-2 cursor-pointer ${
                  selectedColorHex === c.hex
                    ? 'scale-125 border-white shadow-md'
                    : 'border-amber-900/60 hover:scale-110'
                }`}
                style={{ backgroundColor: `#${c.hex.toString(16).padStart(6, '0')}` }}
              />
            ))}
          </div>
        </div>

        {/* Start Game CTA */}
        <button
          type="button"
          data-start="true"
          onClick={onStartGame}
          className="cursor-pointer w-full bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-black text-base md:text-lg py-3 rounded-2xl shadow-xl active:scale-95 transition-all border border-amber-300/40 tracking-wider flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          HIT THE GAS (START)
        </button>
      </div>

      {/* Control Hint Line at Bottom */}
      <div className="text-center pointer-events-auto bg-[#1e130c]/70 text-amber-200/90 text-xs px-4 py-2 rounded-full border border-amber-900/40 shadow-md">
        <span className="font-semibold text-amber-300">WASD / Arrow Keys</span> Drive ·{' '}
        <span className="font-semibold text-amber-300">SPACE</span> Drift / Handbrake ·{' '}
        <span className="font-semibold text-amber-300">H</span> Horn ·{' '}
        <span className="font-semibold text-amber-300">R</span> Reset Car ·{' '}
        <span className="font-semibold text-amber-300">P / ESC</span> Pause
      </div>
    </div>
  );
};
