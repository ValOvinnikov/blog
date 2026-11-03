import type { TPresetId } from '@blog/config';

import { presetMiniVariants } from './preset-mini-variants';

export type TPresetMiniProps = {
  preset: TPresetId;
  title: string;
  tagline: string;
  titleFontFamily: string;
};

const NAV_BAR_KEYS = ['first', 'second', 'third'] as const;

export const PresetMini = ({
  preset,
  title,
  tagline,
  titleFontFamily,
}: TPresetMiniProps) => {
  const {
    root,
    nav,
    navBars,
    logo,
    bar,
    title: titleClass,
    tagline: taglineClass,
    skeleton,
    skeletonLong,
    skeletonShort,
  } = presetMiniVariants({ preset });

  return (
    <span className={root()} aria-hidden="true">
      <span className={nav()}>
        <span className={logo()} />
        <span className={navBars()}>
          {NAV_BAR_KEYS.map((key) => (
            <span key={key} className={bar()} />
          ))}
        </span>
      </span>
      <span className={titleClass()} style={{ fontFamily: titleFontFamily }}>
        {title}
      </span>
      <span className={taglineClass()}>{tagline}</span>
      <span className={skeleton()}>
        <span className={skeletonLong()} />
        <span className={skeletonShort()} />
      </span>
    </span>
  );
};
