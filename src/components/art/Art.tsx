'use client';
/**
 * 자체 제작 SVG 일러스트 — 실제 사진이 준비되기 전까지 사용하는 샘플 자산.
 * 실제 매장·고양이 사진으로 오인되지 않도록 사용처에서 '샘플 일러스트' 표시를 함께 한다.
 */
import { useId } from 'react';
import type { ArtSpec, CatCoat } from '@/lib/types';

const BG: [string, string][] = [
  ['#EAF7F4', '#CFEDE4'],
  ['#FFF4E3', '#FBE2BE'],
  ['#EAF4FB', '#D2E8F6'],
  ['#FCEFEA', '#F6D9CF'],
  ['#F2EFFA', '#E1DAF2'],
];

const COATS: Record<CatCoat, { base: string; stripe: string; light: string }> = {
  orange: { base: '#E9A15B', stripe: '#C9792F', light: '#FCE7CC' },
  gray: { base: '#A6AFB8', stripe: '#7D8892', light: '#ECEFF1' },
  black: { base: '#3A3A41', stripe: '#26262B', light: '#F5F2ED' },
  white: { base: '#F7F4EF', stripe: '#E4DED5', light: '#FFFFFF' },
  cream: { base: '#F1E1C6', stripe: '#D8BD93', light: '#FCF6EC' },
  brown: { base: '#A97C58', stripe: '#6C4A32', light: '#EBD9C6' },
};
const EYES = { amber: '#E3A72F', green: '#7FB55B', blue: '#6FA8DC', copper: '#C9772F' };

export function Art({ spec, className, title }: { spec: ArtSpec; className?: string; title?: string }) {
  const id = useId().replace(/:/g, '');
  const bgIdx = spec.kind === 'cat' ? spec.bg : spec.variant;
  const [b0, b1] = BG[bgIdx % BG.length];
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className={className} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id={`bg${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={b0} />
          <stop offset="1" stopColor={b1} />
        </linearGradient>
        <radialGradient id={`glow${id}`} cx=".3" cy=".25" r=".7">
          <stop offset="0" stopColor="#fff" stopOpacity=".75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#bg${id})`} />
      <rect width="400" height="300" fill={`url(#glow${id})`} />
      {spec.kind === 'salad' && <Salad v={spec.variant} />}
      {spec.kind === 'lunchbox' && <Lunchbox v={spec.variant} />}
      {spec.kind === 'drink' && <Drink v={spec.variant} id={id} />}
      {spec.kind === 'pie' && <Pie />}
      {spec.kind === 'snack' && <Snack v={spec.variant} />}
      {spec.kind === 'space' && <Space v={spec.variant} id={id} />}
      {spec.kind === 'cat' && <Cat spec={spec} id={id} />}
    </svg>
  );
}

/* ── Food ─────────────────────────────────────────── */
const GREENS = ['#7CC46F', '#57A35A', '#9AD283', '#3F8447', '#B5DE8E'];

function Leaves({ cx, cy, r, n = 18 }: { cx: number; cy: number; r: number; n?: number }) {
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * Math.PI * 2 + (i % 3) * 0.3;
        const d = r * (0.25 + ((i * 37) % 60) / 100);
        const x = cx + Math.cos(a) * d;
        const y = cy + Math.sin(a) * d * 0.92;
        return <ellipse key={i} cx={x} cy={y} rx={30 - (i % 4) * 3} ry={14 - (i % 3) * 2} fill={GREENS[i % GREENS.length]} transform={`rotate(${(a * 180) / Math.PI + 30} ${x} ${y})`} opacity={0.96} />;
      })}
    </g>
  );
}

function Plate({ children }: { children: React.ReactNode }) {
  return (
    <g>
      <ellipse cx="206" cy="162" rx="128" ry="122" fill="#0E2A33" opacity=".08" />
      <circle cx="200" cy="150" r="126" fill="#FFFFFF" />
      <circle cx="200" cy="150" r="104" fill="#F6F2EA" />
      {children}
    </g>
  );
}

