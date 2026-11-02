import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { AccordionContext } from '@platform/components/shared/accordion/accordion-context';
import { accordionVariants } from '@platform/components/shared/accordion/accordion-variants';
import { useContext, type ReactNode } from 'react';

export type TAccordionPanelProps = {
  children: ReactNode;
};

export const AccordionPanel = ({ children }: TAccordionPanelProps) => {
  const { variant } = useContext(AccordionContext);
  const { panel, panelContent } = accordionVariants({ variant });

  return (
    <BaseAccordion.Panel className={panel()}>
      <div className={panelContent()}>{children}</div>
    </BaseAccordion.Panel>
  );
};
