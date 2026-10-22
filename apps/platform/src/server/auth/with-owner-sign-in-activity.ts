import { recordOwnerSignInActivity } from '@platform/server/tenants/record-owner-sign-in-activity';
import type { NextAuthConfig } from 'next-auth';

export const withOwnerSignInActivity = (
  config: NextAuthConfig,
): NextAuthConfig => ({
  ...config,
  events: {
    ...config.events,
    signIn: async (message) => {
      const { id: userId } = message.user;
      await Promise.all([
        config.events?.signIn?.(message),
        userId && recordOwnerSignInActivity(userId),
      ]);
    },
  },
});
