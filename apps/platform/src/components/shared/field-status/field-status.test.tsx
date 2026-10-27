import messages from '@platform/i18n/messages/en.json';
import { customRender, screen } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { FieldStatus } from './field-status';

const { fieldStatus } = messages;

const setup = customRender(FieldStatus, {
  isCustomised: false,
  isUnsaved: false,
});

describe(`<${FieldStatus.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('shows a default field with no unsaved mark and no reset', () => {
    setup({ onReset: vi.fn() });

    const defaultBadge = screen.getByText(fieldStatus.default);
    const unsavedMark = screen.queryByText(fieldStatus.unsaved);
    const resetButton = screen.queryByRole('button', {
      name: fieldStatus.reset,
    });

    expect(defaultBadge).toBeVisible();
    expect(unsavedMark).not.toBeInTheDocument();
    expect(resetButton).not.toBeInTheDocument();
  });

  it('announces an unsaved field', () => {
    setup({ isUnsaved: true });

    const unsavedMark = screen.getByText(fieldStatus.unsaved);

    expect(unsavedMark).toBeVisible();
  });

  it('resets a customised field', async () => {
    const onReset = vi.fn();
    setup({ isCustomised: true, onReset });

    const customisedBadge = screen.getByText(fieldStatus.customised);
    const resetButton = screen.getByRole('button', { name: fieldStatus.reset });
    await user.click(resetButton);

    expect(customisedBadge).toBeVisible();
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('offers no reset when the field cannot be reset', () => {
    setup({ isCustomised: true });

    const resetButton = screen.queryByRole('button', {
      name: fieldStatus.reset,
    });

    expect(resetButton).not.toBeInTheDocument();
  });
});
