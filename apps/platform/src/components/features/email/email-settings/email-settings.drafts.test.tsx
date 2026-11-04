import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config';
import { faker } from '@faker-js/faker';
import { screen, within } from '@platform/testing/custom-render';
import {
  chooseLanguage,
  cleanUpEmailSettings,
  fieldLabel,
  FRENCH,
  MOCK_FRENCH_SUBJECT,
  MOCK_INITIAL_DRAFT,
  openPicker,
  openTemplate,
  optionName,
  prepareEmailSettings,
  selectSenderLogo,
  setupEmailSettings,
  SUBJECT_FRENCH,
  tStatus,
  tTemplate,
  typeFrenchSignInSubject,
} from '@platform/testing/email/email-settings';
import {
  mockEmailBody,
  MOCK_EMAIL_DRAFT_SUBJECT,
} from '@platform/testing/email-draft';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import {
  EMAIL_SENDER_ITEM,
  withCopy,
} from '@platform/utils/email-draft/email-draft';
import {
  settingsDraftStorageKey,
  writeSettingsDraft,
} from '@platform/utils/settings-draft-storage/settings-draft-storage';
import type { UserEvent } from '@testing-library/user-event';

import { EmailSettings } from './email-settings';

faker.seed(5996);

vi.mock('@platform/server/email-templates/update-email-template-action');
vi.mock('@platform/server/email-config/update-email-config-action');
vi.mock('@platform/server/email/upload-email-logo-action');
vi.mock('@platform/server/email/clear-email-logo-action');
vi.mock('@platform/server/email/send-test-email-action');

const { MAGIC_LINK } = EMAIL_TEMPLATE_TYPE;
const { EN } = LOCALE_ISO_CODES;
const MESSAGE_ENGLISH = fieldLabel(tTemplate.bodyLabel, EN);
const RESTORE_ONE_CHANGE = makeEnTranslator('draftRecovery')('restore', {
  count: 1,
});
const MOCK_RESTORED_MESSAGE = faker.lorem.sentence();

describe(`<${EmailSettings.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    ({ user } = prepareEmailSettings());
  });

  afterEach(cleanUpEmailSettings);

  it('restores an unsaved translation after leaving the page, but not a staged logo', async () => {
    const { unmount } = setupEmailSettings();
    await selectSenderLogo();
    await typeFrenchSignInSubject(user);
    unmount();

    setupEmailSettings();
    const restoreButton = screen.getByRole('button', {
      name: RESTORE_ONE_CHANGE,
    });
    await user.click(restoreButton);
    await openTemplate(user, MAGIC_LINK);
    await chooseLanguage(user, FRENCH);

    const restoredSubjectInput = screen.getByLabelText(SUBJECT_FRENCH);
    const list = await openPicker(user);
    const senderOption = within(list).getByRole('option', {
      name: optionName(EMAIL_SENDER_ITEM, tStatus.default),
    });

    expect(restoredSubjectInput).toHaveValue(MOCK_FRENCH_SUBJECT);
    expect(senderOption).toBeVisible();
  });

  it('shows a restored message in the template already open', async () => {
    writeSettingsDraft(
      settingsDraftStorageKey({ tenantId: MOCK_TENANT_ID, page: 'email' }),
      {
        values: withCopy(
          MOCK_INITIAL_DRAFT,
          { templateType: MAGIC_LINK, locale: EN },
          {
            subject: MOCK_EMAIL_DRAFT_SUBJECT,
            body: mockEmailBody(MOCK_RESTORED_MESSAGE),
          },
        ),
        baseline: MOCK_INITIAL_DRAFT,
        takenAt: new Date().toISOString(),
      },
    );
    setupEmailSettings();
    await openTemplate(user, MAGIC_LINK);

    const restoreButton = screen.getByRole('button', {
      name: RESTORE_ONE_CHANGE,
    });
    await user.click(restoreButton);

    const messageEditor = await screen.findByRole('textbox', {
      name: MESSAGE_ENGLISH,
    });

    expect(messageEditor).toHaveTextContent(MOCK_RESTORED_MESSAGE);
  });
});
