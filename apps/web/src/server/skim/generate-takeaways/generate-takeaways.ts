import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { ArticleText } from '@shinefold/config';
import { hasLength } from '@shinefold/utils/primitives';
import {
  SKIM_GENERATION_MAX_RETRIES,
  SKIM_GENERATION_TIMEOUT_MS,
} from '@web/constants/generate-skim';
import { z } from 'zod';

export const SKIM_GENERATION_MODEL = 'claude-haiku-5-5';

const MAX_TAKEAWAY_LENGTH = 160;

// Anthropic's structured output takes an object at the schema root, not an array.
const takeawaysSchema = z.object({
  takeaways: z.array(z.string().max(MAX_TAKEAWAY_LENGTH)).min(3).max(7),
});

const bodyToPlainText = (body: ArticleText): string => {
  return body
    .filter((block) => block._type === 'block')
    .map((block) =>
      (block.children ?? []).map((child) => child.text ?? '').join(''),
    )
    .filter((text) => hasLength(text.trim()))
    .join('\n\n');
};

const buildPrompt = (plainText: string): string => {
  return [
    'Summarize the following blog post into 3 to 7 short takeaways for a',
    '"30-second skim" mode. Each takeaway must be a single, self-contained',
    `sentence of ${MAX_TAKEAWAY_LENGTH} characters or fewer, written in the`,
    'post\'s own voice — no meta-commentary like "this post explains".',
    '',
    '---',
    plainText,
    '---',
  ].join('\n');
};

export const generateTakeaways = async (
  body: ArticleText,
  apiKey: string,
): Promise<string[]> => {
  const client = new Anthropic({
    apiKey,
    timeout: SKIM_GENERATION_TIMEOUT_MS,
    maxRetries: SKIM_GENERATION_MAX_RETRIES,
  });

  const message = await client.messages.parse({
    model: SKIM_GENERATION_MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: buildPrompt(bodyToPlainText(body)) }],
    output_config: { format: zodOutputFormat(takeawaysSchema) },
  });

  if (!message.parsed_output) {
    throw new Error('generateTakeaways: Claude returned no parseable output.');
  }

  return message.parsed_output.takeaways;
};
