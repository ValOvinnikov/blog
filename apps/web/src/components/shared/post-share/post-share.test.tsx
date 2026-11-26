import { faker } from '@faker-js/faker';
import { SITE_MESSAGES } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import {
  customRender,
  screen,
  waitFor,
  within,
} from '@web/testing/custom-render';
import { ARIA_EXPANDED } from '@web/testing/shared/aria/constants';

import { PostShare } from './post-share';

faker.seed(5401);

const MOCK_URL = faker.internet.url();
const MOCK_TITLE = faker.lorem.words(2);
const MOCK_LINKS = [
  { href: faker.internet.url(), label: faker.lorem.words(3) },
  { href: faker.internet.url(), label: faker.lorem.words(3) },
];
const [MOCK_FIRST_LINK] = MOCK_LINKS;
const {
  shareAriaLabel: SHARE_LABEL_TEMPLATE,
  copyLink: COPY_LINK_NAME,
  copied: COPIED_NAME,
  linkCopied: LINK_COPIED_MESSAGE,
} = SITE_MESSAGES.postShare;
const SHARE_LABEL = SHARE_LABEL_TEMPLATE.replace('{title}', MOCK_TITLE);

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
    trigger = screen.getByRole('button', { name: SHARE_LABEL });
  });

  it('labels the trigger with the post title and renders it closed', () => {
    const triggerIcon = within(trigger).getByTestId('post-share-trigger-icon');

    expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'false');
    expect(triggerIcon).toBeVisible();
  });

  it('starts with an empty status region', () => {
    const status = screen.getByRole('status');

    expect(status).toHaveTextContent('');
  });

  describe('once opened', () => {
    beforeEach(async () => {
      await user.click(trigger);
    });

    it('expands the panel and closes it on a second trigger click', async () => {
      const openedLink = screen.getByRole('menuitem', {
        name: MOCK_FIRST_LINK?.label,
      });

      expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'true');
      expect(openedLink).toBeVisible();

      await user.click(trigger);

      expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'false');
    });

    describe('after copying the link', () => {
      beforeEach(async () => {
        const copyItem = screen.getByRole('menuitem', { name: COPY_LINK_NAME });
        await user.click(copyItem);
      });

      it('copies the given url and shows a Copied state', async () => {
        const copiedItem = await screen.findByRole('menuitem', {
          name: COPIED_NAME,
        });
        const statusIcon = within(copiedItem).getByTestId(
          'post-share-status-icon',
        );
        const copiedUrl = await navigator.clipboard.readText();

        expect(copiedUrl).toBe(MOCK_URL);
        expect(copiedItem).toBeVisible();
        expect(statusIcon).toBeVisible();
      });

      it('announces the copy through the status region', async () => {
        const status = screen.getByRole('status');

        await waitFor(() => {
          expect(status).toHaveTextContent(LINK_COPIED_MESSAGE);
        });
      });
    });

    it('renders every given link, opening in a new tab', () => {
      const shareLink = screen.getByRole('menuitem', {
        name: MOCK_FIRST_LINK?.label,
      });

      expect(shareLink).toHaveAttribute('href', MOCK_FIRST_LINK?.href);
      expect(shareLink).toHaveAttribute('target', '_blank');
      expect(shareLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
