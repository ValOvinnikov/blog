import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { ICONS } from '@blog/config';
import { accordionVariants } from '@platform/components/shared/accordion/accordion-variants';
import { Icon } from '@platform/components/shared/icon';
import type { ReactNode } from 'react';

export type TAccordionTriggerProps = {
  children: ReactNode;
  className?: string;
};

export const AccordionTrigger = ({
  children,
  className,
}: TAccordionTriggerProps) => {
  const { header, trigger, chevron } = accordionVariants();

  return (
    <BaseAccordion.Header className={header()}>
      <BaseAccordion.Trigger className={trigger({ class: className })}>
        {children}
        <Icon name={ICONS.CHEVRON_DOWN} className={chevron()} />
      </BaseAccordion.Trigger>
    </BaseAccordion.Header>
  );
};
