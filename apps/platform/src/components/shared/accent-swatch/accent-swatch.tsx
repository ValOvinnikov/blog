import { type IWithClassName, SIZE } from '@blog/config';
import { ACCENT_SWATCH_TEST_ID } from '@platform/constants/accent-swatch';
import { buildAccentPreviewTokens } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';

import { accentSwatchVariants } from './accent-swatch-variants';

type TAccentSwatchProps = IWithClassName & {
  hue: number;
  size?: typeof SIZE.SM | typeof SIZE.MD | typeof SIZE.LG;
  name?: string;
};

export const AccentSwatch = ({
  hue,
  size = SIZE.MD,
  name,
  className,
}: TAccentSwatchProps) => (
  <span
    role={name ? 'img' : undefined}
    aria-label={name}
    aria-hidden={name ? undefined : true}
    data-testid={ACCENT_SWATCH_TEST_ID}
    className={accentSwatchVariants({ size, class: className })}
    style={{
      background: buildAccentPreviewTokens(hue, false)['--brand-primary'],
    }}
  />
);
