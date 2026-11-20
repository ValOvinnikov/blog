import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import {
  type ArticleText,
  POST_SUMMARY_MAX_BLOCKS,
  POST_SUMMARY_MAX_WORDS,
} from '@shinefold/config';
import { toBlockText } from '@shinefold/utils/portable-text';
import { hasLength } from '@shinefold/utils/primitives';
import {
  SKIM_GENERATION_DEADLINE_MS,
  SUMMARY_BLOCK_STYLE,
} from '@web/constants/generate-skim';
import type { TGeneratedSummaryBlock } from '@web/server/skim/to-summary-portable-text/to-summary-portable-text';
import { z } from 'zod';

export const SKIM_GENERATION_MODEL = 'claude-haiku-5-5';

// Anthropic's structured output takes an object at the schema root, not an array.
const summarySchema = z.object({
  blocks: z
    .array(
      z.object({
        style: z.enum(SUMMARY_BLOCK_STYLE),
        text: z.string(),
      }),
    )
    .min(1)
    .max(POST_SUMMARY_MAX_BLOCKS),
});

const bodyToPlainText = (body: ArticleText): string =>
  body
    .filter((block) => block._type === 'block')
    .map(toBlockText)
    .filter((text) => hasLength(text.trim()))
    .join('\n\n');

const buildPrompt = (plainText: string): string =>
  [
    `Summarize the following blog post in at most ${String(POST_SUMMARY_MAX_WORDS)} words,`,
    'written in the post\'s own voice — no meta-commentary like "this post explains".',
    `Return 1 to ${String(POST_SUMMARY_MAX_BLOCKS)} blocks. Write prose by default:`,
    `one or two ${SUMMARY_BLOCK_STYLE.PARAGRAPH} blocks. Use ${SUMMARY_BLOCK_STYLE.BULLET}`,
    `or ${SUMMARY_BLOCK_STYLE.NUMBER} blocks, one per item, only where the post itself`,
    'lists things or steps. Mark text only with **bold** and *italic*, sparingly.',
    '',
    '---',
    plainText,
    '---',
  ].join('\n');

export const generateTakeaways = async (
  body: ArticleText,
  apiKey: string,
): Promise<TGeneratedSummaryBlock[]> => {
  const client = new Anthropic({ apiKey });

  const message = await client.messages.parse(
    {
      model: SKIM_GENERATION_MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: buildPrompt(bodyToPlainText(body)) }],
      output_config: { format: zodOutputFormat(summarySchema) },
    },
    { signal: AbortSignal.timeout(SKIM_GENERATION_DEADLINE_MS) },
  );

  if (!message.parsed_output) {
    throw new Error('generateTakeaways: Claude returned no parseable output.');
  }

  return message.parsed_output.blocks;
};
