import type { TMaybeNull } from '@blog/config';
import { isUndefined } from '@blog/utils/primitives';
import { KEY } from '@platform/constants/keyboard';
import { useRef, type KeyboardEvent } from 'react';

type TOptionNode = TMaybeNull<HTMLButtonElement>;

type TLockedArrowFocusOptions = {
  hasVerticalArrows?: boolean;
};

const targetIndex = (
  key: string,
  current: number,
  count: number,
  hasVerticalArrows: boolean,
) => {
  switch (key) {
    case KEY.ARROW_RIGHT:
      return (current + 1) % count;
    case KEY.ARROW_LEFT:
      return (current - 1 + count) % count;
    case KEY.ARROW_DOWN:
      return hasVerticalArrows ? (current + 1) % count : undefined;
    case KEY.ARROW_UP:
      return hasVerticalArrows ? (current - 1 + count) % count : undefined;
    case KEY.HOME:
      return 0;
    case KEY.END:
      return count - 1;
    default:
      return undefined;
  }
};

// Base UI's toggle and radio groups skip `aria-disabled` items in arrow navigation, so a locked group moves focus itself.
export const useLockedArrowFocus = (
  isLocked: boolean,
  { hasVerticalArrows = false }: TLockedArrowFocusOptions = {},
) => {
  const optionRefs = useRef<TOptionNode[]>([]);

  const setOptionRef = (index: number) => (node: TOptionNode) => {
    optionRefs.current[index] = node;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isLocked) return;
    const options = optionRefs.current;
    const current = options.findIndex((option) => option === event.target);
    const next = targetIndex(
      event.key,
      current,
      options.length,
      hasVerticalArrows,
    );
    if (current === -1 || isUndefined(next)) return;
    event.preventDefault();
    options[next]?.focus();
  };

  return { setOptionRef, onKeyDown };
};
