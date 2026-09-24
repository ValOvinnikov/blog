import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import type { IWithClassName, IWithDataTestId } from '@blog/config';
import { type TCompoundComponent } from '@blog/ui/lib/react';
import type { ElementType, ReactNode } from 'react';

import { accordionVariants } from './accordion-variants';
import { AccordionItem } from './components/item/accordion-item';
import { AccordionPanel } from './components/panel/accordion-panel';
import { AccordionTrigger } from './components/trigger/accordion-trigger';

const AccordionParts = {
  Item: AccordionItem,
  Trigger: AccordionTrigger,
  Panel: AccordionPanel,
} satisfies Record<string, ElementType>;

export type TAccordionProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/** A list of disclosure rows, any number of which can be open at once; each is an `Accordion.Item` pairing an `Accordion.Trigger` with its `Accordion.Panel`. */
const AccordionRoot = ({
  children,
  className,
  dataTestId,
}: TAccordionProps) => (
  <BaseAccordion.Root
    multiple={true}
    className={accordionVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </BaseAccordion.Root>
);

export const Accordion: TCompoundComponent<
  typeof AccordionRoot,
  typeof AccordionParts
> = Object.assign(AccordionRoot, AccordionParts);
