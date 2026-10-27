import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config';
import { faker } from '@faker-js/faker';
import en from '@platform/i18n/messages/en.json';
import { screen } from '@platform/testing/custom-render';
import {
  mockEmailDraft,
  MOCK_SENDER_FIELD_IDS,
} from '@platform/testing/email-draft';
import { customRenderInSettingsForm } from '@platform/testing/render-in-settings-form';
import { EMAIL_SENDER_ITEM } from '@platform/utils/email-draft/email-draft';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { EmailEditPane } from './email-edit-pane';

faker.seed(5993);

const { EN, FR } = LOCALE_ISO_CODES;
const { MAGIC_LINK } = EMAIL_TEMPLATE_TYPE;
const FRENCH_SUBJECT_LABEL = en.emailTemplateEditor.subjectLabel.replace(
  '{language}',
  en.languageNames.FR,
);
const MOCK_DRAFT = mockEmailDraft();
const MOCK_TYPED_CHARACTER = faker.string.alpha();

const onSenderChange = vi.fn();
const onDraftChange = vi.fn();

const setup = customRenderInSettingsForm(EmailEditPane, {
  item: EMAIL_SENDER_ITEM,
  locale: EN,
  defaultLocale: EN,
  draft: MOCK_DRAFT,
  saved: MOCK_DRAFT,
  revision: 0,
  senderFieldIds: MOCK_SENDER_FIELD_IDS,
  onSenderChange,
  onDraftChange,
});

describe(`<${EmailEditPane.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('edits the sender on Sender & footer', async () => {
    setup();

    const senderNameInput = screen.getByLabelText(
      en.emailSettingsForm.senderNameLabel,
    );
    await user.type(senderNameInput, MOCK_TYPED_CHARACTER);

    expect(onSenderChange).toHaveBeenCalledWith({
      ...MOCK_DRAFT.sender,
      senderName: MOCK_TYPED_CHARACTER,
    });
  });

  it("edits a template's copy in the chosen language", async () => {
    setup({ item: MAGIC_LINK, locale: FR });

    const subjectInput = screen.getByLabelText(FRENCH_SUBJECT_LABEL);
    await user.type(subjectInput, MOCK_TYPED_CHARACTER);
    const [update] = onDraftChange.mock.lastCall ?? [];
    const updatedSubject = update(MOCK_DRAFT).copies[MAGIC_LINK][FR].subject;

    expect(updatedSubject).toBe(MOCK_TYPED_CHARACTER);
  });
});
