import { previewFrameVariants } from '@platform/components/shared/preview-frame/preview-frame-variants';
import type { ReactNode } from 'react';

export type TPreviewFrameStageProps = {
  isCompact?: boolean;
  children: ReactNode;
};

export const PreviewFrameStage = ({
  isCompact = false,
  children,
}: TPreviewFrameStageProps) => {
  const { sharedStage } = previewFrameVariants({ isCompact });

  return <div className={sharedStage()}>{children}</div>;
};
