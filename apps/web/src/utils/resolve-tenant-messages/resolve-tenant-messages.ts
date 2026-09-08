import {
  portableTextToPlainText,
  VOICE_FIELDS,
  type TVoicePortableText,
} from '@blog/config';
import { getSiteConfig } from '@web/server/site-config/get-site-config';
import { logger } from '@web/utils/logger/logger';
import {
  resolveVoiceRichFields,
  type TVoiceRichFieldId,
} from '@web/utils/resolve-voice-rich-fields';

const VOICE_FIELDS_BY_ID = new Map<string, (typeof VOICE_FIELDS)[number]>(
  VOICE_FIELDS.map((field) => [field.id, field]),
);

const resolveOverrideText = (value: string | TVoicePortableText): string =>
  typeof value === 'string' ? value : portableTextToPlainText(value);

const setAtPath = (
  target: Record<string, unknown>,
  segments: readonly string[],
  value: string,
): Record<string, unknown> => {
  const [key, ...rest] = segments;
  if (key === undefined) return target;

  if (rest.length === 0) {
    return { ...target, [key]: value };
  }

  const child = target[key];
  const childObject =
    typeof child === 'object' && child !== null && !Array.isArray(child)
      ? (child as Record<string, unknown>)
      : {};

  return { ...target, [key]: setAtPath(childObject, rest, value) };
};

/**
 * Applies `site_config.voiceOverrides` onto the merged message tree at each
 * override's own `VOICE_FIELDS` registry path, cloning only the objects
 * along that path so untouched namespaces keep referencing the cached
 * messages module instead of being mutated in place. A message tree leaf
 * must be a string, so a RICH override is projected to plain text rather
 * than dropped — unformatted still beats falling back to the untouched
 * default copy. An override whose key is absent from the registry is
 * ignored.
 */
const applyVoiceOverrides = (
  messages: Record<string, unknown>,
  overrides: Record<string, string | TVoicePortableText>,
): Record<string, unknown> => {
  let result = messages;

  for (const [id, value] of Object.entries(overrides)) {
    const field = VOICE_FIELDS_BY_ID.get(id);
    if (!field) continue;

    const text = resolveOverrideText(value);
    result = setAtPath(result, field.path.split('.'), text);
  }

  return result;
};

export interface ITenantMessages {
  messages: Record<string, unknown>;
  rich: Record<TVoiceRichFieldId, TVoicePortableText>;
}

/**
 * Applies the tenant's per-key voice overrides on top of the base locale
 * messages returned by `getMessages()`, and resolves the same overrides'
 * RICH fields unflattened for `VoiceRichProvider`. Called from every route
 * that builds its own `NextIntlClientProvider` tree
 * (`[tenant]/[locale]/layout.tsx`, and the `not-found.tsx` boundaries that
 * render outside it) — `i18n/request.ts`'s `getRequestConfig` only resolves
 * the base, un-voiced messages since it has no tenant to read. Accepts the
 * `[tenant]` route param and forwards it to `getSiteConfig`; a
 * `not-found.tsx` boundary has no param to supply and falls through to the
 * header.
 */
export const resolveTenantMessages = async (
  base: Record<string, unknown>,
  tenant?: string,
): Promise<ITenantMessages> => {
  const result = await getSiteConfig(tenant);

  if (!result.ok) {
    logger.error('site_config.fetch_failed', { error: result.error });
    return { messages: base, rich: resolveVoiceRichFields({}, base) };
  }

  const voiceOverrides = result.data?.voiceOverrides ?? {};

  return {
    messages: applyVoiceOverrides(base, voiceOverrides),
    rich: resolveVoiceRichFields(voiceOverrides, base),
  };
};
