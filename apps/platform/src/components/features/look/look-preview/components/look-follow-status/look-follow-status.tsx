'use client';

import { ICONS, SIZE, type TMaybeUndefined } from '@blog/config';
import { LOOK_ROW_TITLE_KEY } from '@platform/components/features/look/look-form/look-row-title-key';
import type { TLookFollow } from '@platform/components/features/look/look-preview/use-look-follow';
import { Button } from '@platform/components/shared/button';
import { Icon } from '@platform/components/shared/icon';
import { PreviewFrame } from '@platform/components/shared/preview-frame';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { ICON_SIZE } from '@platform/constants/icon';
import {
  LOOK_FOLLOW_OUTCOME,
  LOOK_FOLLOW_TARGET,
} from '@platform/constants/look-follow';
import {
  PREVIEW_DEVICE,
  type TPreviewDevice,
} from '@platform/constants/preview';
import type { TLookFollowTarget } from '@platform/utils/look-follow-target/look-follow-target';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { lookFollowStatusVariants } from './look-follow-status-variants';

export type TLookFollowStatusProps = {
  follow: TLookFollow;
  target: TLookFollowTarget;
  device: TPreviewDevice;
  isShortLine: boolean;
  readerNote: TMaybeUndefined<string>;
};

const strong = (chunks: ReactNode) => <strong>{chunks}</strong>;

export const LookFollowStatus = ({
  follow,
  target,
  device,
  isShortLine,
  readerNote,
}: TLookFollowStatusProps) => {
  const t = useTranslations('lookFollow');
  const tForm = useTranslations('lookForm');
  const { isOn, isPaused, isFollowing, row, settled, resume, scrollToTop } =
    follow;
  const { action, topIcon } = lookFollowStatusVariants();
  const part = row ? tForm(LOOK_ROW_TITLE_KEY[row]) : '';
  const values = { part, strong };

  const sentence = (): ReactNode => {
    if (!isOn) return t('off');
    if (target.kind === LOOK_FOLLOW_TARGET.IDLE) return t('idle');
    if (target.kind === LOOK_FOLLOW_TARGET.ALL_OPEN) return t('allOpen');
    if (target.kind === LOOK_FOLLOW_TARGET.STYLE) {
      return t.rich('styleCard', {
        card: tForm(LOOK_ROW_TITLE_KEY[target.row]),
        strong,
      });
    }
    if (isPaused) return t('paused');
    if (isShortLine || !settled) return t.rich('short', values);
    switch (settled.outcome) {
      case LOOK_FOLLOW_OUTCOME.NEARLY_FITS:
        return t.rich('nearlyFits', { ...values, overflow: settled.overflow });
      case LOOK_FOLLOW_OUTCOME.AT_END:
        return t.rich('atEnd', values);
      case LOOK_FOLLOW_OUTCOME.AT_TOP:
        return t.rich('atTop', values);
      case LOOK_FOLLOW_OUTCOME.FITS:
        return t.rich('fits', { ...values, device });
      default:
        return t.rich('inView', values);
    }
  };

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
      {sentence()}
      {readerNote && (
        <>
          {' '}
          <span>{readerNote}</span>
        </>
      )}
    </PreviewFrame.Status>
  );
};
