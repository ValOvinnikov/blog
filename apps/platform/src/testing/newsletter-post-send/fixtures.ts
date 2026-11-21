import type { TStudioCaller } from '@platform/server/auth/resolve-studio-caller';
import { MOCK_PLATFORM_ORIGIN } from '@platform/testing/auth/fixtures';
import { createMockFaker } from '@platform/testing/mock-faker';
import { mockTenant } from '@platform/testing/tenants/fixtures';
import { HTTP_METHOD } from '@shinefold/config';
import type { TNewsletterLimits } from '@shinefold/db/queries/email-usage';

export const MOCK_NEWSLETTER_LIMITS = {
  activeCount: 120,
  bandCeiling: 2_500,
  allowance: 15_000,
  sentThisMonth: 400,
} as const satisfies TNewsletterLimits;

export const MOCK_EMAILS_LEFT = 14_600;

const studioFaker = createMockFaker(7710);

export const MOCK_STUDIO_PROJECT_ID = studioFaker.string.alphanumeric(8);

export const MOCK_STUDIO_CALLER: TStudioCaller = {
  tenant: mockTenant(),
  userId: studioFaker.string.uuid(),
  email: studioFaker.internet.email(),
};

export const studioJsonRequest = (path: string, body: unknown): Request =>
  new Request(`${MOCK_PLATFORM_ORIGIN}${path}`, {
    method: HTTP_METHOD.POST,
    body: JSON.stringify(body),
  });
