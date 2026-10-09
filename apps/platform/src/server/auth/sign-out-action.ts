'use server';

import { adminRoutes } from '@platform/utils/routes/routes';

import { signOut } from './auth';

export const signOutAction = async (): Promise<void> => {
  await signOut({ redirectTo: adminRoutes.signIn() });
};
