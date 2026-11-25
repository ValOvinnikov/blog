import { NO_ACCESS_REASON } from '@platform/constants/no-access';
import { auth } from '@platform/server/auth/auth';
import { adminRoutes } from '@platform/utils/routes/routes';
import { signInRedirect } from '@platform/utils/sign-in-redirect/sign-in-redirect';
import { queries } from '@shinefold/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return signInRedirect(url);

  const admin = await queries.admins.getAdminByUserId(userId);
  const destination = admin
    ? adminRoutes.tenants()
    : adminRoutes.noAccess(NO_ACCESS_REASON.ADMIN_INVITE);

  return NextResponse.redirect(new URL(destination, url));
}
