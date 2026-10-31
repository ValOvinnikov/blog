import 'server-only';

import { studioEnteredCookie } from '@platform/utils/studio-entered-cookie/studio-entered-cookie';
import { cookies } from 'next/headers';

export const resolveHasEnteredStudio = async (
  tenantId: string,
): Promise<boolean> => (await cookies()).has(studioEnteredCookie(tenantId));
