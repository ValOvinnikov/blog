import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { PAGE_TOPIC_TYPE } from '@blog/studio/schema-types/documents/pages/topic/topic-type';
import {
  AUTOMATIC_REDIRECT_EDITED_WARNING,
  REDIRECT_DESTINATION_UNPUBLISHED_ERROR,
  REDIRECT_SOURCE_SHADOWED_WARNING,
  validateAutomaticRedirectUnchanged,
  validateRedirectDestinationPage,
  validateRedirectSourcePage,
} from '@blog/studio/schema-types/validation/validate-redirect-page/validate-redirect-page';
import {
  MOCK_REDIRECT_SOURCE,
  mockPage,
  mockRedirect,
} from '@blog/studio/testing/mock-documents';
import { mockGroqValidationContext } from '@blog/studio/testing/mock-validation-context';
import type { SanityDocument, ValidationContext } from 'sanity';

const { EN, NL } = LOCALE_ISO_CODES;

const ELSEWHERE_PATH = '/elsewhere';
const SERVICES_DESIGN_PATH = '/services/design';

const PAGES = [
  mockPage({
    _type: PAGE_LANDING_TYPE,
    _id: 'services',
    slug: 'services',
    language: EN,
  }),
  mockPage({
    _type: PAGE_LANDING_TYPE,
    _id: 'design',
    slug: 'design',
    language: EN,
    parent: 'services',
  }),
  mockPage({
    _type: PAGE_LANDING_TYPE,
    _id: 'design-nl',
    slug: 'design',
    language: NL,
  }),
  mockPage({
    _type: PAGE_POST_TYPE,
    _id: 'hello',
    slug: 'hello',
    language: EN,
  }),
  mockPage({
    _type: PAGE_TOPIC_TYPE,
    _id: 'news',
    slug: 'news',
    language: EN,
  }),
];

describe(validateRedirectDestinationPage, () => {
  let document: SanityDocument;
  let context: ValidationContext;

  beforeEach(() => {
    document = mockRedirect({ _id: 'drafts.r1' });
    context = mockGroqValidationContext(PAGES, { document });
  });

  it.each([
    '/services',
    SERVICES_DESIGN_PATH,
    '/blog/hello',
    '/topics/news',
    '/topics/news/page/2',
    '/',
    '/blog',
    '/blog/page/3',
    '/account',
  ])('passes %s, where a page is live', async (path) => {
    await expect(validateRedirectDestinationPage(path, context)).resolves.toBe(
      true,
    );
  });

  it.each([
    '/missing',
    '/design',
    '/services/missing',
    '/blog/missing',
    '/blog/hello/extra',
    '/tags/news',
  ])('blocks %s, where no page is published', async (path) => {
    await expect(validateRedirectDestinationPage(path, context)).resolves.toBe(
      REDIRECT_DESTINATION_UNPUBLISHED_ERROR,
    );
  });

  it('blocks a page that is only published in another language', async () => {
    const dataset = [
      mockPage({
        _type: PAGE_LANDING_TYPE,
        _id: 'about-nl',
        slug: 'about',
        language: NL,
      }),
    ];

    await expect(
      validateRedirectDestinationPage(
        '/about',
        mockGroqValidationContext(dataset, { document }),
      ),
    ).resolves.toBe(REDIRECT_DESTINATION_UNPUBLISHED_ERROR);
  });

  it('passes a destination when the page lookup fails', async () => {
    await expect(
      validateRedirectDestinationPage(
        '/missing',
        mockGroqValidationContext(PAGES, {
          document,
          fetchError: new Error('network'),
        }),
      ),
    ).resolves.toBe(true);
  });
});

describe(validateRedirectSourcePage, () => {
  let document: SanityDocument;
  let context: ValidationContext;

  beforeEach(() => {
    document = mockRedirect({ _id: 'drafts.r1' });
    context = mockGroqValidationContext(PAGES, { document });
  });

  it('warns when a page is published at the source', async () => {
    await expect(
      validateRedirectSourcePage(SERVICES_DESIGN_PATH, context),
    ).resolves.toBe(REDIRECT_SOURCE_SHADOWED_WARNING);
  });

  it('passes a source with no published page', async () => {
    await expect(
      validateRedirectSourcePage('/old-design', context),
    ).resolves.toBe(true);
  });

  it('passes a source when the page lookup fails', async () => {
    await expect(
      validateRedirectSourcePage(
        '/services',
        mockGroqValidationContext(PAGES, {
          document,
          fetchError: new Error('network'),
        }),
      ),
    ).resolves.toBe(true);
  });
});

describe(validateAutomaticRedirectUnchanged, () => {
  const published = mockRedirect({ _id: 'r1', isAutomatic: true });

  it('warns when the source of an automatic redirect is changed', async () => {
    const draft = mockRedirect({
      _id: 'drafts.r1',
      isAutomatic: true,
      source: '/older',
    });

    await expect(
      validateAutomaticRedirectUnchanged('source')(
        '/older',
        mockGroqValidationContext([published], { document: draft }),
      ),
    ).resolves.toBe(AUTOMATIC_REDIRECT_EDITED_WARNING);
  });

  it('warns when the destination of an automatic redirect is changed', async () => {
    const draft = mockRedirect({
      _id: 'drafts.r1',
      isAutomatic: true,
      destination: ELSEWHERE_PATH,
    });

    await expect(
      validateAutomaticRedirectUnchanged('destination')(
        ELSEWHERE_PATH,
        mockGroqValidationContext([published], { document: draft }),
      ),
    ).resolves.toBe(AUTOMATIC_REDIRECT_EDITED_WARNING);
  });

  it('passes an automatic redirect left as it was created', async () => {
    const draft = mockRedirect({ _id: 'drafts.r1', isAutomatic: true });

    await expect(
      validateAutomaticRedirectUnchanged('source')(
        MOCK_REDIRECT_SOURCE,
        mockGroqValidationContext([published], { document: draft }),
      ),
    ).resolves.toBe(true);
  });

  it('passes a changed manual redirect', async () => {
    const draft = mockRedirect({ _id: 'drafts.r1', source: '/older' });

    await expect(
      validateAutomaticRedirectUnchanged('source')(
        '/older',
        mockGroqValidationContext([mockRedirect({ _id: 'r1' })], {
          document: draft,
        }),
      ),
    ).resolves.toBe(true);
  });
});
