import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { accordionPanelVariants } from './accordion-panel-variants';

export type TAccordionPanelProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/** Stays in the DOM while closed, so browser find-in-page can still match text inside it. */
export const AccordionPanel = ({
  children,
  className,
  dataTestId,
}: TAccordionPanelProps) => {
  const { panel, content } = accordionPanelVariants();

  return (
    <BaseAccordion.Panel
      hiddenUntilFound={true}
      className={panel({ class: className })}
      data-testid={dataTestId}
    >
      <div className={content()}>{children}</div>
    </BaseAccordion.Panel>
  );
};
