import { faker } from '@faker-js/faker';
import { customRender, screen } from '@shinefold/ui/testing/custom-render';
import { MOCK_LINK_TEST_ID, MockLink } from '@shinefold/ui/testing/mock-link';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { ConsentBanner } from './consent-banner';

faker.seed(123);

const MOCK_HEADING = faker.lorem.words(3);
const MOCK_MESSAGE = faker.lorem.sentence();
const MOCK_ACTION_LABEL = faker.lorem.words(2);
const MOCK_POLICY_LINK = {
  href: `/${faker.lorem.slug()}`,
  label: faker.lorem.words(2),
};

const setup = customRender(ConsentBanner, {
  heading: MOCK_HEADING,
  message: MOCK_MESSAGE,
  actions: <button type="button">{MOCK_ACTION_LABEL}</button>,
});

describe(`<${ConsentBanner.name}/>`, () => {
  beforeEach(() => {
    setup();
  });

  it('renders the heading and the message', () => {
    const heading = screen.getByRole('heading', { name: MOCK_HEADING });
    const message = screen.getByText(MOCK_MESSAGE);

    expect(heading).toBeVisible();
    expect(message).toBeVisible();
  });

  it('renders the supplied actions', () => {
    const action = screen.getByRole('button', { name: MOCK_ACTION_LABEL });

    expect(action).toBeVisible();
  });

  it('renders no link without a policy link', () => {
    const link = screen.queryByRole('link');

    expect(link).not.toBeInTheDocument();
  });
});

describe(`<${ConsentBanner.name}/> with a policy link`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    setup({ policyLink: MOCK_POLICY_LINK });
  });

  it('renders the policy link named by its label', () => {
    const link = screen.getByRole('link', { name: MOCK_POLICY_LINK.label });

    expect(link).toHaveAttribute('href', MOCK_POLICY_LINK.href);
  });

  it('reaches the policy link by keyboard before the actions', async () => {
    await user.tab();
    const link = screen.getByRole('link', { name: MOCK_POLICY_LINK.label });
    expect(link).toHaveFocus();

    await user.tab();
    const action = screen.getByRole('button', { name: MOCK_ACTION_LABEL });
    expect(action).toHaveFocus();
  });
});

describe(`<${ConsentBanner.name}/> with a policy link and a link component`, () => {
  it('renders the policy link through the supplied link component', () => {
    setup({ policyLink: MOCK_POLICY_LINK, linkAs: MockLink });

    const link = screen.getByRole('link', { name: MOCK_POLICY_LINK.label });
    const mockLink = screen.getByTestId(MOCK_LINK_TEST_ID);

    expect(link).toBe(mockLink);
  });
});
