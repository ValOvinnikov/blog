import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { ICONS } from '@blog/config';
import { useAccordionItem } from '@platform/components/shared/accordion/accordion-context';
import { accordionVariants } from '@platform/components/shared/accordion/accordion-variants';
import { AccordionRowLabel } from '@platform/components/shared/accordion/components/row-label/accordion-row-label';
import {
  HEADING_TAGS,
  type THeadingLevel,
} from '@platform/components/shared/heading';
import { Icon } from '@platform/components/shared/icon';
import { ACCORDION_VARIANT } from '@platform/constants/accordion';
import { ICON_SIZE } from '@platform/constants/icon';
import type { AriaAttributes, ReactNode } from 'react';

export type TAccordionTriggerProps = {
  children: ReactNode;
  headingLevel?: Exclude<THeadingLevel, 1>;
  summary?: ReactNode;
  summaryMark?: ReactNode;
  trailing?: ReactNode;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
  className?: string;
};

export const AccordionTrigger = ({
  children,
  headingLevel = 3,
  summary,
  summaryMark,
  trailing,
  'aria-describedby': ariaDescribedBy,
  className,
}: TAccordionTriggerProps) => {
  const { variant, value, isOpen, registerButton } = useAccordionItem();
  const { header, trigger, chevron, rowTrailing } = accordionVariants({
    variant,
    isOpen,
  });
  const HeadingTag = HEADING_TAGS[headingLevel];
  const chevronIcon = (
    <Icon
      name={ICONS.CHEVRON_RIGHT}
      size={ICON_SIZE.MD}
      className={chevron()}
    />
  );

  return (
    <BaseAccordion.Header render={<HeadingTag />} className={header()}>
      <BaseAccordion.Trigger
        ref={(button) => registerButton(value, button)}
        aria-describedby={ariaDescribedBy}
        className={trigger({ class: className })}
      >
        {variant === ACCORDION_VARIANT.ROW ? (
          <>
            {chevronIcon}
            <AccordionRowLabel
              title={children}
              summary={summary}
              summaryMark={summaryMark}
              isOpen={isOpen}
            />
            {trailing && <span className={rowTrailing()}>{trailing}</span>}
          </>
        ) : (
          <>
            {children}
            {chevronIcon}
          </>
        )}
      </BaseAccordion.Trigger>
    </BaseAccordion.Header>
  );
};
