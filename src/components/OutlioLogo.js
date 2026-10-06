import React from "react";

export default function OutlioLogo({
  size = 28,
  bg = "#000000",
  shape = "circle",
  style = {},
  className = ""
}) {
  const rx = shape === "circle" ? "50" : shape === "squircle" ? "28" : "0";
  const borderRadius = shape === "circle" ? "50%" : shape === "squircle" ? `${size * 0.28}px` : "0";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        borderRadius: shape !== "none" ? borderRadius : "0",
        flexShrink: 0,
        display: "block",
        ...style
      }}
    >
      {shape !== "none" && <rect width="100" height="100" rx={rx} fill={bg} />}
      {/* Scaled down to ~78% and visually centered with generous breathing room from edges */}
      <g transform="translate(50, 50) scale(0.78) translate(-54, -49)">
        <rect x="22" y="32" width="10" height="36" rx="5" fill="#3f3f46" transform="rotate(25 27 50)" />
        <rect x="45" y="24" width="10" height="52" rx="5" fill="#a1a1aa" transform="rotate(25 50 50)" />
        <rect x="68" y="16" width="10" height="68" rx="5" fill="#ffffff" transform="rotate(25 73 50)" />
        {/* Target ping indicator */}
        <circle cx="73" cy="20" r="3" fill={shape !== "none" && bg === "#000000" ? "#000000" : "#111111"} />
      </g>
    </svg>
  );
}
