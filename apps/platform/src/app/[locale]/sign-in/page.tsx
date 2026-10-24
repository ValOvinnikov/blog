import { getEnabledOAuthProviderIds } from '@blog/auth/utils/oauth-providers/oauth-providers';
import { SignInView } from '@platform/components/features/sign-in/sign-in-view';
import { getSession } from '@platform/server/auth/auth';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { toSafeCallbackPath } from '@platform/utils/safe-callback-path/safe-callback-path';
import { toSignInError } from '@platform/utils/sign-in-error/sign-in-error';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('signIn');
}

type TProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

export default async function SignInPage({ searchParams }: TProps) {
  const [{ callbackUrl, error }, session] = await Promise.all([
    searchParams,
    getSession(),
  ]);
  const callbackPath = toSafeCallbackPath(callbackUrl);

  if (session?.user?.id) {
    redirect(callbackPath);
  }

  return (
    <SignInView
      providerIds={getEnabledOAuthProviderIds()}
      callbackPath={callbackPath}
      error={toSignInError(error)}
    />
  );
}
