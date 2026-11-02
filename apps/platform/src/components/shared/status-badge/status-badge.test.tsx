import { faker } from '@faker-js/faker';
import {
  customRender,
  renderWithIntl,
  screen,
} from '@platform/testing/custom-render';

import { StatusBadge } from './status-badge';

faker.seed(5995);

const MOCK_LABEL = faker.lorem.word();
const MOCK_BADGE_ID = faker.string.alpha(8);
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

  it('describes the element whose aria-describedby names its id', () => {
    renderWithIntl(
      <>
        <button type="button" aria-describedby={MOCK_BADGE_ID} />
        <StatusBadge id={MOCK_BADGE_ID}>{MOCK_LABEL}</StatusBadge>
      </>,
    );

    const button = screen.getByRole('button');

    expect(button).toHaveAccessibleDescription(MOCK_LABEL);
  });
});
