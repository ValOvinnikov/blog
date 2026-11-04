import type { TMaybeUndefined } from '@blog/config';
import { isUndefined } from '@blog/utils/primitives';
import { KEY } from '@platform/constants/keyboard';
import { useState, type KeyboardEvent } from 'react';

type TActiveOptionArgs = {
  count: number;
  columns: number;
  initialIndex: number;
  onChoose: (index: number) => void;
};

export const useActiveOption = ({
  count,
  columns,
  initialIndex,
  onChoose,
}: TActiveOptionArgs) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const last = count - 1;

  const targetOf = (key: string): TMaybeUndefined<number> => {
    switch (key) {
      case KEY.ARROW_RIGHT:
        return activeIndex + 1;
      case KEY.ARROW_LEFT:
        return activeIndex - 1;
      case KEY.ARROW_DOWN:
        return activeIndex + columns;
      case KEY.ARROW_UP:
        return activeIndex - columns;
      case KEY.HOME:
        return 0;
      case KEY.END:
        return last;
      default:
        return undefined;
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === KEY.ENTER || event.key === KEY.SPACE) {
      event.preventDefault();
      onChoose(activeIndex);
      return;
    }
    const target = targetOf(event.key);
    if (isUndefined(target)) {
      return;
    }
    event.preventDefault();
    setActiveIndex(Math.min(Math.max(target, 0), last));
  };

  return { activeIndex, setActiveIndex, onKeyDown };
};
