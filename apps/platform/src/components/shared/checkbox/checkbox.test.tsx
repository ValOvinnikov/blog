import { render, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { Checkbox } from './checkbox';

const MOCK_LABEL = 'I agree to the terms';
const MOCK_ERROR = 'Accept the terms to continue.';

describe(Checkbox, () => {
  it('toggles when its label is clicked', async () => {
    const onCheckedChange = vi.fn();
    render(
      <Checkbox
        isChecked={false}
        onCheckedChange={onCheckedChange}
        label={MOCK_LABEL}
      />,
    );

    await userEvent.click(screen.getByText(MOCK_LABEL));

    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it('describes the checkbox by its error', () => {
    render(
      <Checkbox
        isChecked={false}
        onCheckedChange={vi.fn()}
        label={MOCK_LABEL}
        error={MOCK_ERROR}
      />,
    );

    const checkbox = screen.getByRole('checkbox', { name: MOCK_LABEL });

    expect(checkbox).toHaveAccessibleDescription(MOCK_ERROR);
    expect(checkbox).toBeInvalid();
  });
});
