import {
  SITE_MESSAGES_BY_LOCALE,
  VOICE_FIELD_KIND,
  VOICE_FIELDS,
  VOICE_SURFACE,
  type TVoiceFieldId,
} from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { VoiceEditorProvider } from '@platform/components/features/voice/voice-editor-provider';
import messages from '@platform/i18n/messages/en.json';
import { screen } from '@platform/testing/custom-render';
import {
  ARCHIVED_NOTICE_TEXT,
  customRenderInSettingsForm,
} from '@platform/testing/render-in-settings-form';
import { MOCK_SITE_PREVIEW_THEME } from '@platform/testing/site-preview-theme';
import {
  buildVoiceDraft,
  localeDraftOf,
  withVoiceValue,
  type TVoiceDraftValue,
  type TVoiceFieldErrors,
} from '@platform/utils/voice-draft/voice-draft';
import userEvent from '@testing-library/user-event';

import { VoiceField, type TVoiceFieldProps } from './voice-field';

faker.seed(5994);

const { EN } = LOCALE_ISO_CODES;
const HEADING = 'Heading';
const SUPPORTING_TEXT = 'Supporting text';
const ARIA_INVALID = 'aria-invalid';
const MOCK_FIELD_ID_PREFIX = faker.lorem.word();
const MOCK_ERROR = faker.lorem.sentence();
const MOCK_HEADING = faker.lorem.words(3);
const { reset: RESET } = messages.fieldStatus;

const setFieldValue = vi.fn();

const fieldById = (id: TVoiceFieldId) =>
  VOICE_FIELDS.find((field) => field.id === id)!;

type TVoiceFieldInEditorProps = TVoiceFieldProps & {
  value: TVoiceDraftValue;
  errors: TVoiceFieldErrors;
};

const VoiceFieldInEditor = ({
  field,
  value,
  errors,
}: TVoiceFieldInEditorProps) => {
  const values = localeDraftOf(
    withVoiceValue(buildVoiceDraft({}, [EN]), EN, field.id, value),
    EN,
  );
  return (
    <VoiceEditorProvider
      locale={EN}
      fieldIdPrefix={MOCK_FIELD_ID_PREFIX}
      values={values}
      savedValues={values}
      errors={errors}
      openListFieldId={undefined}
      setOpenListFieldId={vi.fn()}
      setFieldValue={setFieldValue}
      specimenTheme={MOCK_SITE_PREVIEW_THEME}
    >
      <VoiceField field={field} />
    </VoiceEditorProvider>
  );
};

const setup = customRenderInSettingsForm(VoiceFieldInEditor, {
  field: fieldById('notFoundHeading'),
  value: '',
  errors: {},
});

describe(`<${VoiceField.name}/>`, () => {
  it('resets a customised field to its default', async () => {
    const user = userEvent.setup();
    setup({ value: MOCK_HEADING });

    const resetButton = screen.getByRole('button', { name: RESET });
    await user.click(resetButton);

    expect(setFieldValue).toHaveBeenCalledWith('notFoundHeading', '');
  });

  it('offers no reset for a default field', () => {
    setup();

    const resetButton = screen.queryByRole('button', { name: RESET });

    expect(resetButton).not.toBeInTheDocument();
  });

  it('offers no reset for a customised field while archived', () => {
    setup({ value: MOCK_HEADING }, { isArchived: true });

    const resetButton = screen.queryByRole('button', { name: RESET });

    expect(resetButton).not.toBeInTheDocument();
  });

  it('labels a text field and describes it with its hint', () => {
    setup();

    const input = screen.getByRole('textbox', { name: HEADING });

    expect(input).toHaveAttribute(
      'placeholder',
      SITE_MESSAGES_BY_LOCALE.EN.notFound.heading,
    );
    expect(input).toHaveAccessibleDescription('Also the browser tab title');
  });

  it('names a list field without a visible label for screen readers', () => {
    setup({
      field: {
        ...fieldById('notFoundHeading'),
        surface: VOICE_SURFACE.ARCHIVE,
      },
    });

    const input = screen.getByRole('textbox', { name: HEADING });

    expect(input).toBeVisible();
  });

  it('names a rich list field without a visible label for screen readers', () => {
    setup({ field: fieldById('tagEmpty'), value: null });

    const editor = screen.getByRole('textbox', { name: 'Tag page' });
    const visibleLabel = screen.queryByText('Tag page');

    expect(editor).toBeVisible();
    expect(visibleLabel).not.toBeInTheDocument();
  });

  it('edits a rich field with only bold, italic and link controls', () => {
    setup({ field: fieldById('notFoundSupportingText'), value: null });

    const editor = screen.getByRole('textbox', { name: SUPPORTING_TEXT });
    const controls = screen.getAllByRole('button');

    expect(editor).toBeVisible();
    expect(controls).toHaveLength(3);
  });

  it('edits a multiline field in a plain text area', () => {
    setup({
      field: {
        id: 'blogListEmpty',
        kind: VOICE_FIELD_KIND.MULTILINE,
        placeholders: [],
        surface: VOICE_SURFACE.ARCHIVE,
      },
    });

    const textArea = screen.getByRole('textbox', { name: 'Blog index page' });

    expect(textArea).toHaveAttribute('rows', '3');
  });

  it('describes an invalid field with its error and gives it its input id', () => {
    setup({ errors: { notFoundHeading: MOCK_ERROR } });

    const input = screen.getByRole('textbox', { name: HEADING });

    expect(input).toHaveAttribute(ARIA_INVALID, 'true');
    expect(input).toHaveAttribute(
      'id',
      `${MOCK_FIELD_ID_PREFIX}-notFoundHeading`,
    );
    expect(input).toHaveAccessibleDescription(
      `Also the browser tab title ${MOCK_ERROR}`,
    );
  });

  it('notes the placeholder a field must keep', () => {
    setup({ field: fieldById('topicEmpty'), value: null });

    const editor = screen.getByRole('textbox', { name: 'Topic page' });

    expect(editor).toHaveAccessibleDescription(
      'A topic with no posts yet Keep {name} — the site fills it in.',
    );
  });

  it('announces a read-only rich field as read-only, with no editing controls', () => {
    setup(
      { field: fieldById('notFoundSupportingText'), value: null },
      { isArchived: true },
    );

    const editor = screen.getByRole('textbox', { name: SUPPORTING_TEXT });
    const editingControl = screen.queryByRole('button');

    expect(editingControl).not.toBeInTheDocument();
    expect(editor).toHaveAttribute('aria-readonly', 'true');
    expect(editor).not.toHaveAttribute('aria-disabled');
  });

  it.each([
    ['text', 'notFoundHeading', HEADING],
    ['rich', 'notFoundSupportingText', SUPPORTING_TEXT],
  ] as const)(
    'describes a read-only %s field with the archived notice',
    (_kind, id, name) => {
      setup({ field: fieldById(id), value: null }, { isArchived: true });

      const input = screen.getByRole('textbox', { name });

      expect(input).toHaveAccessibleDescription(
        new RegExp(`^${ARCHIVED_NOTICE_TEXT}`),
      );
    },
  );

  it('gives an invalid rich field its input id so the save bar can focus it', () => {
    setup({
      field: fieldById('notFoundSupportingText'),
      value: null,
      errors: { notFoundSupportingText: MOCK_ERROR },
    });

    const editor = screen.getByRole('textbox', { name: SUPPORTING_TEXT });

    expect(editor).toHaveAttribute(
      'id',
      `${MOCK_FIELD_ID_PREFIX}-notFoundSupportingText`,
    );
    expect(editor).toHaveAttribute(ARIA_INVALID, 'true');
  });
});
