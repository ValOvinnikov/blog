import { screen } from '@platform/testing/custom-render';
import type userEvent from '@testing-library/user-event';
import type { Mock } from 'vitest';

/** The shared "archived tenant" contract every settings-tab Save form implements: the archived notice is visible, Save starts disabled, and clicking it never calls through to the save action. */
export const expectArchivedDisablesSave = async (
  user: ReturnType<typeof userEvent.setup>,
  saveAction: Mock,
) => {
  expect(screen.getByText('This tenant is archived')).toBeVisible();

  const saveButton = screen.getByRole('button', { name: 'Save changes' });
  expect(saveButton).toBeDisabled();

  await user.click(saveButton);
  expect(saveAction).not.toHaveBeenCalled();
};

/** The disabled Save button's accessible description names the archived notice, for a screen-reader user. */
export const expectArchivedSaveDescribedByNotice = () => {
  expect(
    screen.getByRole('button', { name: 'Save changes' }),
  ).toHaveAccessibleDescription(/This tenant is archived/);
};
