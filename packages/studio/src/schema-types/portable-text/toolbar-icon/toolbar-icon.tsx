import type { LucideIcon } from 'lucide-react';
import type { ComponentType } from 'react';

// Lucide renders at 24px by default; Sanity's own toolbar icons are 1em.
export const toToolbarIcon = (Icon: LucideIcon): ComponentType => {
  const ToolbarIcon = () => <Icon size="1em" />;
  return ToolbarIcon;
};
