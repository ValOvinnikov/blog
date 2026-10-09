'use client';

import { Collapsible } from '@base-ui/react/collapsible';
import { ICONS } from '@blog/config';
import type { THeadingLevel } from '@platform/components/shared/heading';
import { Icon } from '@platform/components/shared/icon';
import type { ReactNode } from 'react';

import {
  disclosureVariants,
  type TDisclosureVariants,
} from './disclosure-variants';

const HEADING_TAGS = {
  2: 'h2',
  3: 'h3',
  4: 'h4',
} as const;

export type TDisclosureProps = {
  summary: ReactNode;
  children: ReactNode;
  variant?: TDisclosureVariants['variant'];
  headingLevel?: Exclude<THeadingLevel, 1>;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  className?: string;
};

export const Disclosure = ({
  summary,
  children,
  variant,
  headingLevel,
  isOpen,
  onOpenChange,
  className,
}: TDisclosureProps) => {
  const { root, trigger, chevron, inner } = disclosureVariants({ variant });

  const triggerButton = (
    <Collapsible.Trigger className={trigger()}>
      {summary}
      <Icon name={ICONS.CHEVRON_RIGHT} className={chevron()} />
    </Collapsible.Trigger>
  );
  const HeadingTag = headingLevel ? HEADING_TAGS[headingLevel] : undefined;

  return (
    <Collapsible.Root
      className={root({ class: className })}
      open={isOpen}
      onOpenChange={(nextOpen) => onOpenChange?.(nextOpen)}
    >
      {HeadingTag ? <HeadingTag>{triggerButton}</HeadingTag> : triggerButton}
      <Collapsible.Panel keepMounted={true} className={inner()}>
        {children}
      </Collapsible.Panel>
    </Collapsible.Root>
  );
};
