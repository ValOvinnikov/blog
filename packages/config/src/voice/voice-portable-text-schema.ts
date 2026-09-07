export type TVoicePortableTextSchema = {
  decorators: { name: 'strong' | 'em' }[];
  styles: { name: 'normal' }[];
  lists: never[];
  annotations: { name: 'link'; fields: { name: 'href'; type: 'string' }[] }[];
};

/** The editable Voice rich-text vocabulary: bold, italic and link, single-paragraph style only, no lists. */
export const VOICE_PORTABLE_TEXT_SCHEMA: TVoicePortableTextSchema = {
  decorators: [{ name: 'strong' }, { name: 'em' }],
  styles: [{ name: 'normal' }],
  lists: [],
  annotations: [{ name: 'link', fields: [{ name: 'href', type: 'string' }] }],
};
