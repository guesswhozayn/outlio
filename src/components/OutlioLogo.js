import React from "react";

export default function OutlioLogo({
  size = 28,
  bg = "#000000",
  shape = "circle",
  style = {},
  className = ""
}) {
  const rx = shape === "circle" ? "28" : shape === "squircle" ? "18" : "0";
  const borderRadius = shape === "circle" ? "50%" : shape === "squircle" ? `${size * 0.32}px` : "0";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
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
      {shape !== "none" && <rect width="56" height="56" rx={rx} fill={bg} />}
      {/* Primary Fold (Top Wing) */}
      <path d="M14 28 L40 16 L26 32 Z" fill="#FFFFFF" />
      {/* Secondary Dual Fold (Bottom Wing) */}
      <path d="M40 16 L30 42 L26 32 Z" fill="#FFFFFF" fillOpacity="0.75" />
      {/* Origami Shadow Crease */}
      <path d="M14 28 L26 32 L21 35 Z" fill="#000000" fillOpacity="0.22" />
    </svg>
  );
}
