import 'server-only';

import type { TStudioCaller } from '@platform/server/auth/resolve-studio-caller';
import { loadTenantEmailBrand } from '@platform/server/email/load-tenant-email-brand';
import { resolveOperatorAlertFromAddress } from '@platform/server/email/resolve-operator-alert-from-address';
import { takeTestEmailSend } from '@platform/server/email/take-test-email-send';
import { studioProjectSchema } from '@platform/server/newsletter-post-send/studio-route-request';
import {
  ACTION_OUTCOME,
  LOCALE_ISO_CODES,
  NEWSLETTER_TEST_SEND_REFUSAL,
  routes,
  SITE_MESSAGES_BY_LOCALE,
  type TNewsletterTestSendResult,
} from '@shinefold/config';
import { EMAIL_ACCOUNT } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
import {
  applyTenantSenderName,
  buildPostEmail,
  sendEmail,
} from '@shinefold/email';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

const TEXT_MAX_LENGTH = 2_000;
const KEY_MAX_LENGTH = 64;
const TAKEAWAY_BLOCKS_MAX = 20;
const SPANS_PER_BLOCK_MAX = 50;

const takeawaySpanSchema = z.object({
  _type: z.literal('span'),
  _key: z.string().max(KEY_MAX_LENGTH),
  text: z.string().max(TEXT_MAX_LENGTH).optional(),
  marks: z
    .array(z.string().max(KEY_MAX_LENGTH))
    .max(SPANS_PER_BLOCK_MAX)
    .optional(),
});

const takeawayBlockSchema = z.object({
  _type: z.literal('block'),
  _key: z.string().max(KEY_MAX_LENGTH),
  style: z.literal('normal').optional(),
  listItem: z.enum(['bullet', 'number']).optional(),
  level: z.number().int().positive().optional(),
  // Sanity stores an edited block's empty mark definitions as `[]`; the summary type spells them `null`.
  markDefs: z
    .union([z.null(), z.array(z.never()).length(0)])
    .optional()
    .transform(() => undefined),
  children: z.array(takeawaySpanSchema).max(SPANS_PER_BLOCK_MAX).optional(),
});

export const newsletterPostTestSendSchema = studioProjectSchema.extend({
  title: z.string().trim().min(1).max(TEXT_MAX_LENGTH),
  excerpt: z.string().trim().max(TEXT_MAX_LENGTH),
  takeaways: z.array(takeawayBlockSchema).max(TAKEAWAY_BLOCKS_MAX).default([]),
  coverImageUrl: z.url({ protocol: /^https$/ }).optional(),
  slug: z.string().trim().min(1).max(TEXT_MAX_LENGTH),
  locale: z.enum(LOCALE_ISO_CODES),
});

export type TNewsletterPostTestSend = z.output<
  typeof newsletterPostTestSendSchema
>;

/** Emails the post to the signed-in caller only, through the platform account, so it never counts against the site. */
export const sendNewsletterPostTest = async (
  { tenant, userId, email }: TStudioCaller,
  {
    title,
    excerpt,
    takeaways,
    coverImageUrl,
    slug,
    locale,
  }: TNewsletterPostTestSend,
): Promise<TNewsletterTestSendResult> => {
  const refusal = await takeTestEmailSend(userId);
  if (refusal) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: NEWSLETTER_TEST_SEND_REFUSAL.RATE_LIMITED,
      retryAt: refusal.retryAt.toISOString(),
    };
  }

  const { id, name, siteUrl } = tenant;
  const [look, emailConfig, t] = await Promise.all([
    loadTenantEmailBrand(id),
    queries.emailConfig.getEmailConfig(id),
    getTranslations({ locale, namespace: 'emailPreview' }),
  ]);
  const { subject, html, text } = buildPostEmail({
    ...look,
    subject: t('testSubject', { subject: title }),
    title,
    excerpt,
    postUrl: `${siteUrl}${routes.post(slug)}`,
    unsubscribeUrl: siteUrl,
    brandName: name,
    summaryHeading:
      SITE_MESSAGES_BY_LOCALE[locale].blogPostPage.postSummary.button,
    coverImageUrl,
    summary: takeaways,
    logoImageUrl: emailConfig?.logoAssetUrl ?? undefined,
    footerPostalAddress: emailConfig?.footerPostalAddress ?? undefined,
    isTest: true,
    testBannerText: t('postTestBanner'),
  });

  await sendEmail({
    account: EMAIL_ACCOUNT.PLATFORM,
    to: email,
    from: applyTenantSenderName(
      resolveOperatorAlertFromAddress(),
      emailConfig?.senderName ?? name,
    ),
    subject,
    html,
    text,
  });
  return { outcome: ACTION_OUTCOME.SUCCESS, recipient: email };
};
