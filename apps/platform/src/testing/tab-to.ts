import type { UserEvent } from '@testing-library/user-event';

const MAX_TAB_PRESSES = 50;

export const tabTo = async (user: UserEvent, target: HTMLElement) => {
  let hasReachedTarget = false;
  const markReached = () => {
    hasReachedTarget = true;
  };
  target.addEventListener('focus', markReached, { once: true });

  for (
    let press = 0;
    press < MAX_TAB_PRESSES && !hasReachedTarget;
    press += 1
  ) {
    await user.tab();
  }

  target.removeEventListener('focus', markReached);
  if (!hasReachedTarget) {
    throw new Error('Tabbing never reached the target element.');
  }
};