function Salad({ v }: { v: number }) {
  return (
    <Plate>
      <Leaves cx={200} cy={150} r={86} n={20} />
      {v === 0 && (
        <g>
          {[[-30, -18, -20], [10, -30, 15], [35, 8, -10], [-12, 22, 25]].map(([x, y, r], i) => (
            <g key={i} transform={`translate(${200 + x} ${150 + y}) rotate(${r})`}>
              <rect x="-26" y="-11" width="52" height="22" rx="10" fill="#EBCB9E" />
              <path d="M-18 -6 L-10 6 M-4 -7 L4 7 M10 -6 L18 6" stroke="#C4915A" strokeWidth="3" strokeLinecap="round" />
            </g>
          ))}
          {[[-62, -8], [58, -40], [62, 44], [-40, 54], [0, 64]].map(([x, y], i) => (
            <g key={i}>
              <circle cx={200 + x} cy={150 + y} r="13" fill="#E8503F" />
              <circle cx={196 + x} cy={146 + y} r="4" fill="#fff" opacity=".55" />
            </g>
          ))}
          {Array.from({ length: 14 }).map((_, i) => (
            <circle key={i} cx={150 + ((i * 47) % 100)} cy={95 + ((i * 29) % 110)} r="4.5" fill="#F4CB45" />
          ))}
        </g>
      )}
      {v === 1 && (
        <g>
          <path d="M200 150 L200 52 A98 98 0 0 1 290 190 Z" fill="#FBF7EE" />
          {Array.from({ length: 26 }).map((_, i) => (
            <ellipse key={i} cx={212 + ((i * 23) % 70)} cy={78 + ((i * 31) % 90)} rx="4" ry="2.5" fill="#E9E1CF" />
          ))}
          {[[-40, -30], [-58, 6], [-30, 20], [-14, -8], [-50, 40]].map(([x, y], i) => (
            <rect key={i} x={200 + x - 13} y={150 + y - 13} width="26" height="26" rx="6" fill={i % 2 ? '#F49A74' : '#F08560'} transform={`rotate(${i * 17} ${200 + x} ${150 + y})`} />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${120 + i * 14} ${200 - i * 6} q 20 -30 44 -26`} stroke="#9DBF4E" strokeWidth="12" fill="none" strokeLinecap="round" />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <circle key={i} cx={236 + (i % 4) * 14} cy={200 + Math.floor(i / 4) * 14} r="6.5" fill="#86C26A" />
          ))}
        </g>
      )}
      {v === 2 && (
        <g>
          {[[-40, -30], [40, -36], [20, 40], [-46, 34], [60, 10]].map(([x, y], i) => (
            <g key={i} transform={`translate(${200 + x} ${150 + y}) rotate(${i * 30})`}>
              <path d="M0 -16 C 14 -16 18 0 0 18 C -18 0 -14 -16 0 -16 Z" fill="#E5484D" />
              <path d="M-8 -16 L0 -22 L8 -16" stroke="#4E9A53" strokeWidth="4" fill="none" />
            </g>
          ))}
          {[[0, -10], [-14, 12], [30, 6]].map(([x, y], i) => (
            <path key={i} d={`M${200 + x - 18} ${150 + y} q 18 -22 36 0 q -18 10 -36 0 Z`} fill="#FBF8F1" stroke="#EDE6D6" />
          ))}
          {Array.from({ length: 12 }).map((_, i) => (
            <circle key={i} cx={140 + ((i * 41) % 120)} cy={92 + ((i * 53) % 116)} r="6" fill="#4C5FA8" />
          ))}
          {[[-70, -4], [70, -50]].map(([x, y], i) => (
            <path key={i} d={`M${200 + x} ${150 + y} a 22 22 0 0 1 40 0 Z`} fill="#F7A43C" />
          ))}
        </g>
      )}
    </Plate>
  );
}

function Lunchbox({ v }: { v: number }) {
  return (
    <g>
      <rect x="66" y="58" width="276" height="198" rx="26" fill="#0E2A33" opacity=".08" />
      <rect x="60" y="48" width="280" height="200" rx="26" fill="#FFFFFF" />
      <rect x="74" y="62" width="128" height="172" rx="16" fill="#F8F4EB" />
      <rect x="212" y="62" width="114" height="80" rx="16" fill="#F8F4EB" />
      <rect x="212" y="152" width="114" height="82" rx="16" fill="#F8F4EB" />
      {Array.from({ length: 70 }).map((_, i) => (
        <ellipse key={i} cx={84 + ((i * 17) % 110)} cy={72 + ((i * 23) % 150)} rx="5" ry="3" fill={v === 1 ? '#E8DCC2' : '#F3EEE2'} stroke="#E4DCCB" strokeWidth=".8" transform={`rotate(${i * 25} ${84 + ((i * 17) % 110)} ${72 + ((i * 23) % 150)})`} />
      ))}
      {v === 0 ? (
        [0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${236 + i * 30} ${100}) rotate(${-20 + i * 8})`}>
            <rect x="-14" y="-24" width="26" height="48" rx="10" fill="#E9C79A" />
            <path d="M-8 -14 L6 -4 M-8 2 L6 12" stroke="#C69259" strokeWidth="3" strokeLinecap="round" />
          </g>
        ))
      ) : (
        [0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${236 + i * 30} ${102}) rotate(${10 - i * 8})`}>
            <ellipse cx="0" cy="0" rx="14" ry="26" fill="#8C5A8E" />
            <ellipse cx="0" cy="0" rx="10" ry="21" fill="#F2B45C" />
          </g>
        ))
      )}
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${234 + (i % 2) * 44} ${176 + Math.floor(i / 2) * 34})`}>
          <rect x="-3" y="2" width="6" height="14" rx="3" fill="#6FAA58" />
          <circle cx="-8" cy="-2" r="9" fill="#4F8F45" />
          <circle cx="8" cy="-2" r="9" fill="#5FA052" />
          <circle cx="0" cy="-10" r="10" fill="#6BB05C" />
        </g>
      ))}
    </g>
  );
}

