import type { ElementType } from 'react';

export const resolveComponent = (
  as: ElementType | undefined,
  fallback: ElementType,
): ElementType => as ?? fallback;
