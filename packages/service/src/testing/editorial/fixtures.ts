import type { TSaveSkimDraftInput } from '@shinefold/service/features/editorial/skim/adaptor/save-skim-draft/types';
import {
  MOCK_POST_ID,
  mockRawParagraphTextBlock,
} from '@shinefold/service/testing/shared/fixtures';

type TSummaryBlock = TSaveSkimDraftInput['summary'][number];

export const MOCK_SKIM_MODEL = 'claude-haiku-4-5';
export const MOCK_SKIM_SUMMARY = [
  mockRawParagraphTextBlock<TSummaryBlock>({ text: 'One short summary.' }),
];

export function mockSkimDraftInput(
  overrides: Partial<TSaveSkimDraftInput> = {},
): TSaveSkimDraftInput {
  return {
    postId: MOCK_POST_ID,
    summary: MOCK_SKIM_SUMMARY,
    model: MOCK_SKIM_MODEL,
    ...overrides,
  };
}
