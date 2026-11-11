'use client';

import type { TMaybeUndefined } from '@blog/config';
import { LOOK_ROW_TITLE_KEY } from '@platform/components/features/look/look-form/look-row-title-key';
import type { TLookFollow } from '@platform/components/features/look/look-preview/use-look-follow';
import {
  LOOK_FOLLOW_OUTCOME,
  LOOK_FOLLOW_TARGET,
} from '@platform/constants/look-follow';
import type { TPreviewDevice } from '@platform/constants/preview';
import type { TLookFollowTarget } from '@platform/utils/look-follow-target/look-follow-target';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

export type TLookFollowSentenceProps = {
  follow: TLookFollow;
  target: TLookFollowTarget;
  device: TPreviewDevice;
  isShortLine: boolean;
  planNote: TMaybeUndefined<string>;
};

const strong = (chunks: ReactNode) => <strong>{chunks}</strong>;

export const LookFollowSentence = ({
  follow: { isOn, isPaused, outline, settled },
  target,
  device,
  isShortLine,
  planNote,
}: TLookFollowSentenceProps) => {
  const t = useTranslations('lookFollow');
  const tForm = useTranslations('lookForm');
  const part = outline ? tForm(LOOK_ROW_TITLE_KEY[outline.row]) : '';
  const values = { part, strong };

  if (!isOn) return t('off');
  if (
    target.kind === LOOK_FOLLOW_TARGET.IDLE ||
    target.kind === LOOK_FOLLOW_TARGET.UNEDITED
  ) {
    return t('idle');
  }
  if (target.kind === LOOK_FOLLOW_TARGET.ALL_OPEN) return t('allOpen');
  if (isPaused) return t('paused');
  if (target.kind === LOOK_FOLLOW_TARGET.STYLE) {
    return (
      <>
        {t.rich(outline ? 'styleOutlined' : 'styleCard', {
          card: tForm(LOOK_ROW_TITLE_KEY[target.row]),
          strong,
        })}
        {planNote && ` ${planNote}`}
      </>
    );
  }
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
