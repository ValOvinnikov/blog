import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { accordionVariants } from '@platform/components/shared/accordion/accordion-variants';
import type { ReactNode } from 'react';

export type TAccordionPanelProps = {
  children: ReactNode;
};

export const AccordionPanel = ({ children }: TAccordionPanelProps) => {
  const { panel, panelContent } = accordionVariants();

  return (
    <BaseAccordion.Panel className={panel()}>
      <div className={panelContent()}>{children}</div>
    </BaseAccordion.Panel>
  );
};
