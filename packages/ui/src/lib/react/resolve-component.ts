import type { ElementType } from 'react';

/**
 * Resolves the element/component a polymorphic `as`/`linkAs` prop should
 * render as, falling back to the component's default when the prop is
 * omitted.
 */
export const resolveComponent = (
  as: ElementType | undefined,
  fallback: ElementType,
): ElementType => as ?? fallback;
