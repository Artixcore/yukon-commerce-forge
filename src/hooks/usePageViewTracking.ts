import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackMetaEvent } from '@/lib/metaTracking';

export const usePageViewTracking = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Skip admin routes - only track public pages
    if (!location.pathname.startsWith('/admin')) {
      trackMetaEvent('PageView', {
        content_name: document.title || location.pathname,
      });
    }
  }, [location.pathname]);
};
