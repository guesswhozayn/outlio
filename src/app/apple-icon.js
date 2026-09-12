import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000000',
          borderRadius: '36px',
        }}
      >
        <svg
          width="130"
          height="130"
          viewBox="0 0 56 56"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Primary Fold (Top Wing) */}
          <path d="M14 28 L40 16 L26 32 Z" fill="#FFFFFF" />
          {/* Secondary Dual Fold (Bottom Wing) */}
          <path d="M40 16 L30 42 L26 32 Z" fill="#FFFFFF" fillOpacity="0.75" />
          {/* Origami Shadow Crease */}
          <path d="M14 28 L26 32 L21 35 Z" fill="#000000" fillOpacity="0.22" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
