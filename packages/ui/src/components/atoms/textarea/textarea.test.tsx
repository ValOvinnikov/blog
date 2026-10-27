import {
  customRender,
  renderElement,
  screen,
} from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { useState } from 'react';

import { Textarea } from './textarea';

faker.seed(123);

const MOCK_ARIA_LABEL = faker.lorem.words(2);
const MOCK_VALUE = faker.lorem.paragraphs(2);
const MOCK_ERROR = faker.lorem.sentence();
const MOCK_ERROR_ID = faker.lorem.slug(2);
const MOCK_FIRST_LINE = faker.lorem.word();
const MOCK_SECOND_LINE = faker.lorem.word();
const MOCK_TYPED_CHARACTER = faker.string.alpha(1);

const setup = customRender(Textarea, {
  value: '',
  onChange: vi.fn(),
  ariaLabel: MOCK_ARIA_LABEL,
});

const ControlledTextarea = () => {
  const [value, setValue] = useState('');

  return (
    <Textarea value={value} onChange={setValue} ariaLabel={MOCK_ARIA_LABEL} />
  );
};

describe(`<${Textarea.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders a textbox named by the ariaLabel', () => {
    setup();

    const textbox = screen.getByRole('textbox', { name: MOCK_ARIA_LABEL });

    expect(textbox).toBeVisible();
  });

  it('renders the controlled value', () => {
    setup({ value: MOCK_VALUE });

    const textbox = screen.getByRole('textbox', { name: MOCK_ARIA_LABEL });

    expect(textbox).toHaveValue(MOCK_VALUE);
  });

  it('reports typed input without keeping its own state', async () => {
    const onChange = vi.fn();
    setup({ onChange });

    const textbox = screen.getByRole('textbox', { name: MOCK_ARIA_LABEL });
    await user.type(textbox, MOCK_TYPED_CHARACTER);

    expect(onChange).toHaveBeenCalledWith(MOCK_TYPED_CHARACTER);
    expect(textbox).toHaveValue('');
  });

  it('updates the value as the user types across lines under a controlling parent', async () => {
    renderElement(<ControlledTextarea />);

    const textbox = screen.getByRole('textbox', { name: MOCK_ARIA_LABEL });
    await user.type(textbox, `${MOCK_FIRST_LINE}{Enter}${MOCK_SECOND_LINE}`);

    expect(textbox).toHaveValue(`${MOCK_FIRST_LINE}\n${MOCK_SECOND_LINE}`);
  });

  it('describes itself by its error when invalid', () => {
    renderElement(
      <>
        <Textarea
          value=""
          onChange={vi.fn()}
          ariaLabel={MOCK_ARIA_LABEL}
          isInvalid={true}
          aria-describedby={MOCK_ERROR_ID}
        />
        <p id={MOCK_ERROR_ID}>{MOCK_ERROR}</p>
      </>,
    );

    const textbox = screen.getByRole('textbox', { name: MOCK_ARIA_LABEL });

    expect(textbox).toBeInvalid();
    expect(textbox).toHaveAccessibleDescription(MOCK_ERROR);
  });

  it('disables the field when isDisabled is true', () => {
    setup({ isDisabled: true });

    const textbox = screen.getByRole('textbox', { name: MOCK_ARIA_LABEL });

    expect(textbox).toBeDisabled();
  });

  it('requires the field when isRequired is true', () => {
    setup({ isRequired: true });

    const textbox = screen.getByRole('textbox', { name: MOCK_ARIA_LABEL });

    expect(textbox).toBeRequired();
  });
});
