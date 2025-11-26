import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const UpdateNotification = memo(() => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (import.meta.env.DEV) {
        console.log('SW Registered:', r);
      }
    },
    onRegisterError(error) {
      if (import.meta.env.DEV) {
        console.log('SW registration error', error);
      }
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-card border rounded-lg shadow-lg p-4">
      <div className="mb-2">
        {offlineReady ? (
          <p className="text-sm font-medium">App ready to work offline</p>
        ) : (
          <p className="text-sm font-medium">New version available!</p>
        )}
      </div>
      <div className="flex gap-2">
        {needRefresh && (
          <Button 
            size="sm" 
            onClick={() => updateServiceWorker(true)}
          >
            Reload
          </Button>
        )}
        <Button 
          size="sm" 
          variant="outline" 
          onClick={close}
        >
          Close
        </Button>
      </div>
    </div>
  );
});
