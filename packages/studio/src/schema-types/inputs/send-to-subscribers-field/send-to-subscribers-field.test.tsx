/**
 * @vitest-environment jsdom
 */
import { faker } from '@faker-js/faker';
import { LayerProvider, ThemeProvider } from '@sanity/ui';
import { buildTheme } from '@sanity/ui/theme';
import { ToastProvider } from '@sanity/ui/toast';
import {
  ACTION_OUTCOME,
  HTTP_METHOD,
  NEWSLETTER_SEND_NOW_REFUSAL,
  NEWSLETTER_SEND_STATUS,
  NEWSLETTER_SKIP_REASON,
  routes,
  type TNewsletterPostSendStatus,
  type TNewsletterSendNowResult,
} from '@shinefold/config';
import {
  MOCK_BAND_CEILING,
  MOCK_EMAILS_LEFT,
  MOCK_RECIPIENTS,
  MOCK_SEND_DATE,
  mockNewsletterPostSendStatus,
} from '@shinefold/studio/testing/newsletter-post-send-status';
import { stubMatchMedia } from '@shinefold/studio/testing/stub-match-media';
import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from '@testing-library/react';
import { type BooleanFieldProps, useEditState } from 'sanity';

import {
  CANCEL_LABEL,
  SEND_EMAILS_LABEL,
  SEND_NOW_REFUSED_TOAST,
  sendNowDisabledReason,
  sendNowStartedToast,
} from './send-now-copy';
import { formatSendCount } from './send-status-format';
import { SendToSubscribersField } from './send-to-subscribers-field';

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal<typeof import('sanity')>()),
  FormField: ({ title, children }: { title: string; children: unknown }) => (
    <fieldset aria-label={title}>{children as React.ReactNode}</fieldset>
  ),
  useProjectId: () => MOCK_PROJECT_ID,
  useFormValue: () => MOCK_DRAFT_ID,
  useEditState: vi.fn(() => ({ published: undefined })),
}));

faker.seed(7711);

const MOCK_PROJECT_ID = faker.string.alphanumeric(8);
const MOCK_POST_ID = faker.string.uuid();
const MOCK_DRAFT_ID = `drafts.${MOCK_POST_ID}`;
const MOCK_REVISION = faker.string.alphanumeric(12);
const SWITCH_TITLE = 'Send to subscribers';

const MOCK_PUBLISHED_EDIT_STATE = {
  published: { _id: MOCK_POST_ID, _rev: MOCK_REVISION },
} as unknown as ReturnType<typeof useEditState>;

const MOCK_SEND_NOW_OK: TNewsletterSendNowResult = {
  outcome: ACTION_OUTCOME.SUCCESS,
};

const MOCK_OVER_BAND = {
  isOffered: true,
  disabledBy: NEWSLETTER_SEND_NOW_REFUSAL.OVER_BAND,
  bandCeiling: MOCK_BAND_CEILING,
} as const;

const fetchMock = vi.fn<typeof fetch>();

const respondWith = (
  status: TNewsletterPostSendStatus,
  sendNow: TNewsletterSendNowResult = MOCK_SEND_NOW_OK,
) => {
  fetchMock.mockImplementation(async (input) =>
    Response.json(
      String(input).startsWith(routes.newsletterPostSendStatus())
        ? status
        : sendNow,
    ),
  );
};

const statusReads = () =>
  fetchMock.mock.calls.filter(([input]) =>
    String(input).startsWith(routes.newsletterPostSendStatus()),
  );

const sendNowCalls = () =>
  fetchMock.mock.calls.filter(
    ([input]) => input === routes.newsletterPostSendNow(),
  );

const DefaultSwitch = ({ description, inputProps }: BooleanFieldProps) => (
  <label>
    <input
      type="checkbox"
      role="switch"
      aria-label={SWITCH_TITLE}
      disabled={inputProps.readOnly}
    />
    {description}
  </label>
);

const renderField = () =>
  render(
    <ThemeProvider theme={buildTheme()}>
      <LayerProvider>
        <ToastProvider>
          <SendToSubscribersField
            {...({
              title: SWITCH_TITLE,
              inputProps: { readOnly: false },
              renderDefault: DefaultSwitch,
            } as unknown as BooleanFieldProps)}
          />
        </ToastProvider>
      </LayerProvider>
    </ThemeProvider>,
  );

const openSendEmailsDialog = async () => {
  const sendEmails = await screen.findByRole('button', {
    name: SEND_EMAILS_LABEL,
  });
  fireEvent.click(sendEmails);
};

const confirmSendEmails = () => {
  const dialog = screen.getByRole('dialog');
  const confirm = within(dialog).getByRole('button', {
    name: SEND_EMAILS_LABEL,
  });
  fireEvent.click(confirm);
};

