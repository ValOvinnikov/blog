import { LINK_TYPE } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { linkDocumentFragment } from './link-document';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const linkDocQuery = q.star
  .filterByType('link')
  .slice(0)
  .project(linkDocumentFragment)
  .notNull();

function localized(values: Partial<Record<string, string>>) {
  return Object.entries(values).map(([language, value]) => ({
    _key: language,
    _type: 'internationalizedArrayStringValue',
    language,
    value,
  }));
}

function reference(id: string) {
  return { _type: 'reference', _ref: id };
}

const pages = [
  { _id: 'about-en', _type: 'page_landing', slug: { current: 'about' } },
  { _id: 'about-nl', _type: 'page_landing', slug: { current: 'over-ons' } },
  { _id: 'contact-en', _type: 'page_landing', slug: { current: 'contact' } },
  {
    _id: 'meta-about',
    _type: 'translation.metadata',
    translations: [
      { _key: EN, language: EN, value: reference('about-en') },
      { _key: NL, language: NL, value: reference('about-nl') },
    ],
  },
];

function resolveLink(link: Record<string, unknown>, locale: string) {
  return evaluateGroqExpression(
    linkDocQuery.query,
    [{ _id: 'link-1', _type: 'link', ...link }, ...pages],
    undefined,
    { locale, defaultLocale: EN },
  );
}

describe('linkDocumentFragment', () => {
  it('resolves the label in the requested language', async () => {
    const result = await resolveLink(
      {
        linkType: LINK_TYPE.INTERNAL,
        label: localized({ [EN]: 'About us', [NL]: 'Over ons' }),
        internalReference: reference('contact-en'),
      },
      NL,
    );

    expect(result).toMatchObject({ label: 'Over ons' });
  });

  it('falls back to the default-language label when the requested one is missing', async () => {
    const result = await resolveLink(
      {
        linkType: LINK_TYPE.INTERNAL,
        label: localized({ [EN]: 'About us' }),
        internalReference: reference('contact-en'),
      },
      FR,
    );

    expect(result).toMatchObject({ label: 'About us' });
  });

  it("resolves an internal reference to the page's translation in the requested language", async () => {
    const result = await resolveLink(
      {
        linkType: LINK_TYPE.INTERNAL,
        label: localized({ [EN]: 'About us' }),
        internalReference: reference('about-en'),
      },
      NL,
    );

    expect(result).toMatchObject({
      internalReference: { _type: 'page_landing', slug: 'over-ons' },
    });
  });

  it('falls back to the default-language page when the target has no translation', async () => {
    const result = await resolveLink(
      {
        linkType: LINK_TYPE.INTERNAL,
        label: localized({ [EN]: 'Contact' }),
        internalReference: reference('contact-en'),
      },
      NL,
    );

    expect(result).toMatchObject({
      internalReference: { _type: 'page_landing', slug: 'contact' },
    });
  });

  it('resolves an external url in the requested language, falling back to the default', async () => {
    const link = {
      linkType: LINK_TYPE.EXTERNAL,
      label: localized({ [EN]: 'Docs' }),
      url: localized({
        [EN]: 'https://example.com/en',
        [NL]: 'https://example.com/nl',
      }),
    };

    expect(await resolveLink(link, NL)).toMatchObject({
      url: 'https://example.com/nl',
    });
    expect(await resolveLink(link, FR)).toMatchObject({
      url: 'https://example.com/en',
    });
  });
});
