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
      <rect x="2" y="2" width="60" height="60" rx="15" fill="#071A4B" />
      <rect x="2.75" y="2.75" width="58.5" height="58.5" rx="14.25" stroke="#2E86FF" strokeOpacity=".72" strokeWidth="1.5" />
      <path
        d="M20 47.5V16.5C20 13.46 22.46 11 25.5 11H38.5C41.54 11 44 13.46 44 16.5V47.5L38 52L32 47.5L26 52L20 47.5Z"
        fill="#0B2B62"
        stroke="#F8FAFC"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path d="M25 21.5H39" stroke="#F8FAFC" strokeWidth="4" strokeLinecap="round" />
      <path d="M32 22V35" stroke="#F8FAFC" strokeWidth="4" strokeLinecap="round" />
      <path d="M25.5 39L30.5 43.5L39 35" stroke="#12D6B0" strokeWidth="3.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
