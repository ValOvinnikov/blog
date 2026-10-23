import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { PAGE_HOME_TYPE } from '@blog/studio/schema-types/documents/pages/home/home-type';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { REDIRECT_TYPE } from '@blog/studio/schema-types/documents/redirect/redirect-type';
import type { Reference, SanityDocument } from 'sanity';

export const MOCK_REDIRECT_SOURCE = '/old';

type TMockPageInput = {
  _id: string;
  slug?: string;
  parent?: string;
} & Record<string, unknown>;

const withoutUndefined = (fields: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  );

export const mockDocument = (fields: Record<string, unknown> = {}) =>
  withoutUndefined(fields) as unknown as SanityDocument;

export const mockReference = (id: string): Reference => ({
  _type: 'reference',
  _ref: id,
});

export const mockPage = ({ slug, parent, ...fields }: TMockPageInput) =>
  mockDocument({
    ...fields,
    slug: slug === undefined ? undefined : { _type: 'slug', current: slug },
    parent: parent === undefined ? undefined : mockReference(parent),
  });

export const mockLandingPage = (input: TMockPageInput) =>
  mockPage({ _type: PAGE_LANDING_TYPE, ...input });

export const mockHomePage = (input: TMockPageInput) =>
  mockPage({ _type: PAGE_HOME_TYPE, ...input });

export const mockRedirect = ({
  _id,
  ...fields
}: { _id: string } & Record<string, unknown>) =>
  mockDocument({
    _id,
    _type: REDIRECT_TYPE,
    language: LOCALE_ISO_CODES.EN,
    source: MOCK_REDIRECT_SOURCE,
    destination: '/new',
    ...fields,
  });

export const mockTranslationMetadata = (
  members: [id: string, language: string][],
  fields: Record<string, unknown> = {},
) => ({
  _id: `translation.metadata.${members.map(([id]) => id).join('-')}`,
  _type: 'translation.metadata',
  translations: members.map(([id, language]) => ({
    _key: language,
    _type: 'internationalizedArrayReferenceValue',
    language,
    value: mockReference(id),
  })),
  ...fields,
});

export const mockLocalizedValue = <TValue>(language: string, value?: TValue) =>
  value === undefined
    ? { _key: language, language }
    : { _key: language, language, value };
