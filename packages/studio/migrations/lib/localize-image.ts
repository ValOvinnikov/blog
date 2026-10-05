import { at, set, type NodePatch } from 'sanity/migrate';

import { localizedString } from './in-default-locale';

export type TImageValue = { _type?: string; [field: string]: unknown };

export const localizeImage = (
  path: Parameters<typeof at>[0],
  image: TImageValue | undefined,
): NodePatch[] => {
  if (!image || image._type === 'localizedImageWithAlt') {
    return [];
  }

  const { alt, ...rest } = image;

  return [
    at(
      path,
      set({
        ...rest,
        _type: 'localizedImageWithAlt',
        ...(alt === undefined ? {} : { alt: localizedString(alt) }),
      }),
    ),
  ];
};
