import type { TVoicePortableText } from '@blog/config';

const PLACEHOLDER = /\{(\w+)\}/g;

export const fillVoicePlaceholders = (
  value: TVoicePortableText,
  params: Record<string, string>,
): TVoicePortableText =>
  value.map((block) => ({
    ...block,
    children: block.children.map((span) => ({
      ...span,
      text: span.text.replace(
        PLACEHOLDER,
        (token, key: string) => params[key] ?? token,
      ),
    })),
  }));
