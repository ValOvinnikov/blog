import { VOICE_FIELD_KIND, VOICE_FIELDS } from '@blog/config';
import { screen } from '@platform/testing/custom-render';
import { customRenderInSettingsForm } from '@platform/testing/render-in-settings-form';

import { VoiceField } from './voice-field';

const fieldById = (id: string) =>
  VOICE_FIELDS.find((field) => field.id === id)!;

const setup = customRenderInSettingsForm(VoiceField, {
  inputId: 'voice-field-test',
  field: fieldById('notFoundHeading'),
  value: '',
  savedValue: '',
  placeholder: 'Page not found',
  onChange: vi.fn(),
});

describe(`<${VoiceField.name}/>`, () => {
  it('labels a text field and describes it with its hint', () => {
    setup();

    const input = screen.getByRole('textbox', { name: 'Heading' });
    expect(input).toHaveAttribute('placeholder', 'Page not found');
    expect(input).toHaveAccessibleDescription('Also the browser tab title');
  });

  it('names a field without a visible label for screen readers', () => {
    setup({ hasVisibleLabel: false });

    expect(screen.getByRole('textbox', { name: 'Heading' })).toBeVisible();
    expect(screen.queryByText('Heading')).not.toBeInTheDocument();
  });

  it('names a rich field without a visible label for screen readers', () => {
    setup({
      field: fieldById('notFoundSupportingText'),
      value: null,
      hasVisibleLabel: false,
    });

    expect(
      screen.getByRole('textbox', { name: 'Supporting text' }),
    ).toBeVisible();
    expect(screen.queryByText('Supporting text')).not.toBeInTheDocument();
  });

  it('edits a rich field in the rich text editor with only bold, italic and link', () => {
    setup({ field: fieldById('notFoundSupportingText'), value: null });

    expect(
      screen.getByRole('textbox', { name: 'Supporting text' }),
    ).toBeVisible();
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('edits a multiline field in a plain text area', () => {
    setup({
      field: {
        id: 'blogListEmpty',
        kind: VOICE_FIELD_KIND.MULTILINE,
        placeholders: [],
      },
    });

    expect(
      screen.getByRole('textbox', { name: 'Blog index page' }),
    ).toHaveAttribute('rows', '3');
  });

  it('describes the field with its error and marks it invalid', () => {
    setup({ error: 'Must be 100 characters or fewer.' });

    const input = screen.getByRole('textbox', { name: 'Heading' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
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

  it('offers no editing controls on a read-only rich field', () => {
    setup(
      {
        field: fieldById('notFoundSupportingText'),
        value: null,
      },
      { isArchived: true },
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('announces a read-only rich field as read-only rather than disabled', () => {
    setup(
      {
        field: fieldById('notFoundSupportingText'),
        value: null,
      },
      { isArchived: true },
    );

    const editor = screen.getByRole('textbox', { name: 'Supporting text' });
    expect(editor).toHaveAttribute('aria-readonly', 'true');
    expect(editor).not.toHaveAttribute('aria-disabled');
  });

  it('gives an invalid rich field its input id so the save bar can focus it', () => {
    setup({
      field: fieldById('notFoundSupportingText'),
      value: null,
      error: 'Must be 300 characters or fewer.',
    });

    const editor = screen.getByRole('textbox', { name: 'Supporting text' });
    expect(editor).toHaveAttribute('id', 'voice-field-test');
    expect(editor).toHaveAttribute('aria-invalid', 'true');
  });
});
