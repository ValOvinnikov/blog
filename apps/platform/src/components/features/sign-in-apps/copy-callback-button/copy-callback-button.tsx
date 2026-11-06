'use client';

import { ICONS } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { Icon } from '@platform/components/shared/icon';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { COPY_STATUS } from '@platform/constants/clipboard';
import { ICON_SIZE } from '@platform/constants/icon';
import { useCopyToClipboard } from '@platform/utils/use-copy-to-clipboard/use-copy-to-clipboard';
import { useTranslations } from 'next-intl';
import type { Ref } from 'react';

import { copyCallbackButtonVariants } from './copy-callback-button-variants';

const ANNOUNCEMENT_KEYS = {
  [COPY_STATUS.IDLE]: null,
  [COPY_STATUS.COPIED]: 'copied',
  [COPY_STATUS.FAILED]: 'copyFailed',
} as const;

export type TCopyCallbackButtonProps = {
  value: string;
  ref?: Ref<HTMLButtonElement>;
};

export const CopyCallbackButton = ({
  value,
  ref,
}: TCopyCallbackButtonProps) => {
  const t = useTranslations('signInAppsPage');
  const { status, copy } = useCopyToClipboard();
  const { root, liveRegion } = copyCallbackButtonVariants();
  const isCopied = status === COPY_STATUS.COPIED;

  return (
    <>
      <Button
        ref={ref}
        variant={BUTTON_VARIANT.SECONDARY}
        onClick={() => copy(value)}
        className={root()}
      >
        <Icon name={isCopied ? ICONS.TICK : ICONS.COPY} size={ICON_SIZE.MD} />
        {t(isCopied ? 'copied' : 'copy')}
      </Button>
      <span role="status" className={liveRegion()}>
        {ANNOUNCEMENT_KEYS[status] && t(ANNOUNCEMENT_KEYS[status])}
      </span>
    </>
  );
};
