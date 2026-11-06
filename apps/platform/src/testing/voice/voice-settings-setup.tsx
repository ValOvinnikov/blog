import { VOICE_FIELD_ERROR, type TVoicePortableText } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { VoiceListSamplesProvider } from '@platform/components/features/voice/voice-list-samples-provider';
import {
  VoiceSettings,
  type TVoiceSettingsProps,
} from '@platform/components/features/voice/voice-settings';
import de from '@platform/i18n/messages/de.json';
import en from '@platform/i18n/messages/en.json';
import { customRender, screen, within } from '@platform/testing/custom-render';
import {
  SAVE_CHANGES,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { NOTHING_HERE } from '@platform/testing/voice/fixtures';
import { openVoiceSections } from '@platform/testing/voice/sections';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { buildVoiceDraft } from '@platform/utils/voice-draft-builder/voice-draft-builder';
import type { UserEvent } from '@testing-library/user-event';

const { EN, DE } = LOCALE_ISO_CODES;

export const MOCK_MAX_LENGTH = 100;

export const TOO_LONG_ERROR = {
  reason: VOICE_FIELD_ERROR.TOO_LONG,
  values: { max: MOCK_MAX_LENGTH },
};

export const MISSING_NAME_ERROR = {
  reason: VOICE_FIELD_ERROR.MISSING_PLACEHOLDER,
  values: { placeholders: '{name}', count: 1 },
};

export const MISSING_NAME_MESSAGE =
  'Keep the placeholder {name} — the site fills it in.';

export const NO_OVERRIDES = 'with no overrides';
export const TWO_LANGUAGES = 'with stored overrides in two live languages';
export const GERMAN = en.languageNames.DE;
export const RESET = en.fieldStatus.reset;

export const PAGE_NOT_FOUND = en.voiceSurfaces.NOT_FOUND;
export const ERROR_PAGE = en.voiceSurfaces.ERROR;
export const EMPTY_LISTS = en.voiceSurfaces.ARCHIVE;
export const BOOKMARKS = en.voiceSurfaces.BOOKMARKS;

const richText = (text: string, key: string): TVoicePortableText => [
  {
    _type: 'block',
    _key: `${key}-b`,
    style: 'normal',
    children: [
      { _type: 'span', _key: `${key}-s1`, text, marks: ['em'] },
      { _type: 'span', _key: `${key}-s2`, text: ' here', marks: ['l1'] },
    ],
    markDefs: [{ _type: 'link', _key: 'l1', href: '/blog' }],
  },
];

export const STORED_VOICE_OVERRIDES = {
  [EN]: {
    notFoundHeading: NOTHING_HERE,
    notFoundSupportingText: richText('Try the archive', 'en-nf'),
    bookmarksEmpty: richText('Save a post to read it later', 'en-bm'),
  },
  [DE]: {
    localeErrorDescription: richText('Bitte später erneut', 'de-err'),
  },
};

export const DRAFTED_BLOG_LIST_TEXT = 'Notes are on their way';

export const STORED_BLOG_LIST_OVERRIDE = {
  [EN]: { blogListEmpty: richText('Fresh notes soon', 'en-bl') },
};

export const DRAFTED_BLOG_LIST_OVERRIDE = {
  [EN]: { blogListEmpty: richText(DRAFTED_BLOG_LIST_TEXT, 'en-bl-d') },
};

const VoiceSettingsWithListSamples = (props: TVoiceSettingsProps) => (
  <VoiceListSamplesProvider
    samplesByLocale={{
      [EN]: en.voiceSpecimen.lists,
      [DE]: de.voiceSpecimen.lists,
    }}
  >
    <VoiceSettings {...props} />
  </VoiceListSamplesProvider>
);

export const setupVoiceSettings = customRender(VoiceSettingsWithListSamples, {
  tenantId: MOCK_TENANT_ID,
  initialDraft: buildVoiceDraft({}, [EN]),
  defaultLocale: EN,
  liveLocales: [EN],
  previewTheme: defaultLookFormValues(),
});

export const setupBilingualVoiceSettings = (
  overrides: Partial<TVoiceSettingsProps> = {},
) =>
  setupVoiceSettings({
    initialDraft: buildVoiceDraft(STORED_VOICE_OVERRIDES, [EN, DE]),
    liveLocales: [EN, DE],
    ...overrides,
  });

export const activeLanguageLabel = (language: string) =>
  screen.getByText(language, { selector: 'strong' });

export const voiceCard = (name: string) => screen.getByRole('region', { name });

export const notFoundHeadingField = () =>
  within(voiceCard(PAGE_NOT_FOUND)).getByRole('textbox', { name: 'Heading' });

export const editVoiceHeadingAndSave = async (
  user: UserEvent,
  text: string,
) => {
  const headingField = notFoundHeadingField();
  await user.type(headingField, text);

  const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
  const saveButton = within(saveBar).getByRole('button', {
    name: SAVE_CHANGES,
  });
  await user.click(saveButton);
};

export const setupVoiceSettingsWithSectionsOpen = async (
  user: UserEvent,
  overrides: Partial<TVoiceSettingsProps> = {},
) => {
  setupVoiceSettings(overrides);
  await openVoiceSections(user);
};

export const setupBilingualVoiceSettingsWithSectionsOpen = async (
  user: UserEvent,
  overrides: Partial<TVoiceSettingsProps> = {},
) => {
  setupBilingualVoiceSettings(overrides);
  await openVoiceSections(user);
};