function Drink({ v, id }: { v: number; id: string }) {
  const liq = [
    ['#7A4E2E', '#C99A6A'],
    ['#F4D75E', '#FFF3B8'],
    ['#B98B62', '#E7D2B8'],
  ][v % 3];
  return (
    <g>
      <defs>
        <linearGradient id={`liq${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={liq[1]} />
          <stop offset="1" stopColor={liq[0]} />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="268" rx="86" ry="14" fill="#0E2A33" opacity=".1" />
      <rect x="248" y="18" width="10" height="150" rx="5" fill={v === 1 ? '#5FBFD6' : '#EE7A55'} transform="rotate(14 253 90)" />
      <path d="M138 70 L262 70 L248 262 Q200 274 152 262 Z" fill="#FFFFFF" opacity=".55" stroke="#fff" strokeWidth="3" />
      <path d="M146 112 L254 112 L246 256 Q200 266 154 256 Z" fill={`url(#liq${id})`} />
      {v !== 2 &&
        [[170, 120], [210, 130], [188, 150]].map(([x, y], i) => <rect key={i} x={x} y={y} width="30" height="28" rx="7" fill="#fff" opacity=".55" transform={`rotate(${i * 18} ${x + 15} ${y + 14})`} />)}
      {v === 1 && (
        <g transform="translate(150 96)">
          <circle r="26" fill="#F7E06A" stroke="#F0C93A" strokeWidth="4" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path key={i} d={`M0 0 L${Math.cos((i * Math.PI) / 3) * 20} ${Math.sin((i * Math.PI) / 3) * 20}`} stroke="#FFF6C6" strokeWidth="3" />
          ))}
        </g>
      )}
      {v === 2 && <ellipse cx="200" cy="114" rx="52" ry="9" fill="#F7EEE2" />}
      <path d="M160 80 L168 240" stroke="#fff" strokeWidth="8" strokeLinecap="round" opacity=".5" />
    </g>
  );
}

function Pie() {
  return (
    <g>
      <ellipse cx="204" cy="236" rx="150" ry="40" fill="#0E2A33" opacity=".08" />
      <ellipse cx="200" cy="228" rx="150" ry="40" fill="#FFFFFF" />
      <ellipse cx="200" cy="226" rx="122" ry="30" fill="#F6F2EA" />
      <g transform="translate(0 -6)">
        <path d="M110 120 L290 120 L300 222 Q200 236 100 222 Z" fill="#D99A45" />
        {Array.from({ length: 22 }).map((_, i) => (
          <path key={i} d={`M${108 - i * 0.4} ${126 + i * 4.4} Q200 ${130 + i * 4.4 + (i % 2 ? 3 : -2)} ${292 + i * 0.4} ${126 + i * 4.4}`} stroke={i % 2 ? '#F3C978' : '#C4802F'} strokeWidth="1.6" fill="none" opacity=".9" />
        ))}
        <path d="M108 120 Q200 92 292 120 Q200 138 108 120 Z" fill="#F0B95E" />
        <path d="M126 116 Q200 98 274 116" stroke="#FBE2A4" strokeWidth="6" fill="none" strokeLinecap="round" opacity=".8" />
        {Array.from({ length: 16 }).map((_, i) => (
          <circle key={i} cx={130 + ((i * 29) % 140)} cy={110 + ((i * 7) % 14)} r="2.4" fill="#FFF7E0" />
        ))}
      </g>
    </g>
  );
}

