import { screen, within } from '@platform/testing/custom-render';
import {
  emailSettingsFaker,
  FRENCH,
  MOCK_FRENCH_SUBJECT,
  SUBJECT_FRENCH,
  tForm,
  tTemplate,
} from '@platform/testing/email/email-settings';
import {
  SAVE,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import { selectFile } from '@platform/testing/select-file';
import {
  EMAIL_SENDER_ITEM,
  type TEmailPageItem,
} from '@platform/utils/email-draft/email-draft';
import {
  EMAIL_TEMPLATE_TYPE,
  type TEmailTemplateType,
} from '@shinefold/config';
import type { UserEvent } from '@testing-library/user-event';

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
  const saveButton = screen.getByRole('button', { name: SAVE });
  await user.click(saveButton);
};
