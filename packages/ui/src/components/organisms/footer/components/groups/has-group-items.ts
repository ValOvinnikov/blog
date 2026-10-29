import { hasSlotContent } from '@blog/ui/lib/react';
import { Children, isValidElement, type ReactNode } from 'react';

export const hasGroupItems = (groups: ReactNode): boolean =>
  Children.toArray(groups).some(
    (group) =>
      isValidElement<{ children?: ReactNode }>(group) &&
      Children.toArray(group.props.children).some(hasSlotContent),
  );
