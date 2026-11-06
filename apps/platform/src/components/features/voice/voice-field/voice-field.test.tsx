import {
  SITE_MESSAGES_BY_LOCALE,
  VOICE_FIELD_KIND,
  VOICE_SURFACE,
} from '@blog/config';
import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import { screen } from '@platform/testing/custom-render';
import {
  ARCHIVED_NOTICE_TEXT,
  customRenderInSettingsForm,
} from '@platform/testing/render-in-settings-form';
import {
  KEEP_NAME_NOTE,
  SUPPORTING_TEXT_FIELD,
  TOPIC_FIELD,
  UNSAVED_MARK,
} from '@platform/testing/voice/fixtures';
import {
  MOCK_FIELD_ID_PREFIX,
  VoiceFieldInEditor,
  fieldById,
} from '@platform/testing/voice/voice-field-in-editor';
import userEvent from '@testing-library/user-event';

import { VoiceField } from './voice-field';

faker.seed(5994);

const HEADING = 'Heading';
const ARIA_INVALID = 'aria-invalid';
const MOCK_ERROR = faker.lorem.sentence();
const MOCK_HEADING = faker.lorem.words(3);
const { reset: RESET } = messages.fieldStatus;
const MOCK_OTHER_HEADING = faker.lorem.words(4);
const MOCK_SUFFIX = faker.string.alpha(3);

const setFieldValue = vi.fn();

