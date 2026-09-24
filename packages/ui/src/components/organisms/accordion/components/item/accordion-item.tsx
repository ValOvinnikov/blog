import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { accordionItemVariants } from './accordion-item-variants';

export type TAccordionItemProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/** One disclosure row in an `Accordion`, pairing an `Accordion.Trigger` with its `Accordion.Panel`. */
export const AccordionItem = ({
  children,
  className,
  dataTestId,
}: TAccordionItemProps) => (
  <BaseAccordion.Item
    className={accordionItemVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </BaseAccordion.Item>
);
