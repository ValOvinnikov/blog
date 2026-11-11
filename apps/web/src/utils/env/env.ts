import {
  isPersonalDataKey,
  isPersonalDataKeyring,
  PERSONAL_DATA_KEY_FORMAT,
  PERSONAL_DATA_KEYRING_FORMAT,
} from '@blog/utils/encryption';
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    // Absent, `/api/revalidate` answers 500 instead of revalidating.
    // @env-required: development, production
    SANITY_REVALIDATE_SECRET: z.string().min(1).optional(),
    // Absent, `/api/revalidate-site-config` answers 500 instead of revalidating.
    // @env-required: development, production
    SITE_CONFIG_REVALIDATE_SECRET: z.string().min(1).optional(),
    // @env-optional
    INTERNAL_PAGES_SECRET: z.string().min(1).optional(),
    // With this and SANITY_GENERATE_SECRET absent, `/api/generate-skim` answers 503.
    // @env-optional
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    // @env-optional
    SANITY_GENERATE_SECRET: z.string().min(1).optional(),
    // Set only where Web Analytics and Speed Insights are enabled in the Vercel dashboard; otherwise their scripts 404.
    // @env-optional
    WEB_ANALYTICS_ENABLED: z.enum(['true', 'false']).optional(),
    // Absent, Resend's shared testing sender is used.
    // @env-optional
    NEWSLETTER_FROM_ADDRESS: z.string().min(1).optional(),
    // Absent, `/api/email-delivery-events` answers 500 and no delivery outcome is recorded.
    // @env-optional
    RESEND_WEBHOOK_SECRET: z.string().min(1).optional(),
    // Absent, links in owner emails are inert.
    // @env-optional
    PLATFORM_APP_URL: z.string().url().optional(),
    // The rate limiter refuses to start without these when VERCEL_ENV is production.
    // @env-optional
    KV_REST_API_URL: z.string().url().optional(),
    // @env-optional
    KV_REST_API_TOKEN: z.string().min(1).optional(),
    // @env-optional
    LOKI_PUSH_URL: z.string().min(1).optional(),
    // @env-optional
    LOKI_USER: z.string().min(1).optional(),
    // @env-optional
    LOKI_TOKEN: z.string().min(1).optional(),
    // @env-optional
    VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
    // @env-optional
    PERSONAL_DATA_ENCRYPTION_KEY: z
      .string()
      .refine(isPersonalDataKeyring, PERSONAL_DATA_KEYRING_FORMAT)
      .optional(),
    // @env-optional
    PERSONAL_DATA_INDEX_KEY: z
      .string()
      .refine(isPersonalDataKey, PERSONAL_DATA_KEY_FORMAT)
      .optional(),
    // Without it no confirmation email can be sent; changing it breaks every unsubscribe link already sent.
    // @env-optional
    NEWSLETTER_UNSUBSCRIBE_KEY: z.string().min(1).optional(),
    // Absent, every preview link is ignored and the published page is served.
    // @env-optional
    PREVIEW_LINK_SECRET: z.string().min(1).optional(),
    // @env-optional
    PRODUCT_NAME: z.string().trim().min(1).optional(),
    // @env-optional
    MARKETING_SITE_URL: z.string().url().optional(),
  },
  client: {
    // @env-optional
    NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
    NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_SANITY_DATASET: z.string().min(1),
  },
  runtimeEnv: {
    SANITY_REVALIDATE_SECRET: process.env.SANITY_REVALIDATE_SECRET,
    SITE_CONFIG_REVALIDATE_SECRET: process.env.SITE_CONFIG_REVALIDATE_SECRET,
    INTERNAL_PAGES_SECRET: process.env.INTERNAL_PAGES_SECRET,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    SANITY_GENERATE_SECRET: process.env.SANITY_GENERATE_SECRET,
    WEB_ANALYTICS_ENABLED: process.env.WEB_ANALYTICS_ENABLED,
    NEWSLETTER_FROM_ADDRESS: process.env.NEWSLETTER_FROM_ADDRESS,
    RESEND_WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET,
    PLATFORM_APP_URL: process.env.PLATFORM_APP_URL,
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
    LOKI_PUSH_URL: process.env.LOKI_PUSH_URL,
    LOKI_USER: process.env.LOKI_USER,
    LOKI_TOKEN: process.env.LOKI_TOKEN,
    VERCEL_ENV: process.env.VERCEL_ENV,
    PERSONAL_DATA_ENCRYPTION_KEY: process.env.PERSONAL_DATA_ENCRYPTION_KEY,
    PERSONAL_DATA_INDEX_KEY: process.env.PERSONAL_DATA_INDEX_KEY,
    NEWSLETTER_UNSUBSCRIBE_KEY: process.env.NEWSLETTER_UNSUBSCRIBE_KEY,
    PREVIEW_LINK_SECRET: process.env.PREVIEW_LINK_SECRET,
    PRODUCT_NAME: process.env.PRODUCT_NAME,
    MARKETING_SITE_URL: process.env.MARKETING_SITE_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
