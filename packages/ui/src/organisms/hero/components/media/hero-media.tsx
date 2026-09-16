import type { IWithClassName, IWithDataTestId } from '@blog/config';
import { MediaFrame } from '@blog/ui/atoms/media-frame';
import type { TMediaFrameRatio } from '@blog/ui/atoms/media-frame/media-frame-variants';
import type { ReactNode } from 'react';

import { heroMediaVariants } from './hero-media-variants';

export type THeroMediaProps = IWithClassName &
  IWithDataTestId & {
    isFramed?: boolean;
    /** Ignored on Banner, whose media is unframed. */
    ratio?: TMediaFrameRatio;
    children?: ReactNode;
  };

/**
 * HeroMedia — the media slot of a `Hero`; frames its content via `MediaFrame`,
 * at a configurable ratio (16:9 by default).
 */
export const HeroMedia = ({
  isFramed = true,
  ratio = 'video',
  className,
  dataTestId,
  children,
}: THeroMediaProps) =>
  isFramed ? (
    <MediaFrame
      ratio={ratio}
      className={heroMediaVariants({ ratio, class: className })}
      dataTestId={dataTestId}
    >
      {children}
    </MediaFrame>
  ) : (
    children
  );
