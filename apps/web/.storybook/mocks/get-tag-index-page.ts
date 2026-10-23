import { LOCALE_ISO_CODES, CONTENT_ALIGNMENT } from '@blog/config';
import type { TTagIndexPage } from '@blog/service';
import type { TResult } from '@blog/utils';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';

const tagIndexPage: TTagIndexPage = {
  headingAlignment: CONTENT_ALIGNMENT.LEFT,
  headingBlock: mockHeadingBlock({
    heading: 'Tags',
    supportingText: 'Browse every post by tag.',
  }),
  hero: undefined,
  modules: [],
  seo: mockSeo(),
  translations: [LOCALE_ISO_CODES.EN],
};

/**
 * Storybook-only stand-in for the real loader, which reads the request
 * context and calls `@blog/service` — neither resolves outside a real
 * request (`.storybook/main.ts`).
 */
export const getTagIndexPage = async (): Promise<
  TResult<TTagIndexPage | undefined>
> => ({ ok: true, data: tagIndexPage });
