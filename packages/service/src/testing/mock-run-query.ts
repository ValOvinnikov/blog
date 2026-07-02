import type { Mock } from 'vitest';

import { runQuery } from '#/sanity/query';

export const mockRun = runQuery as unknown as Mock;
