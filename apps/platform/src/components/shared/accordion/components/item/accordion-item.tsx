import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { accordionVariants } from '@platform/components/shared/accordion/accordion-variants';
import { AccordionNote } from '@platform/components/shared/accordion/components/note/accordion-note';
import { AccordionPanel } from '@platform/components/shared/accordion/components/panel/accordion-panel';
import { AccordionTrigger } from '@platform/components/shared/accordion/components/trigger/accordion-trigger';
import { mapCompoundSlots, type TCompoundChildren } from '@platform/lib/react';
import { Fragment, type ElementType } from 'react';

const AccordionItemParts = {
  Trigger: AccordionTrigger,
  Note: AccordionNote,
  Panel: AccordionPanel,
} satisfies Record<string, ElementType>;

export type TAccordionItemProps = {
  value: string;
  children: TCompoundChildren<typeof AccordionItemParts>;
  className?: string;
};

export const AccordionItem = ({
  value,
  children,
  className,
}: TAccordionItemProps) => {
  const { item } = accordionVariants();
  const { slots, unmatched } = mapCompoundSlots(children, AccordionItemParts);

  return (
    <BaseAccordion.Item value={value} className={item({ class: className })}>
      {slots.Trigger}
      {slots.Note}
      {slots.Panel}
      {unmatched.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
    </BaseAccordion.Item>
  );
};
