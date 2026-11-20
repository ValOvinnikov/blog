import { EmailSettings } from '@platform/components/features/email/email-settings/email-settings';
import en from '@platform/i18n/messages/en.json';
import { uploadEmailLogoAction } from '@platform/server/email/upload-email-logo-action';
import { updateEmailConfigAction } from '@platform/server/email-config/update-email-config-action';
import { updateEmailTemplateAction } from '@platform/server/email-templates/update-email-template-action';
import { customRender } from '@platform/testing/custom-render';
import {
  mockEmailDraft,
  MOCK_EMAIL_DRAFT_LIVE_LOCALES,
} from '@platform/testing/email-draft';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { createMockFaker } from '@platform/testing/mock-faker';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import { stubStagedImageUrl } from '@platform/testing/staged-image';
import { MOCK_TENANT_EMAIL_BRAND } from '@platform/testing/tenant-email-brand';
import {
  MOCK_TENANT_NAME,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@shinefold/config';
import userEvent from '@testing-library/user-event';

const { EN, FR } = LOCALE_ISO_CODES;
export const emailSettingsFaker = createMockFaker(5993);

export const tForm = en.emailForm;
export const tTemplate = en.emailTemplateEditor;
export const tStatus = en.fieldStatus;
export const tSaveBar = makeEnTranslator('saveBar');
export const { editTab: EDIT, previewTab: PREVIEW } = en.viewTabs;
export const { EN: ENGLISH, FR: FRENCH } = en.languageNames;
export const SENDER_NAME = en.emailSettingsForm.senderNameLabel;

export const fieldLabel = (label: string, locale: TLocaleIsoCode) =>
  label.replace('{language}', en.languageNames[locale]);
export const SUBJECT_ENGLISH = fieldLabel(tTemplate.subjectLabel, EN);
export const SUBJECT_FRENCH = fieldLabel(tTemplate.subjectLabel, FR);

export const MOCK_FRENCH_SUBJECT = emailSettingsFaker.lorem.words(2);
export const MOCK_INVALID_SENDER_NAME = emailSettingsFaker.internet.email();
export const MOCK_INITIAL_DRAFT = mockEmailDraft();
export const BLANK_SENDER_INPUT = {
  senderName: null,
  replyToAddress: null,
  footerPostalAddress: null,
};

export const updateEmailTemplateActionMock = vi.mocked(
  updateEmailTemplateAction,
);
export const updateEmailConfigActionMock = vi.mocked(updateEmailConfigAction);
export const uploadEmailLogoActionMock = vi.mocked(uploadEmailLogoAction);

export const setupEmailSettings = customRender(EmailSettings, {
  tenant: mockTenant(),
  initialDraft: MOCK_INITIAL_DRAFT,
  liveLocales: MOCK_EMAIL_DRAFT_LIVE_LOCALES,
  brand: MOCK_TENANT_EMAIL_BRAND,
  brandName: MOCK_TENANT_NAME,
});

export const prepareEmailSettings = () => {
  updateEmailTemplateActionMock.mockReset();
  updateEmailConfigActionMock.mockReset();
  uploadEmailLogoActionMock.mockReset();
  stubStagedImageUrl();
  return { user: userEvent.setup(), refresh: mockRouterRefresh() };
};

export const cleanUpEmailSettings = () => {
  vi.restoreAllMocks();
  window.localStorage.clear();
};
