import type { IWithClassName, IWithDataTestId } from '@shinefold/config';
import type { TAnchorElementType } from '@shinefold/config/react';
import { TextLink } from '@shinefold/ui/components/atoms/text-link';
import type { ReactNode } from 'react';

import { mediaCardLinkVariants } from './media-card-link-variants';

export type TMediaCardLinkProps = IWithClassName &
  IWithDataTestId & {
    href: string;
    as?: TAnchorElementType;
    target?: '_blank';
    ariaLabel?: string;
    children: ReactNode;
  };

/** The one link that makes the whole card its click target. */
export const MediaCardLink = ({
  href,
  as,
  target,
  ariaLabel,
  children,
  className,
  dataTestId,
}: TMediaCardLinkProps) => (
  <TextLink
    href={href}
    as={as}
    target={target}
    ariaLabel={ariaLabel}
    appearance="quiet"
    isStretched={true}
    className={mediaCardLinkVariants({ class: className })}
    dataTestId={dataTestId}
  >
    {children}
  </TextLink>
);
