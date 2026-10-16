import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { TextLink } from '@blog/ui/components/atoms/text-link';
import type { ReactNode } from 'react';

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
    className={className}
    dataTestId={dataTestId}
  >
    {children}
  </TextLink>
);
