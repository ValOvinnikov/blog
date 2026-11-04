import {
  ACTION_OUTCOME,
  EMAIL_TEMPLATE_TYPE,
  LOCALE_ISO_CODES,
} from '@blog/config';
import { faker } from '@faker-js/faker';
import { EMAIL_SENDER_FIELD_ERROR } from '@platform/constants/email-sender';
import { ARIA_SELECTED } from '@platform/testing/aria';
import { screen, within } from '@platform/testing/custom-render';
import {
  cleanUpEmailSettings,
  EDIT,
  ENGLISH,
  FRENCH,
  getEditingPicker,
  getSaveBar,
  MOCK_INVALID_SENDER_NAME,
  openTemplate,
  pickerText,
  prepareEmailSettings,
  PREVIEW,
  save,
  SENDER_NAME,
  setupEmailSettings,
  SUBJECT_ENGLISH,
  tForm,
  tSaveBar,
  tStatus,
  typeFrenchSignInSubject,
  updateEmailConfigActionMock,
} from '@platform/testing/email/email-settings';
import {
  GO_TO_THE_FIRST_ONE,
  ONE_FIELD_NEEDS_ATTENTION,
  SAVE_CHANGES,
} from '@platform/testing/render-in-settings-form';
import { EMAIL_SENDER_ITEM } from '@platform/utils/email-draft/email-draft';
import type { UserEvent } from '@testing-library/user-event';

import { EmailSettings } from './email-settings';

faker.seed(5995);

vi.mock('@platform/server/email-templates/update-email-template-action');
vi.mock('@platform/server/email-config/update-email-config-action');
vi.mock('@platform/server/email/upload-email-logo-action');
vi.mock('@platform/server/email/clear-email-logo-action');
vi.mock('@platform/server/email/send-test-email-action');

const MOCK_SENDER_NAME = faker.company.name();
const MOCK_TYPED_CHARACTER = faker.string.alpha();

describe(`<${EmailSettings.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    ({ user } = prepareEmailSettings());
  });

  afterEach(cleanUpEmailSettings);

  describe('the save bar', () => {
    it('breaks the changes down so the parts add up to the total', async () => {
      setupEmailSettings();
      const senderNameInput = screen.getByLabelText(SENDER_NAME);
      await user.type(senderNameInput, MOCK_SENDER_NAME);
      await typeFrenchSignInSubject(user);

      const saveBar = getSaveBar();

      expect(saveBar).toHaveTextContent(
        `${tSaveBar('unsavedChanges', { count: 2 })}${tForm.allLanguagesChanges} 1 · ${FRENCH} 1`,
      );
    });

    it('shows no language breakdown with one live language', async () => {
      setupEmailSettings({ liveLocales: [LOCALE_ISO_CODES.EN] });
      const senderNameInput = screen.getByLabelText(SENDER_NAME);
      await user.type(senderNameInput, MOCK_SENDER_NAME);

      const saveBar = getSaveBar();

      expect(saveBar).toHaveTextContent(
        tSaveBar('unsavedChanges', { count: 1 }),
      );
      expect(saveBar).not.toHaveTextContent(tForm.allLanguagesChanges);
      expect(saveBar).not.toHaveTextContent(ENGLISH);
    });

    describe('when the sender name is rejected', () => {
      const goToFirstField = async () => {
        const saveBar = getSaveBar();
        const firstFieldLink = within(saveBar).getByRole('link', {
          name: GO_TO_THE_FIRST_ONE,
        });
        await user.click(firstFieldLink);
      };

      const saveAndSettle = async () => {
        await save(user);
        const barWithLink = getSaveBar();
        await within(barWithLink).findByRole('link', {
          name: GO_TO_THE_FIRST_ONE,
        });
        const barWithSave = getSaveBar();
        await within(barWithSave).findByRole('button', { name: SAVE_CHANGES });
      };

      beforeEach(async () => {
        updateEmailConfigActionMock.mockResolvedValue({
          outcome: ACTION_OUTCOME.INVALID,
          fieldErrors: {
            senderName: {
              reason: EMAIL_SENDER_FIELD_ERROR.SENDER_NAME_INVALID,
            },
          },
        });
        setupEmailSettings();
        const senderNameInput = screen.getByLabelText(SENDER_NAME);
        await user.type(senderNameInput, MOCK_INVALID_SENDER_NAME);
      });

      it('opens Sender & footer and focuses the sender name from a template', async () => {
        await openTemplate(user, EMAIL_TEMPLATE_TYPE.MAGIC_LINK);
        const subjectInput = screen.getByLabelText(SUBJECT_ENGLISH);
        await user.type(subjectInput, MOCK_TYPED_CHARACTER);
        await saveAndSettle();

        const attentionBar = getSaveBar();

        expect(attentionBar).toHaveTextContent(ONE_FIELD_NEEDS_ATTENTION);

        await goToFirstField();

        const senderNameInput = screen.getByLabelText(SENDER_NAME);
        const editingPicker = getEditingPicker();

        expect(senderNameInput).toHaveFocus();
        expect(editingPicker).toHaveTextContent(
          pickerText(EMAIL_SENDER_ITEM, tStatus.unsaved),
        );
      });

      it('returns to the Edit tab and focuses the sender name from the Preview', async () => {
        const previewTab = screen.getByRole('tab', { name: PREVIEW });
        await user.click(previewTab);
        await saveAndSettle();

        const attentionBar = getSaveBar();

        expect(attentionBar).toHaveTextContent(ONE_FIELD_NEEDS_ATTENTION);

        await goToFirstField();

        const editTab = screen.getByRole('tab', { name: EDIT });
        const senderNameInput = screen.getByLabelText(SENDER_NAME);

        expect(editTab).toHaveAttribute(ARIA_SELECTED, 'true');
        expect(senderNameInput).toHaveFocus();
      });
    });
  });
});
