import type { ReactNode } from 'react';

import {
  buttonVariants,
  type TButtonVariants,
} from '../button/button-variants';

export type TExternalLinkButtonProps = {
  href: string;
  variant?: TButtonVariants['variant'];
  size?: TButtonVariants['size'];
  children?: ReactNode;
  className?: string;
  ariaLabel?: string;
  /** Only needed alongside `ariaLabel` when `children` is a bare glyph rather than descriptive text — an icon-only control needs both. */
  title?: string;
};

/**
 * A button-styled link to a destination this app doesn't control — the
 * tenant's live site — as opposed to `LinkButton`, which navigates within
 * this app. Always opens in a new tab with `rel="noopener noreferrer"`,
 * matching this repo's other genuine external-link components (e.g.
 * `packages/ui`'s `ShareLink`).
 */
export const ExternalLinkButton = ({
  href,
  variant,
  size,
  children,
  className,
  ariaLabel,
  title,
}: TExternalLinkButtonProps) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonVariants({ variant, size, class: className })}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </a>
  );
};
