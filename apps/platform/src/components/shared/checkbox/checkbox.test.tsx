import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { Checkbox } from './checkbox';

faker.seed(5995);

const MOCK_LABEL = faker.lorem.sentence();
const MOCK_ERROR = faker.lorem.sentence();

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

    const [isChecked] = onCheckedChange.mock.calls[0] ?? [];

    expect(isChecked).toBe(true);
  });

  it('describes the checkbox by its error', () => {
    setup({ error: MOCK_ERROR });

    const checkbox = screen.getByRole('checkbox', { name: MOCK_LABEL });

    expect(checkbox).toHaveAccessibleDescription(MOCK_ERROR);
    expect(checkbox).toBeInvalid();
  });
});
