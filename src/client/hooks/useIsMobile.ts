import { useState, useEffect } from 'react';

const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if window is defined (for Server-Side Rendering compatibility)
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    
    const handleMediaQueryChange = (event) => {
      setIsMobile(event.matches);
    };

    // Initial check
    setIsMobile(mql.matches);

    // Listen for changes
    // Use addEventListener for modern browsers, addListener is deprecated
    mql.addEventListener('change', handleMediaQueryChange);

    // Cleanup function
    return () => {
      mql.removeEventListener('change', handleMediaQueryChange);
    };
  }, [breakpoint]);

  return isMobile;
};

export default useIsMobile;
