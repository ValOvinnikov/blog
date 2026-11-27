import { Field } from '@base-ui/react/field';
import { faker } from '@faker-js/faker';
import { FieldLabel } from '@platform/components/shared/field-label';
import {
  FormField,
  FormFieldControlProvider,
} from '@platform/components/shared/form-field';
import { ARIA_ATTRIBUTE } from '@platform/constants/aria-attribute';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { TextInput, type TTextInputProps } from './text-input';

faker.seed(5995);

const MOCK_LABEL = faker.lorem.words(2);
const MOCK_VALUE = faker.lorem.word();

const handleChange = vi.fn();

const renderInField = (
  props: Partial<TTextInputProps> = {},
  isDisabled = false,
) =>
  renderWithIntl(
    <FormField label={MOCK_LABEL} control={{ isDisabled }}>
      <TextInput value={MOCK_VALUE} onChange={handleChange} {...props} />
    </FormField>,
  );

describe(`<${TextInput.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    handleChange.mockReset();
  });

  it('renders the given value', () => {
    renderInField();

    const input = screen.getByRole('textbox', { name: MOCK_LABEL });

    expect(input).toHaveValue(MOCK_VALUE);
  });

  it('calls onChange with the typed value', async () => {
    renderInField({ value: '' });

    const input = screen.getByRole('textbox', { name: MOCK_LABEL });
    await user.type(input, 'a');

    expect(handleChange).toHaveBeenCalledWith('a');
  });

  it('is disabled when the field it sits in is disabled', () => {
    renderInField({}, true);

    const input = screen.getByRole('textbox', { name: MOCK_LABEL });

    expect(input).toBeDisabled();
  });

  it('stays focusable but unchangeable when its control is locked', async () => {
    renderWithIntl(
      <Field.Root>
        <FieldLabel>{MOCK_LABEL}</FieldLabel>
        <FormFieldControlProvider isLocked={true}>
          <TextInput value={MOCK_VALUE} onChange={handleChange} />
        </FormFieldControlProvider>
      </Field.Root>,
    );
    const input = screen.getByRole('textbox', { name: MOCK_LABEL });

    await user.type(input, MOCK_VALUE);

    expect(input).toBeEnabled();
    expect(input).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
    expect(handleChange).not.toHaveBeenCalled();
  });

  describe('when read-only', () => {
    let input: HTMLElement;

    beforeEach(() => {
      renderInField({ isReadOnly: true });
      input = screen.getByRole('textbox', { name: MOCK_LABEL });
    });

    it('stays enabled but read-only', () => {
      expect(input).toHaveAttribute('readonly');
      expect(input).toBeEnabled();
    });

    it('ignores typing', async () => {
      await user.type(input, 'x');

      expect(handleChange).not.toHaveBeenCalled();
    });
  });
});
