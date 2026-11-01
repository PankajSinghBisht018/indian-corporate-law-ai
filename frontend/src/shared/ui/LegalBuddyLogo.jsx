import React from 'react'

export function LegalBuddyLogo({ size = 36, className = '', withGlow = true }) {
  const s = typeof size === 'number' ? `${size}px` : size

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 48 48" 
      style={{ width: s, height: s }} 
      className={`shrink-0 ${withGlow ? 'drop-shadow-[0_2px_8px_rgba(249,115,22,0.4)]' : ''} ${className}`}
      fill="none"
    >
      <defs>
        {/* Brand Orange Gradient */}
        <linearGradient id="lb-react-orange-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF9838" />
          <stop offset="45%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>

        {/* Warm Highlight Gradient */}
        <linearGradient id="lb-react-hl" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FED7AA" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>

        {/* Subtle Semi-transparent Fill */}
        <linearGradient id="lb-react-fill" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#F97316" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#EA580C" stopOpacity="0.03" />
        </linearGradient>
      </defs>

      {/* Outer Protective Shield (Transparent Background) */}
      <path 
        d="M 24 4 C 36 4, 43 11, 43 22 C 43 34.5, 24 44, 24 44 C 24 44, 5 34.5, 5 22 C 5 11, 12 4, 24 4 Z" 
        fill="url(#lb-react-fill)" 
        stroke="url(#lb-react-orange-grad)" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />

      {/* Inner Accent Crest */}
      <path 
        d="M 24 7.5 C 33.5 7.5, 39.5 13, 39.5 22 C 39.5 31.5, 24 39.5, 24 39.5 C 24 39.5, 8.5 31.5, 8.5 22 C 8.5 13, 14.5 7.5, 24 7.5 Z" 
        fill="none" 
        stroke="url(#lb-react-orange-grad)" 
        strokeWidth="0.75" 
        strokeOpacity="0.4"
        strokeDasharray="2 1.5"
      />

      {/* Top Legal Beacon / AI Spark Diamond */}
      <polygon 
        points="24,9 26.8,12.8 24,16.5 21.2,12.8" 
        fill="url(#lb-react-hl)" 
        stroke="url(#lb-react-orange-grad)"
        strokeWidth="0.75"
      />

      {/* Scales of Justice: Balance Crossbeam */}
      <path 
        d="M 13 18 C 17.5 16.5, 30.5 16.5, 35 18" 
        stroke="url(#lb-react-orange-grad)" 
        strokeWidth="2.2" 
        strokeLinecap="round" 
        fill="none"
      />

      {/* Central Column (Pillar of Law) */}
      <line 
        x1="24" y1="16.5" x2="24" y2="34" 
        stroke="url(#lb-react-orange-grad)" 
        strokeWidth="2.2" 
        strokeLinecap="round"
      />

      {/* Left Scale: Strings & Pan */}
      <line x1="13" y1="18" x2="9.5" y2="25" stroke="url(#lb-react-orange-grad)" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
      <line x1="13" y1="18" x2="16.5" y2="25" stroke="url(#lb-react-orange-grad)" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
      <path 
        d="M 8 25 C 8 29.5, 18 29.5, 18 25 Z" 
        fill="url(#lb-react-orange-grad)"
      />

      {/* Right Scale: Strings & Pan */}
      <line x1="35" y1="18" x2="31.5" y2="25" stroke="url(#lb-react-orange-grad)" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
      <line x1="35" y1="18" x2="38.5" y2="25" stroke="url(#lb-react-orange-grad)" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
      <path 
        d="M 30 25 C 30 29.5, 40 29.5, 40 25 Z" 
        fill="url(#lb-react-orange-grad)"
      />

      {/* Central Tech AI Node */}
      <circle cx="24" cy="24" r="2.2" fill="#FFA347" stroke="url(#lb-react-orange-grad)" strokeWidth="1" />

      {/* Base Pedestal */}
      <line 
        x1="19" y1="34" x2="29" y2="34" 
        stroke="url(#lb-react-orange-grad)" 
        strokeWidth="2.2" 
        strokeLinecap="round"
      />
      <line 
        x1="16.5" y1="37" x2="31.5" y2="37" 
        stroke="url(#lb-react-orange-grad)" 
        strokeWidth="1.5" 
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  )
}

export function LegalBuddyBrand({ size = 36, subtitle = "IT Legal Department", className = "" }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LegalBuddyLogo size={size} withGlow={true} />
      <div className="flex-1 min-w-0">
        <div className="font-outfit text-lg font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-1 leading-none">
          LegalBuddy
        </div>
        {subtitle && (
          <div className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold mt-1 font-outfit flex items-center gap-1 uppercase tracking-wider leading-none">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block animate-pulse"></span>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  )
}

export default LegalBuddyLogo

