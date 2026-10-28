import { SignUpView } from '@platform/components/features/sign-up/sign-up-view';
import { getSession } from '@platform/server/auth/auth';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { toLegalPageUrls } from '@platform/utils/legal-page-urls/legal-page-urls';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('signUpTitle');
}

export default async function SignUpPage() {
  const session = await getSession();

  if (session?.user?.id) {
    redirect(adminRoutes.home());
  }

  return <SignUpView legalPageUrls={toLegalPageUrls()} />;
}
