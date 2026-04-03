import React from 'react'

/**
 * Inline circular brand logo.
 * Used in the sidebar (top-left) and exported as an SVG favicon.
 */
export default function CircularLogo({ size = 46, className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      role="img"
      aria-label="StockSight logo"
    >
      <circle cx="32" cy="32" r="30" fill="#1A1A1A" />
      <circle cx="32" cy="32" r="29" stroke="rgba(234, 234, 234, 0.07)" strokeWidth="1" />

      {/* "Eye" arcs */}
      <path
        d="M14 32C17 20 24.5 14 32 14C39.5 14 47 20 50 32"
        stroke="#34d399"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M14 32C17 44 24.5 50 32 50C39.5 50 47 44 50 32"
        stroke="#34d399"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Inner ring */}
      <circle cx="32" cy="32" r="12.5" stroke="#34d399" strokeWidth="3" fill="rgba(52, 211, 153, 0.08)" />

      {/* Up arrow */}
      <path
        d="M32 20L40 28H35V41H29V28H24L32 20Z"
        fill="#34d399"
      />
    </svg>
  )
}

