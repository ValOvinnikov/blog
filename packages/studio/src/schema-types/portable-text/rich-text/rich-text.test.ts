import { linkRefSchema } from '@blog/studio/schema-types/objects/link-ref/link-ref';
import { richTextSchema } from '@blog/studio/schema-types/portable-text/rich-text/rich-text';

type TBlockArrayMember = {
  type: string;
  styles?: { title: string; value: string }[];
  marks?: {
    decorators?: { title: string; value: string }[];
    annotations?: { type: string }[];
  };
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

describe('richTextSchema block marks', () => {
  it('annotates links through the link library, not the built-in raw-href annotation', () => {
    const { marks } = getBlockMember();

    expect(marks?.annotations).toEqual([{ type: linkRefSchema.name }]);
  });

  it('leaves decorators undeclared so the default set (bold, italic, code, underline, strike-through) still applies', () => {
    const { marks } = getBlockMember();

    expect(marks?.decorators).toBeUndefined();
  });
});
