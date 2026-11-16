'use client';

import { Menu } from '@base-ui/react/menu';
import { useIsNestedMenu } from '@platform/context/nested-menu-provider';
import type { IWithChildren } from '@shinefold/config/react';

type TNestableMenuRootProps = IWithChildren & {
  onOpenChangeComplete?: (isOpen: boolean) => void;
};

/** A menu that opens as a submenu, Escape closing only itself, when rendered inside another menu's popup. */
export const NestableMenuRoot = ({
  onOpenChangeComplete,
  children,
}: TNestableMenuRootProps) =>
  useIsNestedMenu() ? (
    <Menu.SubmenuRoot onOpenChangeComplete={onOpenChangeComplete}>
      {children}
    </Menu.SubmenuRoot>
  ) : (
    <Menu.Root onOpenChangeComplete={onOpenChangeComplete}>
      {children}
    </Menu.Root>
  );
