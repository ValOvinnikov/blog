import {
  MEDIA_RATIO,
  type IWithClassName,
  type IWithDataTestId,
} from '@shinefold/config';
import { MediaFrame } from '@shinefold/ui/components/atoms/media-frame';
import type { ReactNode } from 'react';

export type TCtaModuleMediaProps = IWithClassName &
  IWithDataTestId & {
    isFramed?: boolean;
    children?: ReactNode;
  };

/** The image slot of a `CtaModule`; framed at 16:9 in a card, unframed behind a banner's copy. */
export const CtaModuleMedia = ({
  isFramed = true,
  className,
  dataTestId,
  children,
}: TCtaModuleMediaProps) =>
  isFramed ? (
    <MediaFrame
      ratio={MEDIA_RATIO.VIDEO}
      className={className}
      dataTestId={dataTestId}
    >
      {children}
    </MediaFrame>
  ) : (
    <div className={className} data-testid={dataTestId}>
      {children}
    </div>
  );
