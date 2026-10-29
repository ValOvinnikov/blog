import { hasSlotContent } from '@blog/ui/lib/react';
import {
  Children,
  isValidElement,
  type PropsWithChildren,
  type ReactNode,
} from 'react';

export const hasGroupItems = (groups: ReactNode): boolean =>
  Children.toArray(groups).some(
    (group) =>
      isValidElement<PropsWithChildren>(group) &&
      Children.toArray(group.props.children).some(hasSlotContent),
  );
