import { linkRefSchema } from '@blog/studio/schema-types/objects/link-ref/link-ref';
import { proseTextSchema } from '@blog/studio/schema-types/portable-text/prose-text/prose-text';

type TBlockArrayMember = {
  type: string;
  marks?: {
    decorators?: { title: string; value: string }[];
    annotations?: { type: string }[];
  };
};

const getBlockMember = () => {
  const of = proseTextSchema.of as unknown as TBlockArrayMember[];
  const blockMember = of.find((member) => member.type === 'block');

  if (!blockMember) {
    throw new Error('Expected proseTextSchema to define a block array member.');
  }

  return blockMember;
};

describe('proseTextSchema block marks', () => {
  it('annotates links through the link library, not the built-in raw-href annotation', () => {
    const { marks } = getBlockMember();

    expect(marks?.annotations).toEqual([{ type: linkRefSchema.name }]);
  });

  it('leaves decorators undeclared so the default set still applies', () => {
    const { marks } = getBlockMember();

    expect(marks?.decorators).toBeUndefined();
  });
});
