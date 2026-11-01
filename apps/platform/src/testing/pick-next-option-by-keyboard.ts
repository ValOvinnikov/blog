import { screen, waitFor } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

const ARROW_DOWN = '{ArrowDown}';

// Base UI moves focus onto the selected option after the listbox mounts, so each key waits for focus to settle.
export const pickNextOptionByKeyboard = async (
  user: UserEvent,
  nextOptionName: string,
) => {
  await user.tab();
  await user.keyboard(ARROW_DOWN);
  await waitFor(() =>
    expect(screen.getByRole('option', { selected: true })).toHaveFocus(),
  );
  await user.keyboard(ARROW_DOWN);
  await waitFor(() =>
    expect(screen.getByRole('option', { name: nextOptionName })).toHaveFocus(),
  );
  await user.keyboard('{Enter}');
};
