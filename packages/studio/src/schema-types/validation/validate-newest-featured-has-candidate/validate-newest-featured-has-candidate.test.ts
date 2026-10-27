import { POST_SOURCE } from '@blog/config/constants';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { validateNewestFeaturedHasCandidate } from '@blog/studio/schema-types/validation/validate-newest-featured-has-candidate/validate-newest-featured-has-candidate';
import { mockDocument } from '@blog/studio/testing/mock-documents';
import {
  mockFetchContext,
  mockGroqValidationContext,
} from '@blog/studio/testing/mock-validation-context';
import { faker } from '@faker-js/faker';

faker.seed(6031);

const MOCK_NOW = new Date('2026-01-01T00:00:00.000Z');
const MOCK_PAST = faker.date.past({ refDate: MOCK_NOW }).toISOString();
const MOCK_FUTURE = faker.date.future({ refDate: MOCK_NOW }).toISOString();
const MOCK_RENDER_TARGET = faker.lorem.word();

const mockPost = (fields: Record<string, unknown>) =>
  mockDocument({ _id: faker.string.uuid(), _type: PAGE_POST_TYPE, ...fields });

describe(validateNewestFeaturedHasCandidate, () => {
  const validate = validateNewestFeaturedHasCandidate(MOCK_RENDER_TARGET);
  const noCandidateError = `No published post is marked Featured, so this ${MOCK_RENDER_TARGET} would render empty.`;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('passes without querying when the post source is not Newest Featured', async () => {
    const { context, fetchCalls } = mockFetchContext(0);

    await expect(validate(POST_SOURCE.PINNED, context)).resolves.toBe(true);
    expect(fetchCalls).toEqual([]);
  });

  it.each([
    [
      'passes when a published post is featured',
      [mockPost({ featured: true, publishedAt: MOCK_PAST })],
      true,
    ],
    ['names the render target when there are no posts', [], noCandidateError],
    [
      'errors when the only featured post is scheduled',
      [mockPost({ featured: true, publishedAt: MOCK_FUTURE })],
      noCandidateError,
    ],
    [
      'errors when no published post is featured',
      [mockPost({ featured: false, publishedAt: MOCK_PAST })],
      noCandidateError,
    ],
  ])('%s', async (_description, dataset, expected) => {
    const context = mockGroqValidationContext(dataset);

    await expect(validate(POST_SOURCE.NEWEST_FEATURED, context)).resolves.toBe(
      expected,
    );
  });

  it('passes when the fetch fails', async () => {
    const context = mockGroqValidationContext([], {
      fetchError: new Error(faker.lorem.sentence()),
    });

    await expect(validate(POST_SOURCE.NEWEST_FEATURED, context)).resolves.toBe(
      true,
    );
  });
});
