'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

/** Refreshes the route once `isActive` turns false, so server-rendered chrome the polling component cannot reach catches up with what it saw finish. */
export const useRefreshOnSettle = (isActive: boolean) => {
  const router = useRouter();
  const wasActiveRef = useRef(isActive);

  useEffect(() => {
    if (wasActiveRef.current && !isActive) {
      router.refresh();
    }
    wasActiveRef.current = isActive;
  }, [isActive, router]);
};
