'use client';

import { useEffect, useState } from 'react';

// Performance monitoring utility for development
const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    fps: 0
  });

  useEffect(() => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
      return;
    }

    // Monitor page load performance
    const measureLoadTime = () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        setMetrics(prev => ({
          ...prev,
          loadTime: Math.round(navigation.loadEventEnd - navigation.loadEventStart)
        }));
      }
    };

    // Monitor memory usage
    const measureMemory = () => {
      if ('memory' in performance) {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)
        }));
      }
    };

    // Monitor FPS
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        setMetrics(prev => ({
          ...prev,
          fps: Math.round(frameCount * 1000 / (currentTime - lastTime))
        }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };

    // Start monitoring
    setTimeout(measureLoadTime, 1000);
    const memoryInterval = setInterval(measureMemory, 5000);
    requestAnimationFrame(measureFPS);

    return () => {
      clearInterval(memoryInterval);
    };
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div className="grid grid-cols-2 gap-2">
        <div>Load: {metrics.loadTime}ms</div>
        <div>FPS: {metrics.fps}</div>
        <div>Memory: {metrics.memoryUsage}MB</div>
        <div>Render: {metrics.renderTime}ms</div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
