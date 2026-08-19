import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: 'linear-gradient(135deg, #059669 0%, #065f46 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '8px',
          fontWeight: 900,
          fontFamily: 'sans-serif',
          boxShadow: '0 4px 6px -1px rgba(6, 78, 59, 0.5)',
        }}
      >
        P
      </div>
    ),
    {
      ...size,
    }
  );
}
