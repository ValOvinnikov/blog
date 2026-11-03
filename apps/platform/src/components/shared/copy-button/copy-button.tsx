'use client';

import { ICONS } from '@blog/config';
import { IconSoloButton } from '@platform/components/shared/icon-solo-button';
import { COPY_STATUS } from '@platform/constants/clipboard';
import { useCopyToClipboard } from '@platform/utils/use-copy-to-clipboard/use-copy-to-clipboard';
import { useTranslations } from 'next-intl';

import { copyButtonVariants } from './copy-button-variants';

const ANNOUNCEMENT_KEYS = {
  [COPY_STATUS.IDLE]: null,
  [COPY_STATUS.COPIED]: 'copied',
  [COPY_STATUS.FAILED]: 'failed',
} as const;

export type TCopyButtonProps = {
  value: string;
  ariaLabel: string;
  className?: string;
};

export const CopyButton = ({
  value,
  ariaLabel,
  className,
}: TCopyButtonProps) => {
  const t = useTranslations('copyButton');
  const { status, copy } = useCopyToClipboard();
  const { root, liveRegion } = copyButtonVariants();
  const announcementKey = ANNOUNCEMENT_KEYS[status];
  const announcement = announcementKey ? t(announcementKey) : '';

  return (
    <span className={root({ class: className })}>
      <IconSoloButton
        ariaLabel={ariaLabel}
        tooltip={announcement || t('tooltip')}
        icon={status === COPY_STATUS.COPIED ? ICONS.TICK : ICONS.COPY}
        onClick={() => copy(value)}
        isTooltipEndAligned={true}
      />
      <span role="status" aria-live="polite" className={liveRegion()}>
        {announcement}
      </span>
    </span>
  );
};
