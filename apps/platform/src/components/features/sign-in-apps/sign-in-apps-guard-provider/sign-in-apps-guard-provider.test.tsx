import { SignInAppCard } from '@platform/components/features/sign-in-apps/sign-in-app-card';
import { GuardedLink } from '@platform/components/shared/guarded-link';
import { useRouter as useGuardRouter } from '@platform/i18n/base-navigation';
import en from '@platform/i18n/messages/en.json';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  MOCK_CLIENT_ID,
  MOCK_CLIENT_SECRET,
  mockSignInAppView,
} from '@platform/testing/sign-in-apps/fixtures';
import {
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import { OAUTH_PROVIDER } from '@shinefold/config/constants';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { SignInAppsGuardProvider } from './sign-in-apps-guard-provider';

vi.mock('@platform/i18n/base-navigation');
vi.mock('@platform/server/sign-in-apps/save-sign-in-app-action');

const { signInAppsPage: page, leavePageDialog, navSections } = en;
const t = makeEnTranslator();

const cardFields = () => {
  const [googleClientId] = screen.getAllByRole('textbox', {
    name: page.clientIdLabel,
  });
  const [, githubSecret] = screen.getAllByLabelText(page.clientSecretLabel);
  return { googleClientId, githubSecret };
};

describe(`<${SignInAppsGuardProvider.name}/>`, () => {
  const push = vi.mocked(vi.mocked(useGuardRouter)().push);
  let user: UserEvent;

  beforeEach(async () => {
    push.mockReset();
    mockRouterRefresh();
    renderWithIntl(
      <>
        <SignInAppsGuardProvider pageTitle={page.pageTitle}>
          {[OAUTH_PROVIDER.GOOGLE, OAUTH_PROVIDER.GITHUB].map((provider) => (
            <SignInAppCard
              key={provider}
              tenantId={MOCK_TENANT_ID}
              app={mockSignInAppView({ provider })}
              domain={MOCK_TENANT_DOMAIN}
            />
          ))}
        </SignInAppsGuardProvider>
        <GuardedLink href={adminRoutes.dashboard()}>
          {navSections.overview}
        </GuardedLink>
      </>,
    );
    user = userEvent.setup();
    const { googleClientId, githubSecret } = cardFields();
    await user.type(googleClientId!, MOCK_CLIENT_ID);
    await user.type(githubSecret!, MOCK_CLIENT_SECRET);
    const overview = screen.getByRole('link', { name: navSections.overview });
    await user.click(overview);
  });

  it('asks before leaving, counting the unsaved fields across both cards', () => {
    const dialog = screen.getByRole('alertdialog', {
      name: leavePageDialog.title,
    });

    expect(dialog).toHaveAccessibleDescription(
      t('leavePageDialog.description', { count: 2, page: page.pageTitle }),
    );
    expect(push).not.toHaveBeenCalled();
  });

  it('empties both cards on Discard and leave', async () => {
    const discard = screen.getByRole('button', {
      name: leavePageDialog.discardAndLeave,
    });

    await user.click(discard);

    const { googleClientId, githubSecret } = cardFields();
    expect(push).toHaveBeenCalledWith(adminRoutes.dashboard());
    expect(googleClientId).toHaveValue('');
    expect(githubSecret).toHaveValue('');
  });
});
