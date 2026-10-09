import { renderWithIntl, screen } from '@platform/testing/custom-render';

import { WorkspacePendingView } from './workspace-pending-view';

vi.mock('@platform/i18n/navigation');
vi.mock('@platform/server/auth/sign-out-action');

describe(WorkspacePendingView, () => {
  it('renders the heading and description from the messages file', () => {
    renderWithIntl(<WorkspacePendingView />);

    expect(
      screen.getByRole('heading', { name: "Your workspace isn't ready yet" }),
    ).toBeVisible();
    expect(
      screen.getByText(
        'This can happen while a workspace is being set up, or if something went wrong along the way. Try refreshing in a few minutes, or contact whoever invited you if it keeps happening.',
      ),
    ).toBeVisible();
  });

  it('offers a retry back through the dashboard and a sign out', () => {
    renderWithIntl(<WorkspacePendingView />);

    expect(screen.getByRole('link', { name: 'Try again' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeVisible();
  });
});
