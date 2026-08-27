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
};

/**
 * A button-styled link to a destination this app doesn't control — the
 * tenant's live site, its Sanity Studio — as opposed to `LinkButton`, which
 * navigates within this app. Always opens in a new tab with
 * `rel="noopener noreferrer"`, matching this repo's other genuine
 * external-link components (e.g. `packages/ui`'s `ShareLink`).
 */
export const ExternalLinkButton = ({
  href,
  variant,
  size,
  children,
  className,
  ariaLabel,
}: TExternalLinkButtonProps) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonVariants({ variant, size, class: className })}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
};
