import {
  makeRawStatItem,
  makeRawStatsModule,
} from '@blog/service/testing/modules/fixtures';

import { statsModuleQuery } from './query';

describe('statsModuleQuery', () => {
  it('filters to module_stats documents by id', () => {
    expect(statsModuleQuery.query).toContain('_type == "module_stats"');
    expect(statsModuleQuery.query).toContain('_id == $id');
  });

  it('rejects a module with no headingBlock', () => {
    const raw = { ...makeRawStatsModule(), headingBlock: null };

    expect(() => statsModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a module with no stats', () => {
    const raw = { ...makeRawStatsModule(), stats: null };

    expect(() => statsModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a stat with no value', () => {
    const raw = {
      ...makeRawStatsModule(),
      stats: [{ ...makeRawStatItem(), value: null }],
    };

    expect(() => statsModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a stat with no label', () => {
    const raw = {
      ...makeRawStatsModule(),
      stats: [{ ...makeRawStatItem(), label: null }],
    };

    expect(() => statsModuleQuery.parse(raw)).toThrow();
  });

  it('parses a stat with no description', () => {
    const raw = {
      ...makeRawStatsModule(),
      stats: [{ ...makeRawStatItem(), description: null }],
    };

    expect(() => statsModuleQuery.parse(raw)).not.toThrow();
    expect(statsModuleQuery.parse(raw).stats?.[0]?.description).toBeNull();
  });
});
