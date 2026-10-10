import { EMAIL_TEMPLATE_TYPE } from '@blog/config';
import { screen } from '@platform/testing/custom-render';
import {
  ARCHIVED_NOTICE_TEXT,
  customRenderInSettingsForm,
} from '@platform/testing/render-in-settings-form';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { EmailTemplateEditor } from './email-template-editor';

const FALLBACK_BODY = [
  {
    _type: 'block',
    _key: 'k1',
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: 's1', text: 'Hello there', marks: [] }],
  },
];

const setup = customRenderInSettingsForm(EmailTemplateEditor, {
  templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
  languageName: 'French',
  copy: {
    draft: { subject: '', body: null },
    saved: { subject: '', body: null },
    fallback: { subject: 'Connectez-vous', body: FALLBACK_BODY },
  },
  logo: { url: undefined },
  onCopyChange: vi.fn(),
  onLogoStage: vi.fn(),
});

describe(`<${EmailTemplateEditor.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('labels the fields with the language being edited', () => {
    setup();

    expect(screen.getByRole('heading', { name: 'Sign-in link' })).toBeVisible();
    expect(screen.getByLabelText('Subject (French)')).toBeVisible();
  });

  it('shows the copy that would be sent in place of a blank subject', () => {
    setup();

    expect(screen.getByLabelText('Subject (French)')).toHaveAttribute(
      'placeholder',
      'Connectez-vous',
    );
    expect(screen.getAllByText('Default')).toHaveLength(2);
  });

  it('reports a typed subject as the new copy', async () => {
    const onCopyChange = vi.fn();
    setup({ onCopyChange });

    await user.type(screen.getByLabelText('Subject (French)'), 'S');

    expect(onCopyChange).toHaveBeenLastCalledWith({ subject: 'S', body: null });
  });

  it('clears a customised subject back to the default', async () => {
    const onCopyChange = vi.fn();
    setup({
      copy: {
        draft: { subject: 'Bonjour', body: null },
        saved: { subject: 'Bonjour', body: null },
        fallback: { subject: 'Connectez-vous', body: FALLBACK_BODY },
      },
      onCopyChange,
    });

    expect(screen.getByText('Customised')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(onCopyChange).toHaveBeenCalledWith({ subject: '', body: null });
  });

  it('marks an edited subject unsaved', () => {
    setup({
      copy: {
        draft: { subject: 'Bonjour', body: null },
        saved: { subject: '', body: null },
        fallback: { subject: 'Connectez-vous', body: FALLBACK_BODY },
      },
    });

    expect(screen.getByText('Unsaved')).toBeInTheDocument();
  });

  it('offers no reset while archived', () => {
    setup(
      {
        copy: {
          draft: { subject: 'Bonjour', body: null },
          saved: { subject: 'Bonjour', body: null },
          fallback: { subject: 'Connectez-vous', body: FALLBACK_BODY },
        },
      },
      { isArchived: true },
    );

    expect(screen.getByText('Customised')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Reset' }),
    ).not.toBeInTheDocument();
  });

  it('locks every field and describes it with the notice while archived', () => {
    setup({}, { isArchived: true });

    const fields = [
      screen.getByLabelText('Subject (French)'),
      screen.getByRole('button', { name: 'Upload template logo' }),
    ];
    for (const field of fields) {
      expect(field).toBeDisabled();
      expect(field).toHaveAccessibleDescription(
        expect.stringContaining(ARCHIVED_NOTICE_TEXT),
      );
    }
  });

  it('locks every field while a save is pending', () => {
    setup({}, { isPending: true });

    expect(screen.getByLabelText('Subject (French)')).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Upload template logo' }),
    ).toBeDisabled();
  });

  it('describes the message editor with its hint', async () => {
    setup();

    expect(
      await screen.findByRole('textbox', { name: 'Message (French)' }),
    ).toHaveAccessibleDescription(
      "The sign-in button, invite link or unsubscribe link always renders below this — it can't be removed from here.",
    );
  });

  it('describes the message editor with the archived notice while archived', () => {
    setup({}, { isArchived: true });

    expect(
      screen.getByRole('textbox', { name: 'Message (French)' }),
    ).toHaveAccessibleDescription(
      expect.stringContaining(ARCHIVED_NOTICE_TEXT),
    );
  });
});
