import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  LANDING_PARENT_CYCLE_ERROR,
  LANDING_PARENT_DEPTH_ERROR,
  LANDING_PARENT_LANGUAGE_ERROR,
  validateLandingParent,
} from '@blog/studio/schema-types/validation/validate-landing-parent/validate-landing-parent';
import {
  mockLandingPage,
  mockReference,
} from '@blog/studio/testing/mock-documents';
import { mockGroqValidationContext } from '@blog/studio/testing/mock-validation-context';
import type { SanityDocument } from 'sanity';

const { EN, NL } = LOCALE_ISO_CODES;

describe(validateLandingParent, () => {
  const modules = mockLandingPage({
    _id: 'modules',
    language: EN,
  });
  const faq = mockLandingPage({
    _id: 'faq',
    parent: 'modules',
    language: EN,
  });
  let draft: SanityDocument;

  beforeEach(() => {
    draft = mockLandingPage({
      _id: 'drafts.modules',
      language: EN,
    });
  });

  it('passes a page with no parent', async () => {
    await expect(
      validateLandingParent(
        undefined,
        mockGroqValidationContext([modules], {
          document: mockLandingPage({
            _id: 'team',
            language: EN,
          }),
        }),
      ),
    ).resolves.toBe(true);
  });

  it('passes a parent in the same language within the depth bound', async () => {
    const team = mockLandingPage({
      _id: 'drafts.team',
      language: EN,
    });

    await expect(
      validateLandingParent(
        mockReference('modules'),
        mockGroqValidationContext([modules], { document: team }),
      ),
    ).resolves.toBe(true);
  });

  it('rejects the page as its own parent', async () => {
    await expect(
      validateLandingParent(
        mockReference('modules'),
        mockGroqValidationContext([modules], { document: draft }),
      ),
    ).resolves.toBe(LANDING_PARENT_CYCLE_ERROR);
  });

  it('rejects a parent that sits beneath the page', async () => {
    await expect(
      validateLandingParent(
        mockReference('faq'),
        mockGroqValidationContext([modules, faq], { document: draft }),
      ),
    ).resolves.toBe(LANDING_PARENT_CYCLE_ERROR);
  });

  it('rejects a parent in another language', async () => {
    const dutch = mockLandingPage({
      _id: 'drafts.over',
      language: NL,
    });

    await expect(
      validateLandingParent(
        mockReference('modules'),
        mockGroqValidationContext([modules], { document: dutch }),
      ),
    ).resolves.toBe(LANDING_PARENT_LANGUAGE_ERROR);
  });

  it('rejects nesting the page deeper than the bound', async () => {
    const billing = mockLandingPage({
      _id: 'billing',
      parent: 'faq',
      language: EN,
    });
    const invoices = mockLandingPage({
      _id: 'drafts.invoices',
      language: EN,
    });

    await expect(
      validateLandingParent(
        mockReference('billing'),
        mockGroqValidationContext([modules, faq, billing], {
          document: invoices,
        }),
      ),
    ).resolves.toBe(LANDING_PARENT_DEPTH_ERROR);
  });

  it('rejects a move that pushes the page’s own sub-pages past the bound', async () => {
    const pricing = mockLandingPage({
      _id: 'drafts.pricing',
      language: EN,
    });
    const plans = mockLandingPage({
      _id: 'plans',
      parent: 'pricing',
      language: EN,
    });

    await expect(
      validateLandingParent(
        mockReference('faq'),
        mockGroqValidationContext([modules, faq, plans], { document: pricing }),
      ),
    ).resolves.toBe(LANDING_PARENT_DEPTH_ERROR);
  });

  it('passes when the parent no longer exists', async () => {
    await expect(
      validateLandingParent(
        mockReference('gone'),
        mockGroqValidationContext([], {
          document: mockLandingPage({
            _id: 'team',
            language: EN,
          }),
        }),
      ),
    ).resolves.toBe(true);
  });

  it('passes when the fetch fails', async () => {
    await expect(
      validateLandingParent(
        mockReference('modules'),
        mockGroqValidationContext([modules], {
          document: mockLandingPage({
            _id: 'team',
            language: EN,
          }),
          fetchError: new Error('network down'),
        }),
      ),
    ).resolves.toBe(true);
  });
});
