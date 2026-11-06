import { faker } from '@faker-js/faker';

import { isBlankPortableTextValue } from './is-blank-portable-text-value';

faker.seed(1);

const MOCK_TEXT = faker.lorem.words(3);

type TBlockInput = {
  style?: string;
  listItem?: string;
  text?: string;
};

const mockBlock = ({ style, listItem, text = '' }: TBlockInput = {}) => ({
  _type: 'block',
  _key: faker.string.alphanumeric(8),
  ...(style ? { style } : {}),
  ...(listItem ? { listItem } : {}),
  children: [
    { _type: 'span', _key: faker.string.alphanumeric(8), text, marks: [] },
  ],
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
