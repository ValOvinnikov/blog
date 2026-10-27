import { faker } from '@faker-js/faker';
import { TextInput } from '@platform/components/shared/text-input';
import {
  customRender,
  renderWithIntl,
  screen,
} from '@platform/testing/custom-render';
import {
  ARCHIVED_NOTICE_ID,
  ARCHIVED_NOTICE_TEXT,
} from '@platform/testing/render-in-settings-form';

import { FormField, type TFormFieldProps } from './form-field';

faker.seed(5995);

const MOCK_LABEL = faker.lorem.words(2);
const MOCK_HINT = faker.lorem.sentence();
const MOCK_ERROR = faker.lorem.sentence();
const MOCK_FOOTER = faker.lorem.sentence();
const MOCK_ACTION = faker.lorem.word();
const MOCK_CONTROL_ID = faker.lorem.slug();

const TextFormField = (props: Omit<TFormFieldProps, 'children'>) => (
  <FormField {...props}>
    <TextInput value="" onChange={vi.fn()} />
  </FormField>
);

const setup = customRender(TextFormField, { label: MOCK_LABEL });

describe(`<${FormField.name}/>`, () => {
  it('names the control by its label', () => {
    setup();

    const input = screen.getByRole('textbox', { name: MOCK_LABEL });

    expect(input).toBeVisible();
  });

  it('renders the label as a plain span when the control names itself', () => {
    renderWithIntl(
      <FormField label={MOCK_LABEL} control={{ hasOwnAccessibleName: true }}>
        <input aria-label={MOCK_LABEL} />
      </FormField>,
    );

    const label = screen.getByText(MOCK_LABEL);

    expect(label.tagName).toBe('SPAN');
  });

  it('describes the control with its hint, then its error', () => {
    setup({ hint: MOCK_HINT, error: MOCK_ERROR });

    const input = screen.getByRole('textbox', { name: MOCK_LABEL });

    expect(input).toHaveAccessibleDescription(`${MOCK_HINT} ${MOCK_ERROR}`);
    expect(input).toBeInvalid();
  });

  it('leaves the control undescribed and valid with no hint or error', () => {
    setup();

    const input = screen.getByRole('textbox', { name: MOCK_LABEL });

    expect(input).toHaveAccessibleDescription('');
    expect(input).not.toBeInvalid();
  });

  it('gives two fields with the same label distinct controls', () => {
    renderWithIntl(
      <>
        <FormField label={MOCK_LABEL} error={MOCK_ERROR}>
          <TextInput value="" onChange={vi.fn()} />
        </FormField>
        <FormField label={MOCK_LABEL}>
          <TextInput value="" onChange={vi.fn()} />
        </FormField>
      </>,
    );

    const [first, second] = screen.getAllByRole('textbox', {
      name: MOCK_LABEL,
    });

    expect(first).toHaveAccessibleDescription(MOCK_ERROR);
    expect(second).toHaveAccessibleDescription('');
  });

  it('disables its control and describes it with an outside notice first', () => {
    renderWithIntl(
      <>
        <p id={ARCHIVED_NOTICE_ID}>{ARCHIVED_NOTICE_TEXT}</p>
        <FormField
          label={MOCK_LABEL}
          hint={MOCK_HINT}
          control={{ isDisabled: true, describedBy: ARCHIVED_NOTICE_ID }}
        >
          <TextInput value="" onChange={vi.fn()} />
        </FormField>
      </>,
    );

    const input = screen.getByRole('textbox', { name: MOCK_LABEL });

    expect(input).toBeDisabled();
    expect(input).toHaveAccessibleDescription(
      `${ARCHIVED_NOTICE_TEXT} ${MOCK_HINT}`,
    );
  });

  it('gives its control the id it is given', () => {
    setup({ control: { id: MOCK_CONTROL_ID } });

    const input = screen.getByRole('textbox', { name: MOCK_LABEL });

    expect(input).toHaveAttribute('id', MOCK_CONTROL_ID);
  });

  it('renders actions beside the control', () => {
    setup({ actions: <button type="button">{MOCK_ACTION}</button> });

    const actionButton = screen.getByRole('button', { name: MOCK_ACTION });
    const input = screen.getByRole('textbox', { name: MOCK_LABEL });

    expect(actionButton).toBeVisible();
    expect(input).toBeVisible();
  });

  it('renders footer content alongside the error message', () => {
    setup({ error: MOCK_ERROR, footer: <span>{MOCK_FOOTER}</span> });

    const footer = screen.getByText(MOCK_FOOTER);
    const error = screen.getByText(MOCK_ERROR);

    expect(footer).toBeVisible();
    expect(error).toBeVisible();
  });
});
