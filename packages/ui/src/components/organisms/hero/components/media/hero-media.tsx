import {
  MEDIA_RATIO,
  type IWithClassName,
  type IWithDataTestId,
  type TContentAlignment,
  type THeroVariant,
} from '@shinefold/config';
import { MediaFrame } from '@shinefold/ui/components/atoms/media-frame';
import type { TMediaFrameRatio } from '@shinefold/ui/components/atoms/media-frame/media-frame-variants';
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

/** The media slot of a `Hero`. */
export const HeroMedia = ({
  isFramed = true,
  ratio = MEDIA_RATIO.VIDEO,
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
