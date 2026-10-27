import { VOICE_FIELDS, VOICE_SURFACE } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
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
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { VoicePageContent } from './voice-page-content';

faker.seed(5994);

const { EN, DE } = LOCALE_ISO_CODES;

const MOCK_GERMAN_HEADING = faker.lorem.words(2);

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

const setup = customRenderAsync(VoicePageContent, {
  tenant: mockReadyTenant(),
});

const notFoundHeading = () => {
  const notFoundRegion = screen.getByRole('region', {
    name: 'Page not found',
  });

  return within(notFoundRegion).getByRole('textbox', { name: 'Heading' });
};

describe(`<${VoicePageContent.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    getSiteConfigMock.mockReset().mockResolvedValue(undefined);
    selectLiveLocalesMock.mockReset().mockReturnValue([EN]);
  });

  it('shows every field at its default when there is no site_config row', async () => {
    await setup();

    const headingInput = notFoundHeading();
    const defaultBadges = screen.getAllByText('Default');

    expect(headingInput).toHaveValue('');
    expect(defaultBadges).toHaveLength(VOICE_FIELDS.length);
  });

  it("renders the default language's saved override as the field value", async () => {
    getSiteConfigMock.mockResolvedValue({
      ...defaultLookFormValues(),
      voiceOverridesByLocale: {
        [EN]: { notFoundHeading: NOTHING_HERE },
        [DE]: { notFoundHeading: MOCK_GERMAN_HEADING },
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
      const germanButton = screen.getByRole('button', { name: 'German' });
      await user.click(germanButton);

      const { eyebrow, heading, count } = de.voiceSpecimen.lists.blogList;
      const specimenRoot = screen.getByTestId(
        `voice-specimen-${VOICE_SURFACE.ARCHIVE}`,
      );
      const specimen = within(specimenRoot);
      const eyebrowText = specimen.getByText(eyebrow);
      const headingText = specimen.getByText(heading);
      const countText = specimen.getByText(count);

      expect(eyebrowText).toBeVisible();
      expect(headingText).toBeVisible();
      expect(countText).toBeVisible();
    });
  });

  it('shows the archived notice and no Save for a deprovisioned tenant', async () => {
    await setup({
      tenant: mockReadyTenant({ deprovisionedAt: MOCK_ARCHIVED_AT }),
    });

    const archivedNotice = screen.getByText(ARCHIVED_NOTICE_TEXT);
    const saveButton = screen.queryByRole('button', { name: 'Save changes' });

    expect(archivedNotice).toBeVisible();
    expect(saveButton).not.toBeInTheDocument();
  });
});
