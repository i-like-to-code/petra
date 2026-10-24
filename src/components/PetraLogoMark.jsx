import React from 'react';

// Reusable SVG Logo Component for Petra Cements
export default function PetraLogoMark({ size = 24, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M20 20H55C70 20 80 30 80 45C80 60 70 70 55 70H40V90H20V20Z" fill="currentColor" />
      <path d="M40 38V52H52C56 52 60 49 60 45C60 41 56 38 52 38H40Z" fill="white" />
    </svg>
  );
}
