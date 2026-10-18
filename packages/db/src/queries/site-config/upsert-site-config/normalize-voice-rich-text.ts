import {
  VOICE_FIELD_ERROR,
  VOICE_PORTABLE_TEXT_SCHEMA,
  type TVoiceFieldFailure,
  type TVoicePortableText,
  type TVoicePortableTextBlock,
  type TVoicePortableTextLink,
  type TVoicePortableTextSpan,
} from '@blog/config';
import { sanitizeHref } from '@blog/utils';

const ALLOWED_DECORATORS: Set<string> = new Set(
  VOICE_PORTABLE_TEXT_SCHEMA.decorators.map((decorator) => decorator.name),
);

function isAllowedStyle(style: unknown): boolean {
  return VOICE_PORTABLE_TEXT_SCHEMA.styles.some(
    (entry) => entry.name === style,
  );
}

const DISALLOWED_CONTENT: TVoiceFieldFailure = {
  reason: VOICE_FIELD_ERROR.DISALLOWED_CONTENT,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function normalizeRichValue(
  raw: unknown[],
):
  | { ok: true; value: TVoicePortableText }
  | { ok: false; error: TVoiceFieldFailure } {
  const blocks: TVoicePortableTextBlock[] = [];

  for (const rawBlock of raw) {
    if (!isRecord(rawBlock) || rawBlock._type !== 'block') {
      return { ok: false, error: DISALLOWED_CONTENT };
    }
    if (rawBlock.style !== undefined && !isAllowedStyle(rawBlock.style)) {
      return { ok: false, error: DISALLOWED_CONTENT };
    }
    if (rawBlock.listItem !== undefined) {
      return { ok: false, error: DISALLOWED_CONTENT };
    }
    if (typeof rawBlock._key !== 'string') {
      return { ok: false, error: DISALLOWED_CONTENT };
    }

    const rawMarkDefs = Array.isArray(rawBlock.markDefs)
      ? rawBlock.markDefs
      : [];
    const markDefs: TVoicePortableTextLink[] = [];

    for (const rawMarkDef of rawMarkDefs) {
      if (!isRecord(rawMarkDef) || rawMarkDef._type !== 'link') {
        return { ok: false, error: DISALLOWED_CONTENT };
      }
      if (
        typeof rawMarkDef._key !== 'string' ||
        typeof rawMarkDef.href !== 'string'
      ) {
        return { ok: false, error: DISALLOWED_CONTENT };
      }
      const sanitized = sanitizeHref(rawMarkDef.href);
      if (sanitized === null) {
        return {
          ok: false,
          error: {
            reason: VOICE_FIELD_ERROR.INVALID_LINK_URL,
            values: { url: rawMarkDef.href },
          },
        };
      }
      markDefs.push({ _type: 'link', _key: rawMarkDef._key, href: sanitized });
    }

    const markDefKeys = new Set(markDefs.map((markDef) => markDef._key));
    const rawChildren = Array.isArray(rawBlock.children)
      ? rawBlock.children
      : [];
    const children: TVoicePortableTextSpan[] = [];

    for (const rawSpan of rawChildren) {
      if (!isRecord(rawSpan) || rawSpan._type !== 'span') {
        return { ok: false, error: DISALLOWED_CONTENT };
      }
      if (
        typeof rawSpan._key !== 'string' ||
        typeof rawSpan.text !== 'string'
      ) {
        return { ok: false, error: DISALLOWED_CONTENT };
      }

      const rawMarks = Array.isArray(rawSpan.marks) ? rawSpan.marks : [];
      const marks: string[] = [];
      for (const mark of rawMarks) {
        if (
          typeof mark !== 'string' ||
          (!ALLOWED_DECORATORS.has(mark) && !markDefKeys.has(mark))
        ) {
          return { ok: false, error: DISALLOWED_CONTENT };
        }
        marks.push(mark);
      }

      children.push(
        marks.length > 0
          ? { _type: 'span', _key: rawSpan._key, text: rawSpan.text, marks }
          : { _type: 'span', _key: rawSpan._key, text: rawSpan.text },
      );
    }

    blocks.push(
      markDefs.length > 0
        ? {
            _type: 'block',
            _key: rawBlock._key,
            style: 'normal',
            children,
            markDefs,
          }
        : { _type: 'block', _key: rawBlock._key, style: 'normal', children },
    );
  }

  return { ok: true, value: blocks };
}
