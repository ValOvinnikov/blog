import { linkSchema } from '@blog/studio/schema-types/documents/link/link';

import { linksSection } from './links-section';

describe('linksSection', () => {
  it('opts into flattening and holds exactly one non-singleton item', () => {
    expect(linksSection.flattenSingleItem).toBe(true);

    const items = linksSection.groups.flatMap((group) => group.items);
    expect(items).toHaveLength(1);
    expect(items[0]?.mode).toBeUndefined();
    expect(items[0]?.schema).toBe(linkSchema);
  });
});
