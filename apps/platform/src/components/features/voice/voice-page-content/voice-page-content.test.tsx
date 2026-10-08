import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  customRenderAsync,
  screen,
  within,
} from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { makeReadyTenant } from '@platform/testing/tenants/fixtures';

import { VoicePageContent } from './voice-page-content';

const { EN, DE } = LOCALE_ISO_CODES;

const { getSiteConfigMock, selectLiveLocalesMock } = vi.hoisted(() => ({
  getSiteConfigMock: vi.fn(),
  selectLiveLocalesMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    siteConfig: { getSiteConfig: getSiteConfigMock },
    tenants: { selectLiveLocales: selectLiveLocalesMock },
  },
}));

vi.mock('@platform/server/auth/auth');

const tenant = makeReadyTenant();

const setup = customRenderAsync(VoicePageContent, { tenant });

const notFoundHeading = () =>
  within(screen.getByRole('region', { name: 'Page not found' })).getByRole(
    'textbox',
    { name: 'Heading' },
  );

describe(`<${VoicePageContent.name}/>`, () => {
  beforeEach(() => {
    getSiteConfigMock.mockReset();
    selectLiveLocalesMock.mockReset();
    selectLiveLocalesMock.mockReturnValue([EN]);
  });

  it('shows every field at its default when there is no site_config row', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    await setup();

    expect(notFoundHeading()).toHaveValue('');
    expect(screen.getAllByText('Default')).toHaveLength(11);
  });

  it("renders the default language's saved override as the field value", async () => {
    getSiteConfigMock.mockResolvedValue({
      voiceOverridesByLocale: {
        [EN]: { notFoundHeading: 'Nothing here' },
        [DE]: { notFoundHeading: 'Nichts hier' },
      },
    });

    await setup();

    expect(notFoundHeading()).toHaveValue('Nothing here');
  });

  it('offers a language switcher over the live languages', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);
    selectLiveLocalesMock.mockReturnValue([EN, DE]);

    await setup();

    expect(screen.getByRole('group', { name: 'Language' })).toBeVisible();
  });

  it('passes the archived date through for a deprovisioned tenant', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    await setup({
      tenant: {
        ...tenant,
        deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
      },
    });

    expect(screen.getByText('This tenant is archived')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Save changes' }),
    ).not.toBeInTheDocument();
  });
});
