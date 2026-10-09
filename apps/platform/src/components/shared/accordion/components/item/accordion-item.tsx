import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { accordionVariants } from '@platform/components/shared/accordion/accordion-variants';
import type { ReactNode } from 'react';

export type TAccordionItemProps = {
  value: string;
  children: ReactNode;
  className?: string;
};

export const AccordionItem = ({
  value,
  children,
  className,
}: TAccordionItemProps) => {
  const { item } = accordionVariants();

  return (
    <BaseAccordion.Item value={value} className={item({ class: className })}>
      {children}
    </BaseAccordion.Item>
  );
};
