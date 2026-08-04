import type { SVGProps } from "react";

export function TivrixMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {/* Background */}
      <rect x="2" y="2" width="60" height="60" rx="15" fill="#06183F" />

      {/* Simplified phone / screen outline */}
      <path
        d="M15 49V22C15 15.9 19.9 11 26 11H38C44.1 11 49 15.9 49 22V49"
        stroke="url(#tivrix-gradient)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Receipt */}
      <path
        d="M20 24H44V50L40 54L36 50L32 54L28 50L24 54L20 50Z"
        fill="#F8FAFC"
      />

      {/* T-shaped receipt header */}
      <path d="M25 30H39" stroke="#10254F" strokeWidth="3" strokeLinecap="round" />

      {/* Simplified barcode / T stem */}
      <path d="M27 38V48M32 36V48M37 38V48" stroke="#10254F" strokeWidth="3" strokeLinecap="round" />

      <defs>
        <linearGradient id="tivrix-gradient" x1="16" y1="12" x2="49" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22E7E7" />
          <stop offset="1" stopColor="#1684FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}
