'use client';

import type { IWithChildren } from '@blog/config/react';
import { textLinkVariants } from '@blog/ui/components/atoms/text-link/text-link-variants';
import { useConsentPreferences } from '@web/context/consent-preferences-provider';

const { root } = textLinkVariants({ appearance: 'prose', hasHref: true });

export const CookiePreferencesLink = ({ children }: IWithChildren) => {
  const { open } = useConsentPreferences();

  return (
    <button
      type="button"
      onClick={open}
      className={root({ class: 'cursor-pointer' })}
    >
      {children}
    </button>
  );
};
