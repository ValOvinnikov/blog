import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  REDIRECT_DUPLICATE_SOURCE_ERROR,
  REDIRECT_INCOMING_CHAIN_ERROR,
  REDIRECT_OUTGOING_CHAIN_ERROR,
  validateRedirectDestination,
  validateRedirectSource,
} from '@blog/studio/schema-types/validation/validate-redirect-chain/validate-redirect-chain';
import {
  MOCK_REDIRECT_SOURCE,
  mockRedirect,
} from '@blog/studio/testing/mock-documents';
import { mockGroqValidationContext } from '@blog/studio/testing/mock-validation-context';
import type { SanityDocument } from 'sanity';

const { NL } = LOCALE_ISO_CODES;

const MODULES_FAQ_PATH = '/modules/faq';

describe(validateRedirectSource, () => {
  let draft: SanityDocument;

  beforeEach(() => {
    draft = mockRedirect({
      _id: 'drafts.r1',
      source: '/faq',
      destination: '/help',
    });
  });

  it('passes a source no other redirect uses', async () => {
    await expect(
      validateRedirectSource(
        '/faq',
        mockGroqValidationContext([draft], { document: draft }),
      ),
    ).resolves.toBe(true);
  });

  it('rejects a source another redirect already starts from', async () => {
    await expect(
      validateRedirectSource(
        '/faq',
        mockGroqValidationContext(
          [mockRedirect({ _id: 'r2', source: '/faq', destination: '/other' })],
          { document: draft },
        ),
      ),
    ).resolves.toBe(REDIRECT_DUPLICATE_SOURCE_ERROR);
  });

  it('rejects a source another redirect sends visitors to', async () => {
    await expect(
      validateRedirectSource(
        '/faq',
        mockGroqValidationContext(
          [
            mockRedirect({
              _id: 'r2',
              source: '/questions',
              destination: '/faq',
            }),
          ],
          { document: draft },
        ),
      ),
    ).resolves.toBe(REDIRECT_INCOMING_CHAIN_ERROR);
  });

  it('rejects a prefix source another redirect sends visitors beneath', async () => {
    const prefixDraft = mockRedirect({
      _id: 'drafts.r1',
      source: '/modules',
      destination: '/catalog',
      isPrefix: true,
    });

    await expect(
      validateRedirectSource(
        '/modules',
        mockGroqValidationContext(
          [
            mockRedirect({
              _id: 'r2',
              source: MOCK_REDIRECT_SOURCE,
              destination: MODULES_FAQ_PATH,
            }),
          ],
          { document: prefixDraft },
        ),
      ),
    ).resolves.toBe(REDIRECT_INCOMING_CHAIN_ERROR);
  });

  it('ignores redirects in another language', async () => {
    await expect(
      validateRedirectSource(
        '/faq',
        mockGroqValidationContext(
          [
            mockRedirect({
              _id: 'r2',
              source: '/faq',
              destination: '/x',
              language: NL,
            }),
          ],
          { document: draft },
        ),
      ),
    ).resolves.toBe(true);
  });

  it('passes when the lookup fails', async () => {
    await expect(
      validateRedirectSource(
        '/faq',
        mockGroqValidationContext([], {
          document: draft,
          fetchError: new Error('x'),
        }),
      ),
    ).resolves.toBe(true);
  });
});

describe(validateRedirectDestination, () => {
  let draft: SanityDocument;

  beforeEach(() => {
    draft = mockRedirect({
      _id: 'drafts.r1',
      source: '/faq',
      destination: '/help',
    });
  });

  it('passes a destination that is not redirected', async () => {
    await expect(
      validateRedirectDestination(
        '/help',
        mockGroqValidationContext([], { document: draft }),
      ),
    ).resolves.toBe(true);
  });

  it('rejects a destination that is itself redirected', async () => {
    await expect(
      validateRedirectDestination(
        '/help',
        mockGroqValidationContext(
          [
            mockRedirect({
              _id: 'r2',
              source: '/help',
              destination: '/support',
            }),
          ],
          { document: draft },
        ),
      ),
    ).resolves.toBe(REDIRECT_OUTGOING_CHAIN_ERROR);
  });

  it('rejects a destination beneath a prefix redirect', async () => {
    const nestedDraft = mockRedirect({
      _id: 'drafts.r1',
      source: '/faq',
      destination: MODULES_FAQ_PATH,
    });

    await expect(
      validateRedirectDestination(
        MODULES_FAQ_PATH,
        mockGroqValidationContext(
          [
            mockRedirect({
              _id: 'r2',
              source: '/modules',
              destination: '/catalog',
              isPrefix: true,
            }),
          ],
          { document: nestedDraft },
        ),
      ),
    ).resolves.toBe(REDIRECT_OUTGOING_CHAIN_ERROR);
  });
});
