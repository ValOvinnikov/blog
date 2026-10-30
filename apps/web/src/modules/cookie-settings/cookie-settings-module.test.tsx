import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { CONSENT_LOG } from '@web/constants/consent';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockCookieSettingsModule } from '@web/testing/modules/cookie-settings/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { CookieSettingsModule } from './cookie-settings-module';

const { getCookieSettingsMock } = vi.hoisted(() => ({
  getCookieSettingsMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      cookieSettings: { v1: { getCookieSettings: getCookieSettingsMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

faker.seed(6088);

const MOCK_MODULE_ID = faker.string.uuid();
const MOCK_EDITOR_HEADING = faker.lorem.sentence();

const setup = customRenderAsync(CookieSettingsModule, { id: MOCK_MODULE_ID });

describe(`<${CookieSettingsModule.name}/>`, () => {
  beforeEach(() => {
    getCookieSettingsMock.mockReset();
    getCookieSettingsMock.mockResolvedValue(
      okResult(mockCookieSettingsModule()),
    );
  });

  it('fetches the module with the tenant Sanity context', async () => {
    await setup();

    expect(getCookieSettingsMock).toHaveBeenCalledWith(
      MOCK_MODULE_ID,
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('logs and renders nothing when the fetch fails', async () => {
    getCookieSettingsMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(logger.error).toHaveBeenCalledWith(CONSENT_LOG.MODULE_FETCH_FAILED, {
      id: MOCK_MODULE_ID,
      error: MOCK_ERROR,
    });
  });

  it('names the section with the cookie settings heading when the editor set none', async () => {
    await setup();

    const section = screen.getByRole('region', { name: 'Cookie settings' });

    expect(section).toBeVisible();
  });

  it("names the section with the editor's heading", async () => {
    getCookieSettingsMock.mockResolvedValue(
      okResult(
        mockCookieSettingsModule({
          headingBlock: mockHeadingBlock({ heading: MOCK_EDITOR_HEADING }),
        }),
      ),
    );

    await setup();

    const section = screen.getByRole('region', { name: MOCK_EDITOR_HEADING });

    expect(section).toBeVisible();
  });
});
