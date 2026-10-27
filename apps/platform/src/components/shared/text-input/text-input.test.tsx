import { faker } from '@faker-js/faker';
import { FormField } from '@platform/components/shared/form-field';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { TextInput, type TTextInputProps } from './text-input';

faker.seed(5995);

const MOCK_LABEL = faker.lorem.words(2);
const MOCK_VALUE = faker.lorem.word();

const renderInField = (
  props: Partial<TTextInputProps> = {},
  isDisabled = false,
) =>
  renderWithIntl(
    <FormField label={MOCK_LABEL} control={{ isDisabled }}>
      <TextInput value={MOCK_VALUE} onChange={vi.fn()} {...props} />
    </FormField>,
  );

describe(`<${TextInput.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders the given value', () => {
    renderInField();

    const input = screen.getByRole('textbox', { name: MOCK_LABEL });

    expect(input).toHaveValue(MOCK_VALUE);
  });

  it('calls onChange with the typed value', async () => {
    const handleChange = vi.fn();
    renderInField({ value: '', onChange: handleChange });

    const input = screen.getByRole('textbox', { name: MOCK_LABEL });
    await user.type(input, 'a');

    expect(handleChange).toHaveBeenCalledWith('a');
  });

  it('is disabled when the field it sits in is disabled', () => {
    renderInField({}, true);

    const input = screen.getByRole('textbox', { name: MOCK_LABEL });

    expect(input).toBeDisabled();
  });

  describe('when read-only', () => {
    let handleChange: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      handleChange = vi.fn();
      renderInField({ onChange: handleChange, isReadOnly: true });
    });

    it('stays enabled but read-only', () => {
      const input = screen.getByRole('textbox', { name: MOCK_LABEL });

      expect(input).toHaveAttribute('readonly');
      expect(input).toBeEnabled();
    });

    it('ignores typing', async () => {
      const input = screen.getByRole('textbox', { name: MOCK_LABEL });
      await user.type(input, 'x');

      expect(handleChange).not.toHaveBeenCalled();
    });
  });
});
