import { EMAIL_TEMPLATE_TYPE } from '@blog/config';
import {
  customRender,
  renderWithIntl,
  screen,
} from '@platform/testing/custom-render';
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

const setup = customRender(EmailTemplateEditor, {
  templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
  languageName: 'French',
  copy: { subject: '', body: null },
  fallback: { subject: 'Connectez-vous', body: FALLBACK_BODY },
  logo: { url: undefined },
  onCopyChange: vi.fn(),
  onLogoStage: vi.fn(),
  isDisabled: false,
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
    setup({ copy: { subject: 'Bonjour', body: null }, onCopyChange });

    expect(screen.getByText('Customised')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Use default' }));

    expect(onCopyChange).toHaveBeenCalledWith({ subject: '', body: null });
  });

  it('locks every field while disabled', () => {
    setup({ isDisabled: true });

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
    renderWithIntl(
      <>
        <p id="archived-notice">This tenant is archived</p>
        <EmailTemplateEditor
          templateType={EMAIL_TEMPLATE_TYPE.MAGIC_LINK}
          languageName="French"
          copy={{ subject: '', body: null }}
          fallback={{ subject: 'Connectez-vous', body: FALLBACK_BODY }}
          logo={{ url: undefined }}
          onCopyChange={vi.fn()}
          onLogoStage={vi.fn()}
          isDisabled={true}
          archivedNoticeId="archived-notice"
        />
      </>,
    );

    expect(
      screen.getByRole('textbox', { name: 'Message (French)' }),
    ).toHaveAccessibleDescription(
      expect.stringContaining('This tenant is archived'),
    );
  });
});
