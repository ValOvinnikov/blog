'use client';

import { DEPTH } from '@blog/config';
import { Button } from '@blog/ui/atoms';
import { useDepth } from '@web/components/shared/depth-provider';

export interface ISwitchToReadButtonProps {
  /** Button copy — supplied by the caller (next-intl at the page level). */
  label: string;
}

/**
 * SwitchToReadButton — the `SkimPanel`'s "read the full article" affordance.
 * A small client leaf so `SkimPanel` itself can stay a server component
 * (per `web-component-practices`, the interactive bit is isolated to the
 * smallest leaf that actually needs `useDepth()`).
 */
export const SwitchToReadButton = ({ label }: ISwitchToReadButtonProps) => {
  const { setDepth } = useDepth();

  return <Button onClick={() => setDepth(DEPTH.READ)}>{label}</Button>;
};
