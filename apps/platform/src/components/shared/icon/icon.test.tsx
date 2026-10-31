import { ICONS } from '@blog/config';
import { faker } from '@faker-js/faker';
import { ICON_TEST_ID } from '@platform/constants/icon';
import { ARIA_HIDDEN } from '@platform/testing/aria';
import { customRender, screen } from '@platform/testing/custom-render';

import { Icon } from './icon';

faker.seed(5995);

const STROKE_WIDTH = 'stroke-width';
const DEFAULT_STROKE_WIDTH = '2';
const MOCK_ARIA_LABEL = faker.lorem.word();
const MOCK_STROKE_WIDTH = 2.2;

const setup = customRender(Icon, { name: ICONS.GRID });

describe(`<${Icon.name}/>`, () => {
  it('is decorative by default', () => {
    setup();

    const icon = screen.getByTestId(ICON_TEST_ID);

    expect(icon).toHaveAttribute(ARIA_HIDDEN, 'true');
  });

  it('exposes an accessible name when one is given', () => {
    setup({ ariaLabel: MOCK_ARIA_LABEL });

    const icon = screen.getByTestId(ICON_TEST_ID);

    expect(icon).toHaveAccessibleName(MOCK_ARIA_LABEL);
    expect(icon).not.toHaveAttribute(ARIA_HIDDEN);
  });

  it('keeps the glyph stroke width when no override is given', () => {
    setup();

    const icon = screen.getByTestId(ICON_TEST_ID);

    expect(icon).toHaveAttribute(STROKE_WIDTH, DEFAULT_STROKE_WIDTH);
  });

  it('draws the glyph at the given stroke width', () => {
    setup({ strokeWidth: MOCK_STROKE_WIDTH });

    const icon = screen.getByTestId(ICON_TEST_ID);

    expect(icon).toHaveAttribute(STROKE_WIDTH, String(MOCK_STROKE_WIDTH));
  });
});
