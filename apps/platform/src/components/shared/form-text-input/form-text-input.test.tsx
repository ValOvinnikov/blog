import { faker } from '@faker-js/faker';
import { ARIA_ATTRIBUTE } from '@platform/constants/aria-attribute';
import { customRender, screen } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { FormTextInput } from './form-text-input';

faker.seed(5995);

const MOCK_LABEL = faker.lorem.words(2);
const MOCK_HINT = faker.lorem.sentence();
const MOCK_ERROR = faker.lorem.sentence();

const setup = customRender(FormTextInput, {
  label: MOCK_LABEL,
  value: '',
  onChange: vi.fn(),
});

describe(`<${FormTextInput.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('names the input by its label', () => {
    setup();

    const input = screen.getByRole('textbox', { name: MOCK_LABEL });

    expect(input).toBeVisible();
    expect(input).not.toHaveAttribute(ARIA_ATTRIBUTE.LABEL);
  });

  it('describes the input with its hint and error', () => {
    setup({ hint: MOCK_HINT, error: MOCK_ERROR });

    const input = screen.getByRole('textbox', { name: MOCK_LABEL });

    expect(input).toHaveAccessibleDescription(`${MOCK_HINT} ${MOCK_ERROR}`);
    expect(input).toHaveAttribute(ARIA_ATTRIBUTE.INVALID, 'true');
  });

  it('calls onChange with the typed value', async () => {
    const handleChange = vi.fn();
    setup({ onChange: handleChange });

    const input = screen.getByRole('textbox', { name: MOCK_LABEL });
    await user.type(input, 'a');

    expect(handleChange).toHaveBeenCalledWith('a');
  });
});
