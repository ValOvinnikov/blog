import { featureBlockSchema } from '@blog/studio/schema-types/documents/blocks/feature/feature';
import { linkSchema } from '@blog/studio/schema-types/documents/link/link';

import { blocksSection } from './blocks-section';

describe('blocksSection', () => {
  it('groups Feature Cards and Links, each holding exactly one item', () => {
    expect(blocksSection.groups).toHaveLength(2);

    const [featureCardsGroup, linksGroup] = blocksSection.groups;

    expect(featureCardsGroup?.title).toBe('Feature Cards');
    expect(featureCardsGroup?.items).toEqual([{ schema: featureBlockSchema }]);

    expect(linksGroup?.title).toBe('Links');
    expect(linksGroup?.items).toEqual([{ schema: linkSchema }]);
  });

  it('does not opt into flattening — Blocks holds more than one document type', () => {
    expect(blocksSection.flattenSingleItem).toBeUndefined();
  });
});
