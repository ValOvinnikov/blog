import {
  Icon,
  type TRegisteredIconName,
} from '@platform/components/shared/icon';
import { previewFrameVariants } from '@platform/components/shared/preview-frame/preview-frame-variants';
import { ICON_SIZE } from '@platform/constants/icon';
import type { ReactNode } from 'react';

export type TPreviewFrameStatusProps = {
  icon: TRegisteredIconName;
  isAccent?: boolean;
  action?: ReactNode;
  children: ReactNode;
};

export const PreviewFrameStatus = ({
  icon,
  isAccent = false,
  action,
  children,
}: TPreviewFrameStatusProps) => {
  const { status, statusIcon, statusText, statusAction } = previewFrameVariants(
    { isAccent },
  );

  return (
    <div className={status()}>
      <span className={statusIcon()}>
        <Icon name={icon} size={ICON_SIZE.MD} strokeWidth={2} />
      </span>
      <span className={statusText()}>{children}</span>
      {action && <span className={statusAction()}>{action}</span>}
    </div>
  );
};
