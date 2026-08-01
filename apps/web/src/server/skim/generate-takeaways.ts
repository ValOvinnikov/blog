import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { RichText } from '@blog/config';
import { z } from 'zod';

/** Model id for both the Anthropic call and the `skim.model` value persisted via `saveSkimDraft` — one source of truth, per `cms-schema-practices`' "no repeated literals". */
export const SKIM_GENERATION_MODEL = 'claude-haiku-4-5';

const MAX_TAKEAWAY_LENGTH = 160;

// Wrapped in an object (not a bare array) at the schema root — Anthropic's
// structured-output `json_schema` format is documented against object
// schemas; the route only ever reads `.takeaways` back out.
const takeawaysSchema = z.object({
  takeaways: z.array(z.string().max(MAX_TAKEAWAY_LENGTH)).min(3).max(7),
});

/** Flattens a post body's text-bearing blocks to plain text for the generation prompt — code/image/aside blocks are skipped, they carry no prose to summarize. */
function bodyToPlainText(body: RichText): string {
  return body
    .filter((block) => block._type === 'block')
    .map((block) =>
      (block.children ?? []).map((child) => child.text ?? '').join(''),
    )
    .filter((text) => text.trim().length > 0)
    .join('\n\n');
}

function buildPrompt(plainText: string): string {
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
}

/**
 * Calls Claude (`SKIM_GENERATION_MODEL`) to draft 3–7 takeaways for a post's
 * `skim` field, forcing the response through a zod schema via the SDK's
 * `parse()` + `zodOutputFormat()` (throws an `AnthropicError` on malformed
 * JSON or a failed schema — the caller (`/api/generate-skim`) maps that to a
 * 422 and never calls the write path). No AI call happens on the reader
 * path — this only ever runs from the publish-time pipeline route.
 */
export async function generateTakeaways(
  body: RichText,
  apiKey: string,
): Promise<string[]> {
  const client = new Anthropic({ apiKey });

  const message = await client.messages.parse({
    model: SKIM_GENERATION_MODEL,
    max_tokens: 1024,
    temperature: 0,
    messages: [{ role: 'user', content: buildPrompt(bodyToPlainText(body)) }],
    output_config: { format: zodOutputFormat(takeawaysSchema) },
  });

  if (!message.parsed_output) {
    throw new Error('generateTakeaways: Claude returned no parseable output.');
  }

  return message.parsed_output.takeaways;
}
