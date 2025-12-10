'use client';

import { memo, useEffect, useState } from 'react';

const MobileOptimizedLayout = memo(function MobileOptimizedLayout({ children }) {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return (
    <div className={`min-h-screen ${isMobile ? 'mobile-optimized' : ''} ${isTablet ? 'tablet-optimized' : ''}`}>
      {children}
    </div>
  );
});

export default MobileOptimizedLayout;
