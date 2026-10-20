import { ownerAccessHookToken } from '@worker/utils/owner-access-hook/owner-access-hook';
import { ensureOwnerAccess } from '@worker/workflows/ensure-owner-access';
import { resumeHook, start } from 'workflow/api';
import { HookNotFoundError } from 'workflow/errors';

export async function wakeOwnerAccess(tenantId: string): Promise<void> {
  try {
    await resumeHook(ownerAccessHookToken(tenantId), null);
    return;
  } catch (error) {
    if (!HookNotFoundError.is(error)) throw error;
  }
  await start(ensureOwnerAccess, [tenantId]);
}
