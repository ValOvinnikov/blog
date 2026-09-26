import {
  makeRawPricingModule,
  makeRawPricingPrice,
  makeRawPricingTier,
} from '@blog/service/testing/modules/fixtures';

import { pricingModuleQuery } from './query';

describe('pricingModuleQuery', () => {
  it('filters to module_pricing documents by id', () => {
    expect(pricingModuleQuery.query).toContain('_type == "module_pricing"');
    expect(pricingModuleQuery.query).toContain('_id == $id');
  });

  it('rejects a module with no headingBlock', () => {
    const raw = { ...makeRawPricingModule(), headingBlock: null };

    expect(() => pricingModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a module with no tiers', () => {
    const raw = { ...makeRawPricingModule(), tiers: null };

    expect(() => pricingModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a tier with no name', () => {
    const raw = {
      ...makeRawPricingModule(),
      tiers: [{ ...makeRawPricingTier(), name: null }],
    };

    expect(() => pricingModuleQuery.parse(raw)).toThrow();
  });

  it('parses a tier with no prices', () => {
    const raw = {
      ...makeRawPricingModule(),
      tiers: [{ ...makeRawPricingTier(), prices: null }],
    };

    expect(() => pricingModuleQuery.parse(raw)).not.toThrow();
    expect(pricingModuleQuery.parse(raw).tiers?.[0]?.prices).toBeNull();
  });

  it('rejects a price with no period', () => {
    const raw = {
      ...makeRawPricingModule(),
      tiers: [
        {
          ...makeRawPricingTier(),
          prices: [{ ...makeRawPricingPrice(), period: null }],
        },
      ],
    };

    expect(() => pricingModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a price with no amount', () => {
    const raw = {
      ...makeRawPricingModule(),
      tiers: [
        {
          ...makeRawPricingTier(),
          prices: [{ ...makeRawPricingPrice(), amount: null }],
        },
      ],
    };

    expect(() => pricingModuleQuery.parse(raw)).toThrow();
  });
});
