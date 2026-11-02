import type { ReactNode } from 'react';

export type TDeviceFrameOverlayProps = {
  children: ReactNode;
};

export const DeviceFrameOverlay = ({ children }: TDeviceFrameOverlayProps) => (
  <>{children}</>
);
