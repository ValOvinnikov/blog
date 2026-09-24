import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import {
  ICONS,
  SIZE,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import type { ReactNode } from 'react';

import { accordionTriggerVariants } from './accordion-trigger-variants';

export type TAccordionTriggerProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/** Toggles an `Accordion.Item`'s panel open and closed. */
export const AccordionTrigger = ({
  children,
  className,
  dataTestId,
}: TAccordionTriggerProps) => {
  const { header, trigger, chevron } = accordionTriggerVariants();

  return (
    <BaseAccordion.Header className={header()}>
      <BaseAccordion.Trigger
        className={trigger({ class: className })}
        data-testid={dataTestId}
      >
        {children}
        <Icon name={ICONS.CHEVRON_RIGHT} size={SIZE.SM} className={chevron()} />
      </BaseAccordion.Trigger>
    </BaseAccordion.Header>
  );
};
