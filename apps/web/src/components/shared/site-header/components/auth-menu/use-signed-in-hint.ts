'use client';

import type { TMaybeUndefined } from '@blog/config';
import { SESSION_STATUS } from '@web/constants/session';
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
    if (status === SESSION_STATUS.AUTHENTICATED && sessionExpires) {
      document.cookie = encodeSignedInHint(sessionExpires);
    }
    if (status === SESSION_STATUS.UNAUTHENTICATED) {
      document.cookie = encodeClearedSignedInHint();
    }
  }, [status, sessionExpires]);
};
