import type {
  IWithClassName,
  IWithDataTestId,
  TContentAlignment,
  THeroVariant,
} from '@blog/config';
import { MediaFrame } from '@blog/ui/components/atoms/media-frame';
import type { TMediaFrameRatio } from '@blog/ui/components/atoms/media-frame/media-frame-variants';
import type { ReactNode } from 'react';

import { heroMediaVariants } from './hero-media-variants';

export type THeroMediaProps = IWithClassName &
  IWithDataTestId & {
    isFramed?: boolean;
    ratio?: TMediaFrameRatio;
    variant?: THeroVariant;
    contentAlignment?: TContentAlignment;
    children?: ReactNode;
  };

/** The media slot of a `Hero`; frames its content via `MediaFrame`, at a configurable ratio (16:9 by default). */
export const HeroMedia = ({
  isFramed = true,
  ratio = 'video',
  variant,
  contentAlignment,
  className,
  dataTestId,
  children,
}: THeroMediaProps) =>
  isFramed ? (
    <MediaFrame
      ratio={ratio}
      className={heroMediaVariants({
        ratio,
        variant,
        contentAlignment,
        class: className,
      })}
      dataTestId={dataTestId}
    >
      {children}
    </MediaFrame>
  ) : (
    children
  );
