import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef } from 'react';

import {
  brandMarkImageVariants,
  brandMarkVariants,
  type TBrandMarkVariants,
} from './brand-mark-variants';

/** Attributes valid on both the `<svg>` and `<img>` render branches, so passthrough props aren't dropped when `src` selects the image variant. */
type TBrandMarkRestProps = Omit<
  ComponentPropsWithoutRef<'svg'> & ComponentPropsWithoutRef<'img'>,
  'className' | 'title' | 'src' | 'alt'
>;

export interface IBrandMarkProps extends TBrandMarkRestProps, IWithDataTestId {
  /** Ignored on the uploaded-image branch when `stacked` is set — its sizing is container-width-driven instead. */
  size?: TBrandMarkVariants['size'];
  /** Accessible title for standalone use. Omit to keep the mark decorative. */
  title?: string;
  className?: string;
  /** Uploaded brand-mark image source; renders in place of the polygon mark when set. */
  src?: string;
  /** Sizes the uploaded image to span the available width with a bounded height, instead of a fixed height — for rendering above a spec line. No effect on the polygon fallback, which is always square. */
  stacked?: boolean;
}

/**
 * BrandMark atom — the brand mark, rendered from an uploaded image when
 * `src` is supplied, or as three stacked polygon layers coloured from the
 * `--logo-1/2/3` design tokens via inline `style` otherwise (these tokens
 * aren't mirrored into `@theme inline` as Tailwind utilities). Decorative by
 * default (no accessible name); pass `title` when it's used standalone
 * rather than nested inside a labelled composition.
 */
export const BrandMark = ({
  src,
  size,
  stacked,
  title,
  className,
  dataTestId,
  ...rest
}: IBrandMarkProps) => {
  if (src) {
    return (
      <img
        src={src}
        alt={title ?? ''}
        className={brandMarkImageVariants({ size, stacked, class: className })}
        data-testid={dataTestId}
        {...rest}
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
      {...rest}
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
