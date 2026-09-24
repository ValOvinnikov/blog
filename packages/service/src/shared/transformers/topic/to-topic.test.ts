import { makeRawTopic } from '@blog/service/testing/entities/fixtures';

import { toTopic } from './to-topic';

describe('toTopic', () => {
  it('maps all fields from raw input', () => {
    const raw = makeRawTopic();
    const result = toTopic(raw);

    expect(result).toEqual({
      id: 'topic-1',
      title: 'Engineering',
      slug: 'engineering',
      description: 'Engineering posts',
    });
  });

  it('converts null description to undefined', () => {
    const raw = makeRawTopic({ description: null });
    expect(toTopic(raw).description).toBeUndefined();
  });
});
