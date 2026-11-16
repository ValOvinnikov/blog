import { runQuery } from '@shinefold/service/sanity/query/query';
import type { Mock } from 'vitest';

export const mockRun = runQuery as unknown as Mock;
