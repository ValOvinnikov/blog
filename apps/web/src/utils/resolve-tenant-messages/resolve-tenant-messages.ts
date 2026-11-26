import {
  portableTextToPlainText,
  type TLocaleIsoCode,
  VOICE_FIELDS,
  type TVoicePortableText,
} from '@shinefold/config';
import {
  hasLength,
  isPlainObject,
  isString,
  isUndefined,
} from '@shinefold/utils/primitives';
import { SITE_CONFIG_LOG } from '@web/constants/site-config';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { logger } from '@web/utils/logger/logger';
import {
  resolveVoiceRichFields,
  type TVoiceRichFieldId,
} from '@web/utils/resolve-voice-rich-fields';

const VOICE_FIELDS_BY_ID = new Map<string, (typeof VOICE_FIELDS)[number]>(
  VOICE_FIELDS.map((field) => [field.id, field]),
);

const resolveOverrideText = (value: string | TVoicePortableText): string =>
  isString(value) ? value : portableTextToPlainText(value);

const setAtPath = (
  target: Record<string, unknown>,
  segments: readonly string[],
  value: string,
): Record<string, unknown> => {
  const [key, ...rest] = segments;
  if (isUndefined(key)) return target;

  if (!hasLength(rest)) {
    return { ...target, [key]: value };
  }

  const child = target[key];
  const childObject = isPlainObject(child) ? child : {};

  return { ...target, [key]: setAtPath(childObject, rest, value) };
};

// A message leaf must be a string, so a RICH override is projected to plain text rather than dropped.
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

export const resolveTenantMessages = async (
  base: Record<string, unknown>,
  locale: TLocaleIsoCode,
  tenant?: string,
): Promise<ITenantMessages> => {
  const result = await getSiteConfig(tenant);

  if (!result.ok) {
    logger.error(SITE_CONFIG_LOG.FETCH_FAILED, { error: result.error });
    return { messages: base, rich: resolveVoiceRichFields({}, base) };
  }

  const voiceOverrides = result.data?.voiceOverridesByLocale[locale] ?? {};

  return {
    messages: applyVoiceOverrides(base, voiceOverrides),
    rich: resolveVoiceRichFields(voiceOverrides, base),
  };
};
