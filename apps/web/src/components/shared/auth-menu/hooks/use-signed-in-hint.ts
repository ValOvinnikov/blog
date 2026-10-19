'use client';

import type { TMaybeUndefined } from '@blog/config';
import {
  encodeClearedSignedInHint,
  encodeSignedInHint,
} from '@web/utils/signed-in-hint-cookie';
import type { SessionContextValue } from 'next-auth/react';
import { useEffect } from 'react';

export const useSignedInHint = (
  status: SessionContextValue['status'],
  sessionExpires: TMaybeUndefined<string>,
) => {
  useEffect(() => {
    if (status === 'authenticated' && sessionExpires) {
      document.cookie = encodeSignedInHint(sessionExpires);
    }
    if (status === 'unauthenticated') {
      document.cookie = encodeClearedSignedInHint();
    }
  }, [status, sessionExpires]);
};
