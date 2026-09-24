import type { IWithClassName, IWithDataTestId } from '@blog/config';

import {
  brandMarkImageVariants,
  brandMarkVariants,
  type TBrandMarkVariants,
} from './brand-mark-variants';

export type TBrandMarkProps = IWithClassName &
  IWithDataTestId & {
    size?: TBrandMarkVariants['size'];
    title?: string;
    src?: string;
    isStacked?: boolean;
  };

/** The brand mark, rendered from an uploaded image when `src` is supplied, or as three stacked polygon layers coloured from the `--logo-1/2/3` design tokens via inline `style` otherwise (these tokens aren't mirrored into `@theme inline` as Tailwind utilities). */
export const BrandMark = ({
  src,
  size,
  isStacked,
  title,
  className,
  dataTestId,
}: TBrandMarkProps) => {
  if (src) {
    return (
      <img
        src={src}
        alt={title ?? ''}
        className={brandMarkImageVariants({
          size,
          stacked: isStacked,
          class: className,
        })}
        data-testid={dataTestId}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className={brandMarkVariants({ size, class: className })}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      data-testid={dataTestId}
    >
      {title && <title>{title}</title>}
      <polygon points="12,3 22,7 12,11 2,7" style={{ fill: 'var(--logo-1)' }} />
      <polygon
        points="12,8 22,12 12,16 2,12"
        style={{ fill: 'var(--logo-2)' }}
      />
      <polygon
        points="12,13 22,17 12,21 2,17"
        style={{ fill: 'var(--logo-3)' }}
      />
    </svg>
  );
};
