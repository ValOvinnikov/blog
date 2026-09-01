import type { ReactNode } from 'react';

import {
  bannerStateVariants,
  type TBannerStateVariants,
} from './banner-state-variants';

const GLYPH: Record<NonNullable<TBannerStateVariants['tone']>, string> = {
  ok: '✓',
  warn: '◐',
  bad: '!',
};

export type TBannerStateProps = {
  tone: NonNullable<TBannerStateVariants['tone']>;
  role: 'status' | 'alert';
  title: ReactNode;
  description: ReactNode;
  action: ReactNode;
  /** Lets a caller point a disabled control's `aria-describedby` at this banner. */
  id?: string;
};

export const BannerState = ({
  tone,
  role,
  title,
  description,
  action,
  id,
}: TBannerStateProps) => {
  const {
    root,
    icon,
    textGroup,
    title: titleClass,
    description: descriptionClass,
  } = bannerStateVariants();

  return (
    <div id={id} className={root({ tone })} role={role}>
      <span className={icon()} aria-hidden="true">
        {GLYPH[tone]}
      </span>
      <div className={textGroup()} aria-live="polite">
        <strong className={titleClass()}>{title}</strong>
        <span className={descriptionClass()}>{description}</span>
      </div>
      {action}
    </div>
  );
};
