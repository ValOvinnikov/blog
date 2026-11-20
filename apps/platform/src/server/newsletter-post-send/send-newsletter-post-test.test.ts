import { faker } from '@faker-js/faker';
import nl from '@platform/i18n/messages/nl.json';
import {
  mockEmailConfig,
  MOCK_TEST_EMAIL_LIMIT_REFUSAL,
} from '@platform/testing/email/fixtures';
import { mockTenant } from '@platform/testing/tenants/fixtures';
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
    testEmailSendCounters: { incrementTestEmailSendCount: vi.fn() },
  },
}));

faker.seed(7713);

const MOCK_ALERT_ADDRESS = faker.internet.email();
const MOCK_SENDER_NAME = faker.company.name();
const MOCK_CALLER = {
  tenant: mockTenant(),
  userId: faker.string.uuid(),
  email: faker.internet.email(),
};
const MOCK_TAKEAWAY = faker.lorem.sentence();

const POST: TNewsletterPostTestSend = newsletterPostTestSendSchema.parse({
  projectId: faker.string.alphanumeric(8),
  title: faker.lorem.sentence(),
  excerpt: faker.lorem.paragraph(),
  takeaways: [
    {
      _type: 'block',
      _key: faker.string.alphanumeric(6),
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          _key: faker.string.alphanumeric(6),
          text: MOCK_TAKEAWAY,
        },
      ],
    },
  ],
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
    incrementTestEmailSendCount.mockResolvedValue({
      count: 1,
      windowStartedAt: new Date(),
    });
    vi.mocked(sendEmail).mockReset();
  });

  it("emails only the caller, via the platform account, bannered in the post's locale", async () => {
    const result = await sendNewsletterPostTest(MOCK_CALLER, POST);

    const [[email] = []] = vi.mocked(sendEmail).mock.calls;
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(email?.account).toBe(EMAIL_ACCOUNT.PLATFORM);
    expect(email?.to).toBe(MOCK_CALLER.email);
    expect(email?.from).toBe(`"${MOCK_SENDER_NAME}" <${MOCK_ALERT_ADDRESS}>`);
    expect(email?.html).toContain(nl.emailPreview.postTestBanner);
    expect(email?.text).toContain(POST.title);
    expect(email?.text).toContain(MOCK_TAKEAWAY);
    expect(email?.text).toContain(POST.slug);
  });

  it('refuses at the test limit without sending, saying when to try again', async () => {
    const { count, windowStartedAt, retryAt } = MOCK_TEST_EMAIL_LIMIT_REFUSAL;
    incrementTestEmailSendCount.mockResolvedValue({ count, windowStartedAt });

    const result = await sendNewsletterPostTest(MOCK_CALLER, POST);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: NEWSLETTER_TEST_SEND_REFUSAL.RATE_LIMITED,
      retryAt,
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });
});

describe('newsletterPostTestSendSchema', () => {
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
  ])('refuses $name', ({ fields }) => {
    expect(
      newsletterPostTestSendSchema.safeParse({ ...POST, ...fields }).success,
    ).toBe(false);
  });
});
