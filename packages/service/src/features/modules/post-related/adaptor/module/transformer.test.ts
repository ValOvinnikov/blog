import { BRAND_VARIANT } from '@blog/config/constants';
import { mockRawPostRelatedModule } from '@blog/service/testing/modules/fixtures';
import { faker } from '@faker-js/faker';

import { toPostRelatedModuleDocument } from './transformer';

faker.seed(23);

const MOCK_LIMIT = faker.number.int({ min: 1, max: 12 });

describe(toPostRelatedModuleDocument, () => {
  it('maps the module fields, keeping the authored limit', () => {
    const result = toPostRelatedModuleDocument(
      mockRawPostRelatedModule({ limit: MOCK_LIMIT }),
    );

    expect(result.brandVariant).toBe(BRAND_VARIANT.PRIMARY);
    expect(result.showImages).toBe(true);
    expect(result.limit).toBe(MOCK_LIMIT);
  });
});
