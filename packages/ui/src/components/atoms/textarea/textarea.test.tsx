import {
  customRender,
  renderElement,
  screen,
} from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { Textarea } from './textarea';

faker.seed(123);

const setup = customRender(Textarea, {
  value: '',
  onChange: vi.fn(),
  ariaLabel: 'Message',
});

const ControlledTextarea = () => {
  const [value, setValue] = useState('');

  return <Textarea value={value} onChange={setValue} ariaLabel="Message" />;
};

describe(`<${Textarea.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders a textbox with the given ariaLabel', () => {
      expect(screen.getByRole('textbox', { name: 'Message' })).toBeVisible();
    });

    it('is not marked invalid', () => {
      expect(screen.getByRole('textbox')).toHaveAttribute(
        'aria-invalid',
        'false',
      );
    });

    it('is enabled', () => {
      expect(screen.getByRole('textbox')).toBeEnabled();
    });
  });

  it('renders the controlled value', () => {
    const value = faker.lorem.paragraphs(2);
    setup({ value });
    expect(screen.getByRole('textbox')).toHaveValue(value);
  });

  it('calls onChange with the new value on input, and does not manage its own state', async () => {
    const onChange = vi.fn();
    setup({ onChange });
    await userEvent.type(screen.getByRole('textbox'), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('updates the value as the user types across lines when controlled by its parent', async () => {
    renderElement(<ControlledTextarea />);
    await userEvent.type(screen.getByRole('textbox'), 'Hello{Enter}there');
    expect(screen.getByRole('textbox')).toHaveValue('Hello\nthere');
  });

  it('announces its error to assistive tech when invalid and described by an error', () => {
    const error = faker.lorem.sentence();
    renderElement(
      <>
        <Textarea
          value=""
          onChange={vi.fn()}
          ariaLabel="Message"
          isInvalid={true}
          aria-describedby="message-error"
        />
        <p id="message-error">{error}</p>
      </>,
    );
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(textarea).toHaveAccessibleDescription(error);
  });

  it('forwards dataTestId to the field', () => {
    setup({ dataTestId: 'textarea' });
    expect(screen.getByTestId('textarea')).toBe(screen.getByRole('textbox'));
  });

  it('renders the native disabled attribute when isDisabled is true', () => {
    setup({ isDisabled: true });
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('renders the native required attribute when isRequired is true', () => {
    setup({ isRequired: true });
    expect(screen.getByRole('textbox')).toBeRequired();
  });
});
