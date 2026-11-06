import { TENANT_PLAN } from '@blog/db/constants';
import { MOCK_PRODUCT_NAME } from '@platform/testing/env/fixtures';

import { toPoweredByProductName } from './powered-by-product-name';

describe(toPoweredByProductName, () => {
  it('names the product on a plan that carries the mark', () => {
    expect(toPoweredByProductName(TENANT_PLAN.FREE, MOCK_PRODUCT_NAME)).toBe(
      MOCK_PRODUCT_NAME,
    );
  });

  it('names nothing on a plan without the mark', () => {
    expect(
      toPoweredByProductName(TENANT_PLAN.GROWTH, MOCK_PRODUCT_NAME),
    ).toBeUndefined();
  });

  it('names nothing while the product name is unset', () => {
    expect(toPoweredByProductName(TENANT_PLAN.FREE, undefined)).toBeUndefined();
  });
});
