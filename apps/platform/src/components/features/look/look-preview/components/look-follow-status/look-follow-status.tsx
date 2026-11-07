'use client';

import { ICONS, SIZE, type TMaybeUndefined } from '@blog/config';
import { LOOK_ROW_TITLE_KEY } from '@platform/components/features/look/look-form/look-row-title-key';
import type { TLookFollow } from '@platform/components/features/look/look-preview/use-look-follow';
import { Button } from '@platform/components/shared/button';
import { Icon } from '@platform/components/shared/icon';
import { PreviewFrame } from '@platform/components/shared/preview-frame';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { ICON_SIZE } from '@platform/constants/icon';
import { LOOK_FOLLOW_OUTCOME } from '@platform/constants/look-follow';
import {
  PREVIEW_DEVICE,
  type TPreviewDevice,
} from '@platform/constants/preview';
import type { TLookFollowTarget } from '@platform/utils/look-follow-target/look-follow-target';
import { useTranslations } from 'next-intl';

import { LookFollowSentence } from './components/look-follow-sentence';
import { lookFollowStatusVariants } from './look-follow-status-variants';

export type TLookFollowStatusProps = {
  follow: TLookFollow;
  target: TLookFollowTarget;
  device: TPreviewDevice;
  isShortLine: boolean;
  readerNote: TMaybeUndefined<string>;
  planNote: TMaybeUndefined<string>;
};

export const LookFollowStatus = ({
  follow,
  target,
  device,
  isShortLine,
  readerNote,
  planNote,
}: TLookFollowStatusProps) => {
  const t = useTranslations('lookFollow');
  const tForm = useTranslations('lookForm');
  const { isOn, isPaused, isFollowing, row, settled, resume, scrollToTop } =
    follow;
  const { action, topIcon } = lookFollowStatusVariants();
  const part = row ? tForm(LOOK_ROW_TITLE_KEY[row]) : '';

  const isTopOfPageShown =
    isFollowing &&
    !isShortLine &&
    device === PREVIEW_DEVICE.PHONE &&
    settled?.outcome === LOOK_FOLLOW_OUTCOME.AT_END;

  const trailing = isPaused ? (
    <Button size={SIZE.SM} onClick={resume} className={action()}>
      <Icon name={ICONS.CROSSHAIR} size={ICON_SIZE.XS} />
      {t('backTo', { part })}
    </Button>
  ) : (
    isTopOfPageShown && (
      <Button
        size={SIZE.SM}
        variant={BUTTON_VARIANT.GHOST}
        onClick={scrollToTop}
        className={action()}
      >
        <Icon name={ICONS.ARROW_UP} size={ICON_SIZE.XS} className={topIcon()} />
        {t('topOfPage')}
      </Button>
    )
  );

  const isPauseIcon = !isOn || isPaused;

  return (
    <PreviewFrame.Status
      icon={isPauseIcon ? ICONS.PAUSE : ICONS.CROSSHAIR}
      isAccent={!isPauseIcon}
      action={trailing || undefined}
    >
      <LookFollowSentence
        follow={follow}
        target={target}
        device={device}
        isShortLine={isShortLine}
        planNote={planNote}
      />
      {readerNote && !isPaused && ` ${readerNote}`}
    </PreviewFrame.Status>
  );
};
