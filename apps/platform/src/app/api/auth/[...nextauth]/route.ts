import { getSession, GET as handleAuthGet } from '@platform/server/auth/auth';
import { adminRoutes, SIGN_IN_PATH } from '@platform/utils/routes/routes';
import { type NextRequest, NextResponse } from 'next/server';

export { POST } from '@platform/server/auth/auth';

const isSignedIn = async () => Boolean((await getSession())?.user?.id);

export async function GET(request: NextRequest): Promise<Response> {
  if (request.nextUrl.pathname === SIGN_IN_PATH && (await isSignedIn())) {
    return NextResponse.redirect(new URL(adminRoutes.home(), request.url));
  }

  return handleAuthGet(request);
}
