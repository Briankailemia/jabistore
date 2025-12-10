'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function PlaceholderImage({ width = 400, height = 300, alt = '', className = '' }) {
  const [isError, setIsError] = useState(false);
  const placeholderUrl = `/api/placeholder/${width}x${height}`;
  const fallbackUrl = `data:image/svg+xml;base64,${btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
      <rect width="${width}" height="${height}" fill="#F3F4F6"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#9CA3AF">${width} × ${height}</text>
    </svg>`
  )}`;

  return (
    <div className={`relative ${className}`} style={{ width: '100%', height: 'auto', aspectRatio: `${width}/${height}` }}>
      <Image
        src={isError ? fallbackUrl : placeholderUrl}
        alt={alt}
        fill
        className="object-cover"
        onError={() => setIsError(true)}
        unoptimized={isError}
      />
    </div>
  );
}
