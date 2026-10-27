import { PORTABLE_TEXT_BLOCK_TYPE } from '@blog/config/constants';
import { faker } from '@faker-js/faker';

export const MOCK_EXTERNAL_HOSTNAME = 'example.com';
export const MOCK_EXTERNAL_PATH = '/pricing';
export const MOCK_EXTERNAL_URL = `https://${MOCK_EXTERNAL_HOSTNAME}${MOCK_EXTERNAL_PATH}`;
export const MOCK_EXTERNAL_LABEL = `${MOCK_EXTERNAL_HOSTNAME}${MOCK_EXTERNAL_PATH}`;

export const mockPagePost = ({
  _id = faker.string.uuid(),
  title = faker.lorem.words(3),
  slug = faker.lorem.slug(3),
}: { _id?: string; title?: string; slug?: string } = {}) => ({
  _id,
  _type: 'page_post',
  title,
  slug: { current: slug },
});

export const mockSpan = (text: string, marks: string[] = []) => ({
  _key: faker.string.alphanumeric(12),
  _type: 'span',
  text,
  marks,
});

export const mockRawHrefMarkDef = (href?: string) => ({
  _key: faker.string.alphanumeric(12),
  _type: 'link' as const,
  ...(href === undefined ? {} : { href }),
});

export const mockInlineLinkMarkDef = (
  fields: Record<string, unknown> = {},
) => ({
  _key: faker.string.alphanumeric(12),
  _type: 'inlineLink' as const,
  ...fields,
});

export const mockLinkRefMarkDef = (linkId: string) => ({
  _key: faker.string.alphanumeric(12),
  _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
  link: { _type: 'reference' as const, _ref: linkId },
});

export const mockPortableTextBlock = ({
  markDefs = [],
  children = [],
}: {
  markDefs?: { _key: string; _type: string }[];
  children?: ReturnType<typeof mockSpan>[];
} = {}) => ({
  _key: faker.string.alphanumeric(12),
  _type: 'block' as const,
  markDefs,
  children,
});
