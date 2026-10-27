import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import {
  customRender,
  screen,
  waitFor,
  within,
} from '@web/testing/custom-render';

import { PostShare } from './post-share';

faker.seed(5401);

const MOCK_URL = faker.internet.url();
const MOCK_TITLE = faker.lorem.words(2);
const MOCK_LINKS = [
  { href: faker.internet.url(), label: faker.lorem.words(3) },
  { href: faker.internet.url(), label: faker.lorem.words(3) },
];
const [MOCK_FIRST_LINK] = MOCK_LINKS;
const COPY_LINK_NAME = 'Copy link';
const ARIA_EXPANDED = 'aria-expanded';

const setup = customRender(PostShare, {
  url: MOCK_URL,
  title: MOCK_TITLE,
  links: MOCK_LINKS,
});

describe(`<${PostShare.name}/>`, () => {
  let user: UserEvent;
  let trigger: HTMLElement;

  beforeEach(() => {
    user = userEvent.setup();
    setup();
    trigger = screen.getByRole('button', { name: `Share "${MOCK_TITLE}"` });
  });

  it('labels the trigger with the post title and renders it closed', () => {
    const triggerIcon = within(trigger).getByTestId('post-share-trigger-icon');

    expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'false');
    expect(triggerIcon).toBeVisible();
  });

  it('opens the panel on trigger click and closes it on a second click', async () => {
    await user.click(trigger);
    const openedLink = screen.getByRole('menuitem', {
      name: MOCK_FIRST_LINK?.label,
    });

    expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'true');
    expect(openedLink).toBeVisible();

    await user.click(trigger);

    expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'false');
  });

  it('copies the given url and shows a Copied state', async () => {
    await user.click(trigger);
    const copyItem = screen.getByRole('menuitem', { name: COPY_LINK_NAME });

    await user.click(copyItem);

    const copiedItem = await screen.findByRole('menuitem', { name: 'Copied' });
    const statusIcon = within(copiedItem).getByTestId('post-share-status-icon');
    const copiedUrl = await navigator.clipboard.readText();

    expect(copiedUrl).toBe(MOCK_URL);
    expect(copiedItem).toBeVisible();
    expect(statusIcon).toBeVisible();
  });

  it('announces a successful copy through the status region', async () => {
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('');

    await user.click(trigger);
    const copyItem = screen.getByRole('menuitem', { name: COPY_LINK_NAME });
    await user.click(copyItem);

    await waitFor(() => {
      expect(status).toHaveTextContent('Link copied');
    });
  });

  it('renders every given link, opening in a new tab', async () => {
    await user.click(trigger);

    const shareLink = screen.getByRole('menuitem', {
      name: MOCK_FIRST_LINK?.label,
    });

    expect(shareLink).toHaveAttribute('href', MOCK_FIRST_LINK?.href);
    expect(shareLink).toHaveAttribute('target', '_blank');
    expect(shareLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
