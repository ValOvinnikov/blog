import { type IWithClassName, type IWithDataTestId, SIZE } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import type { IWithIcon } from '@blog/ui/lib/react';
import { LinkButton } from '@blog/ui/molecules/link-button';
import type { ElementType } from 'react';

export interface IShareLinkItem extends IWithIcon {
  href: string;
  label: string;
}

export type TShareLinkProps = IShareLinkItem &
  IWithClassName &
  IWithDataTestId & {
    as?: TAnchorElementType;
  };

/** A single external share action (e.g. "Share on X"), rendered through `LinkButton` with `target="_blank"` and `rel="noopener noreferrer"` baked in, since every share link opens the target platform in a new tab. */
export const ShareLink = ({
  href,
  label,
  icon,
  className,
  dataTestId,
  as,
}: TShareLinkProps) => {
  // Widened for LinkButton's `as` slot: the restricted `TAnchorElementType` union (no `rel`) would otherwise reject the `rel` prop below.
  const asElement = as as ElementType | undefined;

  return (
    <LinkButton
      as={asElement}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      variant="ghost"
      size={SIZE.SM}
      className={className}
      dataTestId={dataTestId}
    >
      {icon}
      {label}
    </LinkButton>
  );
};
