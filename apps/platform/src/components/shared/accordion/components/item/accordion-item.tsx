import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import {
  AccordionContext,
  AccordionItemValueContext,
} from '@platform/components/shared/accordion/accordion-context';
import { accordionVariants } from '@platform/components/shared/accordion/accordion-variants';
import { AccordionNote } from '@platform/components/shared/accordion/components/note/accordion-note';
import { AccordionPanel } from '@platform/components/shared/accordion/components/panel/accordion-panel';
import { AccordionTrigger } from '@platform/components/shared/accordion/components/trigger/accordion-trigger';
import { mapCompoundSlots, type TCompoundChildren } from '@platform/lib/react';
import { Fragment, useContext, type ElementType } from 'react';

const AccordionItemParts = {
  Trigger: AccordionTrigger,
  Note: AccordionNote,
  Panel: AccordionPanel,
} satisfies Record<string, ElementType>;

export type TAccordionItemProps = {
  value: string;
  id?: string;
  children: TCompoundChildren<typeof AccordionItemParts>;
  className?: string;
};

export const AccordionItem = ({
  value,
  id,
  children,
  className,
}: TAccordionItemProps) => {
  const { variant, isList } = useContext(AccordionContext);
  const { slots, unmatched } = mapCompoundSlots(children, AccordionItemParts);

  return (
    <BaseAccordion.Item
      value={value}
      id={id}
      render={isList ? <li /> : undefined}
      className={({ index, open }) =>
        accordionVariants({ variant, isFirst: index === 0, isOpen: open }).item(
          { class: className },
        )
      }
    >
      <AccordionItemValueContext.Provider value={value}>
        {slots.Trigger}
        {slots.Note}
        {slots.Panel}
        {unmatched.map((node, i) => (
          <Fragment key={i}>{node}</Fragment>
        ))}
      </AccordionItemValueContext.Provider>
    </BaseAccordion.Item>
  );
};
