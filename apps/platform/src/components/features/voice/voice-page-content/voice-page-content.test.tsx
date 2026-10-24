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
  mockReadyTenant,
  MOCK_ARCHIVED_AT,
} from '@platform/testing/tenants/fixtures';
import { NOTHING_HERE } from '@platform/testing/voice/fixtures';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import userEvent from '@testing-library/user-event';

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

const tenant = mockReadyTenant();

const setup = customRenderAsync(VoicePageContent, { tenant });

const notFoundHeading = () => {
  const notFoundRegion = screen.getByRole('region', {
    name: 'Page not found',
  });

  return within(notFoundRegion).getByRole('textbox', { name: 'Heading' });
};

describe(`<${VoicePageContent.name}/>`, () => {
  beforeEach(() => {
    getSiteConfigMock.mockReset();
    getSiteConfigMock.mockResolvedValue(undefined);
    selectLiveLocalesMock.mockReset();
    selectLiveLocalesMock.mockReturnValue([EN]);
  });

  it('shows every field at its default when there is no site_config row', async () => {
    await setup();

    const headingInput = notFoundHeading();
    const defaultBadges = screen.getAllByText('Default');

    expect(headingInput).toHaveValue('');
    expect(defaultBadges).toHaveLength(11);
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

    const headingInput = notFoundHeading();

    expect(headingInput).toHaveValue(NOTHING_HERE);
  });

  describe('with a second live language', () => {
    beforeEach(async () => {
      selectLiveLocalesMock.mockReturnValue([EN, DE]);
      await setup();
    });

    it('offers a language switcher over the live languages', () => {
      const languageSwitcher = screen.getByRole('group', { name: 'Language' });

      expect(languageSwitcher).toBeVisible();
    });

    it('renders the empty-list specimen in the language being edited', async () => {
      const user = userEvent.setup();
      const germanButton = screen.getByRole('button', { name: 'German' });
      await user.click(germanButton);

      const { eyebrow, heading, count } = de.voiceSpecimen.lists.blogList;
      const specimenRoot = screen.getByTestId('voice-specimen-ARCHIVE');
      const specimen = within(specimenRoot);
      const eyebrowText = specimen.getByText(eyebrow);
      const headingText = specimen.getByText(heading);
      const countText = specimen.getByText(count);

      expect(eyebrowText).toBeInTheDocument();
      expect(headingText).toBeInTheDocument();
      expect(countText).toBeInTheDocument();
    });
  });

  it('passes the archived date through for a deprovisioned tenant', async () => {
    await setup({
      tenant: {
        ...tenant,
        deprovisionedAt: MOCK_ARCHIVED_AT,
      },
    });

    const archivedNotice = screen.getByText(ARCHIVED_NOTICE_TEXT);
    const saveButton = screen.queryByRole('button', { name: 'Save changes' });

    expect(archivedNotice).toBeVisible();
    expect(saveButton).not.toBeInTheDocument();
  });
});
