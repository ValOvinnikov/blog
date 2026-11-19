import { SAMPLE_HEADER_FULL_TEST_ID } from '@platform/constants/sample-header';
import messages from '@platform/i18n/messages/en.json';
import { getEnabledCapabilities } from '@platform/server/settings-features/get-enabled-capabilities';
import { screen, within } from '@platform/testing/custom-render';
import { setupLookPageContent as setup } from '@platform/testing/look/look-page-content-setup';
import { mockReadyTenant } from '@platform/testing/tenants/fixtures';
import { CAPABILITY } from '@shinefold/config';
import { TENANT_PLAN } from '@shinefold/config/constants';
import { SHINEFOLD_LOGO_NAME } from '@shinefold/utils/shinefold-logo';

import { LookPageContent } from './look-page-content';

vi.mock(
  '@shinefold/db',
  () => import('@platform/testing/site-config/site-config-db'),
);

vi.mock('@platform/server/settings-features/get-enabled-capabilities');

const SIGN_IN = 'Sign in';
const POWERED_BY_MARK = `${messages.lookPreview.footerPoweredByLabel} ${SHINEFOLD_LOGO_NAME}`;

describe(`<${LookPageContent.name}/> preview`, () => {
  it('previews Sign in when Reader accounts is on', async () => {
    vi.mocked(getEnabledCapabilities).mockResolvedValueOnce([
      CAPABILITY.READER_ACCOUNTS,
    ]);

    await setup();

    const fullHeader = screen.getByTestId(SAMPLE_HEADER_FULL_TEST_ID);
    const signInButton = within(fullHeader).getByRole('button', {
      name: SIGN_IN,
    });

    expect(signInButton).toBeVisible();
  });

  it('previews no Sign in while Reader accounts is off', async () => {
    vi.mocked(getEnabledCapabilities).mockResolvedValueOnce([
      CAPABILITY.BOOKMARKS,
      CAPABILITY.ANALYTICS,
    ]);

    await setup();

    const signInButton = screen.queryByRole('button', { name: SIGN_IN });

    expect(signInButton).not.toBeInTheDocument();
  });

  it('previews the Powered by mark on Free', async () => {
    await setup({ tenant: mockReadyTenant({ plan: TENANT_PLAN.FREE }) });

    const mark = screen.getByRole('link', { name: POWERED_BY_MARK });

    expect(mark).toBeInTheDocument();
  });

  it('previews no Powered by mark on Growth', async () => {
    await setup({ tenant: mockReadyTenant({ plan: TENANT_PLAN.GROWTH }) });

    const mark = screen.queryByRole('link', { name: POWERED_BY_MARK });

    expect(mark).not.toBeInTheDocument();
  });
});
