import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';

import { StatusBadge } from './status-badge';

faker.seed(5995);

const MOCK_LABEL = faker.lorem.word();
const STATUS_BADGE_DOT_TEST_ID = 'status-badge-dot';

const setup = customRender(StatusBadge, { children: MOCK_LABEL });

describe(`<${StatusBadge.name}/>`, () => {
  it('renders its label', () => {
    setup();

    const label = screen.getByText(MOCK_LABEL);

    expect(label).toBeVisible();
  });

  it('renders the tone dot when hasDot is true', () => {
    setup({ hasDot: true });

    const dot = screen.getByTestId(STATUS_BADGE_DOT_TEST_ID);

    expect(dot).toBeVisible();
  });

  it('omits the tone dot when hasDot is false', () => {
    setup({ hasDot: false });

    const dot = screen.queryByTestId(STATUS_BADGE_DOT_TEST_ID);

    expect(dot).not.toBeInTheDocument();
  });
});
