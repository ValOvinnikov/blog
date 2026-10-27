import { EMAIL_TEMPLATE_TYPE } from '@blog/config';
import { faker } from '@faker-js/faker';
import en from '@platform/i18n/messages/en.json';
import { screen } from '@platform/testing/custom-render';
import { mockEmailBody } from '@platform/testing/email-draft';
import {
  ARCHIVED_NOTICE_TEXT,
  customRenderInSettingsForm,
} from '@platform/testing/render-in-settings-form';
import type { TEmailCopyEdit } from '@platform/utils/email-draft/email-draft';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { EmailTemplateEditor } from './email-template-editor';

faker.seed(5993);

const {
  subjectLabel,
  subjectHint,
  bodyLabel,
  bodyHint,
  logoHint,
  templateTypeLabel,
} = en.emailTemplateEditor;
const { customised, reset, unsaved } = en.fieldStatus;
const LANGUAGE_NAME = en.languageNames.FR;
const LANGUAGE_PLACEHOLDER = '{language}';
const SUBJECT_LABEL = subjectLabel.replace(LANGUAGE_PLACEHOLDER, LANGUAGE_NAME);
const MESSAGE_LABEL = bodyLabel.replace(LANGUAGE_PLACEHOLDER, LANGUAGE_NAME);
const UPLOAD_TEMPLATE_LOGO = en.assetUploadField.TEMPLATE.upload;

const MOCK_FALLBACK_SUBJECT = faker.lorem.sentence();
const MOCK_SUBJECT = faker.lorem.words(2);
const MOCK_TYPED_CHARACTER = faker.string.alpha();

const mockCopy = (
  draftSubject: string,
  savedSubject: string,
): TEmailCopyEdit => ({
  draft: { subject: draftSubject, body: null },
  saved: { subject: savedSubject, body: null },
  fallback: {
    subject: MOCK_FALLBACK_SUBJECT,
    body: mockEmailBody(faker.lorem.sentence()),
  },
});

const MOCK_CUSTOMISED_COPY = mockCopy(MOCK_SUBJECT, MOCK_SUBJECT);

const onCopyChange = vi.fn();

const setup = customRenderInSettingsForm(EmailTemplateEditor, {
  templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
  languageName: LANGUAGE_NAME,
  copy: mockCopy('', ''),
  logo: { url: undefined },
  onCopyChange,
  onLogoStage: vi.fn(),
});

describe(`<${EmailTemplateEditor.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('with a blank subject and message', () => {
    beforeEach(() => {
      setup();
    });

    it('labels the fields with the language being edited', () => {
      const heading = screen.getByRole('heading', {
        name: templateTypeLabel.MAGIC_LINK,
      });
      const subjectInput = screen.getByLabelText(SUBJECT_LABEL);

      expect(heading).toBeVisible();
      expect(subjectInput).toBeVisible();
    });

    it('shows the copy that would be sent in place of a blank subject', () => {
      const subjectInput = screen.getByLabelText(SUBJECT_LABEL);
      const defaultBadges = screen.getAllByText(en.fieldStatus.default);

      expect(subjectInput).toHaveAttribute(
        'placeholder',
        MOCK_FALLBACK_SUBJECT,
      );
      expect(defaultBadges).toHaveLength(2);
    });

    it('reports a typed subject as the new copy', async () => {
      const subjectInput = screen.getByLabelText(SUBJECT_LABEL);
      await user.type(subjectInput, MOCK_TYPED_CHARACTER);

      expect(onCopyChange).toHaveBeenLastCalledWith({
        subject: MOCK_TYPED_CHARACTER,
        body: null,
      });
    });

    it('describes the message editor with its hint', async () => {
      const messageEditor = await screen.findByRole('textbox', {
        name: MESSAGE_LABEL,
      });

      expect(messageEditor).toHaveAccessibleDescription(bodyHint);
    });
  });

  it('clears a customised subject back to the default', async () => {
    setup({ copy: MOCK_CUSTOMISED_COPY });

    const customisedBadge = screen.getByText(customised);
    const resetButton = screen.getByRole('button', { name: reset });

    expect(customisedBadge).toBeVisible();

    await user.click(resetButton);

    expect(onCopyChange).toHaveBeenCalledWith({ subject: '', body: null });
  });

  it('marks an edited subject unsaved', () => {
    setup({ copy: mockCopy(MOCK_SUBJECT, '') });

    const unsavedMark = screen.getByText(unsaved);

    expect(unsavedMark).toBeVisible();
  });

  it('offers no reset while archived', () => {
    setup({ copy: MOCK_CUSTOMISED_COPY }, { isArchived: true });

    const customisedBadge = screen.getByText(customised);
    const resetButton = screen.queryByRole('button', { name: reset });

    expect(customisedBadge).toBeVisible();
    expect(resetButton).not.toBeInTheDocument();
  });

  it.each([
    { state: 'archived', formState: { isArchived: true } },
    { state: 'pending', formState: { isPending: true } },
  ])('locks every field while $state', ({ formState }) => {
    setup({}, formState);

    const subjectInput = screen.getByLabelText(SUBJECT_LABEL);
    const uploadButton = screen.getByRole('button', {
      name: UPLOAD_TEMPLATE_LOGO,
    });

    expect(subjectInput).toBeDisabled();
    expect(uploadButton).toBeDisabled();
  });

  describe('while archived', () => {
    beforeEach(() => {
      setup({}, { isArchived: true });
    });

    it('describes the subject with the notice', () => {
      const subjectInput = screen.getByLabelText(SUBJECT_LABEL);

      expect(subjectInput).toHaveAccessibleDescription(
        `${ARCHIVED_NOTICE_TEXT} ${subjectHint}`,
      );
    });

    it('describes the message editor with the notice', () => {
      const messageEditor = screen.getByRole('textbox', {
        name: MESSAGE_LABEL,
      });

      expect(messageEditor).toHaveAccessibleDescription(
        `${bodyHint} ${ARCHIVED_NOTICE_TEXT}`,
      );
    });

    it('describes the logo upload with the notice', () => {
      const uploadButton = screen.getByRole('button', {
        name: UPLOAD_TEMPLATE_LOGO,
      });

      expect(uploadButton).toHaveAccessibleDescription(
        `${logoHint} ${ARCHIVED_NOTICE_TEXT}`,
      );
    });
  });
});
