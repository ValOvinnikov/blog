'use client';

import { Collapsible } from '@base-ui/react/collapsible';
import { ICONS } from '@blog/config';
import { Icon } from '@platform/components/shared/icon';
import type { ReactNode } from 'react';

import {
  disclosureVariants,
  type TDisclosureVariants,
} from './disclosure-variants';

export type TDisclosureProps = {
  summary: ReactNode;
  children: ReactNode;
  variant?: TDisclosureVariants['variant'];
  isDefaultOpen?: boolean;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  className?: string;
};

export const Disclosure = ({
  summary,
  children,
  variant,
  isDefaultOpen = false,
  isOpen,
  onOpenChange,
  className,
}: TDisclosureProps) => {
  const { root, trigger, chevron, inner } = disclosureVariants({ variant });

  return (
    <Collapsible.Root
      className={root({ class: className })}
      defaultOpen={isDefaultOpen}
      open={isOpen}
      onOpenChange={(nextOpen) => onOpenChange?.(nextOpen)}
    >
      <Collapsible.Trigger className={trigger()}>
        {summary}
        <Icon name={ICONS.CHEVRON_RIGHT} className={chevron()} />
      </Collapsible.Trigger>
      <Collapsible.Panel keepMounted={true} className={inner()}>
        {children}
      </Collapsible.Panel>
    </Collapsible.Root>
  );
};
