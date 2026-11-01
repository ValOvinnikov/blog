import messages from '@platform/i18n/messages/en.json';
import { customRender, screen } from '@platform/testing/custom-render';

import { FieldStatus } from './field-status';

const { fieldStatus } = messages;

const setup = customRender(FieldStatus, {
  isCustomised: false,
  isUnsaved: false,
});

describe(`<${FieldStatus.name}/>`, () => {
  it('shows a default field with no unsaved mark', () => {
    setup();

    const defaultBadge = screen.getByText(fieldStatus.default);
    const unsavedMark = screen.queryByText(fieldStatus.unsaved);

    expect(defaultBadge).toBeVisible();
    expect(unsavedMark).not.toBeInTheDocument();
  });

  it('announces an unsaved field', () => {
    setup({ isUnsaved: true });

    const unsavedMark = screen.getByText(fieldStatus.unsaved);

    expect(unsavedMark).toBeVisible();
  });

  it('shows a customised field with no reset of its own', () => {
    setup({ isCustomised: true });

    const customisedBadge = screen.getByText(fieldStatus.customised);
    const resetButton = screen.queryByRole('button', {
      name: fieldStatus.reset,
    });

    expect(customisedBadge).toBeVisible();
    expect(resetButton).not.toBeInTheDocument();
  });
});
