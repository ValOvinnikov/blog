'use client';

import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { AccordionItem } from '@platform/components/shared/accordion/components/item/accordion-item';
import { AccordionNote } from '@platform/components/shared/accordion/components/note/accordion-note';
import { AccordionPanel } from '@platform/components/shared/accordion/components/panel/accordion-panel';
import { AccordionTrigger } from '@platform/components/shared/accordion/components/trigger/accordion-trigger';
import type { TCompoundComponent } from '@platform/lib/react';
import type { ElementType, ReactNode } from 'react';

import { accordionVariants } from './accordion-variants';

const AccordionParts = {
  Item: AccordionItem,
  Trigger: AccordionTrigger,
  Note: AccordionNote,
  Panel: AccordionPanel,
} satisfies Record<string, ElementType>;

type TAccordionProps<TValue extends string> = {
  openValue: TValue | undefined;
  onOpenValueChange: (value: TValue | undefined) => void;
  children: ReactNode;
  className?: string;
};

/** Rows that open one at a time; opening a row closes the one already open. */
const AccordionRoot = <TValue extends string>({
  openValue,
  onOpenValueChange,
  children,
  className,
}: TAccordionProps<TValue>) => {
  const { root } = accordionVariants();

  return (
    <BaseAccordion.Root<TValue>
      value={openValue === undefined ? [] : [openValue]}
      onValueChange={([next]) => onOpenValueChange(next)}
      className={root({ class: className })}
    >
      {children}
    </BaseAccordion.Root>
  );
};

export const Accordion: TCompoundComponent<
  typeof AccordionRoot,
  typeof AccordionParts
> = Object.assign(AccordionRoot, AccordionParts);
