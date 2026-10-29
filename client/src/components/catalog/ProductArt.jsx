/**
 * ProductArt - drawn product picture (SVG), so the catalog needs no photo files.
 *
 * The chocolate gets darker as the cacao percentage goes up (40% milk is a warm brown,
 * 100% is almost black), and the wrapper colour stands for the origin. That way the
 * picture itself tells a shopper how dark a bar is at a glance.
 * In Phase 4 a real product photo can replace it without changing the cards.
 *
 * Decorative: the product name and percentage are always written next to it, so the
 * SVG is hidden from screen readers.
 */
import { useId } from 'react';

const ORIGIN_COLORS = {
  Peru: '#8C3B2E',
  Ecuador: '#2F5D50',
  Colombia: '#9A7424',
  Venezuela: '#5B3A6B',
  'Dominican Republic': '#3D5A80',
  Madagascar: '#5E6B2E',
  Ghana: '#A0612A',
  Mexico: '#8E2C4C',
};
const DEFAULT_WRAPPER = '#573923';

// Mixes two hex colours; t = 0 gives a, t = 1 gives b
function mix(a, b, t) {
  const channel = (hex, i) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const value = (i) => Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * t);
  return `#${[0, 1, 2].map((i) => value(i).toString(16).padStart(2, '0')).join('')}`;
}

// 35% cacao -> milky brown, 100% -> near black
export function chocolateShade(cacaoPct) {
  const t = Math.min(1, Math.max(0, (cacaoPct - 35) / 65));
  return mix('#9E6B42', '#22130A', t);
}

function Bar({ shade, wrapper, pct, ribbon }) {
  const cols = 3;
  const rows = 4;
  const x = 62;
  const y = 22;
  const w = 116;
  const h = 140;
  const gap = 6;
  const cw = (w - gap * (cols + 1)) / cols;
  const ch = (h - gap * (rows + 1)) / rows;

  return (
    <g transform="rotate(-7 120 92)">
      {/* shadow */}
      <rect x={x + 5} y={y + 7} width={w} height={h} rx="7" fill="#2A1B11" opacity="0.18" />
      {/* bar body and its squares */}
      <rect x={x} y={y} width={w} height={h} rx="7" fill={shade} />
      {Array.from({ length: cols * rows }, (_, i) => {
        const cx = x + gap + (i % cols) * (cw + gap);
        const cy = y + gap + Math.floor(i / cols) * (ch + gap);
        return (
          <g key={i}>
            <rect x={cx} y={cy} width={cw} height={ch} rx="3" fill={mix(shade, '#000000', 0.18)} />
            <rect x={cx + 2} y={cy + 2} width={cw - 4} height={ch - 4} rx="2" fill={mix(shade, '#FFFFFF', 0.08)} />
          </g>
        );
      })}
      {/* paper wrapper over the lower half */}
      <rect x={x - 6} y={y + 74} width={w + 12} height={h - 66} rx="4" fill={wrapper} />
      <rect x={x - 6} y={y + 74} width={w + 12} height="4" fill="#C59B45" />
      <text
        x={x + 10}
        y={y + 122}
        fill="#F8F1E7"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize="34"
        fontWeight="600"
      >
        {pct}%
      </text>
      {ribbon && (
        <g>
          <rect x={x + w - 26} y={y + 74} width="14" height={h - 66} fill="#C59B45" />
          <circle cx={x + w - 19} cy={y + 96} r="9" fill="#E6CE95" stroke="#A87F2E" strokeWidth="2" />
        </g>
      )}
    </g>
  );
}

function TruffleBox({ shade, wrapper, gradientId }) {
  const positions = [];
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 4; col += 1) positions.push([66 + col * 36, 76 + row * 38]);
  }
  return (
    <g>
      <defs>
        <radialGradient id={gradientId} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor={mix(shade, '#FFFFFF', 0.25)} />
          <stop offset="100%" stopColor={mix(shade, '#000000', 0.25)} />
        </radialGradient>
      </defs>
      <rect x="37" y="43" width="174" height="112" rx="9" fill="#2A1B11" opacity="0.18" />
      <rect x="32" y="36" width="174" height="112" rx="9" fill={wrapper} />
      <rect x="42" y="52" width="154" height="86" rx="5" fill="#3E2819" />
      {positions.map(([cx, cy]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx + 2} cy={cy + 3} r="14" fill="#1A100A" opacity="0.5" />
          <circle cx={cx} cy={cy} r="14" fill={`url(#${gradientId})`} />
          <path
            d={`M${cx - 7} ${cy - 4} q 7 -6 14 0`}
            stroke={mix(shade, '#FFFFFF', 0.45)}
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      ))}
      <rect x="32" y="36" width="174" height="10" rx="4" fill="#C59B45" />
    </g>
  );
}

export default function ProductArt({ product, className = '' }) {
  const gradientId = `truffle-${useId().replace(/:/g, '')}`;
  const shade = chocolateShade(product.cacaoPct);
  const wrapper = ORIGIN_COLORS[product.origin] || DEFAULT_WRAPPER;
  const background = mix(wrapper, '#F8F1E7', 0.86);

  return (
    <svg
      viewBox="0 0 240 184"
      className={className}
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="240" height="184" fill={background} />
      {product.category === 'truffles' ? (
        <TruffleBox shade={shade} wrapper={wrapper} gradientId={gradientId} />
      ) : (
        <Bar shade={shade} wrapper={wrapper} pct={product.cacaoPct} ribbon={product.category === 'seasonal'} />
      )}
    </svg>
  );
}
