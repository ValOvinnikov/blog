import { serializePortableText } from '@blog/email';
import { faker } from '@faker-js/faker';

import {
  EMAIL_PORTABLE_TEXT_SCHEMA,
  isBlankPortableTextValue,
} from './portable-text-schema';

faker.seed(1);

const MOCK_TEXT = faker.lorem.words(3);
const MOCK_HREF = faker.internet.url();
const MOCK_LINK_KEY = faker.string.alphanumeric(8);

type TBlockInput = {
  style?: string;
  listItem?: string;
  text?: string;
  marks?: string[];
};

const mockBlock = ({
  style,
  listItem,
  text = '',
  marks = [],
}: TBlockInput = {}) => ({
  _type: 'block',
  _key: faker.string.alphanumeric(8),
  ...(style ? { style } : {}),
  ...(listItem ? { listItem } : {}),
  markDefs: [{ _key: MOCK_LINK_KEY, _type: 'link', href: MOCK_HREF }],
  children: [
    { _type: 'span', _key: faker.string.alphanumeric(8), text, marks },
  ],
});

const names = (entries: readonly { name: string }[] | undefined) =>
  (entries ?? []).map(({ name }) => name);

describe('EMAIL_PORTABLE_TEXT_SCHEMA', () => {
  const plainHtml = serializePortableText([mockBlock({ text: MOCK_TEXT })]);

  it.each(names(EMAIL_PORTABLE_TEXT_SCHEMA.styles))(
    'offers only the %s style the email serializer renders',
    (style) => {
      const html = serializePortableText([
        mockBlock({ style, text: MOCK_TEXT }),
      ]);

      expect(html).not.toBe('');
    },
  );

  it.each(names(EMAIL_PORTABLE_TEXT_SCHEMA.lists))(
    'offers only the %s list the email serializer renders',
    (listItem) => {
      const html = serializePortableText([
        mockBlock({ listItem, text: MOCK_TEXT }),
      ]);

      expect(html).not.toBe('');
    },
  );

  it.each([
    ...names(EMAIL_PORTABLE_TEXT_SCHEMA.decorators),
    ...names(EMAIL_PORTABLE_TEXT_SCHEMA.annotations).map(() => MOCK_LINK_KEY),
  ])('offers only the %s mark the email serializer renders', (mark) => {
    const html = serializePortableText([
      mockBlock({ text: MOCK_TEXT, marks: [mark] }),
    ]);

    expect(html).not.toBe(plainHtml);
  });
});

describe(isBlankPortableTextValue, () => {
  it.each([
    { value: undefined, shape: 'undefined' },
    { value: null, shape: 'null' },
    { value: [], shape: 'an empty array' },
    { value: [mockBlock({ style: 'normal' })], shape: 'one empty paragraph' },
    { value: [mockBlock({ text: '   ' })], shape: 'whitespace-only text' },
  ])('treats $shape as blank', ({ value }) => {
    expect(isBlankPortableTextValue(value)).toBe(true);
  });

  it.each([
    { value: [mockBlock({ text: MOCK_TEXT })], shape: 'real text' },
    { value: [mockBlock({ style: 'h2' })], shape: 'an empty heading' },
    { value: [mockBlock({ listItem: 'bullet' })], shape: 'an empty list item' },
    { value: [mockBlock(), mockBlock()], shape: 'more than one block' },
  ])('treats $shape as not blank', ({ value }) => {
    expect(isBlankPortableTextValue(value)).toBe(false);
  });
});
