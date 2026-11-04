import {
  EMAIL_TEMPLATE_TYPE,
  LOCALE_ISO_CODES,
  type TEmailTemplateType,
  type TLocaleIsoCode,
} from '@blog/config';
import { EmailSettings } from '@platform/components/features/email/email-settings/email-settings';
import en from '@platform/i18n/messages/en.json';
import { uploadEmailLogoAction } from '@platform/server/email/upload-email-logo-action';
import { updateEmailConfigAction } from '@platform/server/email-config/update-email-config-action';
import { updateEmailTemplateAction } from '@platform/server/email-templates/update-email-template-action';
import { customRender, screen, within } from '@platform/testing/custom-render';
import {
  mockEmailDraft,
  MOCK_EMAIL_DRAFT_LIVE_LOCALES,
} from '@platform/testing/email-draft';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { createMockFaker } from '@platform/testing/mock-faker';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  SAVE_CHANGES,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import { selectFile } from '@platform/testing/select-file';
import { MOCK_STAGED_LOGO_BLOB_URL } from '@platform/testing/site-config/fixtures';
import { MOCK_TENANT_EMAIL_BRAND } from '@platform/testing/tenant-email-brand';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import {
  EMAIL_SENDER_ITEM,
  type TEmailPageItem,
} from '@platform/utils/email-draft/email-draft';
import userEvent, { type UserEvent } from '@testing-library/user-event';

const { EN, FR } = LOCALE_ISO_CODES;
const emailSettingsFaker = createMockFaker(5993);

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
  tenantId: MOCK_TENANT_ID,
  initialDraft: MOCK_INITIAL_DRAFT,
  defaultLocale: EN,
  liveLocales: MOCK_EMAIL_DRAFT_LIVE_LOCALES,
  brand: MOCK_TENANT_EMAIL_BRAND,
  brandName: MOCK_TENANT_NAME,
});

export const prepareEmailSettings = () => {
  updateEmailTemplateActionMock.mockReset();
  updateEmailConfigActionMock.mockReset();
  uploadEmailLogoActionMock.mockReset();
  vi.spyOn(URL, 'createObjectURL').mockReturnValue(MOCK_STAGED_LOGO_BLOB_URL);
  return { user: userEvent.setup(), refresh: mockRouterRefresh() };
};

export const cleanUpEmailSettings = () => {
  vi.restoreAllMocks();
  window.localStorage.clear();
};

const itemLabel = (item: TEmailPageItem) =>
  item === EMAIL_SENDER_ITEM
    ? tForm.senderItemLabel
    : tTemplate.templateTypeLabel[item];

const itemDescription = (item: TEmailPageItem) =>
  item === EMAIL_SENDER_ITEM
    ? tForm.senderItemDescription
    : tTemplate.templateTypeDescription[item];

export const pickerText = (item: TEmailPageItem, status: string) =>
  item === EMAIL_SENDER_ITEM
    ? `${itemLabel(item)}${status}`
    : `${itemLabel(item)}${tForm.templateGroupLabel} · ${status}`;

export const optionName = (item: TEmailPageItem, status: string) =>
  `${itemLabel(item)} ${itemDescription(item)}${status}`;

export const getEditingPicker = () =>
  screen.getByRole('combobox', { name: tForm.editingLabel });

export const getSaveBar = () =>
  screen.getByRole('region', { name: UNSAVED_CHANGES });

export const openPicker = async (user: UserEvent) => {
  const editingPicker = getEditingPicker();
  await user.click(editingPicker);
  return screen.findByRole('listbox');
};

export const openTemplate = async (
  user: UserEvent,
  item: TEmailTemplateType,
) => {
  const list = await openPicker(user);
  const option = within(list).getByRole('option', {
    name: new RegExp(`^${itemLabel(item)}`),
  });
  await user.click(option);
};

export const chooseLanguage = (user: UserEvent, name: string) => {
  const languageRadio = screen.getByRole('radio', { name });
  return user.click(languageRadio);
};

export const typeFrenchSignInSubject = async (user: UserEvent) => {
  await openTemplate(user, EMAIL_TEMPLATE_TYPE.MAGIC_LINK);
  await chooseLanguage(user, FRENCH);
  const frenchSubjectInput = screen.getByLabelText(SUBJECT_FRENCH);
  await user.type(frenchSubjectInput, MOCK_FRENCH_SUBJECT);
};

export const selectSenderLogo = () =>
  selectFile(
    new File(['x'], emailSettingsFaker.system.commonFileName('png'), {
      type: 'image/png',
    }),
  );

export const save = async (user: UserEvent) => {
  const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
  await user.click(saveButton);
};
