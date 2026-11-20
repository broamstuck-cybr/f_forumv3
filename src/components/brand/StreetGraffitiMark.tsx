import React, { useId } from 'react';

export interface StreetGraffitiMarkProps {
  className?: string;
}

const LETTER_F1 =
  'M 64 34 L 166 28 L 154 66 L 104 68 L 99 94 L 144 92 L 135 126 L 93 128 L 84 182 L 42 184 L 58 68 L 46 66 Z';
const LETTER_DASH = 'M 176 98 L 230 94 L 222 126 L 168 130 Z';
const LETTER_F2 =
  'M 254 34 L 360 30 L 348 66 L 296 68 L 291 95 L 336 93 L 328 126 L 285 128 L 276 182 L 234 184 L 250 66 L 238 64 Z';
const LETTER_O =
  'M 398 34 L 494 30 L 516 58 L 498 162 L 468 184 L 372 186 L 352 158 L 370 58 Z M 414 68 L 398 148 L 456 146 L 472 66 Z';
const LETTER_R =
  'M 536 32 L 642 30 L 664 56 L 652 106 L 626 122 L 656 182 L 610 184 L 586 128 L 570 128 L 560 182 L 518 184 Z M 580 64 L 574 96 L 616 95 L 622 64 Z';
const LETTER_U =
  'M 684 32 L 726 30 L 708 136 L 752 135 L 770 30 L 812 32 L 788 162 L 758 184 L 682 186 L 662 158 Z';
const LETTER_M =
  'M 832 32 L 876 30 L 892 92 L 928 30 L 970 32 L 944 184 L 904 182 L 916 102 L 882 156 L 864 156 L 854 102 L 840 182 L 800 184 Z';

const ALL_LETTERS = [
  { id: 'f1', d: LETTER_F1, tone: 'red' as const },
  { id: 'dash', d: LETTER_DASH, tone: 'harbour' as const },
  { id: 'f2', d: LETTER_F2, tone: 'ink' as const },
  { id: 'o', d: LETTER_O, tone: 'ink' as const },
  { id: 'r', d: LETTER_R, tone: 'ink' as const },
  { id: 'u', d: LETTER_U, tone: 'ink' as const },
  { id: 'm', d: LETTER_M, tone: 'ink' as const },
];

export const StreetGraffitiMark: React.FC<StreetGraffitiMarkProps> = ({ className = '' }) => {
  const uid = useId().replace(/:/g, '');
  const halftoneId = `ff-halftone-${uid}`;
  const sprayRedId = `ff-spray-red-${uid}`;
  const sprayBlueId = `ff-spray-blue-${uid}`;
  const faceRedId = `ff-face-red-${uid}`;

  return (
    <svg
      viewBox="0 0 1000 240"
      role="img"
      aria-label="F-Forum"
      className={`foot__graffitiSvg ${className}`.trim()}
      fill="none"
    >
      <defs>
        <pattern id={halftoneId} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
          <circle cx="3" cy="3" r="1.9" fill="#7DA3BB" fillOpacity="0.42" />
          <circle cx="8" cy="8" r="1.3" fill="#DDAD95" fillOpacity="0.34" />
        </pattern>
        <radialGradient id={sprayRedId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D63A27" stopOpacity="0.36" />
          <stop offset="62%" stopColor="#DDAD95" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#D63A27" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={sprayBlueId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7DA3BB" stopOpacity="0.34" />
          <stop offset="65%" stopColor="#B0AEC6" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#7DA3BB" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={faceRedId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6450" />
          <stop offset="100%" stopColor="#D63A27" />
        </linearGradient>
      </defs>

      <ellipse cx="135" cy="112" rx="125" ry="92" fill={`url(#${sprayRedId})`} />
      <ellipse cx="520" cy="118" rx="180" ry="86" fill={`url(#${sprayBlueId})`} />
      <ellipse cx="860" cy="108" rx="135" ry="88" fill={`url(#${sprayRedId})`} />

      <polygon points="34,42 380,18 352,196 16,204" fill={`url(#${halftoneId})`} />
      <polygon points="620,24 978,16 960,192 590,204" fill={`url(#${halftoneId})`} />

      <path
        d="M 28 202 Q 260 184 520 198 T 948 188 L 974 176 L 952 204 L 930 198 Q 520 214 34 210 Z"
        fill="#7DA3BB"
        fillOpacity="0.72"
      />
      <path
        d="M 192 212 Q 490 200 842 208"
        stroke="#DDAD95"
        strokeWidth="4"
        strokeLinecap="round"
        strokeOpacity="0.75"
      />

      <g transform="translate(11 12)">
        {ALL_LETTERS.map((item) => (
          <path
            key={`${item.id}-shadow`}
            d={item.d}
            fill={item.tone === 'red' ? '#2E3546' : '#2E3546'}
            stroke="#121110"
            strokeWidth="8"
            strokeLinejoin="round"
            fillRule="evenodd"
          />
        ))}
      </g>

      <g>
        {ALL_LETTERS.map((item) => {
          const fill =
            item.tone === 'red'
              ? `url(#${faceRedId})`
              : item.tone === 'harbour'
                ? '#7DA3BB'
                : 'var(--fg)';
          return (
            <path
              key={item.id}
              d={item.d}
              fill={fill}
              stroke="#121110"
              strokeWidth="5.5"
              strokeLinejoin="round"
              fillRule="evenodd"
            />
          );
        })}
      </g>

      <path d="M 68 42 L 146 37" stroke="#BAD9E6" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.88" />
      <path d="M 258 43 L 340 39" stroke="#DDAD95" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.82" />
      <path d="M 404 42 L 484 39" stroke="#7DA3BB" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.86" />
      <path d="M 544 41 L 632 39" stroke="#DDAD95" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.82" />
      <path d="M 840 41 L 866 40" stroke="#D63A27" strokeWidth="5" strokeLinecap="round" />
      <path d="M 936 40 L 958 41" stroke="#7DA3BB" strokeWidth="5" strokeLinecap="round" />

      <path d="M 56 184 Q 56 210 61 214 Q 66 210 66 184 Z" fill="#D63A27" stroke="#121110" strokeWidth="2.5" />
      <path d="M 140 66 Q 140 86 144 90 Q 148 86 148 66 Z" fill="#D63A27" stroke="#121110" strokeWidth="2.2" />
      <path d="M 412 185 Q 412 216 418 221 Q 424 216 424 185 Z" fill="#7DA3BB" stroke="#121110" strokeWidth="2.5" />
      <path d="M 730 185 Q 730 208 735 212 Q 740 208 740 185 Z" fill="#DDAD95" stroke="#121110" strokeWidth="2.2" />
      <path d="M 922 183 Q 922 216 928 222 Q 934 216 934 183 Z" fill="#D63A27" stroke="#121110" strokeWidth="2.5" />

      <circle cx="28" cy="48" r="4.5" fill="#D63A27" />
      <circle cx="196" cy="54" r="3.5" fill="#7DA3BB" />
      <circle cx="212" cy="156" r="4" fill="#DDAD95" />
      <circle cx="364" cy="166" r="3" fill="#B0AEC6" />
      <circle cx="518" cy="36" r="3.5" fill="#D63A27" />
      <circle cx="674" cy="172" r="4" fill="#7DA3BB" />
      <circle cx="822" cy="46" r="3.5" fill="#DDAD95" />
      <circle cx="978" cy="156" r="4.5" fill="#D63A27" />
      <circle cx="964" cy="52" r="3" fill="#BAD9E6" />
    </svg>
  );
};

export default StreetGraffitiMark;
