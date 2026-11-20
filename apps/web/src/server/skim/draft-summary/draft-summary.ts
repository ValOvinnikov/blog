import {
  type ArticleText,
  POST_SUMMARY_MAX_WORDS,
  type TPostSummary,
} from '@shinefold/config';
import { errorResult, okResult, type TResult } from '@shinefold/utils';
import { countBlockWords } from '@shinefold/utils/portable-text';
import { GENERATE_SKIM_LOG } from '@web/constants/generate-skim';
import { generateTakeaways } from '@web/server/skim/generate-takeaways/generate-takeaways';
import { toSummaryPortableText } from '@web/server/skim/to-summary-portable-text/to-summary-portable-text';
import { logger } from '@web/utils/logger/logger';

type TDraftSummaryContext = { tenantId?: string; postId: string };

export const draftSummary = async (
  body: ArticleText,
  apiKey: string,
  context: TDraftSummaryContext,
): Promise<TResult<TPostSummary, string>> => {
  let summary: TPostSummary;
  try {
    summary = toSummaryPortableText(await generateTakeaways(body, apiKey));
  } catch (error) {
    logger.error(GENERATE_SKIM_LOG.GENERATION_FAILED, { ...context, error });
    return errorResult('Failed to generate the summary.');
  }

  const words = countBlockWords(summary);
  if (words === 0) {
    logger.warn(GENERATE_SKIM_LOG.SUMMARY_EMPTY, context);
    return errorResult('The generated summary has no words.');
  }
  if (words > POST_SUMMARY_MAX_WORDS) {
    logger.warn(GENERATE_SKIM_LOG.SUMMARY_OVER_WORD_LIMIT, {
      ...context,
      words,
    });
    return errorResult(
      `The generated summary ran over ${String(POST_SUMMARY_MAX_WORDS)} words.`,
    );
  }

  return okResult(summary);
};
