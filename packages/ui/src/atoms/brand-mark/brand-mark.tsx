import type { IWithDataTestId, Size } from '@blog/config';
import type { SVGProps } from 'react';

import { brandMarkVariants } from './brand-mark-variants';

export type TBrandMarkVariant = 'console' | 'indigo';

/**
 * Fill order (back → front) for each palette variant, sourced from the
 * `--logo-*` design tokens in `configs/tailwind/theme.css`. These tokens are
 * raw CSS custom properties (not mirrored into `@theme inline` as Tailwind
 * utilities), so fills are applied via inline `style`, not class names.
 */
const MARK_FILLS: Record<TBrandMarkVariant, readonly [string, string, string]> =
  {
    console: ['var(--logo-1)', 'var(--logo-2)', 'var(--logo-3)'],
    indigo: ['var(--logo-alt-1)', 'var(--logo-alt-2)', 'var(--logo-alt-3)'],
  };

export interface IBrandMarkProps
  extends
    Omit<SVGProps<SVGSVGElement>, 'className' | 'title'>,
    IWithDataTestId {
  variant?: TBrandMarkVariant;
  size?: typeof Size.SM | typeof Size.MD | typeof Size.LG;
  /** Accessible title for standalone use. Omit to keep the mark decorative. */
  title?: string;
  className?: string;
}

/**
 * BrandMark atom — the brand mark as three stacked polygon layers, coloured
 * from the `--logo-1/2/3` (Console) or `--logo-alt-1/2/3` (Indigo) tokens.
 * Decorative by default (no accessible name); pass `title` when it's used
 * standalone rather than nested inside a labelled composition.
 */
export const BrandMark = ({
  variant = 'console',
  size,
  title,
  className,
  dataTestId,
  ...rest
}: IBrandMarkProps) => {
  const [back, mid, front] = MARK_FILLS[variant];

  return (
    <svg
      viewBox="0 0 24 24"
      className={brandMarkVariants({ size, class: className })}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      data-testid={dataTestId}
      {...rest}
    >
      {title && <title>{title}</title>}
      <polygon points="12,3 22,7 12,11 2,7" style={{ fill: back }} />
      <polygon points="12,8 22,12 12,16 2,12" style={{ fill: mid }} />
      <polygon points="12,13 22,17 12,21 2,17" style={{ fill: front }} />
    </svg>
  );
};
