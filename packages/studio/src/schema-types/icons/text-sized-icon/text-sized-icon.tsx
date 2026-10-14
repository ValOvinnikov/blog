import type { LucideIcon } from 'lucide-react';
import type { ComponentType } from 'react';

export const textSizedIcon = (Icon: LucideIcon): ComponentType => {
  const TextSizedIcon = () => (
    // 1.5 keeps the stroke close to @sanity/icons' weight at text size.
    <Icon size="1em" strokeWidth={1.5} />
  );
  TextSizedIcon.displayName = `TextSized(${Icon.displayName ?? 'Icon'})`;

  return TextSizedIcon;
};
