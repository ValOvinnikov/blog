import { proseTextSchema } from '@blog/studio/schema-types/portable-text/prose-text/prose-text';

type TBlockArrayMember = {
  type: string;
  marks?: { annotations?: { name?: string; type?: string }[] };
};

describe('proseTextSchema block annotations', () => {
  it('offers both the shared-link annotation and the href-based paste-a-URL annotation', () => {
    const [blockMember] = proseTextSchema.of as unknown as TBlockArrayMember[];

    expect(blockMember?.marks?.annotations).toEqual([
      { type: 'sharedLinkAnnotation' },
      expect.objectContaining({ name: 'link', type: 'object' }),
    ]);
  });
});
