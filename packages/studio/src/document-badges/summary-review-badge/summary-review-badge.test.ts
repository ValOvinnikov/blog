import { faker } from '@faker-js/faker';
import type { TMaybeUndefined } from '@shinefold/config/types';
import {
  PAGE_POST_TYPE,
  POST_TAKEAWAYS_FIELD,
} from '@shinefold/studio/schema-types/documents/pages/post/post-type';
import { mockDocument } from '@shinefold/studio/testing/mock-documents';
import type { DocumentBadgeProps } from 'sanity';

import { SummaryReviewBadge } from './summary-review-badge';

faker.seed(8175);

const MOCK_GENERATED_AT = faker.date.recent().toISOString();
const MOCK_EARLIER_GENERATED_AT = faker.date.past().toISOString();

const postWithSummary = (generatedAt: TMaybeUndefined<string>) =>
  mockDocument({ [POST_TAKEAWAYS_FIELD]: { generatedAt } });

const badgeFor = ({
  type = PAGE_POST_TYPE,
  draftGeneratedAt,
  publishedGeneratedAt,
}: {
  type?: string;
  draftGeneratedAt?: string;
  publishedGeneratedAt?: string;
}) =>
  SummaryReviewBadge({
    type,
    draft: postWithSummary(draftGeneratedAt),
    published: postWithSummary(publishedGeneratedAt),
  } as DocumentBadgeProps);

describe(SummaryReviewBadge, () => {
  it('badges a post whose draft holds a summary not yet published', () => {
    expect(badgeFor({ draftGeneratedAt: MOCK_GENERATED_AT })).not.toBeNull();
  });

  it('badges a post whose draft holds a newer summary than the published one', () => {
    expect(
      badgeFor({
        draftGeneratedAt: MOCK_GENERATED_AT,
        publishedGeneratedAt: MOCK_EARLIER_GENERATED_AT,
      }),
    ).not.toBeNull();
  });

  it('leaves a post unbadged once its summary is published', () => {
    expect(
      badgeFor({
        draftGeneratedAt: MOCK_GENERATED_AT,
        publishedGeneratedAt: MOCK_GENERATED_AT,
      }),
    ).toBeNull();
  });

  it('leaves a draft with no generated summary unbadged', () => {
    expect(badgeFor({})).toBeNull();
  });

  it('leaves any other document type unbadged', () => {
    expect(
      badgeFor({
        type: faker.lorem.word(),
        draftGeneratedAt: MOCK_GENERATED_AT,
      }),
    ).toBeNull();
  });
});
