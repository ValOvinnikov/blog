import {
  portableTextToPlainText,
  VOICE_FIELD_KIND,
  VOICE_FIELDS,
  VOICE_PORTABLE_TEXT_SCHEMA,
  type TVoiceFieldId,
  type TVoicePortableText,
  type TVoicePortableTextBlock,
  type TVoicePortableTextLink,
  type TVoicePortableTextSpan,
} from '@blog/config';
import {
  DENSITY,
  FONT_CHOICE,
  PRESET_ID,
  RADIUS_SCALE,
  type TDensity,
  type TFontChoice,
  type TPresetId,
  type TRadiusScale,
} from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { siteConfig } from '@blog/db/schema/site-config';
import { sanitizeHref } from '@blog/utils';
import { z } from 'zod';

import { toSiteConfigResult, type TSiteConfigResult } from '../get-site-config';

const HUE_MIN = 0;
const HUE_MAX = 360;

const hueSchema = z.number().int().min(HUE_MIN).max(HUE_MAX);

const ALLOWED_DECORATORS: Set<string> = new Set(
  VOICE_PORTABLE_TEXT_SCHEMA.decorators.map((decorator) => decorator.name),
);
const PLACEHOLDER_PATTERN = /\{([^{}]+)\}/g;

function isAllowedStyle(style: unknown): boolean {
  return VOICE_PORTABLE_TEXT_SCHEMA.styles.some(
    (entry) => entry.name === style,
  );
}

const VOICE_FIELDS_BY_ID = new Map(
  VOICE_FIELDS.map((field) => [field.id, field]),
);

type TVoiceField = (typeof VOICE_FIELDS)[number];
type TVoiceFieldValue = string | TVoicePortableText;

type TVoiceFieldValidation =
  | { ok: true; value: TVoiceFieldValue | undefined }
  | { ok: false; error: string };

/** Every field id the platform can send, mapped to the raw value it authored — not yet trimmed, size-checked or sanitized. */
export type TVoiceOverridesInput = Partial<Record<TVoiceFieldId, unknown>>;

export type TUpsertSiteConfigResult =
  | ({ ok: true } & TSiteConfigResult)
  | { ok: false; fieldErrors: Partial<Record<TVoiceFieldId, string>> };

function findPlaceholderError(
  text: string,
  placeholders: readonly string[],
): string | undefined {
  const found = new Set<string>();
  for (const match of text.matchAll(PLACEHOLDER_PATTERN)) {
    const token = match[1];
    if (token !== undefined) found.add(token);
  }

  const missing = placeholders.filter((token) => !found.has(token));
  if (missing.length > 0) {
    return `Missing required placeholder${missing.length > 1 ? 's' : ''} ${missing.map((token) => `{${token}}`).join(', ')}.`;
  }

  const unknown = [...found].filter((token) => !placeholders.includes(token));
  if (unknown.length > 0) {
    return `Contains unknown placeholder${unknown.length > 1 ? 's' : ''} ${unknown.map((token) => `{${token}}`).join(', ')}.`;
  }

  return undefined;
}

