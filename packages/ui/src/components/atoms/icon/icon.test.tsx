import { FEATURE_ICONS, ICONS } from '@blog/config';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { Icon } from './icon';

faker.seed(123);

const ARIA_HIDDEN = 'aria-hidden';
const MOCK_LABEL = faker.lorem.words(3);
const ICON_TEST_ID = 'icon';
const OTHER_ICON_TEST_ID = 'other-icon';

const setup = customRender(Icon, { name: ICONS.SUN, dataTestId: ICON_TEST_ID });

describe(`<${Icon.name}/>`, () => {
  it('renders a different glyph for each icon name', () => {
    setup({ name: ICONS.SUN });
    setup({ name: ICONS.MOON, dataTestId: OTHER_ICON_TEST_ID });

    const sunIcon = screen.getByTestId(ICON_TEST_ID);
    const moonIcon = screen.getByTestId(OTHER_ICON_TEST_ID);

    expect(sunIcon.innerHTML).not.toBe(moonIcon.innerHTML);
  });

  it.each(FEATURE_ICONS)('renders the %s feature icon', (name) => {
    setup({ name });

    const icon = screen.getByTestId(ICON_TEST_ID);

    expect(icon).toBeVisible();
  });

  it('is hidden from assistive tech by default', () => {
    setup();

    const icon = screen.getByTestId(ICON_TEST_ID);

    expect(icon).toHaveAttribute(ARIA_HIDDEN, 'true');
  });

  it('is exposed with its accessible name when an aria-label is given', () => {
    setup({ 'aria-label': MOCK_LABEL });

    const icon = screen.getByTestId(ICON_TEST_ID);

    expect(icon).toHaveAccessibleName(MOCK_LABEL);
    expect(icon).not.toHaveAttribute(ARIA_HIDDEN);
  });

  it('lets an explicit aria-hidden win over the aria-label default', () => {
    setup({ 'aria-label': MOCK_LABEL, [ARIA_HIDDEN]: false });

    const icon = screen.getByTestId(ICON_TEST_ID);

    expect(icon).toHaveAttribute(ARIA_HIDDEN, 'false');
  });
});
