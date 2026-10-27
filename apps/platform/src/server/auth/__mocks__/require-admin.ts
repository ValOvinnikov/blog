import type { TAdmin } from '@blog/db/schema/admins';
import { mockAdmin } from '@platform/testing/admins/fixtures';

export const requireAdmin = vi.fn(async (): Promise<TAdmin> => mockAdmin());
