import { ICONS, SIZE } from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { TextInput } from './text-input';

faker.seed(123);

const MOCK_ARIA_LABEL = faker.lorem.words(2);
const MOCK_VALUE = faker.internet.email();
const MOCK_TYPED_CHARACTER = faker.string.alpha(1);
const MOCK_LEADING_GLYPH = faker.string.symbol(1);
const MOCK_TRAILING_GLYPH = faker.string.symbol(1);
const ARIA_HIDDEN = 'aria-hidden';
const LEADING_ICON_TEST_ID = 'leading-icon';
const TRAILING_ICON_TEST_ID = 'trailing-icon';

const setup = customRender(TextInput, {
  value: '',
  onChange: vi.fn(),
  ariaLabel: MOCK_ARIA_LABEL,
});

const renderIcon = (dataTestId: string) => (
  <Icon name={ICONS.CHEVRON_RIGHT} size={SIZE.SM} dataTestId={dataTestId} />
);

describe(`<${TextInput.name}/>`, () => {
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

  it('renders a decorative leading glyph hidden from assistive tech', () => {
    setup({ leadingIcon: MOCK_LEADING_GLYPH });

    const leadingGlyph = screen.getByText(MOCK_LEADING_GLYPH);

    expect(leadingGlyph).toBeVisible();
    expect(leadingGlyph).toHaveAttribute(ARIA_HIDDEN, 'true');
  });

  it('renders a decorative trailing glyph hidden from assistive tech', () => {
    setup({ trailingIcon: MOCK_TRAILING_GLYPH });

    const trailingGlyph = screen.getByText(MOCK_TRAILING_GLYPH);

    expect(trailingGlyph).toBeVisible();
    expect(trailingGlyph).toHaveAttribute(ARIA_HIDDEN, 'true');
  });

  it('renders an icon element as the leading icon', () => {
    setup({ leadingIcon: renderIcon(LEADING_ICON_TEST_ID) });

    const leadingIcon = screen.getByTestId(LEADING_ICON_TEST_ID);

    expect(leadingIcon).toBeVisible();
  });

  it('renders an icon element as the trailing icon', () => {
    setup({ trailingIcon: renderIcon(TRAILING_ICON_TEST_ID) });

    const trailingIcon = screen.getByTestId(TRAILING_ICON_TEST_ID);

    expect(trailingIcon).toBeVisible();
  });

  it('places the leading icon before and the trailing icon after the input', () => {
    setup({
      leadingIcon: MOCK_LEADING_GLYPH,
      trailingIcon: MOCK_TRAILING_GLYPH,
    });

    const leadingGlyph = screen.getByText(MOCK_LEADING_GLYPH);
    const trailingGlyph = screen.getByText(MOCK_TRAILING_GLYPH);
    const textbox = screen.getByRole('textbox', { name: MOCK_ARIA_LABEL });

    expect(
      leadingGlyph.compareDocumentPosition(textbox) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      textbox.compareDocumentPosition(trailingGlyph) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('marks the field invalid when isInvalid is true', () => {
    setup({ isInvalid: true });

    const textbox = screen.getByRole('textbox', { name: MOCK_ARIA_LABEL });

    expect(textbox).toBeInvalid();
  });

  it('disables the field when isDisabled is true', () => {
    setup({ isDisabled: true });

    const textbox = screen.getByRole('textbox', { name: MOCK_ARIA_LABEL });

    expect(textbox).toBeDisabled();
  });
});
