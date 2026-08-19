import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

// Image generation
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 110,
          background: 'linear-gradient(135deg, #059669 0%, #065f46 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '36px',
          fontWeight: 900,
          fontFamily: 'sans-serif',
          boxShadow: '0 10px 25px -5px rgba(6, 78, 59, 0.6)',
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