function validateTextField(
  field: TVoiceField,
  raw: unknown,
): TVoiceFieldValidation {
  if (raw === undefined || raw === null) return { ok: true, value: undefined };
  if (typeof raw !== 'string') {
    return { ok: false, error: 'Must be a string.' };
  }

  const trimmed = raw.trim();
  if (trimmed === '') return { ok: true, value: undefined };

  if (field.kind === VOICE_FIELD_KIND.TEXT && /[\r\n]/.test(trimmed)) {
    return { ok: false, error: 'Must not contain line breaks.' };
  }

  if (trimmed.length > field.max) {
    return { ok: false, error: `Must be ${field.max} characters or fewer.` };
  }

  const placeholderError = findPlaceholderError(trimmed, field.placeholders);
  if (placeholderError) return { ok: false, error: placeholderError };

  return { ok: true, value: trimmed };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeRichValue(
  raw: unknown[],
): { ok: true; value: TVoicePortableText } | { ok: false; error: string } {
  const blocks: TVoicePortableTextBlock[] = [];

  for (const rawBlock of raw) {
    if (!isRecord(rawBlock) || rawBlock._type !== 'block') {
      return { ok: false, error: 'Contains a disallowed block type.' };
    }
    if (rawBlock.style !== undefined && !isAllowedStyle(rawBlock.style)) {
      return {
        ok: false,
        error: `Contains a disallowed style "${String(rawBlock.style)}".`,
      };
    }
    if (rawBlock.listItem !== undefined) {
      return { ok: false, error: 'Contains a disallowed list.' };
    }
    if (typeof rawBlock._key !== 'string') {
      return { ok: false, error: 'Contains a malformed block.' };
    }

    const rawMarkDefs = Array.isArray(rawBlock.markDefs)
      ? rawBlock.markDefs
      : [];
    const markDefs: TVoicePortableTextLink[] = [];

    for (const rawMarkDef of rawMarkDefs) {
      if (!isRecord(rawMarkDef) || rawMarkDef._type !== 'link') {
        return { ok: false, error: 'Contains a disallowed annotation.' };
      }
      if (
        typeof rawMarkDef._key !== 'string' ||
        typeof rawMarkDef.href !== 'string'
      ) {
        return { ok: false, error: 'Contains a malformed link annotation.' };
      }
      const sanitized = sanitizeHref(rawMarkDef.href);
      if (sanitized === null) {
        return {
          ok: false,
          error: `Has an invalid link URL "${rawMarkDef.href}".`,
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
        return { ok: false, error: 'Contains a disallowed inline type.' };
      }
      if (
        typeof rawSpan._key !== 'string' ||
        typeof rawSpan.text !== 'string'
      ) {
        return { ok: false, error: 'Contains a malformed span.' };
      }

      const rawMarks = Array.isArray(rawSpan.marks) ? rawSpan.marks : [];
      const marks: string[] = [];
      for (const mark of rawMarks) {
        if (
          typeof mark !== 'string' ||
          (!ALLOWED_DECORATORS.has(mark) && !markDefKeys.has(mark))
        ) {
          return {
            ok: false,
            error: `Contains a disallowed mark "${String(mark)}".`,
          };
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

function isBlankRichValue(value: TVoicePortableText): boolean {
  return value.every((block) =>
    block.children.every((span) => span.text.trim() === ''),
  );
}

function coercePlainStringToRichValue(text: string): TVoicePortableText {
  return [
    {
      _type: 'block',
      _key: crypto.randomUUID(),
      style: 'normal',
      children: [{ _type: 'span', _key: crypto.randomUUID(), text }],
    },
  ];
}

function finalizeRichValue(
  field: TVoiceField,
  value: TVoicePortableText,
): TVoiceFieldValidation {
  if (isBlankRichValue(value)) return { ok: true, value: undefined };

  const plainText = portableTextToPlainText(value);
  if (plainText.length > field.max) {
    return { ok: false, error: `Must be ${field.max} characters or fewer.` };
  }

  const placeholderError = findPlaceholderError(plainText, field.placeholders);
  if (placeholderError) return { ok: false, error: placeholderError };

  return { ok: true, value };
}

function validateRichField(
  field: TVoiceField,
  raw: unknown,
): TVoiceFieldValidation {
  if (raw === undefined || raw === null) return { ok: true, value: undefined };

  if (typeof raw === 'string') {
    return finalizeRichValue(field, coercePlainStringToRichValue(raw));
  }

  if (!Array.isArray(raw)) return { ok: false, error: 'Must be rich text.' };
  if (raw.length === 0) return { ok: true, value: undefined };

  const normalized = normalizeRichValue(raw);
  if (!normalized.ok) return normalized;

  return finalizeRichValue(field, normalized.value);
}

function validateVoiceFieldValue(
  field: TVoiceField,
  raw: unknown,
): TVoiceFieldValidation {
  return field.kind === VOICE_FIELD_KIND.RICH
    ? validateRichField(field, raw)
    : validateTextField(field, raw);
}

type TVoiceOverridesParseResult =
  | { ok: true; value: Record<string, TVoiceFieldValue> }
  | { ok: false; fieldErrors: Partial<Record<TVoiceFieldId, string>> };

/**
 * Validates a tenant's raw Voice-tab submission against the `VOICE_FIELDS`
 * registry — kind-specific rules, placeholder integrity and link-href
 * sanitization — collecting one message per offending field rather than
 * stopping at the first. A key absent from the registry is a malformed
 * request, not a per-field error, and throws instead.
 */
function parseVoiceOverrides(
  raw: TVoiceOverridesInput,
): TVoiceOverridesParseResult {
  const unknownKeys = Object.keys(raw).filter(
    (key) => !VOICE_FIELDS_BY_ID.has(key as TVoiceFieldId),
  );
  if (unknownKeys.length > 0) {
    throw new Error(
      `upsertSiteConfig: unknown voice override key(s): ${unknownKeys.join(', ')}.`,
    );
  }

  const value: Record<string, TVoiceFieldValue> = {};
  const fieldErrors: Partial<Record<TVoiceFieldId, string>> = {};

  for (const [key, rawValue] of Object.entries(raw)) {
    const field = VOICE_FIELDS_BY_ID.get(key as TVoiceFieldId)!;
    const result = validateVoiceFieldValue(field, rawValue);

    if (!result.ok) {
      fieldErrors[field.id] = result.error;
      continue;
    }
    if (result.value !== undefined) value[field.id] = result.value;
  }

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };

  return { ok: true, value };
}

// A field absent from the input is left untouched on `UPDATE` — Look and
// Voice are saved from separate admin-panel tabs, so a Look save must never
// wipe Voice data (or vice versa). `logoHue`/`logoAssetUrl`/`faviconAssetUrl`
// additionally accept an explicit `null` to actually clear them (distinct
// from omission) since `undefined` alone can't express "unset this" once a
// value has been set. `voiceOverrides` follows the same omit-vs-present rule
// one level up: omitted leaves the whole JSONB column untouched, present
// (even `{}`) replaces it — the per-field blank-clears-that-key behaviour
// inside it is handled separately by `parseVoiceOverrides`, since it needs
// registry lookups a Zod object schema can't express.
export const updateSiteConfigInputSchema = z.object({
  preset: z.enum(Object.values(PRESET_ID) as [TPresetId, ...TPresetId[]]),
  accentHue: hueSchema,
  logoHue: hueSchema.nullable().optional(),
  headingFont: z.enum(
    Object.values(FONT_CHOICE) as [TFontChoice, ...TFontChoice[]],
  ),
  bodyFont: z.enum(
    Object.values(FONT_CHOICE) as [TFontChoice, ...TFontChoice[]],
  ),
  radiusScale: z.enum(
    Object.values(RADIUS_SCALE) as [TRadiusScale, ...TRadiusScale[]],
  ),
  density: z.enum(Object.values(DENSITY) as [TDensity, ...TDensity[]]),
  logoAssetUrl: z.string().trim().url().nullable().optional(),
  faviconAssetUrl: z.string().trim().url().nullable().optional(),
});

// The pre-validation shape callers submit — a form's raw values, including
// blank strings/empty rich text for a cleared voice override.
export type TUpdateSiteConfigInput = z.input<
  typeof updateSiteConfigInputSchema
> & { voiceOverrides?: TVoiceOverridesInput };

type TSiteConfigWritable = Partial<typeof siteConfig.$inferInsert>;

// Builds only the columns this call actually supplied — `undefined` means
// "key absent from the input", so it's excluded from the object entirely
// rather than passed through, which is what keeps an omitted column out of
// both the `INSERT` values and the `UPDATE ... SET` clause.
function presentOptionalFields(
  parsed: z.output<typeof updateSiteConfigInputSchema>,
  voiceOverrides: Record<string, TVoiceFieldValue> | undefined,
): TSiteConfigWritable {
  const fields: TSiteConfigWritable = {};

  if (parsed.logoHue !== undefined) fields.logoHue = parsed.logoHue;
  if (parsed.logoAssetUrl !== undefined) {
    fields.logoAssetUrl = parsed.logoAssetUrl;
  }
  if (parsed.faviconAssetUrl !== undefined) {
    fields.faviconAssetUrl = parsed.faviconAssetUrl;
  }
  if (voiceOverrides !== undefined) fields.voiceOverrides = voiceOverrides;

  return fields;
}

export async function upsertSiteConfig(
  tenantId: string,
  input: TUpdateSiteConfigInput,
): Promise<TUpsertSiteConfigResult> {
  const db = getDb();
  const { voiceOverrides: rawVoiceOverrides, ...rest } = input;
  const parsed = updateSiteConfigInputSchema.parse(rest);

  let voiceOverrides: Record<string, TVoiceFieldValue> | undefined;
  if (rawVoiceOverrides !== undefined) {
    const result = parseVoiceOverrides(rawVoiceOverrides);
    if (!result.ok) return result;
    voiceOverrides = result.value;
  }

  const required = {
    preset: parsed.preset,
    accentHue: parsed.accentHue,
    headingFont: parsed.headingFont,
    bodyFont: parsed.bodyFont,
    radiusScale: parsed.radiusScale,
    density: parsed.density,
  };
  const optional = presentOptionalFields(parsed, voiceOverrides);

  const [row] = await db
    .insert(siteConfig)
    .values({ tenantId, ...required, ...optional })
    .onConflictDoUpdate({
      target: siteConfig.tenantId,
      set: { ...required, ...optional, updatedAt: new Date() },
    })
    .returning();

  if (!row) {
    throw new Error(
      `upsertSiteConfig: upsert for tenant "${tenantId}" returned no row.`,
    );
  }

  return { ok: true, ...toSiteConfigResult(row) };
}
