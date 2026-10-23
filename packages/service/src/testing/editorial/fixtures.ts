import type { TSaveSkimDraftInput } from '@blog/service/features/editorial/skim/adaptor/save-skim-draft/types';
import { MOCK_POST_ID } from '@blog/service/testing/shared/fixtures';

export const MOCK_SKIM_MODEL = 'claude-haiku-4-5';
export const MOCK_SKIM_TAKEAWAYS = ['One', 'Two', 'Three'];

export function mockSkimDraftInput(
  overrides: Partial<TSaveSkimDraftInput> = {},
): TSaveSkimDraftInput {
  return {
    postId: MOCK_POST_ID,
    takeaways: MOCK_SKIM_TAKEAWAYS,
    model: MOCK_SKIM_MODEL,
    ...overrides,
  };
}
