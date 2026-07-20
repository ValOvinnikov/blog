import type { IWithDataTestId } from '@blog/config';
import { Size } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { LinkButton } from '@blog/ui/molecules/link-button';
import type { ElementType, ReactNode } from 'react';

export interface IShareLinkItem {
  href: string;
  label: string;
  icon?: ReactNode;
}

export interface IShareLinkProps extends IShareLinkItem, IWithDataTestId {
  className?: string;
  /** Component this share link renders as — defaults to a plain `<a>`. Pass the app router's Link to get client-side navigation. */
  as?: TAnchorElementType;
}

/**
 * ShareLink molecule — a single external share action (e.g. "Share on X"),
 * rendered through `LinkButton` with `target="_blank"` and
 * `rel="noopener noreferrer"` baked in, since every share link opens the
 * target platform in a new tab. `ShareButtons` maps its `links` prop through
 * this component instead of duplicating the same `LinkButton` wiring per
 * platform. It never builds the `href` itself — `apps/web` constructs the
 * platform-specific share URL and passes it in as plain data.
 */
export const ShareLink = ({
  href,
  label,
  icon,
  className,
  dataTestId,
  as,
}: IShareLinkProps) => {
  // Widened for LinkButton's `as` slot: the restricted `TAnchorElementType`
  // union (no `rel`) would otherwise reject the `rel` prop below. The clean
  // fix is adding `rel` to `TAnchorElementType`
  // (packages/config/src/react/polymorphic.ts), but that's a config-layer
  // change out of scope for this ticket (#581) — left as a follow-up.
  const asElement = as as ElementType | undefined;

  return (
    <LinkButton
      as={asElement}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      variant="ghost"
      size={Size.SM}
      className={className}
      dataTestId={dataTestId}
    >
      {icon}
      {label}
    </LinkButton>
  );
};
