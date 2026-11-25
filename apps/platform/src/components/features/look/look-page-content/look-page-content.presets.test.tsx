import messages from '@platform/i18n/messages/en.json';
import { screen } from '@platform/testing/custom-render';
import {
  arrangeLookPageQueries,
  setupLookPageContent as setup,
} from '@platform/testing/look/look-page-content-setup';
import {
  getSiteConfigMock,
  selectLiveLocalesMock,
} from '@platform/testing/look/look-page-db';
import { mockSiteConfig } from '@platform/testing/site-config/fixtures';
import {
  mockReadyTenant,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { TENANT_PLAN } from '@shinefold/config/constants';
import { MOCK_SHINEFOLD_PRESET_GRANT } from '@shinefold/db/testing/tenant-entitlement-grants/mock-entitlement-grant';

import { LookPageContent } from './look-page-content';

vi.mock('@shinefold/db', async () =>
  (await import('@platform/testing/look/look-page-db')).mockLookPageDb(),
);

vi.mock('@platform/server/settings-features/get-enabled-capabilities');

vi.mock('@platform/utils/env/env');

const { shinefold: SHINEFOLD } = messages.presetPicker;

describe(`<${LookPageContent.name}/> the Shinefold preset`, () => {
  beforeEach(() => {
    arrangeLookPageQueries({
      getSiteConfig: getSiteConfigMock,
      selectLiveLocalesWithin: selectLiveLocalesMock,
    });
    getSiteConfigMock.mockResolvedValue(mockSiteConfig());
  });

  it('is not offered without its grant', async () => {
    await setup({ tenant: mockReadyTenant({ plan: TENANT_PLAN.GROWTH }) });

    const shinefoldPreset = screen.queryByRole('radio', { name: SHINEFOLD });
    expect(shinefoldPreset).not.toBeInTheDocument();
  });

  it('is offered with its grant', async () => {
    await setup({
      tenant: mockTenant({ plan: TENANT_PLAN.FREE }, [
        MOCK_SHINEFOLD_PRESET_GRANT,
      ]),
    });

    const shinefoldPreset = screen.getByRole('radio', { name: SHINEFOLD });
    expect(shinefoldPreset).toBeVisible();
  });
});
