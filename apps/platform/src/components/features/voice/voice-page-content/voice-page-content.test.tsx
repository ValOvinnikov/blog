import { LOCALE_ISO_CODES } from '@blog/config/constants';
import de from '@platform/i18n/messages/de.json';
import {
  customRenderAsync,
  screen,
  within,
} from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { ARCHIVED_NOTICE_TEXT } from '@platform/testing/render-in-settings-form';
import {
  makeReadyTenant,
  MOCK_ARCHIVED_AT,
} from '@platform/testing/tenants/fixtures';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import userEvent from '@testing-library/user-event';

import { VoicePageContent } from './voice-page-content';

const NOTHING_HERE = 'Nothing here';

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
    getSiteConfigMock.mockResolvedValue(undefined);
    selectLiveLocalesMock.mockReset();
    selectLiveLocalesMock.mockReturnValue([EN]);
  });

  it('shows every field at its default when there is no site_config row', async () => {
    await setup();

    expect(notFoundHeading()).toHaveValue('');
    expect(screen.getAllByText('Default')).toHaveLength(11);
  });

  it("renders the default language's saved override as the field value", async () => {
    getSiteConfigMock.mockResolvedValue({
      ...defaultLookFormValues(),
      voiceOverridesByLocale: {
        [EN]: { notFoundHeading: NOTHING_HERE },
        [DE]: { notFoundHeading: 'Nichts hier' },
      },
    });

    await setup();

    expect(notFoundHeading()).toHaveValue(NOTHING_HERE);
  });

  describe('with a second live language', () => {
    beforeEach(async () => {
      selectLiveLocalesMock.mockReturnValue([EN, DE]);
      await setup();
    });

    it('offers a language switcher over the live languages', () => {
      expect(screen.getByRole('group', { name: 'Language' })).toBeVisible();
    });

    it('renders the empty-list specimen in the language being edited', async () => {
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'German' }));

      const { eyebrow, heading, count } = de.voiceSpecimen.lists.blogList;
      const specimen = within(screen.getByTestId('voice-specimen-ARCHIVE'));
      expect(specimen.getByText(eyebrow)).toBeInTheDocument();
      expect(specimen.getByText(heading)).toBeInTheDocument();
      expect(specimen.getByText(count)).toBeInTheDocument();
    });
  });

  it('passes the archived date through for a deprovisioned tenant', async () => {
    await setup({
      tenant: {
        ...tenant,
        deprovisionedAt: MOCK_ARCHIVED_AT,
      },
    });

    expect(screen.getByText(ARCHIVED_NOTICE_TEXT)).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Save changes' }),
    ).not.toBeInTheDocument();
  });
});
