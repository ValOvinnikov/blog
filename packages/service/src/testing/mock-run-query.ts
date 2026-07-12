import { runQuery } from '@blog/service/sanity/query';
import type { Mock } from 'vitest';

export const mockRun = runQuery as unknown as Mock;
