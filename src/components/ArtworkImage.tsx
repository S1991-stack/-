import React, { useState } from 'react';
import { AudioTrack, BuiltInArtworkId } from '../types/audio';

interface ArtworkImageProps {
  track?: AudioTrack | null;
  preset?: BuiltInArtworkId;
  className?: string;
  alt?: string;
}

const PRESET_FROM_ID = (track?: AudioTrack | null): BuiltInArtworkId => {
  if (track?.artworkPreset) return track.artworkPreset;
  const presets: BuiltInArtworkId[] = [
    'sunset_dreams',
    'summer_breeze',
    'quiet_music',
    'night_city',
    'nature_bloom',
    'midnight_vibes',
  ];
  const hash = (track?.title || 'salah')
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return presets[hash % presets.length];
};

const SceneSVG: React.FC<{ scene: BuiltInArtworkId; className?: string }> = ({ scene, className }) => {
  switch (scene) {
    case 'sunset_dreams':
      return (
        <svg viewBox="0 0 240 240" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="sd-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF5E1A" />
              <stop offset="48%" stopColor="#FFB800" />
              <stop offset="100%" stopColor="#FFE270" />
            </linearGradient>
            <linearGradient id="sd-water" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF9E2C" />
              <stop offset="55%" stopColor="#B83B5E" />
              <stop offset="100%" stopColor="#261242" />
            </linearGradient>
          </defs>
          <rect width="240" height="145" fill="url(#sd-sky)" />
          <circle cx="96" cy="116" r="34" fill="#FFF7D6" opacity="0.95" />
          <circle cx="96" cy="116" r="52" fill="#FFD166" opacity="0.28" />
          <rect y="140" width="240" height="100" fill="url(#sd-water)" />
          <ellipse cx="96" cy="155" rx="34" ry="5" fill="#FFF1B8" opacity="0.85" />
          <ellipse cx="96" cy="172" rx="26" ry="3.5" fill="#FFE082" opacity="0.7" />
          <ellipse cx="96" cy="188" rx="18" ry="2.5" fill="#FFD166" opacity="0.55" />
          <path d="M0 142 Q60 132 120 140 T240 138 L240 146 L0 146 Z" fill="#1B0E2E" opacity="0.75" />
          {/* Lakeside Tree Silhouette */}
          <path
            d="M174 176 L176 116 L160 95 M176 122 L196 98 M175 106 L174 78"
            stroke="#12091E"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          <g fill="#12091E">
            <circle cx="172" cy="70" r="24" />
            <circle cx="148" cy="84" r="21" />
            <circle cx="198" cy="85" r="22" />
            <circle cx="162" cy="54" r="19" />
            <circle cx="188" cy="60" r="18" />
            <path d="M132 178 Q175 162 240 168 L240 240 L110 240 Z" opacity="0.95" />
          </g>
          {/* Birds */}
          <path d="M44 52 Q49 47 54 52 Q59 47 64 52" fill="none" stroke="#2D142C" strokeWidth="2" strokeLinecap="round" />
          <path d="M68 38 Q72 34 76 38 Q80 34 84 38" fill="none" stroke="#2D142C" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case 'summer_breeze':
      return (
        <svg viewBox="0 0 240 240" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="sb-sky" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#FDE047" />
            </linearGradient>
            <linearGradient id="sb-sea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
          </defs>
          <rect width="240" height="150" fill="url(#sb-sky)" />
          <circle cx="168" cy="118" r="28" fill="#FFFBEB" />
          <rect y="145" width="240" height="95" fill="url(#sb-sea)" />
          <path d="M0 175 Q90 162 180 175 T240 170 L240 240 L0 240 Z" fill="#FDE68A" opacity="0.25" />
          {/* Palm Trees */}
          <path d="M56 240 Q72 150 94 74" stroke="#0B132B" strokeWidth="9" fill="none" strokeLinecap="round" />
          <g fill="#0B132B">
            <path d="M94 74 Q50 56 26 84 Q60 76 94 74 Z" />
            <path d="M94 74 Q64 36 38 42 Q70 54 94 74 Z" />
            <path d="M94 74 Q124 38 156 54 Q124 58 94 74 Z" />
            <path d="M94 74 Q138 68 164 98 Q128 84 94 74 Z" />
          </g>
        </svg>
      );

    case 'quiet_music':
      return (
        <svg viewBox="0 0 240 240" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="qm-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0EA5E9" />
              <stop offset="65%" stopColor="#7DD3FC" />
              <stop offset="100%" stopColor="#E0F2FE" />
            </linearGradient>
            <linearGradient id="qm-lake" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#082F49" />
            </linearGradient>
          </defs>
          <rect width="240" height="140" fill="url(#qm-sky)" />
          <polygon points="10,140 78,52 146,140" fill="#1E3A8A" />
          <polygon points="78,52 58,78 74,74 86,84 98,77" fill="#F8FAFC" />
          <polygon points="94,140 166,44 238,140" fill="#0F172A" />
          <polygon points="166,44 143,74 162,68 176,78 189,74" fill="#F1F5F9" />
          <rect y="140" width="240" height="100" fill="url(#qm-lake)" />
          <polygon points="20,140 78,205 138,140" fill="#1E3A8A" opacity="0.4" />
          <polygon points="104,140 166,214 226,140" fill="#0F172A" opacity="0.42" />
        </svg>
      );

    case 'night_city':
      return (
        <svg viewBox="0 0 240 240" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="nc-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0F0728" />
              <stop offset="60%" stopColor="#4C1D95" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>
          <rect width="240" height="240" fill="url(#nc-sky)" />
          <circle cx="52" cy="48" r="1.5" fill="#fff" />
          <circle cx="110" cy="32" r="2" fill="#7DD3FC" />
          <circle cx="195" cy="54" r="1.5" fill="#fff" />
          <circle cx="164" cy="24" r="1.2" fill="#F9A8D4" />
          {/* Skyline */}
          <g fill="#090D24">
            <rect x="14" y="102" width="28" height="72" />
            <rect x="46" y="74" width="32" height="100" />
            <rect x="84" y="54" width="36" height="120" />
            <rect x="126" y="84" width="30" height="90" />
            <rect x="162" y="64" width="34" height="110" />
            <rect x="200" y="96" width="28" height="78" />
          </g>
          {/* Neon Windows */}
          <g fill="#00E5FF" opacity="0.85">
            <rect x="52" y="88" width="6" height="6" />
            <rect x="64" y="88" width="6" height="6" />
            <rect x="92" y="68" width="7" height="7" />
            <rect x="105" y="68" width="7" height="7" />
            <rect x="92" y="84" width="7" height="7" />
            <rect x="170" y="78" width="6" height="6" />
            <rect x="182" y="92" width="6" height="6" />
          </g>
          <rect y="172" width="240" height="68" fill="#06091E" opacity="0.92" />
          <rect x="50" y="182" width="140" height="3" rx="1.5" fill="#00E5FF" opacity="0.7" />
          <rect x="74" y="196" width="94" height="2.5" rx="1.2" fill="#EC4899" opacity="0.65" />
        </svg>
      );

    case 'nature_bloom':
      return (
        <svg viewBox="0 0 240 240" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <radialGradient id="nb-bg" cx="40%" cy="25%" r="80%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="45%" stopColor="#4ADE80" />
              <stop offset="100%" stopColor="#064E3B" />
            </radialGradient>
          </defs>
          <rect width="240" height="240" fill="url(#nb-bg)" />
          {[
            { cx: 74, cy: 96, s: 1 },
            { cx: 162, cy: 84, s: 0.85 },
            { cx: 122, cy: 152, s: 1.1 },
            { cx: 56, cy: 174, s: 0.78 },
            { cx: 186, cy: 168, s: 0.88 },
          ].map((fl, i) => (
            <g key={i} transform={`translate(${fl.cx},${fl.cy}) scale(${fl.s})`}>
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <ellipse
                  key={deg}
                  cx="0"
                  cy="-18"
                  rx="7"
                  ry="14"
                  fill="#FFFFFF"
                  opacity="0.95"
                  transform={`rotate(${deg})`}
                />
              ))}
              <circle cx="0" cy="0" r="10" fill="#F59E0B" />
              <circle cx="-2" cy="-2" r="4" fill="#FDE047" />
            </g>
          ))}
        </svg>
      );

    case 'midnight_vibes':
    default:
      return (
        <svg viewBox="0 0 240 240" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <radialGradient id="mv-bg" cx="55%" cy="40%" r="75%">
              <stop offset="0%" stopColor="#EC4899" />
              <stop offset="42%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#05081A" />
            </radialGradient>
          </defs>
          <rect width="240" height="240" fill="url(#mv-bg)" />
          {/* Stage Laser Beams */}
          <polygon points="30,0 130,240 160,240" fill="#00E5FF" opacity="0.24" />
          <polygon points="210,0 84,240 112,240" fill="#F472B6" opacity="0.28" />
          {/* Stylized Guitarist / Concert Silhouette */}
          <g fill="#09071A">
            <circle cx="118" cy="76" r="20" />
            <path d="M84 118 Q116 96 148 118 L158 205 L78 205 Z" />
            <path d="M70 156 L176 92 L182 102 L78 168 Z" fill="#1E1B4B" stroke="#00E5FF" strokeWidth="2" />
            <ellipse cx="104" cy="148" rx="22" ry="15" transform="rotate(-25 104 148)" fill="#0F172A" stroke="#EC4899" strokeWidth="2" />
          </g>
        </svg>
      );
  }
};

export const ArtworkImage: React.FC<ArtworkImageProps> = ({
  track,
  preset,
  className = 'w-full h-full object-cover',
  alt,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  if (track?.artworkDataUrl && !imgFailed) {
    return (
      <img
        src={track.artworkDataUrl}
        alt={alt || track.title}
        referrerPolicy="no-referrer"
        className={className}
        onError={() => setImgFailed(true)}
      />
    );
  }

  const scene = preset ?? PRESET_FROM_ID(track);
  return <SceneSVG scene={scene} className={className} />;
};
