import { ICONS } from '@blog/config';
import { faker } from '@faker-js/faker';
import { ICON_TEST_ID } from '@platform/constants/icon';
import { customRender, screen } from '@platform/testing/custom-render';
import { mockNavBadge } from '@platform/testing/layout/fixtures';

import { NavItemContent } from './nav-item-content';

faker.seed(5993);

const MOCK_LABEL = faker.lorem.word();
const MOCK_DISABLED_REASON = faker.lorem.sentence();
const MOCK_BADGE = mockNavBadge();
const STATUS_BADGE_DOT_TEST_ID = 'status-badge-dot';

const setup = customRender(NavItemContent, {
  icon: ICONS.GRID,
  label: MOCK_LABEL,
});

describe(`<${NavItemContent.name}/>`, () => {
  it('renders the icon and label', () => {
    setup();

    const label = screen.getByText(MOCK_LABEL);
    const icon = screen.getByTestId(ICON_TEST_ID);

    expect(label).toBeVisible();
    expect(icon).toBeVisible();
  });

  it('renders the disabled reason', () => {
    setup({ disabledReason: MOCK_DISABLED_REASON });

    const reason = screen.getByText(MOCK_DISABLED_REASON);

    expect(reason).toBeVisible();
  });

  it('renders no badge when none is given', () => {
    setup();

    const dot = screen.queryByTestId(STATUS_BADGE_DOT_TEST_ID);

    expect(dot).not.toBeInTheDocument();
  });

  it('renders the badge label', () => {
    setup({ badge: MOCK_BADGE });

    const badge = screen.getByText(MOCK_BADGE.label);

    expect(badge).toBeVisible();
  });

  it('omits the tone dot when the badge opts out of it', () => {
    setup({ badge: { ...MOCK_BADGE, hasDot: false } });

    const dot = screen.queryByTestId(STATUS_BADGE_DOT_TEST_ID);

    expect(dot).not.toBeInTheDocument();
  });
});
