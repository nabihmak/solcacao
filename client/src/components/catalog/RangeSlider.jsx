/**
 * RangeSlider - a two-handle slider for a min-max range (cacao %, price).
 *
 * Built from two native <input type="range"> elements laid on top of each other, so it
 * works with the keyboard (arrows, Page Up/Down, Home/End) and screen readers out of
 * the box. Each handle has its own label and spoken value (aria-valuetext).
 *
 * The handles move instantly, but onChange is called only after the user pauses
 * (COMMIT_DELAY_MS), so dragging does not send a request for every pixel.
 */
import { useEffect, useState } from 'react';

const COMMIT_DELAY_MS = 300;

// Thumb styles for Chrome/Safari/Edge and Firefox. Only the thumbs take clicks,
// so the two stacked inputs do not block each other.
const THUMB = [
  'pointer-events-none absolute inset-x-0 top-1/2 h-6 w-full -translate-y-1/2 appearance-none bg-transparent',
  '[&::-webkit-slider-runnable-track]:bg-transparent [&::-moz-range-track]:bg-transparent',
  '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5',
  '[&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
  '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-solid [&::-webkit-slider-thumb]:border-cocoa-900 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow',
  '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4',
  '[&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full',
  '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-solid [&::-moz-range-thumb]:border-cocoa-900 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow',
  // Visible keyboard focus on the handle itself (WCAG 2.4.7)
  '[&:focus-visible::-webkit-slider-thumb]:outline [&:focus-visible::-webkit-slider-thumb]:outline-[3px]',
  '[&:focus-visible::-webkit-slider-thumb]:outline-offset-2 [&:focus-visible::-webkit-slider-thumb]:outline-gold-600',
  '[&:focus-visible::-moz-range-thumb]:outline [&:focus-visible::-moz-range-thumb]:outline-[3px]',
  '[&:focus-visible::-moz-range-thumb]:outline-offset-2 [&:focus-visible::-moz-range-thumb]:outline-gold-600',
].join(' ');

export default function RangeSlider({ legend, min, max, step = 1, value, onChange, format = String, minLabel, maxLabel }) {
  const [low, high] = value;
  const [local, setLocal] = useState([low, high]);

  // Follow outside changes, e.g. "Clear all filters"
  useEffect(() => {
    setLocal([low, high]);
  }, [low, high]);

  // Send the new range once the user stops moving a handle
  useEffect(() => {
    if (local[0] === low && local[1] === high) return undefined;
    const timer = setTimeout(() => onChange(local), COMMIT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [local, low, high, onChange]);

  const span = max - min || 1;
  const left = ((local[0] - min) / span) * 100;
  const right = ((local[1] - min) / span) * 100;

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-cocoa-900">{legend}</legend>
      <div className="mt-2 flex justify-between text-sm text-cocoa-700" aria-hidden="true">
        <span>{format(local[0])}</span>
        <span>{format(local[1])}</span>
      </div>
      <div className="relative mt-1 h-8">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-cocoa-200" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-cocoa-800"
          style={{ left: `${left}%`, width: `${Math.max(0, right - left)}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={local[0]}
          aria-label={minLabel}
          aria-valuetext={format(local[0])}
          onChange={(event) => setLocal(([, hi]) => [Math.min(Number(event.target.value), hi), hi])}
          // When both handles meet at the top end, keep the low handle reachable
          className={`${THUMB} ${local[0] >= max - step ? 'z-20' : 'z-10'}`}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={local[1]}
          aria-label={maxLabel}
          aria-valuetext={format(local[1])}
          onChange={(event) => setLocal(([lo]) => [lo, Math.max(Number(event.target.value), lo)])}
          className={`${THUMB} z-10`}
        />
      </div>
    </fieldset>
  );
}
