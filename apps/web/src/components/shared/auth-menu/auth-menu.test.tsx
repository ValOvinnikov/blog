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

const setup = customRender(AuthMenu, {
  oauthProviderIds: ['github', 'google'],
});
const setupPlain = customRender(AuthMenu, {
  oauthProviderIds: ['github', 'google'],
  isPlain: true,
});

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

  it('renders no accessible button while the session is resolving', () => {
    useSessionMock.mockReturnValue({ data: null, status: 'loading' });

    setup();

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows a neutral loading status region while the session is resolving — not shaped like either the sign-in or account trigger', () => {
    useSessionMock.mockReturnValue({ data: null, status: 'loading' });

    setup();

    const status = screen.getByRole('status', {
      name: 'Loading account status',
    });
    // A live region, never an interactive element — no button role at all.
    expect(status.tagName).toBe('SPAN');
    // Neither final state's label leaks into the neutral placeholder.
    expect(status).not.toHaveTextContent('Sign in');
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

    it('dresses the panel in the WindowChrome terminal shell (mock §01) with a generic, non-personal bar', async () => {
      setup();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: 'Sign in' }));
      const panel = screen.getByRole('menu');

      expect(within(panel).getByText('Guest')).toBeVisible();
      expect(within(panel).getByText(/Sign in/)).toBeVisible();
      expect(within(panel).getByText(/Choose a sign-in method/)).toBeVisible();
      expect(
        within(panel).getByText(
          'Redirects back to this article — you never lose your place.',
        ),
      ).toBeVisible();
      // The bar's segments render as separate DOM nodes (User/Prompt/plain
      // text) — assert the concatenated reading is properly space-separated
      // ("Guest Sign in"), not touching ("GuestSign in").
      expect(panel.textContent).toMatch(/Guest\s+Sign in/);
    });

    it('renders a plain, non-heading "Sign in" label with no terminal prompt line when plain', async () => {
      setupPlain();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: 'Sign in' }));
      const panel = screen.getByRole('menu');

      // Plain mode never introduces a new heading — the popover panel
      // already has an accessible name via its own `ariaLabel`, and this
      // panel renders before the page's own `<h1>` in `[locale]/layout.tsx`.
      expect(within(panel).queryByRole('heading')).not.toBeInTheDocument();
      expect(within(panel).getByText('Sign in')).toBeVisible();
      expect(within(panel).queryByText('Guest')).not.toBeInTheDocument();
      expect(
        within(panel).getByRole('menuitem', { name: 'Continue with GitHub' }),
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

    it('renders only the GitHub button when only GitHub is enabled', async () => {
      setup({ oauthProviderIds: ['github'] });
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: 'Sign in' }));

      expect(
        screen.getByRole('menuitem', { name: 'Continue with GitHub' }),
      ).toBeVisible();
      expect(
        screen.queryByRole('menuitem', { name: 'Continue with Google' }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('menuitem', { name: 'Continue with email' }),
      ).toBeVisible();
    });

    it('renders only the Google button when only Google is enabled', async () => {
      setup({ oauthProviderIds: ['google'] });
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: 'Sign in' }));

      expect(
        screen.queryByRole('menuitem', { name: 'Continue with GitHub' }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('menuitem', { name: 'Continue with Google' }),
      ).toBeVisible();
      expect(
        screen.getByRole('menuitem', { name: 'Continue with email' }),
      ).toBeVisible();
    });

    it('renders no OAuth buttons when neither provider is enabled, but email sign-in still works', async () => {
      setup({ oauthProviderIds: [] });
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: 'Sign in' }));

      expect(
        screen.queryByRole('menuitem', { name: 'Continue with GitHub' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('menuitem', { name: 'Continue with Google' }),
      ).not.toBeInTheDocument();
      await user.click(
        screen.getByRole('menuitem', { name: 'Continue with email' }),
      );

      expect(
        screen.getByRole('textbox', { name: 'Email address' }),
      ).toBeVisible();
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
      expect(screen.getByTestId('sign-in-prompt-icon')).toBeVisible();
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
            name: 'Jane Doe',
            email: 'jane@example.com',
            image: null,
          },
          expires: '2099-01-01',
        },
        status: 'authenticated',
      });
    });

    it('shows the account menu with name, email, My bookmarks, Account settings, and Sign out', async () => {
      setup();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: 'Account menu' }));
      const panel = screen.getByRole('menu');

      // Two "Jane Doe" occurrences (the avatar's sr-only name span and the
      // account header) — scope to the panel and use `getAllByText`.
      expect(within(panel).getAllByText('Jane Doe').length).toBeGreaterThan(0);
      expect(within(panel).getByText('jane@example.com')).toBeVisible();
      expect(screen.getByRole('menuitem', { name: 'Sign out' })).toBeVisible();
      expect(
        screen.getByRole('menuitem', { name: 'My bookmarks' }),
      ).toHaveAttribute('href', '/bookmarks');
      expect(
        screen.getByRole('menuitem', { name: 'Account settings' }),
      ).toHaveAttribute('href', '/account');
    });

    it('dresses the panel in the WindowChrome terminal shell with the real session user, not a hardcoded name', async () => {
      setup();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: 'Account menu' }));
      const panel = screen.getByRole('menu');

      // Asserts the bar shows this session's email-derived username, not a
      // hardcoded placeholder.
      expect(within(panel).getByText('jane')).toBeVisible();
      expect(panel.textContent).toMatch(/jane\s+Account/);
    });

    it('renders a plain user-info row and link list with no terminal bar when plain', async () => {
      setupPlain();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: 'Account menu' }));
      const panel = screen.getByRole('menu');

      expect(within(panel).getAllByText('Jane Doe').length).toBeGreaterThan(0);
      expect(
        screen.getByRole('menuitem', { name: 'My bookmarks' }),
      ).toBeVisible();
      expect(panel.textContent).not.toMatch(/jane\s+Account/);
    });

    it('calls signOut when Sign out is clicked', async () => {
      setup();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: 'Account menu' }));
      await user.click(screen.getByRole('menuitem', { name: 'Sign out' }));

      expect(signOutMock).toHaveBeenCalled();
    });

    it('derives a different bar username for a different session (proves it is not hardcoded)', async () => {
      useSessionMock.mockReturnValue({
        data: {
          user: {
            name: 'Chester Reader',
            email: 'chester@example.com',
            image: null,
          },
          expires: '2099-01-01',
        },
        status: 'authenticated',
      });
      setup();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: 'Account menu' }));
      const panel = screen.getByRole('menu');

      expect(within(panel).getByText('chester')).toBeVisible();
      expect(within(panel).queryByText('jane')).not.toBeInTheDocument();
    });
  });
});
