'use client';

import type { IWithClassName } from '@shinefold/config';
import type { IWithChildren } from '@shinefold/config/react';
import { usePostSummary } from '@web/context/post-summary-provider';

export type TPostSummaryPanelProps = IWithChildren &
  IWithClassName & {
    ariaLabel: string;
  };

export const PostSummaryPanel = ({
  ariaLabel,
  children,
  className,
}: TPostSummaryPanelProps) => {
  const { isOpen, cardId } = usePostSummary();

  return (
    <section
      id={cardId}
      hidden={!isOpen}
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </section>
  );
};
