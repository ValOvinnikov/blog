import messages from '@platform/i18n/messages/en.json';
import { MOCK_SIGN_IN_EMAIL } from '@platform/testing/auth/fixtures';
import { customRender, screen } from '@platform/testing/custom-render';
import { adminRoutes } from '@platform/utils/routes/routes';

import { WorkspacePendingView } from './workspace-pending-view';

vi.mock('@platform/i18n/navigation');
vi.mock('@platform/server/auth/sign-out-action');

const setup = customRender(WorkspacePendingView, {
  accountEmail: MOCK_SIGN_IN_EMAIL,
});

describe(`<${WorkspacePendingView.name}/>`, () => {
  beforeEach(() => {
    setup();
  });

  it('explains that the workspace is not ready yet', () => {
    const heading = screen.getByRole('heading', {
      name: messages.workspacePendingPage.heading,
    });
    const description = screen.getByText(
      messages.workspacePendingPage.description,
    );

    expect(heading).toBeVisible();
    expect(description).toBeVisible();
  });

  it('offers a retry back through the dashboard', () => {
    const tryAgainLink = screen.getByRole('link', {
      name: messages.workspacePendingPage.tryAgain,
    });

    expect(tryAgainLink).toHaveAttribute('href', adminRoutes.dashboard());
  });

  it('names the signed-in email and offers a sign out', () => {
    const email = screen.getByText(MOCK_SIGN_IN_EMAIL, { exact: false });
    const signOutButton = screen.getByRole('button', {
      name: messages.account.signOut,
    });

    expect(email).toBeVisible();
    expect(signOutButton).toBeVisible();
  });
});
