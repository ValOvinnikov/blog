import type { IWithClassName, IWithDataTestId } from '@blog/config';
import { MediaFrame } from '@blog/ui/atoms/media-frame';
import type { ReactNode } from 'react';

import { heroMediaVariants } from './hero-media-variants';

export type THeroMediaProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/**
 * HeroMedia — the media slot of a `Hero`; frames its content at a 16:9 ratio via
 * `MediaFrame`.
 */
export const HeroMedia = ({
  className,
  dataTestId,
  children,
}: THeroMediaProps) => (
  <MediaFrame
    ratio="video"
    className={heroMediaVariants({ class: className })}
    dataTestId={dataTestId}
  >
    {children}
  </MediaFrame>
);
