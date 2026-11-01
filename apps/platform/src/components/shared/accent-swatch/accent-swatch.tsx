import { SIZE } from '@blog/config';
import { buildAccentPreviewTokens } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';

import { accentSwatchVariants } from './accent-swatch-variants';

type TAccentSwatchProps = {
  hue: number;
  size?: typeof SIZE.SM | typeof SIZE.MD | typeof SIZE.LG;
  name?: string;
};

export const AccentSwatch = ({
  hue,
  size = SIZE.MD,
  name,
}: TAccentSwatchProps) => (
  <span
    role={name ? 'img' : undefined}
    aria-label={name}
    aria-hidden={name ? undefined : true}
    data-testid="accent-swatch"
    className={accentSwatchVariants({ size })}
    style={{
      background: buildAccentPreviewTokens(hue, false)['--brand-primary'],
    }}
  />
);
