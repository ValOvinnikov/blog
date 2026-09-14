import { inlineTextSchema } from '@blog/studio/schema-types/portable-text/inline-text/inline-text';

type TBlockArrayMember = {
  type: string;
  marks?: { annotations?: { type?: string }[] };
};

describe('inlineTextSchema block annotations', () => {
  it('offers the shared-link annotation only — no href-based paste-a-URL fallback', () => {
    const [blockMember] = inlineTextSchema.of as unknown as TBlockArrayMember[];

    expect(blockMember?.marks?.annotations).toEqual([
      { type: 'sharedLinkAnnotation' },
    ]);
  });
});
