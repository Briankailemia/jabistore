// Performance optimization utilities
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
};

// Intersection Observer for lazy loading
export const createIntersectionObserver = (callback, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1
  };

  return new IntersectionObserver(callback, { ...defaultOptions, ...options });
};

// Preload critical resources
export const preloadResource = (href, as = 'script') => {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
};

// Bundle size analyzer
export const analyzeBundleSize = () => {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return;
  
  console.group('Bundle Analysis');
  console.log('Scripts loaded:', document.scripts.length);
  console.log('Stylesheets loaded:', document.styleSheets.length);
  console.log('Images loaded:', document.images.length);
  console.groupEnd();
};

// Memory leak detector
export const detectMemoryLeaks = () => {
  if (typeof window === 'undefined' || !performance.memory) return;
  
  const memoryInfo = performance.memory;
  const threshold = 50 * 1024 * 1024; // 50MB
  
  if (memoryInfo.usedJSHeapSize > threshold) {
    console.warn('High memory usage detected:', {
      used: Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) + 'MB',
      total: Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024) + 'MB',
      limit: Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024) + 'MB'
    });
  }
};
