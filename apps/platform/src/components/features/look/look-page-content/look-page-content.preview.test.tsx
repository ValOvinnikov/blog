import { CAPABILITY } from '@blog/config';
import { TENANT_PLAN } from '@blog/config/constants';
import { SHINEFOLD_LOGO_NAME } from '@blog/utils/shinefold-logo';
import { SAMPLE_HEADER_FULL_TEST_ID } from '@platform/constants/sample-header';
import messages from '@platform/i18n/messages/en.json';
import { getEnabledCapabilities } from '@platform/server/settings-features/get-enabled-capabilities';
import { screen, within } from '@platform/testing/custom-render';
import { MOCK_PRODUCT_NAME } from '@platform/testing/env/fixtures';
import { mockedEnv } from '@platform/testing/env/mocked-env';
import {
  arrangeLookPageQueries,
  setupLookPageContent as setup,
} from '@platform/testing/look/look-page-content-setup';
import { mockReadyTenant } from '@platform/testing/tenants/fixtures';

import { LookPageContent } from './look-page-content';

const { getSiteConfigMock, selectLiveLocalesMock } = vi.hoisted(() => ({
  getSiteConfigMock: vi.fn(),
  selectLiveLocalesMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await (
    await import('@platform/testing/mock-db-constants')
  ).mockDbConstants()),
  queries: {
    siteConfig: { getSiteConfig: getSiteConfigMock },
    tenants: { selectLiveLocales: selectLiveLocalesMock },
  },
}));

vi.mock('@platform/server/settings-features/get-enabled-capabilities');

vi.mock('@platform/utils/env/env');

const SIGN_IN = 'Sign in';
const POWERED_BY_MARK = `${messages.lookPreview.footerPoweredByLabel} ${SHINEFOLD_LOGO_NAME}`;

describe(`<${LookPageContent.name}/> preview`, () => {
  beforeEach(() => {
    arrangeLookPageQueries({
      getSiteConfig: getSiteConfigMock,
      selectLiveLocales: selectLiveLocalesMock,
    });
  });

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

  describe('with the product name set', () => {
    beforeEach(() => {
      mockedEnv.PRODUCT_NAME = MOCK_PRODUCT_NAME;
    });

    afterEach(() => {
      delete mockedEnv.PRODUCT_NAME;
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
});
