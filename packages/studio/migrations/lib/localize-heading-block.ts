import { at, set, type NodePatch } from 'sanity/migrate';

import { inDefaultLocale, localizedString } from './in-default-locale';

export type THeadingBlockValue = { _type?: string; [field: string]: unknown };

export const localizeHeadingBlock = (
  headingBlock: THeadingBlockValue | undefined,
): NodePatch[] => {
  if (!headingBlock || headingBlock._type === 'localizedHeadingBlock') {
    return [];
  }

  const { heading, supportingText, ...rest } = headingBlock;

  return [
    at(
      'headingBlock',
      set({
        ...rest,
        _type: 'localizedHeadingBlock',
        ...(heading === undefined ? {} : { heading: localizedString(heading) }),
        ...(typeof supportingText === 'string'
          ? {
              supportingText: inDefaultLocale(
                'internationalizedArrayTextValue',
                supportingText,
              ),
            }
          : {}),
      }),
    ),
  ];
};
