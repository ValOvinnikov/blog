import { customRender, screen } from '@blog/ui/testing/custom-render';
import { MOCK_LINK_TEST_ID, MockLink } from '@blog/ui/testing/mock-link';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { ConsentBanner } from './consent-banner';

faker.seed(123);

const HEADING_LEVEL = 2 as const;
const MOCK_HEADING = faker.lorem.words(3);
const MOCK_MESSAGE = faker.lorem.sentence();
const MOCK_ACCEPT_LABEL = faker.lorem.words(2);
const MOCK_REJECT_LABEL = faker.lorem.words(2);
const MOCK_SETTINGS_LABEL = faker.lorem.words(2);
const MOCK_POLICY_LINK = {
  href: `/${faker.lorem.slug()}`,
  label: faker.lorem.words(2),
};

const CONTROLS = [
  { control: 'Accept', label: MOCK_ACCEPT_LABEL, handler: 'onAccept', tabs: 1 },
  { control: 'Reject', label: MOCK_REJECT_LABEL, handler: 'onReject', tabs: 2 },
  {
    control: 'Settings',
    label: MOCK_SETTINGS_LABEL,
    handler: 'onOpenSettings',
    tabs: 3,
  },
] as const;

const setup = customRender(ConsentBanner, {
  headingLevel: HEADING_LEVEL,
  heading: MOCK_HEADING,
  message: MOCK_MESSAGE,
  acceptLabel: MOCK_ACCEPT_LABEL,
  rejectLabel: MOCK_REJECT_LABEL,
  settingsLabel: MOCK_SETTINGS_LABEL,
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

  it('renders the heading at the given level and the message', () => {
    const heading = screen.getByRole('heading', {
      level: HEADING_LEVEL,
      name: MOCK_HEADING,
    });
    const message = screen.getByText(MOCK_MESSAGE);

    expect(heading).toBeVisible();
    expect(message).toBeVisible();
  });

  it.each(CONTROLS)('renders the $control control', ({ label }) => {
    const button = screen.getByRole('button', { name: label });

    expect(button).toBeVisible();
  });

  it.each(CONTROLS)(
    'runs the $control action when clicked',
    async ({ label, handler }) => {
      const button = screen.getByRole('button', { name: label });

      await user.click(button);

      expect(handlers[handler]).toHaveBeenCalledTimes(1);
    },
  );

  it.each(CONTROLS)(
    'runs the $control action when activated by keyboard',
    async ({ handler, tabs }) => {
      for (let i = 0; i < tabs; i++) {
        await user.tab();
      }
      await user.keyboard('{Enter}');

      expect(handlers[handler]).toHaveBeenCalledTimes(1);
    },
  );

  it('renders no link without a policy link', () => {
    const link = screen.queryByRole('link');

    expect(link).not.toBeInTheDocument();
  });
});

describe(`<${ConsentBanner.name}/> with a policy link`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders the policy link named by its label', () => {
    setup({ policyLink: MOCK_POLICY_LINK });

    const link = screen.getByRole('link', { name: MOCK_POLICY_LINK.label });

    expect(link).toHaveAttribute('href', MOCK_POLICY_LINK.href);
  });

  it('renders the policy link through the supplied link component', () => {
    setup({ policyLink: MOCK_POLICY_LINK, linkAs: MockLink });

    const link = screen.getByRole('link', { name: MOCK_POLICY_LINK.label });
    const mockLink = screen.getByTestId(MOCK_LINK_TEST_ID);

    expect(link).toBe(mockLink);
  });

  it('reaches the policy link by keyboard before the accept control', async () => {
    setup({ policyLink: MOCK_POLICY_LINK });

    await user.tab();
    const link = screen.getByRole('link', { name: MOCK_POLICY_LINK.label });
    expect(link).toHaveFocus();

    await user.tab();
    const accept = screen.getByRole('button', { name: MOCK_ACCEPT_LABEL });
    expect(accept).toHaveFocus();
  });
});
