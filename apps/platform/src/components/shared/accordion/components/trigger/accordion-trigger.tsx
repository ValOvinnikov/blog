import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { ICONS } from '@blog/config';
import { accordionVariants } from '@platform/components/shared/accordion/accordion-variants';
import { Icon } from '@platform/components/shared/icon';
import type { AriaAttributes, ReactNode } from 'react';

export type TAccordionTriggerProps = {
  children: ReactNode;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
  className?: string;
};

export const AccordionTrigger = ({
  children,
  'aria-describedby': ariaDescribedBy,
  className,
}: TAccordionTriggerProps) => {
  const { header, trigger, chevron } = accordionVariants();

  return (
    <BaseAccordion.Header className={header()}>
      <BaseAccordion.Trigger
        aria-describedby={ariaDescribedBy}
        className={trigger({ class: className })}
      >
        {children}
        <Icon name={ICONS.CHEVRON_DOWN} className={chevron()} />
      </BaseAccordion.Trigger>
    </BaseAccordion.Header>
  );
};
