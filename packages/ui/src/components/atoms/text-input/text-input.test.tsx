import { ICONS, SIZE } from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import { itActsAsAControlledTextbox } from '@blog/ui/testing/atoms/controlled-textbox';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { TextInput } from './text-input';

faker.seed(123);

const MOCK_ARIA_LABEL = faker.lorem.words(2);
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
  itActsAsAControlledTextbox(TextInput);

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

    expect(leadingGlyph.compareDocumentPosition(textbox)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(textbox.compareDocumentPosition(trailingGlyph)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('marks the field invalid when isInvalid is true', () => {
    setup({ isInvalid: true });

    const textbox = screen.getByRole('textbox', { name: MOCK_ARIA_LABEL });

    expect(textbox).toBeInvalid();
  });
});