const setup = customRenderInSettingsForm(VoiceFieldInEditor, {
  field: fieldById('notFoundHeading'),
  value: '',
  errors: {},
  onSetFieldValue: setFieldValue,
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

    expect(input).toHaveValue(SITE_MESSAGES_BY_LOCALE.EN.notFound.heading);
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

  it('names a rich list field without a visible label for screen readers', async () => {
    setup({ field: fieldById('tagEmpty'), value: null });

    const editor = await screen.findByRole('textbox', { name: 'Tag page' });
    const visibleLabel = screen.queryByText('Tag page');

    expect(editor).toBeVisible();
    expect(visibleLabel).not.toBeInTheDocument();
  });

  it('edits a rich field with only bold, italic and link controls', async () => {
    setup({ field: fieldById('notFoundSupportingText'), value: null });

    const editor = await screen.findByRole('textbox', {
      name: SUPPORTING_TEXT_FIELD,
    });
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

  it('notes the placeholder a field must keep', async () => {
    setup({ field: fieldById('topicEmpty'), value: null });

    const editor = await screen.findByRole('textbox', { name: TOPIC_FIELD });

    expect(editor).toHaveAccessibleDescription(
      `A topic with no posts yet ${KEEP_NAME_NOTE}`,
    );
  });

  it('announces a read-only rich field as read-only, with no editing controls', () => {
    setup(
      { field: fieldById('notFoundSupportingText'), value: null },
      { isArchived: true },
    );

    const editor = screen.getByRole('textbox', { name: SUPPORTING_TEXT_FIELD });
    const editingControl = screen.queryByRole('button');

    expect(editingControl).not.toBeInTheDocument();
    expect(editor).toHaveAttribute('aria-readonly', 'true');
    expect(editor).not.toHaveAttribute('aria-disabled');
  });

  it.each([
    ['text', 'notFoundHeading', HEADING],
    ['rich', 'notFoundSupportingText', SUPPORTING_TEXT_FIELD],
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

  it('gives an invalid rich field its input id so the save bar can focus it', async () => {
    setup({
      field: fieldById('notFoundSupportingText'),
      value: null,
      errors: { notFoundSupportingText: MOCK_ERROR },
    });

    const editor = await screen.findByRole('textbox', {
      name: SUPPORTING_TEXT_FIELD,
    });

    expect(editor).toHaveAttribute(
      'id',
      `${MOCK_FIELD_ID_PREFIX}-notFoundSupportingText`,
    );
    expect(editor).toHaveAttribute(ARIA_INVALID, 'true');
  });

  it('labels a field with its status and offers no unsaved mark while the draft matches the saved value', () => {
    setup({ value: MOCK_HEADING });

    const customisedPill = screen.getByText('Customised');
    const unsavedMark = screen.queryByRole('img', { name: UNSAVED_MARK });

    expect(customisedPill).toBeVisible();
    expect(unsavedMark).not.toBeInTheDocument();
  });

  it('marks a draft that differs from the saved value as unsaved', () => {
    setup({ value: MOCK_HEADING, savedValue: '' });

    const unsavedMark = screen.getByRole('img', { name: UNSAVED_MARK });

    expect(unsavedMark).toBeVisible();
  });

  it('reads Default with no unsaved mark or Reset for a field at its default', () => {
    setup();

    const defaultPill = screen.getByText('Default');
    const unsavedMark = screen.queryByRole('img', { name: UNSAVED_MARK });
    const resetButton = screen.queryByRole('button', { name: RESET });

    expect(defaultPill).toBeVisible();
    expect(unsavedMark).not.toBeInTheDocument();
    expect(resetButton).not.toBeInTheDocument();
  });

  it('keeps Reset for an unsaved customised edit', () => {
    setup({ value: MOCK_HEADING, savedValue: MOCK_OTHER_HEADING });

    const resetButton = screen.getByRole('button', { name: RESET });

    expect(resetButton).toBeVisible();
  });

  it('shows the default copy as the value of a text field at its default', () => {
    setup({ field: fieldById('notFoundEyebrow') });

    const input = screen.getByRole('textbox', { name: 'Eyebrow' });

    expect(input).toHaveValue(SITE_MESSAGES_BY_LOCALE.EN.notFound.eyebrow);
    expect(input).not.toHaveAttribute('placeholder');
  });

  it('shows the default copy as the content of a rich field at its default', async () => {
    setup({ field: fieldById('notFoundSupportingText'), value: null });

    const editor = await screen.findByRole('textbox', {
      name: SUPPORTING_TEXT_FIELD,
    });

    expect(editor).toHaveTextContent(
      SITE_MESSAGES_BY_LOCALE.EN.notFound.supportingText,
    );
  });

  it('stores the typed text when it differs from the default', async () => {
    const user = userEvent.setup();
    setup();

    const input = screen.getByRole('textbox', { name: HEADING });
    await user.type(input, MOCK_SUFFIX);

    expect(setFieldValue).toHaveBeenLastCalledWith(
      'notFoundHeading',
      `${SITE_MESSAGES_BY_LOCALE.EN.notFound.heading}${MOCK_SUFFIX}`,
    );
  });

  it('stores the empty value when the text is typed back to the default', async () => {
    const user = userEvent.setup();
    setup({ value: MOCK_HEADING });

    const input = screen.getByRole('textbox', { name: HEADING });
    await user.clear(input);
    await user.type(input, SITE_MESSAGES_BY_LOCALE.EN.notFound.heading);

    expect(setFieldValue).toHaveBeenLastCalledWith('notFoundHeading', '');
  });

  it('keeps an emptied text field empty while it has focus and shows the default again on blur', async () => {
    const user = userEvent.setup();
    setup();

    const input = screen.getByRole('textbox', { name: HEADING });
    await user.clear(input);

    expect(input).toHaveValue('');
    expect(setFieldValue).toHaveBeenLastCalledWith('notFoundHeading', '');

    await user.tab();

    expect(input).toHaveValue(SITE_MESSAGES_BY_LOCALE.EN.notFound.heading);
  });

  it('keeps the hint and the placeholder note on an archived field', async () => {
    setup(
      { field: fieldById('topicEmpty'), value: null },
      { isArchived: true },
    );

    const editor = await screen.findByRole('textbox', { name: TOPIC_FIELD });

    expect(editor).toHaveAccessibleDescription(
      new RegExp(
        `^${ARCHIVED_NOTICE_TEXT}.*A topic with no posts yet.*${KEEP_NAME_NOTE}`,
      ),
    );
  });

  it('shows the default again and stores the empty value when Reset follows typing', async () => {
    const user = userEvent.setup();
    setup();

    const input = screen.getByRole('textbox', { name: HEADING });
    await user.type(input, MOCK_SUFFIX);
    const resetButton = screen.getByRole('button', { name: RESET });
    await user.click(resetButton);

    expect(setFieldValue).toHaveBeenLastCalledWith('notFoundHeading', '');
    expect(input).toHaveValue(SITE_MESSAGES_BY_LOCALE.EN.notFound.heading);
  });
});
