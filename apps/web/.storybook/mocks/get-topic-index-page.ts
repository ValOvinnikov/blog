import type { TTopicIndexPage } from '@blog/service';
import type { TResult } from '@blog/utils';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { makeSeo } from '@web/testing/shared/seo/fixtures';

const topicIndexPage: TTopicIndexPage = {
  headingBlock: makeHeadingBlock({
    heading: 'Topics',
    supportingText: 'Browse every post by topic.',
  }),
  hero: undefined,
  modules: [],
  seo: makeSeo(),
};

/**
 * Storybook-only stand-in for the real loader, which reads the request
 * context and calls `@blog/service` — neither resolves outside a real
 * request (`.storybook/main.ts`).
 */
export const getTopicIndexPage = async (): Promise<
  TResult<TTopicIndexPage | undefined>
> => ({ ok: true, data: topicIndexPage });
