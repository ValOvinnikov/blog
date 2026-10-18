'use client';

import { ICONS, SIZE } from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import {
  ACCOUNT_OVERLAY_ID,
  useHeaderOverlay,
} from '@web/context/header-overlay-provider';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

import { accountRowVariants } from './account-row-variants';

export const AccountRow = () => {
  const { status } = useSession();
  const t = useTranslations('authMenu');
  const overlay = useHeaderOverlay();
  const { root, glyph } = accountRowVariants();

  if (status === 'loading' || !overlay) {
    return null;
  }

  const { activeId, setActiveId } = overlay;

  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={activeId === ACCOUNT_OVERLAY_ID}
      onClick={() => setActiveId(ACCOUNT_OVERLAY_ID)}
      className={root()}
    >
      <Icon name={ICONS.USER} size={SIZE.SM} className={glyph()} />
      {status === 'authenticated' ? t('accountHeading') : t('signIn')}
    </button>
  );
};
