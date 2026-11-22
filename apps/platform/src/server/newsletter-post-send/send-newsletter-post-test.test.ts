import { faker } from '@faker-js/faker';
import nl from '@platform/i18n/messages/nl.json';
import {
  mockEmailConfig,
  MOCK_TEST_EMAIL_LIMIT_REFUSAL,
  MOCK_TEST_EMAIL_SEND_ADMITTED,
} from '@platform/testing/email/fixtures';
import {
  MOCK_STUDIO_CALLER,
  MOCK_STUDIO_PROJECT_ID,
} from '@platform/testing/newsletter-post-send/fixtures';
import { env } from '@platform/utils/env/env';
import {
  ACTION_OUTCOME,
  LOCALE_ISO_CODES,
  NEWSLETTER_TEST_SEND_REFUSAL,
} from '@shinefold/config';
import { EMAIL_ACCOUNT } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
import { sendEmail } from '@shinefold/email';

import {
  newsletterPostTestSendSchema,
  sendNewsletterPostTest,
  type TNewsletterPostTestSend,
} from './send-newsletter-post-test';

vi.mock('@shinefold/email');
vi.mock('@platform/utils/env/env');

vi.mock('@shinefold/db', () => ({
  queries: {
    emailConfig: { getEmailConfig: vi.fn() },
    siteConfig: { getSiteConfig: vi.fn() },
    testEmailSendCounters: {
      incrementTestEmailSendCount: vi.fn(),
      getTestEmailSendCount: vi.fn(),
    },
  },
}));

faker.seed(7713);

const MOCK_ALERT_ADDRESS = faker.internet.email();
const MOCK_SENDER_NAME = faker.company.name();
const MOCK_TAKEAWAY = faker.lorem.sentence();

const MOCK_TAKEAWAY_BLOCK = {
  _type: 'block',
  _key: faker.string.alphanumeric(6),
  listItem: 'bullet',
  markDefs: [],
  children: [
    {
      _type: 'span',
      _key: faker.string.alphanumeric(6),
      text: MOCK_TAKEAWAY,
    },
  ],
};

const MOCK_POST: TNewsletterPostTestSend = newsletterPostTestSendSchema.parse({
  projectId: MOCK_STUDIO_PROJECT_ID,
  title: faker.lorem.sentence(),
  excerpt: faker.lorem.paragraph(),
  takeaways: [MOCK_TAKEAWAY_BLOCK],
  slug: faker.lorem.slug(),
  locale: LOCALE_ISO_CODES.NL,
});

const incrementTestEmailSendCount = vi.mocked(
  queries.testEmailSendCounters.incrementTestEmailSendCount,
);

describe(sendNewsletterPostTest, () => {
  beforeEach(() => {
    Object.assign(env, {
      OPERATOR_ALERT_FROM_ADDRESS: `Alerts <${MOCK_ALERT_ADDRESS}>`,
    });
    vi.mocked(queries.emailConfig.getEmailConfig).mockResolvedValue(
      mockEmailConfig({ senderName: MOCK_SENDER_NAME }),
    );
    incrementTestEmailSendCount.mockResolvedValue(
      MOCK_TEST_EMAIL_SEND_ADMITTED,
    );
    vi.mocked(sendEmail).mockReset();
  });

  it("emails only the caller, via the platform account, bannered in the post's locale", async () => {
    const result = await sendNewsletterPostTest(MOCK_STUDIO_CALLER, MOCK_POST);

    const [[email] = []] = vi.mocked(sendEmail).mock.calls;
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(email?.account).toBe(EMAIL_ACCOUNT.PLATFORM);
    expect(email?.to).toBe(MOCK_STUDIO_CALLER.email);
    expect(email?.from).toBe(`"${MOCK_SENDER_NAME}" <${MOCK_ALERT_ADDRESS}>`);
    expect(email?.html).toContain(nl.emailPreview.postTestBanner);
    expect(email?.text).toContain(MOCK_POST.title);
    expect(email?.text).toContain(MOCK_TAKEAWAY);
    expect(email?.text).toContain(MOCK_POST.slug);
  });

  it('refuses at the test limit without sending, saying when to try again', async () => {
    const { count, windowStartedAt, retryAt } = MOCK_TEST_EMAIL_LIMIT_REFUSAL;
    incrementTestEmailSendCount.mockResolvedValue({ count, windowStartedAt });

    const result = await sendNewsletterPostTest(MOCK_STUDIO_CALLER, MOCK_POST);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: NEWSLETTER_TEST_SEND_REFUSAL.RATE_LIMITED,
      retryAt,
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });
});

describe('newsletterPostTestSendSchema', () => {
  it.each([[], null])(
    'accepts a takeaway whose mark definitions are %o, as the summary type',
    (markDefs) => {
      const { takeaways } = newsletterPostTestSendSchema.parse({
        ...MOCK_POST,
        takeaways: [{ ...MOCK_TAKEAWAY_BLOCK, markDefs }],
      });

      expect(takeaways).toEqual([
        expect.not.objectContaining({ markDefs: expect.anything() }),
      ]);
    },
  );

  it.each([
    { name: 'a blank title', fields: { title: ' ' } },
    {
      name: 'a cover that is not https',
      fields: { coverImageUrl: 'http://example.com/c.png' },
    },
    { name: 'an unknown locale', fields: { locale: 'PT' } },
    {
      name: 'a takeaway that is not a block',
      fields: { takeaways: [{ _type: 'image' }] },
    },
    {
      name: 'a takeaway with mark definitions',
      fields: { takeaways: [{ ...MOCK_TAKEAWAY_BLOCK, markDefs: [{}] }] },
    },
  ])('refuses $name', ({ fields }) => {
    expect(
      newsletterPostTestSendSchema.safeParse({ ...MOCK_POST, ...fields })
        .success,
    ).toBe(false);
  });
});
