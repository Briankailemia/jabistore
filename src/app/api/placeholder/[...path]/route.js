import { ImageResponse } from 'next/og';

export async function GET(request, { params }) {
  try {
    const { path } = params;
    const [width = 400, height = 300] = path[0].split('x').map(Number);
    
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6',
            color: '#9ca3af',
            fontSize: 24,
          }}
        >
          {width} × {height}
        </div>
      ),
      {
        width,
        height,
      }
    );
  } catch (error) {
    console.error('Error generating placeholder:', error);
    return new Response('Error generating placeholder', { status: 500 });
  }
}
