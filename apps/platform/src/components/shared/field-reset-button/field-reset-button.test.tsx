import messages from '@platform/i18n/messages/en.json';
import { customRender, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { FieldResetButton } from './field-reset-button';

const { fieldStatus } = messages;

const onReset = vi.fn();

const setup = customRender(FieldResetButton, { onReset });

describe(`<${FieldResetButton.name}/>`, () => {
  it('resets its field when pressed', async () => {
    const user = userEvent.setup();
    setup();

    const resetButton = screen.getByRole('button', { name: fieldStatus.reset });
    await user.click(resetButton);

    expect(onReset).toHaveBeenCalledOnce();
  });
});
