import { makeRawPostRelatedModule } from '@blog/service/testing/modules/fixtures';

import { toPostRelatedModuleDocument } from './transformer';

describe(toPostRelatedModuleDocument, () => {
  it('maps the module fields, keeping the authored limit', () => {
    const result = toPostRelatedModuleDocument(
      makeRawPostRelatedModule({ limit: 4 }),
    );

    expect(result.brandVariant).toBe('PRIMARY');
    expect(result.showImages).toBe(true);
    expect(result.limit).toBe(4);
  });
});
