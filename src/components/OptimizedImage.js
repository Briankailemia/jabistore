'use client';

import Image from 'next/image';
import { useState } from 'react';

const OptimizedImage = ({ 
  src, 
  alt, 
  width, 
  height, 
  className = '', 
  priority = false,
  placeholder = 'blur',
  ...props 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Create a simple blur placeholder
  const blurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==';

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setError(true);
    setIsLoading(false);
  };

  if (error) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width: width || '100%', height: height || 'auto', aspectRatio: width && height ? `${width}/${height}` : undefined }}
      >
        <span className="text-gray-500 text-sm">Image unavailable</span>
      </div>
    );
  }

  // Use container with aspect ratio if width/height provided
  if (width && height) {
    return (
      <div className={`relative ${className}`} style={{ width: '100%', aspectRatio: `${width}/${height}` }}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 object-cover ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          {...props}
        />
        {isLoading && (
          <div 
            className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
          >
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    );
  }

  // Fallback for when only width provided (common case)
  if (width && !height) {
    // Default to square or 4:3 aspect ratio
    const defaultHeight = width;
    return (
      <div className={`relative ${className}`} style={{ width: '100%', aspectRatio: '1' }}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 object-cover ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          {...props}
        />
        {isLoading && (
          <div 
            className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
          >
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    );
  }

  // Fallback for when neither provided
  return (
    <div className={`relative ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={800}
        height={600}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 w-full h-auto ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ width: 'auto', height: 'auto' }}
        {...props}
      />
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
        >
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export { OptimizedImage };
export default OptimizedImage;
