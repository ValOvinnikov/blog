'use client';

import type { TMaybeUndefined } from '@blog/config';
import {
  SITE_ADDRESS_STATUS,
  type TSiteAddressStatus,
} from '@platform/constants/onboarding';
import { checkSiteAddressAction } from '@platform/server/onboarding/check-site-address-action';
import type { TTenantSlugError } from '@platform/server/tenants/check-tenant-slug';
import { useEffect, useState } from 'react';

// Long enough that typing an address runs one check, not one per keystroke.
const SITE_ADDRESS_CHECK_DELAY_MS = 400;

type TSiteAddressCheck = {
  slug: string;
  error: TMaybeUndefined<TTenantSlugError>;
};

export const useSiteAddressCheck = (slug: string) => {
  const [check, setCheck] =
    useState<TMaybeUndefined<TSiteAddressCheck>>(undefined);

  useEffect(() => {
    if (!slug) return;

    let isCurrent = true;
    const timer = setTimeout(() => {
      checkSiteAddressAction(slug).then(
        (error) => {
          if (isCurrent) setCheck({ slug, error });
        },
        () => undefined,
      );
    }, SITE_ADDRESS_CHECK_DELAY_MS);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [slug]);

  const isChecked = Boolean(slug) && check?.slug === slug;
  const status: TSiteAddressStatus = !slug
    ? SITE_ADDRESS_STATUS.IDLE
    : !isChecked
      ? SITE_ADDRESS_STATUS.CHECKING
      : check?.error
        ? SITE_ADDRESS_STATUS.UNAVAILABLE
        : SITE_ADDRESS_STATUS.AVAILABLE;

  return { status, error: isChecked ? check?.error : undefined };
};
