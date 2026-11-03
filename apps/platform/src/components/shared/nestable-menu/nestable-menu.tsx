'use client';

import { Menu } from '@base-ui/react/menu';
import { useIsNestedMenu } from '@platform/context/nested-menu-provider';
import type { ReactNode } from 'react';

import { nestableMenuVariants } from './nestable-menu-variants';

type TNestableMenuRootProps = {
  onOpenChangeComplete?: (isOpen: boolean) => void;
  children: ReactNode;
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

type TNestableMenuTriggerProps = {
  className: string;
  title?: string;
  'aria-label'?: string;
  children: ReactNode;
};

export const NestableMenuTrigger = ({
  className,
  ...props
}: TNestableMenuTriggerProps) => {
  const isNested = useIsNestedMenu();
  const { trigger } = nestableMenuVariants({ isNested });

  return isNested ? (
    <Menu.SubmenuTrigger
      {...props}
      openOnHover={false}
      className={trigger({ class: className })}
    />
  ) : (
    <Menu.Trigger {...props} className={trigger({ class: className })} />
  );
};
