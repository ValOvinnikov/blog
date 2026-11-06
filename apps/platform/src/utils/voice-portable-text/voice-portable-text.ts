import {
  portableTextToPlainText,
  type TMaybeNull,
  type TVoiceFieldId,
  type TVoicePortableText,
} from '@blog/config';
import { hasLength } from '@blog/utils/primitives';
import { isBlankPortableTextValue } from '@platform/utils/is-blank-portable-text-value/is-blank-portable-text-value';

export const voiceTextToPortableText = (
  id: TVoiceFieldId,
  text: string,
): TVoicePortableText => [
  {
    _type: 'block',
    _key: `${id}-block`,
    style: 'normal',
    children: [{ _type: 'span', _key: `${id}-span`, text }],
  },
];

export const isVoicePlainCopyOf = (
  value: TVoicePortableText,
  text: string,
): boolean =>
  value.length === 1 &&
  value.every(
    ({ children, markDefs }) =>
      !hasLength(markDefs) && children.every(({ marks }) => !hasLength(marks)),
  ) &&
  portableTextToPlainText(value) === text;

export const toVoiceRichDraft = (
  value: TVoicePortableText,
  defaultText: string,
): TMaybeNull<TVoicePortableText> =>
  isBlankPortableTextValue(value) || isVoicePlainCopyOf(value, defaultText)
    ? null
    : value;
