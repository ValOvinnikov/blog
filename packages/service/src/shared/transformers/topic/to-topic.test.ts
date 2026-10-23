import {
  MOCK_TOPIC_DESCRIPTION,
  MOCK_TOPIC_ID,
  MOCK_TOPIC_SLUG,
  MOCK_TOPIC_TITLE,
  mockRawTopic,
} from '@blog/service/testing/entities/fixtures';

import { toTopic } from './to-topic';

describe(toTopic, () => {
  it('maps all fields from raw input', () => {
    const result = toTopic(mockRawTopic());

    expect(result).toEqual({
      id: MOCK_TOPIC_ID,
      title: MOCK_TOPIC_TITLE,
      slug: MOCK_TOPIC_SLUG,
      description: MOCK_TOPIC_DESCRIPTION,
    });
  });

  it('converts null description to undefined', () => {
    const { description } = toTopic(mockRawTopic({ description: null }));

    expect(description).toBeUndefined();
  });

  it('maps a topic with no topic page to an undefined slug', () => {
    const { slug } = toTopic(mockRawTopic({ slug: null }));

    expect(slug).toBeUndefined();
  });
});
