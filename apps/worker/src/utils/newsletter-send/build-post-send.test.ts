import { resolveTenantEmailBrand } from '@blog/config';
import {
  LOCALE_ISO_CODES,
  PRESET_ID,
  PRESET_REGISTRY,
} from '@blog/config/constants';
import { EMAIL_ACCOUNT, SITE_EMAIL_TAG_NAME } from '@blog/email';
import { verifyNewsletterUnsubscribeToken } from '@blog/utils/newsletter-unsubscribe-token';
import { RESEND_IDEMPOTENCY_KEY_MAX_LENGTH } from '@worker/constants/newsletter-send';
import {
  MOCK_NEWSLETTER_FROM_ADDRESS,
  MOCK_NEWSLETTER_POST,
  MOCK_POST_ID,
  MOCK_SUBSCRIBER_EMAILS,
  MOCK_SUBSCRIBER_IDS,
  MOCK_UNSUBSCRIBE_KEY,
} from '@worker/testing/newsletter-send/fixtures';
import {
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
} from '@worker/testing/tenant/fixtures';
import type { TNewsletterSendContext } from '@worker/utils/newsletter-send/newsletter-send-context';

import { buildPostSend, postSendIdempotencyKey } from './build-post-send';

const MOCK_SITE_URL = `https://${MOCK_TENANT_DOMAIN}`;
const MOCK_CONTEXT: TNewsletterSendContext = {
  siteUrl: MOCK_SITE_URL,
  locale: LOCALE_ISO_CODES.NL,
  from: MOCK_NEWSLETTER_FROM_ADDRESS,
  replyTo: undefined,
  brandName: 'Acme',
  logoImageUrl: undefined,
  footerPostalAddress: undefined,
  unsubscribeKey: MOCK_UNSUBSCRIBE_KEY,
  brand: resolveTenantEmailBrand({
    preset: PRESET_ID.CONSOLE,
    accentHue: PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens.accentHue,
  }),
};
const [SUBSCRIBER_ID = '', OTHER_SUBSCRIBER_ID = ''] = MOCK_SUBSCRIBER_IDS;
const [EMAIL = ''] = MOCK_SUBSCRIBER_EMAILS;

function buildFor(subscriberId: string) {
  return buildPostSend(MOCK_CONTEXT, MOCK_NEWSLETTER_POST, {
    tenantId: MOCK_TENANT_ID,
    postId: MOCK_POST_ID,
    subscriberId,
    email: EMAIL,
  });
}

function unsubscribeUrlOf(subscriberId: string): URL {
  const url = buildFor(subscriberId).headers?.['List-Unsubscribe'] ?? '';
  return new URL(url.slice(1, -1));
}

describe(buildPostSend, () => {
  it('sends to the subscriber from the tenant account, tagged with the site', () => {
    expect(buildFor(SUBSCRIBER_ID)).toMatchObject({
      account: EMAIL_ACCOUNT.TENANT,
      to: EMAIL,
      from: MOCK_NEWSLETTER_FROM_ADDRESS,
      tags: [{ name: SITE_EMAIL_TAG_NAME, value: MOCK_TENANT_ID }],
    });
  });

  it('links to the post on the site', () => {
    expect(buildFor(SUBSCRIBER_ID).html).toContain(
      `${MOCK_SITE_URL}/blog/${MOCK_NEWSLETTER_POST.slug}`,
    );
  });

  it('carries an unsubscribe link for this subscriber in the site’s default language', () => {
    const url = unsubscribeUrlOf(SUBSCRIBER_ID);

    expect(url.origin).toBe(MOCK_SITE_URL);
    expect(url.searchParams.get('lang')).toBe(LOCALE_ISO_CODES.NL);
    expect(
      verifyNewsletterUnsubscribeToken(
        url.searchParams.get('token') ?? '',
        MOCK_UNSUBSCRIBE_KEY,
      ),
    ).toBe(SUBSCRIBER_ID);
  });

  it('keys each send by post and subscriber, so a retry is not delivered twice', () => {
    const first = buildFor(SUBSCRIBER_ID).idempotencyKey;

    expect(buildFor(SUBSCRIBER_ID).idempotencyKey).toBe(first);
    expect(buildFor(OTHER_SUBSCRIBER_ID).idempotencyKey).not.toBe(first);
  });
});

describe(postSendIdempotencyKey, () => {
  it('names the post and the subscriber', () => {
    expect(postSendIdempotencyKey(MOCK_POST_ID, SUBSCRIBER_ID)).toBe(
      `${MOCK_POST_ID}:${SUBSCRIBER_ID}`,
    );
  });

  it.each([
    ['an empty post id', '', SUBSCRIBER_ID],
    ['an empty subscriber id', MOCK_POST_ID, ''],
    [
      'a key past Resend’s limit',
      'p'.repeat(RESEND_IDEMPOTENCY_KEY_MAX_LENGTH),
      SUBSCRIBER_ID,
    ],
  ])('refuses %s', (_, postId, subscriberId) => {
    expect(() => postSendIdempotencyKey(postId, subscriberId)).toThrow();
  });
});
