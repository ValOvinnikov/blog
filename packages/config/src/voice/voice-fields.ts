import { VOICE_FIELD_KIND } from './voice-field-kind';
import { VOICE_SURFACE } from './voice-surface';

/**
 * The page-level prose a tenant may reword; `id` is the storage key persisted
 * on `site_config.voiceOverrides`.
 */
export const VOICE_FIELDS = [
  {
    id: 'blogListEmpty',
    path: 'blogListPage.empty',
    kind: VOICE_FIELD_KIND.RICH,
    surface: VOICE_SURFACE.ARCHIVE,
    placeholders: [],
    max: 300,
  },
  {
    id: 'topicEmpty',
    path: 'topicPage.empty',
    kind: VOICE_FIELD_KIND.RICH,
    surface: VOICE_SURFACE.ARCHIVE,
    placeholders: ['name'],
    max: 300,
  },
  {
    id: 'tagEmpty',
    path: 'tagPage.empty',
    kind: VOICE_FIELD_KIND.RICH,
    surface: VOICE_SURFACE.ARCHIVE,
    placeholders: ['name'],
    max: 300,
  },
  {
    id: 'topicsEmpty',
    path: 'taxonomyListModule.topics.empty',
    kind: VOICE_FIELD_KIND.RICH,
    surface: VOICE_SURFACE.ARCHIVE,
    placeholders: [],
    max: 300,
  },
  {
    id: 'tagsEmpty',
    path: 'taxonomyListModule.tags.empty',
    kind: VOICE_FIELD_KIND.RICH,
    surface: VOICE_SURFACE.ARCHIVE,
    placeholders: [],
    max: 300,
  },
  {
    id: 'notFoundEyebrow',
    path: 'notFound.eyebrow',
    kind: VOICE_FIELD_KIND.TEXT,
    surface: VOICE_SURFACE.NOT_FOUND,
    placeholders: [],
    max: 40,
  },
  {
    id: 'notFoundHeading',
    path: 'notFound.heading',
    kind: VOICE_FIELD_KIND.TEXT,
    surface: VOICE_SURFACE.NOT_FOUND,
    placeholders: [],
    max: 100,
  },
  {
    id: 'notFoundSupportingText',
    path: 'notFound.supportingText',
    kind: VOICE_FIELD_KIND.RICH,
    surface: VOICE_SURFACE.NOT_FOUND,
    placeholders: [],
    max: 300,
  },
  {
    id: 'localeErrorTitle',
    path: 'localeErrorPage.title',
    kind: VOICE_FIELD_KIND.TEXT,
    surface: VOICE_SURFACE.ERROR,
    placeholders: [],
    max: 100,
  },
  {
    id: 'localeErrorDescription',
    path: 'localeErrorPage.description',
    kind: VOICE_FIELD_KIND.RICH,
    surface: VOICE_SURFACE.ERROR,
    placeholders: [],
    max: 300,
  },
  {
    id: 'bookmarksEmpty',
    path: 'bookmarksPage.empty',
    kind: VOICE_FIELD_KIND.RICH,
    surface: VOICE_SURFACE.BOOKMARKS,
    placeholders: [],
    max: 300,
  },
] as const;

export type TVoiceFieldId = (typeof VOICE_FIELDS)[number]['id'];