function Snack({ v }: { v: number }) {
  if (v === 0)
    return (
      <g>
        <ellipse cx="204" cy="252" rx="110" ry="18" fill="#0E2A33" opacity=".08" />
        <path d="M92 130 Q200 120 308 130 Q300 248 200 252 Q100 248 92 130 Z" fill="#FFFFFF" />
        <ellipse cx="200" cy="130" rx="108" ry="30" fill="#FBFAF6" />
        <ellipse cx="200" cy="130" rx="94" ry="22" fill="#F4F1EA" />
        {Array.from({ length: 30 }).map((_, i) => (
          <circle key={i} cx={130 + ((i * 19) % 140)} cy={118 + ((i * 7) % 24)} r={3 + (i % 3)} fill={i % 2 ? '#D3A15E' : '#B98446'} />
        ))}
        {[[160, 122], [232, 126], [204, 116]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="10" fill={i === 1 ? '#E5484D' : '#4C5FA8'} />
        ))}
      </g>
    );
  return (
    <g>
      {[[140, 150, -12], [250, 130, 10], [210, 210, -4]].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
          <ellipse cx="4" cy="8" rx="48" ry="44" fill="#0E2A33" opacity=".07" />
          <path d="M-36 -20 L-30 -56 L-8 -36 Q0 -38 8 -36 L30 -56 L36 -20 Q46 20 0 40 Q-46 20 -36 -20 Z" fill="#E7B672" />
          <path d="M-30 -20 L-26 -46 L-10 -32 Q0 -34 10 -32 L26 -46 L30 -20 Q38 14 0 32 Q-38 14 -30 -20 Z" fill="#F2CB8C" />
          <circle cx="-12" cy="-4" r="4" fill="#5B3B26" />
          <circle cx="12" cy="-4" r="4" fill="#5B3B26" />
          <path d="M-4 6 L0 10 L4 6" stroke="#5B3B26" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
}

function Space({ v, id }: { v: number; id: string }) {
  return (
    <g>
      <defs>
        <linearGradient id={`win${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#CFEAF7" />
          <stop offset="1" stopColor="#F2FAFD" />
        </linearGradient>
      </defs>
      <rect y="210" width="400" height="90" fill="#E8D7BF" />
      {Array.from({ length: 8 }).map((_, i) => (
        <path key={i} d={`M${i * 56} 210 L${i * 56 - 40} 300`} stroke="#DCC7AA" strokeWidth="2" />
      ))}
      <path d="M60 210 L60 90 A50 50 0 0 1 160 90 L160 210 Z" fill={`url(#win${id})`} stroke="#fff" strokeWidth="8" />
      <path d="M110 40 L110 210 M60 130 L160 130" stroke="#fff" strokeWidth="6" />
      <path d="M180 210 L240 0" stroke="#fff" strokeWidth="0" />
      <g transform="translate(300 0)">
        <rect x="-6" y="70" width="12" height="140" fill="#D9C2A2" />
        <rect x="-50" y="68" width="100" height="14" rx="7" fill="#C9A77B" />
        <rect x="-40" y="140" width="80" height="12" rx="6" fill="#C9A77B" />
        <rect x="-60" y="198" width="120" height="16" rx="8" fill="#C9A77B" />
        <g transform="translate(0 40) scale(.42)">
          <ellipse cx="0" cy="60" rx="70" ry="40" fill={v % 2 ? '#E9A15B' : '#3A3A41'} />
          <circle cx="-40" cy="20" r="34" fill={v % 2 ? '#E9A15B' : '#3A3A41'} />
          <path d="M-66 4 L-60 -34 L-40 -6 Z M-14 4 L-20 -34 L-40 -6 Z" fill={v % 2 ? '#E9A15B' : '#3A3A41'} />
          <path d="M60 60 Q110 40 90 0" stroke={v % 2 ? '#E9A15B' : '#3A3A41'} strokeWidth="16" fill="none" strokeLinecap="round" />
        </g>
      </g>
      <g transform="translate(205 210)">
        <path d="M-22 0 L-16 -40 L16 -40 L22 0 Z" fill="#F1E6D6" />
        {[-30, -10, 10, 30].map((x, i) => (
          <ellipse key={i} cx={x * 0.6} cy={-58 - (i % 2) * 14} rx="10" ry="26" fill={GREENS[i]} transform={`rotate(${x} ${x * 0.6} ${-58})`} />
        ))}
      </g>
      <ellipse cx="110" cy="230" rx="70" ry="10" fill="#fff" opacity=".35" />
    </g>
  );
}

/* ── Cat ──────────────────────────────────────────── */
function Cat({ spec, id }: { spec: Extract<ArtSpec, { kind: 'cat' }>; id: string }) {
  const coat = spec.pattern === 'calico' ? COATS.white : spec.pattern === 'point' ? COATS.cream : COATS[spec.coat];
  const eye = EYES[spec.eyes];
  const dark = spec.pattern === 'point' ? '#6B4E3D' : coat.stripe;
  const outline = spec.coat === 'white' || spec.pattern === 'calico' ? '#D9D2C7' : 'transparent';
  const clip = `cc${id}`;
  const stroke = { stroke: outline, strokeWidth: 2 };
  const pose = spec.pose;

  // 몸/머리 기준 좌표
  const head = pose === 'peek' ? { cx: 200, cy: 196, rx: 84, ry: 74 } : pose === 'sleep' ? { cx: 138, cy: 196, rx: 56, ry: 50 } : pose === 'loaf' ? { cx: 200, cy: 142, rx: 62, ry: 54 } : { cx: 200, cy: 124, rx: 60, ry: 53 };
  const body = pose === 'loaf' ? { cx: 200, cy: 222, rx: 108, ry: 56 } : pose === 'sleep' ? { cx: 218, cy: 204, rx: 112, ry: 66 } : pose === 'peek' ? null : { cx: 200, cy: 214, rx: 70, ry: 64 };
  const s = head.rx / 60;
  const earL = `M${head.cx - 48 * s} ${head.cy - 22 * s} L${head.cx - 40 * s} ${head.cy - 74 * s} L${head.cx - 8 * s} ${head.cy - 44 * s} Z`;
  const earR = `M${head.cx + 48 * s} ${head.cy - 22 * s} L${head.cx + 40 * s} ${head.cy - 74 * s} L${head.cx + 8 * s} ${head.cy - 44 * s} Z`;
  const earLi = `M${head.cx - 40 * s} ${head.cy - 30 * s} L${head.cx - 37 * s} ${head.cy - 62 * s} L${head.cx - 16 * s} ${head.cy - 42 * s} Z`;
  const earRi = `M${head.cx + 40 * s} ${head.cy - 30 * s} L${head.cx + 37 * s} ${head.cy - 62 * s} L${head.cx + 16 * s} ${head.cy - 42 * s} Z`;
  const tilt = pose === 'sleep' ? -14 : 0;

  return (
    <g>
      <defs>
        <clipPath id={clip}>
          {body && <ellipse {...body} />}
          <ellipse {...head} transform={`rotate(${tilt} ${head.cx} ${head.cy})`} />
          <path d={earL} transform={`rotate(${tilt} ${head.cx} ${head.cy})`} />
          <path d={earR} transform={`rotate(${tilt} ${head.cx} ${head.cy})`} />
        </clipPath>
      </defs>
      {/* 바닥 그림자/소품 */}
      <ellipse cx="200" cy={pose === 'peek' ? 300 : 278} rx="140" ry="16" fill="#0E2A33" opacity=".07" />
      <circle cx="70" cy="70" r="28" fill="#fff" opacity=".35" />
      <circle cx="340" cy="54" r="16" fill="#fff" opacity=".4" />

      {/* 꼬리 */}
      {pose === 'sit' && <path d="M258 250 Q318 240 300 176" stroke={spec.pattern === 'point' ? dark : coat.base} strokeWidth="18" fill="none" strokeLinecap="round" {...(outline !== 'transparent' ? {} : {})} />}
      {pose === 'loaf' && <path d="M300 236 Q330 268 270 276" stroke={spec.pattern === 'point' ? dark : coat.base} strokeWidth="16" fill="none" strokeLinecap="round" />}

      <g>
        {body && <ellipse {...body} fill={coat.base} {...stroke} />}
        <g transform={`rotate(${tilt} ${head.cx} ${head.cy})`}>
          <path d={earL} fill={coat.base} {...stroke} />
          <path d={earR} fill={coat.base} {...stroke} />
          <ellipse {...head} fill={coat.base} {...stroke} />
        </g>
      </g>

      {/* 무늬 (clip) */}
      <g clipPath={`url(#${clip})`}>
        {spec.pattern === 'tabby' && (
          <g stroke={coat.stripe} strokeWidth={6 * s} strokeLinecap="round" fill="none" opacity=".85" transform={`rotate(${tilt} ${head.cx} ${head.cy})`}>
            <path d={`M${head.cx} ${head.cy - 50 * s} L${head.cx} ${head.cy - 30 * s}`} />
            <path d={`M${head.cx - 14 * s} ${head.cy - 48 * s} L${head.cx - 10 * s} ${head.cy - 32 * s}`} />
            <path d={`M${head.cx + 14 * s} ${head.cy - 48 * s} L${head.cx + 10 * s} ${head.cy - 32 * s}`} />
            <path d={`M${head.cx - 60 * s} ${head.cy + 4 * s} L${head.cx - 42 * s} ${head.cy + 2 * s}`} />
            <path d={`M${head.cx + 60 * s} ${head.cy + 4 * s} L${head.cx + 42 * s} ${head.cy + 2 * s}`} />
          </g>
        )}
        {spec.pattern === 'tabby' && body && (
          <g stroke={coat.stripe} strokeWidth="9" strokeLinecap="round" fill="none" opacity=".75">
            {[-1, 0, 1].map((k) => (
              <path key={k} d={`M${body.cx + body.rx * 0.55} ${body.cy - 30 + k * 26} q -18 6 -30 0`} />
            ))}
            {[-1, 0, 1].map((k) => (
              <path key={`l${k}`} d={`M${body.cx - body.rx * 0.55} ${body.cy - 30 + k * 26} q 18 6 30 0`} />
            ))}
          </g>
        )}
        {spec.pattern === 'calico' && (
          <g>
            <ellipse cx={head.cx - 34 * s} cy={head.cy - 30 * s} rx={34 * s} ry={30 * s} fill="#E39A4E" />
            <ellipse cx={head.cx + 38 * s} cy={head.cy - 34 * s} rx={28 * s} ry={26 * s} fill="#3A3A41" />
            {body && <ellipse cx={body.cx + body.rx * 0.5} cy={body.cy} rx={body.rx * 0.45} ry={body.ry * 0.6} fill="#E39A4E" />}
            {body && <ellipse cx={body.cx - body.rx * 0.6} cy={body.cy + 10} rx={body.rx * 0.3} ry={body.ry * 0.4} fill="#3A3A41" />}
          </g>
        )}
        {spec.pattern === 'point' && (
          <g fill={dark}>
            <path d={earL} transform={`rotate(${tilt} ${head.cx} ${head.cy})`} />
            <path d={earR} transform={`rotate(${tilt} ${head.cx} ${head.cy})`} />
            <ellipse cx={head.cx} cy={head.cy + 20 * s} rx={30 * s} ry={26 * s} opacity=".55" transform={`rotate(${tilt} ${head.cx} ${head.cy})`} />
          </g>
        )}
        {spec.pattern === 'tuxedo' && (
          <g fill={coat.light}>
            {body && <ellipse cx={body.cx} cy={body.cy + body.ry * 0.25} rx={body.rx * 0.38} ry={body.ry * 0.7} />}
            <ellipse cx={head.cx} cy={head.cy + 30 * s} rx={26 * s} ry={22 * s} />
            <path d={`M${head.cx} ${head.cy - 6 * s} L${head.cx - 12 * s} ${head.cy + 20 * s} L${head.cx + 12 * s} ${head.cy + 20 * s} Z`} />
          </g>
        )}
        {(spec.pattern === 'solid' || spec.pattern === 'tabby') && body && <ellipse cx={body.cx} cy={body.cy + body.ry * 0.3} rx={body.rx * 0.32} ry={body.ry * 0.55} fill={coat.light} opacity=".75" />}
      </g>

      {/* 안쪽 귀 */}
      <g transform={`rotate(${tilt} ${head.cx} ${head.cy})`}>
        <path d={earLi} fill="#F3B6B0" opacity=".85" />
        <path d={earRi} fill="#F3B6B0" opacity=".85" />
      </g>

      {/* 얼굴 */}
      <g transform={`rotate(${tilt} ${head.cx} ${head.cy})`}>
        {pose === 'sleep' ? (
          <g stroke="#2B2B30" strokeWidth={3.5 * s} fill="none" strokeLinecap="round">
            <path d={`M${head.cx - 30 * s} ${head.cy + 2 * s} q 10 8 20 0`} />
            <path d={`M${head.cx + 10 * s} ${head.cy + 2 * s} q 10 8 20 0`} />
          </g>
        ) : (
          [-1, 1].map((d) => (
            <g key={d}>
              <ellipse cx={head.cx + d * 22 * s} cy={head.cy + 2 * s} rx={11 * s} ry={13 * s} fill={eye} />
              <ellipse cx={head.cx + d * 22 * s} cy={head.cy + 2 * s} rx={4 * s} ry={10 * s} fill="#1F1F24" />
              <circle cx={head.cx + d * 22 * s - 3 * s} cy={head.cy - 4 * s} r={3 * s} fill="#fff" />
            </g>
          ))
        )}
        <path d={`M${head.cx - 6 * s} ${head.cy + 18 * s} L${head.cx + 6 * s} ${head.cy + 18 * s} L${head.cx} ${head.cy + 25 * s} Z`} fill="#E58C8C" />
        <path d={`M${head.cx} ${head.cy + 25 * s} q -6 8 -13 4 M${head.cx} ${head.cy + 25 * s} q 6 8 13 4`} stroke="#4A3A36" strokeWidth={2 * s} fill="none" strokeLinecap="round" />
        <g stroke={spec.coat === 'black' && spec.pattern !== 'tuxedo' ? '#9A9AA3' : '#6E625C'} strokeWidth={1.4 * s} opacity=".55">
          {[-1, 1].map((d) => (
            <g key={d}>
              <path d={`M${head.cx + d * 18 * s} ${head.cy + 22 * s} L${head.cx + d * 62 * s} ${head.cy + 14 * s}`} />
              <path d={`M${head.cx + d * 18 * s} ${head.cy + 26 * s} L${head.cx + d * 62 * s} ${head.cy + 28 * s}`} />
            </g>
          ))}
        </g>
        <ellipse cx={head.cx - 34 * s} cy={head.cy + 20 * s} rx={8 * s} ry={5 * s} fill="#F49C9C" opacity=".25" />
        <ellipse cx={head.cx + 34 * s} cy={head.cy + 20 * s} rx={8 * s} ry={5 * s} fill="#F49C9C" opacity=".25" />
      </g>

      {/* 앞발 / 소품 */}
      {pose === 'sit' && [-1, 1].map((d) => <ellipse key={d} cx={200 + d * 22} cy={272} rx="17" ry="10" fill={spec.pattern === 'tuxedo' ? coat.light : spec.pattern === 'point' ? dark : coat.base} {...stroke} />)}
      {pose === 'loaf' && [-1, 1].map((d) => <ellipse key={d} cx={200 + d * 26} cy={274} rx="18" ry="8" fill={spec.pattern === 'tuxedo' ? coat.light : spec.pattern === 'point' ? dark : coat.base} {...stroke} />)}
      {pose === 'peek' && (
        <g>
          <rect x="0" y="248" width="400" height="60" fill="#E6D2B5" />
          <rect x="0" y="248" width="400" height="8" fill="#D8BF9A" />
          {[-1, 1].map((d) => <ellipse key={d} cx={200 + d * 46} cy={250} rx="22" ry="12" fill={spec.pattern === 'tuxedo' ? coat.light : spec.pattern === 'point' ? dark : coat.base} {...stroke} />)}
        </g>
      )}
      {pose === 'sleep' && <path d="M330 220 Q340 276 200 272 Q150 270 120 252" stroke={spec.pattern === 'point' ? dark : coat.base} strokeWidth="18" fill="none" strokeLinecap="round" />}
      {pose === 'sleep' && (
        <g fill="#5B7A8A" opacity=".55" fontFamily="sans-serif" fontWeight="700">
          <text x="250" y="110" fontSize="26">z</text>
          <text x="272" y="88" fontSize="18">z</text>
        </g>
      )}
    </g>
  );
}
