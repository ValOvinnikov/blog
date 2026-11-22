import type { TPostSummary } from '@shinefold/config';

export type TSaveSkimDraftInput = {
  postId: string;
  summary: TPostSummary;
  model: string;
};
