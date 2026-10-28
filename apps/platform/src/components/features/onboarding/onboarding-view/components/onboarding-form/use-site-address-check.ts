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

type TCheckedSlug = {
  slug: string;
  error: TMaybeUndefined<TTenantSlugError>;
};

export type TSiteAddressCheck = {
  status: TSiteAddressStatus;
  error: TMaybeUndefined<TTenantSlugError>;
};

const toSiteAddressStatus = (
  slug: string,
  check: TMaybeUndefined<TCheckedSlug>,
): TSiteAddressStatus => {
  if (!slug) return SITE_ADDRESS_STATUS.IDLE;
  if (check?.slug !== slug) return SITE_ADDRESS_STATUS.CHECKING;
  if (check.error) return SITE_ADDRESS_STATUS.UNAVAILABLE;
  return SITE_ADDRESS_STATUS.AVAILABLE;
};

export const useSiteAddressCheck = (slug: string): TSiteAddressCheck => {
  const [check, setCheck] = useState<TMaybeUndefined<TCheckedSlug>>(undefined);

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

  const status = toSiteAddressStatus(slug, check);

  return {
    status,
    error:
      status === SITE_ADDRESS_STATUS.UNAVAILABLE ? check?.error : undefined,
  };
};
