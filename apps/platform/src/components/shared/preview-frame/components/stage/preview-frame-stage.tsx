import { previewFrameVariants } from '@platform/components/shared/preview-frame/preview-frame-variants';
import type { ReactNode, Ref } from 'react';

export type TPreviewFrameStageProps = {
  isCompact?: boolean;
  className?: string;
  children: ReactNode;
  ref?: Ref<HTMLDivElement>;
};

export const PreviewFrameStage = ({
  isCompact = false,
  className,
  children,
  ref,
}: TPreviewFrameStageProps) => {
  const { sharedStage } = previewFrameVariants({ isCompact });

  return (
    <div ref={ref} className={sharedStage({ class: className })}>
      {children}
    </div>
  );
};
