import { mockAdmin } from '@platform/testing/admins/fixtures';
import type { TAdmin } from '@shinefold/db/schema/admins';

export const requireAdmin = vi.fn(async (): Promise<TAdmin> => mockAdmin());
