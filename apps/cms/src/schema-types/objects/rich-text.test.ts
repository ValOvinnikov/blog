import { richTextSchema } from '@cms/schema-types/objects/rich-text';

type TBlockArrayMember = {
  type: string;
  styles?: { title: string; value: string }[];
};

const getBlockMember = () => {
  const of = richTextSchema.of as unknown as TBlockArrayMember[];
  const blockMember = of.find((member) => member.type === 'block');

  if (!blockMember) {
    throw new Error('Expected richTextSchema to define a block array member.');
  }

  return blockMember;
};

describe('richTextSchema block styles', () => {
  it('only offers normal, H2–H4, and blockquote — excluding H1 so the body never competes with the page/post title', () => {
    const { styles } = getBlockMember();

    expect(styles?.map((style) => style.value)).toEqual([
      'normal',
      'h2',
      'h3',
      'h4',
      'blockquote',
    ]);
  });
});
