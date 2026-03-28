import { forwardRef } from "react";
import type { LucideProps } from "lucide-react";

export const NailPolishIcon = forwardRef<SVGSVGElement, LucideProps>(
  ({ color = "currentColor", size = 24, strokeWidth = 2, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Brush handle */}
      <rect x="10" y="2" width="4" height="6" rx="1" />
      {/* Bottle neck */}
      <line x1="12" y1="8" x2="12" y2="10" />
      {/* Bottle body */}
      <path d="M8 10h8l-1 10a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2L8 10z" />
    </svg>
  )
);

NailPolishIcon.displayName = "NailPolishIcon";
