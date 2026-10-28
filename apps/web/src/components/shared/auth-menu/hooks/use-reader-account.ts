'use client';

import type { TMaybeUndefined } from '@blog/config';
import type { IReaderAccountUser } from '@web/components/shared/auth-menu/components/reader-account-panel/reader-account-panel';
import { SESSION_STATUS } from '@web/constants/session';
import { toSessionUsername } from '@web/utils/to-session-username';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

export const useReaderAccount = () => {
  const { status, data } = useSession();
  const { name, email, image } = data?.user ?? {};
  const [lastImage, setLastImage] = useState(image);
  const [hasImageFailed, setHasImageFailed] = useState(false);

  if (image !== lastImage) {
    setLastImage(image);
    setHasImageFailed(false);
  }

  const user: TMaybeUndefined<IReaderAccountUser> =
    status === SESSION_STATUS.AUTHENTICATED
      ? {
          name: name ?? toSessionUsername(name, email),
          email: email ?? undefined,
          image: hasImageFailed ? undefined : (image ?? undefined),
        }
      : undefined;

  return {
    status,
    expires: data?.expires,
    user,
    onImageError: () => setHasImageFailed(true),
  };
};
