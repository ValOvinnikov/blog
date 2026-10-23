import {
  SITE_MESSAGES_BY_LOCALE,
  VOICE_FIELD_KIND,
  VOICE_FIELDS,
  VOICE_SURFACE,
  type TVoiceFieldId,
} from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { VoiceEditorProvider } from '@platform/components/features/voice/voice-editor-provider';
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

import { VoiceField, type TVoiceFieldProps } from './voice-field';

const { EN } = LOCALE_ISO_CODES;
const HEADING = 'Heading';
const SUPPORTING_TEXT = 'Supporting text';
const ARIA_INVALID = 'aria-invalid';

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
      fieldIdPrefix="voice-field"
      values={values}
      savedValues={values}
      errors={errors}
      openListFieldId={undefined}
      setOpenListFieldId={vi.fn()}
      setFieldValue={vi.fn()}
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

    expect(screen.getByRole('textbox', { name: HEADING })).toBeVisible();
  });

  it('names a rich list field without a visible label for screen readers', () => {
    setup({ field: fieldById('tagEmpty'), value: null });

    expect(screen.getByRole('textbox', { name: 'Tag page' })).toBeVisible();
    expect(screen.queryByText('Tag page')).not.toBeInTheDocument();
  });

  it('edits a rich field in the rich text editor with only bold, italic and link', () => {
    setup({ field: fieldById('notFoundSupportingText'), value: null });

    expect(
      screen.getByRole('textbox', { name: SUPPORTING_TEXT }),
    ).toBeVisible();
    expect(screen.getAllByRole('button')).toHaveLength(3);
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

    expect(
      screen.getByRole('textbox', { name: 'Blog index page' }),
    ).toHaveAttribute('rows', '3');
  });

  it('describes an invalid field with its error and gives it its input id', () => {
    setup({ errors: { notFoundHeading: 'Must be 100 characters or fewer.' } });

    const input = screen.getByRole('textbox', { name: HEADING });
    expect(input).toHaveAttribute(ARIA_INVALID, 'true');
    expect(input).toHaveAttribute('id', 'voice-field-notFoundHeading');
    expect(input).toHaveAccessibleDescription(
      'Also the browser tab title Must be 100 characters or fewer.',
    );
  });

  it('notes the placeholder a field must keep', () => {
    setup({ field: fieldById('topicEmpty'), value: null });

    expect(
      screen.getByRole('textbox', { name: 'Topic page' }),
    ).toHaveAccessibleDescription(
      'A topic with no posts yet Keep {name} — the site fills it in.',
    );
  });

  it('announces a read-only rich field as read-only, with no editing controls', () => {
    setup(
      {
        field: fieldById('notFoundSupportingText'),
        value: null,
      },
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

      expect(screen.getByRole('textbox', { name })).toHaveAccessibleDescription(
        new RegExp(`^${ARCHIVED_NOTICE_TEXT}`),
      );
    },
  );

  it('gives an invalid rich field its input id so the save bar can focus it', () => {
    setup({
      field: fieldById('notFoundSupportingText'),
      value: null,
      errors: { notFoundSupportingText: 'Must be 300 characters or fewer.' },
    });

    const editor = screen.getByRole('textbox', { name: SUPPORTING_TEXT });
    expect(editor).toHaveAttribute('id', 'voice-field-notFoundSupportingText');
    expect(editor).toHaveAttribute(ARIA_INVALID, 'true');
  });
});
