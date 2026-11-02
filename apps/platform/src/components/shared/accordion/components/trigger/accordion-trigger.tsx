import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { ICONS } from '@blog/config';
import { accordionVariants } from '@platform/components/shared/accordion/accordion-variants';
import {
  HEADING_TAGS,
  type THeadingLevel,
} from '@platform/components/shared/heading';
import { Icon } from '@platform/components/shared/icon';
import { ICON_SIZE } from '@platform/constants/icon';
import type { AriaAttributes, ReactNode } from 'react';

export type TAccordionTriggerProps = {
  children: ReactNode;
  headingLevel?: Exclude<THeadingLevel, 1>;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
  className?: string;
};

export const AccordionTrigger = ({
  children,
  headingLevel = 3,
  'aria-describedby': ariaDescribedBy,
  className,
}: TAccordionTriggerProps) => {
  const { header, chevron } = accordionVariants();
  const HeadingTag = HEADING_TAGS[headingLevel];

  return (
    <BaseAccordion.Header render={<HeadingTag />} className={header()}>
      <BaseAccordion.Trigger
        aria-describedby={ariaDescribedBy}
        className={({ open }) =>
          accordionVariants({ isOpen: open }).trigger({ class: className })
        }
      >
        {children}
        <Icon
          name={ICONS.CHEVRON_RIGHT}
          size={ICON_SIZE.XL}
          className={chevron()}
        />
      </BaseAccordion.Trigger>
    </BaseAccordion.Header>
  );
};
