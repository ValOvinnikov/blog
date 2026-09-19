export type TVoicePortableTextSchema = {
  decorators: { name: 'strong' | 'em' }[];
  styles: { name: 'normal' }[];
  lists: never[];
  annotations: { name: 'link'; fields: { name: 'href'; type: 'string' }[] }[];
};

export const VOICE_PORTABLE_TEXT_SCHEMA: TVoicePortableTextSchema = {
  decorators: [{ name: 'strong' }, { name: 'em' }],
  styles: [{ name: 'normal' }],
  lists: [],
  annotations: [{ name: 'link', fields: [{ name: 'href', type: 'string' }] }],
};
