import {
  isDocumentVisible,
  subscribeToVisibilityChange,
} from '@platform/utils/use-document-visible/use-document-visible';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export const useRefreshOnTabReturn = () => {
  const router = useRouter();

  useEffect(() => {
    let isAway = false;

    // Focus moving into an iframe on the page blurs the window but leaves the document focused.
    const markAway = () => {
      if (!isDocumentVisible() || !document.hasFocus()) isAway = true;
    };
    const refreshIfReturned = () => {
      if (!isAway || !isDocumentVisible()) return;
      isAway = false;
      router.refresh();
    };
    const followVisibility = () =>
      isDocumentVisible() ? refreshIfReturned() : markAway();

    window.addEventListener('blur', markAway);
    window.addEventListener('focus', refreshIfReturned);
    const unsubscribe = subscribeToVisibilityChange(followVisibility);

    return () => {
      window.removeEventListener('blur', markAway);
      window.removeEventListener('focus', refreshIfReturned);
      unsubscribe();
    };
  }, [router]);
};
