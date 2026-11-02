'use client';

import type { TMaybeNull } from '@blog/config';
import { useRef } from 'react';

import { useIsTruncated } from './use-is-truncated';

export type TCrumbLabelProps = {
  label: string;
  className: string;
  isCurrent: boolean;
  hasFullTitle: boolean;
};

export const CrumbLabel = ({
  label,
  className,
  isCurrent,
  hasFullTitle,
}: TCrumbLabelProps) => {
  const ref = useRef<TMaybeNull<HTMLSpanElement>>(null);
  const isTruncated = useIsTruncated(ref);

  return (
    <span
      ref={ref}
      className={className}
      aria-current={isCurrent ? 'page' : undefined}
      title={hasFullTitle || isTruncated ? label : undefined}
    >
      {label}
    </span>
  );
};
