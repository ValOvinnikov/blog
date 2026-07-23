import userEvent from '@testing-library/user-event';
import {
  customRender,
  fireEvent,
  screen,
  waitFor,
} from '@web/testing/custom-render';

import { PostShare } from './post-share';

const links = [
  {
    href: 'https://twitter.com/intent/tweet?text=Hi&url=https%3A%2F%2Fx.com',
    label: 'Share on X',
  },
  {
    href: 'https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fx.com',
    label: 'Share on LinkedIn',
  },
];

const setup = customRender(PostShare, {
  url: 'https://example.com/blog/hello',
  title: 'Hello World',
  links,
});

const getTrigger = () =>
  screen.getByRole('button', { name: 'Share "Hello World"' });

// Popover open/close/focus/dismissal mechanics are covered directly against the
// hook in `@web/hooks/use-popover`; these tests cover only how `PostShare`
// composes `PopoverMenu` (labels, the copy action, and the per-link items).
describe(`<${PostShare.name}/>`, () => {
  beforeEach(() => {
    setup();
  });

  it('labels the trigger with the post title and renders it closed', () => {
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the panel on trigger click and closes it again on a second click', async () => {
    const user = userEvent.setup();
    const trigger = getTrigger();

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: 'Share on X' })).toBeVisible();

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('copies the given url to the clipboard and shows a Copied state that resets', async () => {
    const writeText = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined);

    await userEvent.setup().click(getTrigger());
    fireEvent.click(screen.getByRole('menuitem', { name: 'Copy link' }));

    expect(writeText).toHaveBeenCalledWith('https://example.com/blog/hello');
    expect(
      await screen.findByRole('menuitem', { name: 'Copied' }),
    ).toBeVisible();

    await waitFor(
      () => {
        expect(
          screen.getByRole('menuitem', { name: 'Copy link' }),
        ).toBeVisible();
      },
      { timeout: 3000 },
    );
  });

  it('announces a successful copy via an aria-live status region', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    expect(screen.getByRole('status')).toHaveTextContent('');

    await userEvent.setup().click(getTrigger());
    fireEvent.click(screen.getByRole('menuitem', { name: 'Copy link' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Link copied');
  });

  it('renders one share link per entry in `links`, opening in a new tab', async () => {
    await userEvent.setup().click(getTrigger());

    const xLink = screen.getByRole('menuitem', { name: 'Share on X' });
    expect(xLink).toHaveAttribute('href', links[0]?.href);
    expect(xLink).toHaveAttribute('target', '_blank');
    expect(xLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
