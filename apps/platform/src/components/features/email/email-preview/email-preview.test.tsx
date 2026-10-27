import { faker } from '@faker-js/faker';
import { PREVIEW_WIDTH } from '@platform/constants/preview';
import { customRender, screen } from '@platform/testing/custom-render';
import { mockEmailSender } from '@platform/testing/email-draft';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { EmailPreview } from './email-preview';

faker.seed(5993);

const MOCK_SENDER = mockEmailSender({
  senderName: faker.company.name(),
  replyToAddress: faker.internet.email(),
});
const MOCK_SUBJECT = faker.lorem.sentence();
const MOCK_ACTION_LABEL = faker.lorem.word();
const MOCK_NOTE = faker.lorem.sentence();
const DATA_WIDTH = 'data-width';

const setup = customRender(EmailPreview, {
  html: `<p>${faker.lorem.sentence()}</p>`,
  sender: MOCK_SENDER,
  subject: MOCK_SUBJECT,
});

describe(`<${EmailPreview.name}/>`, () => {
  describe('with a sender and reply-to address', () => {
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
      setup();
    });

    it('shows who the email is from, where replies go and its subject', () => {
      const senderName = screen.getByText(MOCK_SENDER.senderName);
      const replyTo = screen.getByText(MOCK_SENDER.replyToAddress);
      const subject = screen.getByText(MOCK_SUBJECT);

      expect(senderName).toBeVisible();
      expect(replyTo).toBeVisible();
      expect(subject).toBeVisible();
    });

    it('switches the preview between desktop and mobile widths', async () => {
      const frame = screen.getByTitle('Email preview');
      const mobileButton = screen.getByRole('button', { name: 'Mobile' });

      expect(frame).toHaveAttribute(DATA_WIDTH, PREVIEW_WIDTH.DESKTOP);

      await user.click(mobileButton);

      expect(frame).toHaveAttribute(DATA_WIDTH, PREVIEW_WIDTH.MOBILE);
    });
  });

  it('names the defaults when the sender and reply-to are blank', () => {
    setup({ sender: mockEmailSender({ senderName: '  ' }) });

    const defaultSender = screen.getByText('Default sender');
    const noReplyTo = screen.getByText('No reply-to address');

    expect(defaultSender).toBeVisible();
    expect(noReplyTo).toBeVisible();
  });

  it('shows the actions and notes it is given', () => {
    setup({
      actions: <button type="button">{MOCK_ACTION_LABEL}</button>,
      notes: <p>{MOCK_NOTE}</p>,
    });

    const actionButton = screen.getByRole('button', {
      name: MOCK_ACTION_LABEL,
    });
    const note = screen.getByText(MOCK_NOTE);

    expect(actionButton).toBeVisible();
    expect(note).toBeVisible();
  });
});
