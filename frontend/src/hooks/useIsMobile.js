import { useState, useEffect } from 'react';

/**
 * Custom hook to detect mobile devices
 * Returns true if screen width <= 768px OR if it's a mobile user agent
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      // Check screen width
      const isMobileWidth = window.innerWidth <= 768;

      // Check user agent for mobile devices
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

      setIsMobile(isMobileWidth || isMobileUA);
    };

    // Initial check
    checkIsMobile();

    // Listen for window resize
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

export default useIsMobile;
