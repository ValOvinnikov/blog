import { customRender, screen } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { Checkbox } from './checkbox';

const MOCK_LABEL = 'I agree to the terms';
const MOCK_ERROR = 'Accept the terms to continue.';

const setup = customRender(Checkbox, {
  isChecked: false,
  onCheckedChange: vi.fn(),
  label: MOCK_LABEL,
});

describe(`<${Checkbox.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('toggles when its label is clicked', async () => {
    const onCheckedChange = vi.fn();
    setup({ onCheckedChange });

    const label = screen.getByText(MOCK_LABEL);

    await user.click(label);

    const [[isChecked]] = onCheckedChange.mock.calls;

    expect(isChecked).toBe(true);
  });

  it('describes the checkbox by its error', () => {
    setup({ error: MOCK_ERROR });

    const checkbox = screen.getByRole('checkbox', { name: MOCK_LABEL });

    expect(checkbox).toHaveAccessibleDescription(MOCK_ERROR);
    expect(checkbox).toBeInvalid();
  });
});
