import type { TStudioCaller } from '@platform/server/auth/resolve-studio-caller';
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

export const MOCK_STUDIO_PROJECT_ID = 'k3x9p2ab';

export const MOCK_STUDIO_CALLER: TStudioCaller = {
  tenant: mockTenant(),
  userId: '0d3f6c2a-7710-4c1e-9a55-2f4b8e1d6a90',
  email: 'studio-editor@example.com',
};

export const studioJsonRequest = (path: string, body: unknown): Request =>
  new Request(`https://platform.example${path}`, {
    method: HTTP_METHOD.POST,
    body: JSON.stringify(body),
  });
