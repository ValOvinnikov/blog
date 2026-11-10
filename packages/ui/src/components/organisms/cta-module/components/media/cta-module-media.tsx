import type { IWithClassName, IWithDataTestId } from '@blog/config';
import { MediaFrame } from '@blog/ui/components/atoms/media-frame';
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
    <MediaFrame ratio="video" className={className} dataTestId={dataTestId}>
      {children}
    </MediaFrame>
  ) : (
    <div className={className} data-testid={dataTestId}>
      {children}
    </div>
  );
