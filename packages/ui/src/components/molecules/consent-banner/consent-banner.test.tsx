import { faker } from '@faker-js/faker';
import { testControlActions } from '@shinefold/ui/testing/control-actions-contract';
import { customRender, screen } from '@shinefold/ui/testing/custom-render';
import { MOCK_LINK_TEST_ID, MockLink } from '@shinefold/ui/testing/mock-link';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { ConsentBanner } from './consent-banner';

faker.seed(123);

const MOCK_HEADING = faker.lorem.words(3);
const MOCK_MESSAGE = faker.lorem.sentence();
const MOCK_LABELS = {
  accept: faker.lorem.words(2),
  reject: faker.lorem.words(2),
  settings: faker.lorem.words(2),
};
const MOCK_POLICY_LINK = {
  href: `/${faker.lorem.slug()}`,
  label: faker.lorem.words(2),
};

const CONTROLS = [
  {
    control: 'Accept',
    label: MOCK_LABELS.accept,
    handler: 'onAccept',
    tabs: 1,
  },
  {
    control: 'Reject',
    label: MOCK_LABELS.reject,
    handler: 'onReject',
    tabs: 2,
  },
  {
    control: 'Settings',
    label: MOCK_LABELS.settings,
    handler: 'onOpenSettings',
    tabs: 3,
  },
] as const;

const setup = customRender(ConsentBanner, {
  heading: MOCK_HEADING,
  message: MOCK_MESSAGE,
  labels: MOCK_LABELS,
  onAccept: vi.fn(),
  onReject: vi.fn(),
  onOpenSettings: vi.fn(),
});

describe(`<${ConsentBanner.name}/>`, () => {
  let user: UserEvent;
  let handlers: Record<(typeof CONTROLS)[number]['handler'], Mock<() => void>>;

  beforeEach(() => {
    user = userEvent.setup();
    handlers = {
      onAccept: vi.fn(),
      onReject: vi.fn(),
      onOpenSettings: vi.fn(),
    };
    setup(handlers);
  });

  it('renders the heading and the message', () => {
    const heading = screen.getByRole('heading', { name: MOCK_HEADING });
    const message = screen.getByText(MOCK_MESSAGE);

    expect(heading).toBeVisible();
    expect(message).toBeVisible();
  });

  it.each(CONTROLS)('renders the $control control', ({ label }) => {
    const button = screen.getByRole('button', { name: label });

    expect(button).toBeVisible();
  });

  testControlActions({
    controls: CONTROLS,
    getUser: () => user,
    getHandlers: () => handlers,
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

  it('reaches the policy link by keyboard before the accept control', async () => {
    await user.tab();
    const link = screen.getByRole('link', { name: MOCK_POLICY_LINK.label });
    expect(link).toHaveFocus();

    await user.tab();
    const accept = screen.getByRole('button', { name: MOCK_LABELS.accept });
    expect(accept).toHaveFocus();
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
