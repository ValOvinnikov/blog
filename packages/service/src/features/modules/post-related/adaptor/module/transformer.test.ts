import { BRAND_VARIANT } from '@blog/config/constants';
import { mockRawPostRelatedModule } from '@blog/service/testing/modules/fixtures';

import { toPostRelatedModuleDocument } from './transformer';

describe(toPostRelatedModuleDocument, () => {
  it('maps the module fields, keeping the authored limit', () => {
    const result = toPostRelatedModuleDocument(
      mockRawPostRelatedModule({ limit: 4 }),
    );

    expect(result.brandVariant).toBe(BRAND_VARIANT.PRIMARY);
    expect(result.showImages).toBe(true);
    expect(result.limit).toBe(4);
  });
});
