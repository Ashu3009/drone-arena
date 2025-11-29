import { useState, useEffect } from 'react';

/**
 * Custom hook to detect mobile devices
 * Returns true if screen width <= 480px OR if it's a mobile user agent
 * Responsive: Automatically updates on window resize
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      // Check screen width (480px for mobile phones only, laptops/tablets show desktop)
      const isMobileWidth = window.innerWidth <= 480;

      // Check user agent for mobile devices
      const isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
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
