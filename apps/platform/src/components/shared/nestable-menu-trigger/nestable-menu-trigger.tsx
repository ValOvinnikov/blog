'use client';

import { Menu } from '@base-ui/react/menu';
import { useIsNestedMenu } from '@platform/context/nested-menu-provider';
import type { ReactNode } from 'react';

import {
  NESTED_TRIGGER_CLASSES,
  nestableMenuTriggerVariants,
} from './nestable-menu-trigger-variants';

type TNestableMenuTriggerProps = {
  className: string;
  title?: string;
  'aria-label'?: string;
  children: ReactNode;
};

// Nested, the pinned-trigger colours come after the caller's classes so they win the merge.
export const NestableMenuTrigger = ({
  className,
  ...props
}: TNestableMenuTriggerProps) => {
  const isNested = useIsNestedMenu();
  const { trigger } = nestableMenuTriggerVariants();

  return isNested ? (
    <Menu.SubmenuTrigger
      {...props}
      openOnHover={false}
      className={trigger({ class: [className, ...NESTED_TRIGGER_CLASSES] })}
    />
  ) : (
    <Menu.Trigger {...props} className={className} />
  );
};
