import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { at, defineMigration, set } from 'sanity/migrate';

type TSanityObject = { _type?: string; [field: string]: unknown };

type TCtaDoc = {
  headingBlock?: TSanityObject;
  eyebrow?: unknown;
  footnote?: unknown;
  content?: unknown;
  image?: TSanityObject;
};

// Every tenant's default language is English when this runs.
const DEFAULT_LOCALE = LOCALE_ISO_CODES.EN;

const inDefaultLocale = (type: string, value: unknown) => [
  { _key: DEFAULT_LOCALE, _type: type, language: DEFAULT_LOCALE, value },
];

const localizedString = (value: unknown) =>
  typeof value === 'string'
    ? inDefaultLocale('internationalizedArrayStringValue', value)
    : value;

const isPortableText = (value: unknown): value is unknown[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every(
    (item) => (item as { _type?: unknown } | null)?._type === 'block',
  );

const localizeHeadingBlock = (headingBlock: TCtaDoc['headingBlock']) => {
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

const localizeImage = (image: TCtaDoc['image']) => {
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

const localizeStringField = (field: 'eyebrow' | 'footnote', value: unknown) =>
  typeof value === 'string' ? [at(field, set(localizedString(value)))] : [];

const localizeContent = (content: unknown) =>
  isPortableText(content)
    ? [
        at(
          'content',
          set(
            inDefaultLocale('internationalizedArrayListedTextValue', content),
          ),
        ),
      ]
    : [];

export const localizeCtaModule = (doc: TCtaDoc) => {
  const patches = [
    ...localizeHeadingBlock(doc.headingBlock),
    ...localizeStringField('eyebrow', doc.eyebrow),
    ...localizeContent(doc.content),
    ...localizeStringField('footnote', doc.footnote),
    ...localizeImage(doc.image),
  ];

  return patches.length > 0 ? patches : undefined;
};

export default defineMigration({
  title: 'Move CTA module text into the default language',
  documentTypes: ['module_cta'],
  migrate: {
    document(doc) {
      return localizeCtaModule(doc as TCtaDoc);
    },
  },
});
