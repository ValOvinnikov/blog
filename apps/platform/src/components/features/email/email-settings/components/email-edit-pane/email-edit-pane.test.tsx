import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config';
import { screen } from '@platform/testing/custom-render';
import { buildTestEmailDraft } from '@platform/testing/email-draft';
import { customRenderInSettingsForm } from '@platform/testing/render-in-settings-form';
import { EMAIL_SENDER_ITEM } from '@platform/utils/email-draft/email-draft';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { EmailEditPane } from './email-edit-pane';

const { EN, FR } = LOCALE_ISO_CODES;
const DRAFT = buildTestEmailDraft();

const setup = customRenderInSettingsForm(EmailEditPane, {
  item: EMAIL_SENDER_ITEM,
  locale: EN,
  defaultLocale: EN,
  draft: DRAFT,
  saved: DRAFT,
  revision: 0,
  senderNameInputId: 'sender-name',
  onSenderChange: vi.fn(),
  onDraftChange: vi.fn(),
});

describe(`<${EmailEditPane.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('edits the sender on Sender & footer', async () => {
    const onSenderChange = vi.fn();
    setup({ onSenderChange });

    await user.type(screen.getByLabelText('Sender name'), 'A');

    expect(onSenderChange).toHaveBeenCalledWith({
      ...DRAFT.sender,
      senderName: 'A',
    });
  });

  it("edits a template's copy in the chosen language", async () => {
    const onDraftChange = vi.fn();
    setup({ item: EMAIL_TEMPLATE_TYPE.MAGIC_LINK, locale: FR, onDraftChange });

    await user.type(screen.getByLabelText('Subject (French)'), 'C');

    const [update] = onDraftChange.mock.lastCall ?? [];
    expect(update(DRAFT).copies.MAGIC_LINK.FR.subject).toBe('C');
  });
});
