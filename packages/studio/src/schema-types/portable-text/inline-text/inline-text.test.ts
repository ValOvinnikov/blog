import { linkRefSchema } from '@blog/studio/schema-types/objects/link-ref/link-ref';
import { inlineTextSchema } from '@blog/studio/schema-types/portable-text/inline-text/inline-text';

type TBlockArrayMember = {
  type: string;
  marks?: {
    decorators?: { title: string; value: string }[];
    annotations?: { type: string }[];
  };
};

const getBlockMember = () => {
  const of = inlineTextSchema.of as unknown as TBlockArrayMember[];
  const blockMember = of.find((member) => member.type === 'block');

  if (!blockMember) {
    throw new Error(
      'Expected inlineTextSchema to define a block array member.',
    );
  }

  return blockMember;
};

describe('inlineTextSchema block marks', () => {
  it('annotates links through the link library, not the built-in raw-href annotation', () => {
    const { marks } = getBlockMember();

    expect(marks?.annotations).toEqual([{ type: linkRefSchema.name }]);
  });

  it('keeps its restricted bold/italic decorator set', () => {
    const { marks } = getBlockMember();

    expect(marks?.decorators?.map((decorator) => decorator.value)).toEqual([
      'strong',
      'em',
    ]);
  });
});