const offeredSendNow = mockNewsletterPostSendStatus(undefined, {
  sendNow: { isOffered: true, emailsLeft: MOCK_EMAILS_LEFT },
});

describe(`<${SendToSubscribersField.name}/>`, () => {
  beforeEach(() => {
    stubMatchMedia();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('renders nothing on a plan without Newsletter', async () => {
    respondWith(
      mockNewsletterPostSendStatus(undefined, {
        sendingOffCause: NEWSLETTER_SKIP_REASON.NOT_IN_PLAN,
      }),
    );
    renderField();

    await waitForElementToBeRemoved(() =>
      screen.queryByRole('group', { name: SWITCH_TITLE }),
    );
    const toggle = screen.queryByRole('switch', { name: SWITCH_TITLE });

    expect(toggle).toBeNull();
  });

  it('replaces the switch with the status once the post was emailed', async () => {
    respondWith(
      mockNewsletterPostSendStatus({
        status: NEWSLETTER_SEND_STATUS.SENT,
        recipients: MOCK_RECIPIENTS,
        settledAt: MOCK_SEND_DATE,
      }),
    );
    renderField();

    const field = await screen.findByRole('group', { name: SWITCH_TITLE });
    await screen.findByText('Emailed');
    const toggle = screen.queryByRole('switch', { name: SWITCH_TITLE });

    expect(field.textContent).toContain(formatSendCount(MOCK_RECIPIENTS));
    expect(toggle).toBeNull();
  });

  it('disables the switch while the newsletter is off in Features', async () => {
    respondWith(
      mockNewsletterPostSendStatus(undefined, {
        sendingOffCause: NEWSLETTER_SKIP_REASON.NEWSLETTER_OFF,
      }),
    );
    renderField();

    const toggle = await screen.findByRole<HTMLInputElement>('switch', {
      name: SWITCH_TITLE,
    });

    expect(toggle.disabled).toBe(true);
  });

  it('explains why Send emails is disabled', async () => {
    respondWith(
      mockNewsletterPostSendStatus(undefined, { sendNow: MOCK_OVER_BAND }),
    );
    renderField();

    const sendEmails = await screen.findByRole<HTMLButtonElement>('button', {
      name: SEND_EMAILS_LABEL,
    });
    const reason = screen.queryByText(
      String(sendNowDisabledReason(MOCK_OVER_BAND)),
    );

    expect(sendEmails.disabled).toBe(true);
    expect(reason).not.toBeNull();
  });

  describe('with a published post Send emails can send', () => {
    beforeEach(() => {
      vi.mocked(useEditState).mockReturnValue(MOCK_PUBLISHED_EDIT_STATE);
    });

    describe('once the dialog is open', () => {
      beforeEach(async () => {
        respondWith(offeredSendNow);
        renderField();
        await openSendEmailsDialog();
      });

      it('asks first, naming the emails left', () => {
        const dialog = screen.getByRole('dialog');

        expect(dialog.textContent).toContain(formatSendCount(MOCK_EMAILS_LEFT));
      });

      describe('its Cancel button', () => {
        let cancel: HTMLElement;

        beforeEach(() => {
          cancel = screen.getByRole('button', { name: CANCEL_LABEL });
        });

        it('has focus first', () => {
          expect(cancel.matches(':focus')).toBe(true);
        });

        it('sends nothing when pressed', () => {
          fireEvent.click(cancel);

          const dialog = screen.queryByRole('dialog');

          expect(dialog).toBeNull();
          expect(sendNowCalls()).toStrictEqual([]);
        });
      });

      it('sends the post once and re-reads its status', async () => {
        const readsBefore = statusReads().length;
        confirmSendEmails();

        await screen.findByText(
          sendNowStartedToast(offeredSendNow.confirmedCount),
        );
        const [[, init]] = sendNowCalls() as [[string, RequestInit]];

        expect([init.method, JSON.parse(String(init.body))]).toStrictEqual([
          HTTP_METHOD.POST,
          {
            projectId: MOCK_PROJECT_ID,
            postId: MOCK_POST_ID,
            isPublished: true,
          },
        ]);
        expect(statusReads().length).toBe(readsBefore + 1);
      });
    });

    it('says the post cannot be sent when the send is refused', async () => {
      respondWith(offeredSendNow, {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: NEWSLETTER_SEND_NOW_REFUSAL.OVER_MONTH,
      });
      renderField();
      await openSendEmailsDialog();
      confirmSendEmails();

      const toast = await screen.findByText(SEND_NOW_REFUSED_TOAST);

      expect(toast.textContent).toBe(SEND_NOW_REFUSED_TOAST);
    });
  });
});
