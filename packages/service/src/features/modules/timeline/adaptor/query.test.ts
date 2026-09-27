import {
  makeRawTimelineItem,
  makeRawTimelineModule,
} from '@blog/service/testing/modules/fixtures';

import { timelineModuleQuery } from './query';

describe('timelineModuleQuery', () => {
  it('filters to module_timeline documents by id', () => {
    expect(timelineModuleQuery.query).toContain('_type == "module_timeline"');
    expect(timelineModuleQuery.query).toContain('_id == $id');
  });

  it('rejects a module with no headingBlock', () => {
    const raw = { ...makeRawTimelineModule(), headingBlock: null };

    expect(() => timelineModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a module with no items', () => {
    const raw = { ...makeRawTimelineModule(), items: null };

    expect(() => timelineModuleQuery.parse(raw)).toThrow();
  });

  it('rejects an item with no heading', () => {
    const raw = {
      ...makeRawTimelineModule(),
      items: [{ ...makeRawTimelineItem(), heading: null }],
    };

    expect(() => timelineModuleQuery.parse(raw)).toThrow();
  });

  it('parses an item with no marker or body', () => {
    const raw = {
      ...makeRawTimelineModule(),
      items: [{ ...makeRawTimelineItem(), marker: null, body: null }],
    };

    expect(() => timelineModuleQuery.parse(raw)).not.toThrow();
    const parsed = timelineModuleQuery.parse(raw).items?.[0];
    expect(parsed?.marker).toBeNull();
    expect(parsed?.body).toBeNull();
  });

  it('rejects a module with no markerStyle', () => {
    const raw = { ...makeRawTimelineModule(), markerStyle: null };

    expect(() => timelineModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a module with no orientation', () => {
    const raw = { ...makeRawTimelineModule(), orientation: null };

    expect(() => timelineModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a module with no itemAlignment', () => {
    const raw = { ...makeRawTimelineModule(), itemAlignment: null };

    expect(() => timelineModuleQuery.parse(raw)).toThrow();
  });
});
