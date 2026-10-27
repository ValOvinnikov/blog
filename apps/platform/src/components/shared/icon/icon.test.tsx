import { ICONS } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';

import { Icon } from './icon';

faker.seed(5995);

const ICON_TEST_ID = 'icon';
const ARIA_HIDDEN = 'aria-hidden';
const MOCK_ARIA_LABEL = faker.lorem.word();

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
});
