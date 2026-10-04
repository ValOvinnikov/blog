import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { at, set } from 'sanity/migrate';

export type TSanityObject = { _type?: string; [field: string]: unknown };

// Every tenant's default language is English when these migrations run.
const DEFAULT_LOCALE = LOCALE_ISO_CODES.EN;

export const inDefaultLocale = (type: string, value: unknown) => [
  { _key: DEFAULT_LOCALE, _type: type, language: DEFAULT_LOCALE, value },
];

const localizedString = (value: unknown) =>
  typeof value === 'string'
    ? inDefaultLocale('internationalizedArrayStringValue', value)
    : value;

export const localizeStringField = (field: string, value: unknown) =>
  typeof value === 'string' ? [at(field, set(localizedString(value)))] : [];

export const localizeHeadingBlock = (headingBlock?: TSanityObject) => {
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

export const localizeImage = (image?: TSanityObject) => {
  if (!image || image._type === 'localizedImageWithAlt') {
    return [];
  }

  const { alt, ...rest } = image;

  return [
    at(
      'image',
      set({
        ...rest,
        _type: 'localizedImageWithAlt',
        ...(alt === undefined ? {} : { alt: localizedString(alt) }),
      }),
    ),
  ];
};
