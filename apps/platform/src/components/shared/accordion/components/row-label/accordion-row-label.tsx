import { accordionVariants } from '@platform/components/shared/accordion/accordion-variants';
import { ACCORDION_VARIANT } from '@platform/constants/accordion';
import type { ReactNode } from 'react';

export type TAccordionRowLabelProps = {
  title: ReactNode;
  summary: ReactNode;
  summaryMark: ReactNode;
  isOpen: boolean;
};

export const AccordionRowLabel = ({
  title,
  summary,
  summaryMark,
  isOpen,
}: TAccordionRowLabelProps) => {
  const { rowLabel, rowTitle, rowSummary, rowSummaryMark, rowSummaryText } =
    accordionVariants({ variant: ACCORDION_VARIANT.ROW });
  const hasSummary = !isOpen && Boolean(summary);

  return (
    <span className={rowLabel()}>
      <span className={rowTitle()}>{title}</span>
      {hasSummary && (
        <span className={rowSummary()}>
          {summaryMark && (
            <span aria-hidden="true" className={rowSummaryMark()}>
              {summaryMark}
            </span>
          )}
          <span className={rowSummaryText()}>{summary}</span>
        </span>
      )}
    </span>
  );
};
