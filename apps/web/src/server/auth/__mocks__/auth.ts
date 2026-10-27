import { mockSession } from '@web/testing/shared/session/fixtures';
import type { Session } from 'next-auth';

export const auth = vi.fn(async (): Promise<Session | null> => mockSession());

export const GET = vi.fn();

export const POST = vi.fn();
