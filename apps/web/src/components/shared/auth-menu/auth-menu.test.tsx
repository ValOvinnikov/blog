import userEvent from '@testing-library/user-event';
import {
  customRender,
  screen,
  waitFor,
  within,
} from '@web/testing/custom-render';

import { AuthMenu } from './auth-menu';

const { useSessionMock, signInMock, signOutMock } = vi.hoisted(() => ({
  useSessionMock: vi.fn(),
  signInMock: vi.fn(),
  signOutMock: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  useSession: useSessionMock,
  signIn: signInMock,
  signOut: signOutMock,
}));

const setup = customRender(AuthMenu, {});

const setLocationSearch = (search: string) => {
  window.history.replaceState(null, '', `/${search}`);
};

describe(`<${AuthMenu.name}/>`, () => {
  beforeEach(() => {
    useSessionMock.mockReset();
    signInMock.mockReset();
    signOutMock.mockReset();
    setLocationSearch('');
  });

  it('renders a neutral placeholder with no trigger while the session is resolving', () => {
    useSessionMock.mockReturnValue({ data: null, status: 'loading' });

    setup();

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  describe('logged out', () => {
    beforeEach(() => {
      useSessionMock.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
    });

    it('opens a popover with the GitHub, Google, and email items', async () => {
      setup();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: 'Sign in' }));

      expect(
        screen.getByRole('menuitem', { name: 'Continue with GitHub' }),
      ).toBeVisible();
      expect(
        screen.getByRole('menuitem', { name: 'Continue with Google' }),
      ).toBeVisible();
      expect(
        screen.getByRole('menuitem', { name: 'Continue with email' }),
      ).toBeVisible();
    });

    it('calls signIn("github") when the GitHub item is clicked', async () => {
      setup();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: 'Sign in' }));
      await user.click(
        screen.getByRole('menuitem', { name: 'Continue with GitHub' }),
      );

      expect(signInMock).toHaveBeenCalledWith('github');
    });

    it('calls signIn("google") when the Google item is clicked', async () => {
      setup();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: 'Sign in' }));
      await user.click(
        screen.getByRole('menuitem', { name: 'Continue with Google' }),
      );

      expect(signInMock).toHaveBeenCalledWith('google');
    });

    it('expands the email item in place into a field and submit button', async () => {
      setup();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: 'Sign in' }));
      await user.click(
        screen.getByRole('menuitem', { name: 'Continue with email' }),
      );

      expect(
        screen.getByRole('textbox', { name: 'Email address' }),
      ).toBeVisible();
      expect(screen.getByRole('button', { name: 'Send link' })).toBeVisible();
      expect(
        screen.queryByRole('menuitem', { name: 'Continue with email' }),
      ).not.toBeInTheDocument();
    });

    it('moves focus into the email field once it expands (collapsed → expanded)', async () => {
      setup();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: 'Sign in' }));
      await user.click(
        screen.getByRole('menuitem', { name: 'Continue with email' }),
      );

      await waitFor(() => {
        expect(
          screen.getByRole('textbox', { name: 'Email address' }),
        ).toHaveFocus();
      });
    });

    it('submits the email and shows a check-your-inbox confirmation on success', async () => {
      signInMock.mockResolvedValue({
        ok: true,
        error: undefined,
        code: undefined,
        status: 200,
        url: null,
      });
      setup();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: 'Sign in' }));
      await user.click(
        screen.getByRole('menuitem', { name: 'Continue with email' }),
      );
      await user.type(
        screen.getByRole('textbox', { name: 'Email address' }),
        'reader@example.com',
      );
      await user.click(screen.getByRole('button', { name: 'Send link' }));

      expect(signInMock).toHaveBeenCalledWith('email', {
        email: 'reader@example.com',
        redirect: false,
      });
      // `role="status"` so the confirmation is announced, not just visible.
      expect(await screen.findByRole('status')).toHaveTextContent(
        'Check your inbox for a sign-in link.',
      );
    });

    it('also submits on Enter in the email field (the send button is never a native submit control)', async () => {
      signInMock.mockResolvedValue({
        ok: true,
        error: undefined,
        code: undefined,
        status: 200,
        url: null,
      });
      setup();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: 'Sign in' }));
      await user.click(
        screen.getByRole('menuitem', { name: 'Continue with email' }),
      );
      await user.type(
        screen.getByRole('textbox', { name: 'Email address' }),
        'reader@example.com{Enter}',
      );

      expect(signInMock).toHaveBeenCalledWith('email', {
        email: 'reader@example.com',
        redirect: false,
      });
      expect(
        await screen.findByText('Check your inbox for a sign-in link.'),
      ).toBeVisible();
    });

    it('shows an inline error and keeps the field open when the email sign-in fails', async () => {
      signInMock.mockResolvedValue({
        ok: false,
        error: 'EmailSignin',
        code: undefined,
        status: 401,
        url: null,
      });
      setup();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: 'Sign in' }));
      await user.click(
        screen.getByRole('menuitem', { name: 'Continue with email' }),
      );
      await user.type(
        screen.getByRole('textbox', { name: 'Email address' }),
        'reader@example.com',
      );
      await user.click(screen.getByRole('button', { name: 'Send link' }));

      // `role="status"` so the failure is announced, not just visible.
      expect(await screen.findByRole('status')).toHaveTextContent(
        "Couldn't send the link. Try again.",
      );
      expect(
        screen.getByRole('textbox', { name: 'Email address' }),
      ).toBeVisible();
    });

    it('shows an inline OAuth error notice as soon as the URL carries an error param, without opening the popover', async () => {
      setLocationSearch('?error=OAuthAccountNotLinked');
      setup();

      // Reachable/announced immediately — not gated behind opening the
      // (default-closed) popover, since a redirect-back happens before the
      // reader has done anything else on the page.
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Sign-in failed. Please try again.',
      );
      expect(screen.getByRole('button', { name: 'Sign in' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });
  });

  describe('logged in', () => {
    beforeEach(() => {
      useSessionMock.mockReturnValue({
        data: {
          user: {
            name: 'Val Ovinnikov',
            email: 'val@example.com',
            image: null,
          },
          expires: '2099-01-01',
        },
        status: 'authenticated',
      });
    });

    it('shows the account menu with name, email, My bookmarks, and Sign out', async () => {
      setup();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: 'Account menu' }));
      const panel = screen.getByRole('menu');

      // Two "Val Ovinnikov" occurrences (the avatar's sr-only name span and
      // the account header) — scope to the panel and use `getAllByText`.
      expect(
        within(panel).getAllByText('Val Ovinnikov').length,
      ).toBeGreaterThan(0);
      expect(within(panel).getByText('val@example.com')).toBeVisible();
      expect(
        screen.getByRole('menuitem', { name: 'My bookmarks' }),
      ).toHaveAttribute('href', '/bookmarks');
      expect(screen.getByRole('menuitem', { name: 'Sign out' })).toBeVisible();
    });

    it('calls signOut when Sign out is clicked', async () => {
      setup();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: 'Account menu' }));
      await user.click(screen.getByRole('menuitem', { name: 'Sign out' }));

      expect(signOutMock).toHaveBeenCalled();
    });
  });
});
