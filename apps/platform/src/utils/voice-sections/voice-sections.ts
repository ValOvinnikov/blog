import {
  VOICE_FIELDS,
  VOICE_SURFACE,
  type TMaybeUndefined,
  type TVoiceFieldId,
  type TVoiceSurface,
} from '@blog/config';
import { isUndefined } from '@blog/utils/primitives';
import {
  VOICE_CARD_ID,
  VOICE_COUNT_UNIT,
  VOICE_SECTION_ID,
  type TVoiceCountUnit,
  type TVoiceSection,
} from '@platform/constants/voice';
import {
  countCustomisedVoiceFields,
  VOICE_SECTIONS_IN_PAGE_ORDER,
  VOICE_SURFACES_BY_SECTION,
  voiceFieldsOf,
  type TVoiceField,
  type TVoiceFieldErrors,
  type TVoiceLocaleDraft,
} from '@platform/utils/voice-draft/voice-draft';

// 16px below the top bar: <html> scroll padding is 68, the drawn bar 67 below md and 59 from md.
export const VOICE_ANCHOR_CLASSES = 'scroll-mt-[15px] md:scroll-mt-[7px]';

export type TVoiceHashTarget = {
  section: TVoiceSection;
  id: string;
};

const VOICE_SECTION_BY_SURFACE = Object.fromEntries(
  VOICE_SECTIONS_IN_PAGE_ORDER.flatMap((section) =>
    VOICE_SURFACES_BY_SECTION[section].map((surface) => [surface, section]),
  ),
) as Record<TVoiceSurface, TVoiceSection>;

export const voiceSectionOf = (surface: TVoiceSurface): TVoiceSection =>
  VOICE_SECTION_BY_SURFACE[surface];

const VOICE_SECTION_BY_FIELD = Object.fromEntries(
  VOICE_FIELDS.map(({ id, surface }) => [id, voiceSectionOf(surface)]),
) as Record<TVoiceFieldId, TVoiceSection>;

export const voiceSectionOfField = (fieldId: TVoiceFieldId): TVoiceSection =>
  VOICE_SECTION_BY_FIELD[fieldId];

export const voiceSectionFields = (section: TVoiceSection): TVoiceField[] =>
  VOICE_SURFACES_BY_SECTION[section].flatMap(voiceFieldsOf);

export const voiceSurfaceUnit = (surface: TVoiceSurface): TVoiceCountUnit =>
  surface === VOICE_SURFACE.ARCHIVE
    ? VOICE_COUNT_UNIT.LISTS
    : VOICE_COUNT_UNIT.FIELDS;

export const countVoiceSectionCustomised = (
  values: TVoiceLocaleDraft,
  section: TVoiceSection,
): number => countCustomisedVoiceFields(values, voiceSectionFields(section));

export const countVoiceSectionErrors = (
  errors: TVoiceFieldErrors,
  section: TVoiceSection,
): number =>
  voiceSectionFields(section).filter(({ id }) => !isUndefined(errors[id]))
    .length;

export const voiceCardHref = (surface: TVoiceSurface): string =>
  `#${VOICE_CARD_ID[surface].card}`;

export const voiceHashTarget = (
  hash: string,
): TMaybeUndefined<TVoiceHashTarget> => {
  const id = hash.slice(1);
  const section = VOICE_SECTIONS_IN_PAGE_ORDER.find(
    (candidate) =>
      VOICE_SECTION_ID[candidate].section === id ||
      VOICE_SURFACES_BY_SECTION[candidate].some(
        (surface) => VOICE_CARD_ID[surface].card === id,
      ),
  );
  return section && { section, id };
};
