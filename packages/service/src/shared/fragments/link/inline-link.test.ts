import { LINK_TYPE } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query/query';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { inlineLinkFragment } from './inline-link';

const { EN } = LOCALE_ISO_CODES;

const inlineLinkDocQuery = q.star
  .filterByType('inlineLink')
  .slice(0)
  .project(inlineLinkFragment);

describe('inlineLinkFragment', () => {
  it('keeps the internalReference field through a real parse for a page_post reference', () => {
    const raw = {
      label: 'Read more',
      linkType: LINK_TYPE.INTERNAL,
      url: null,
      internalReference: { _type: 'page_post', slug: 'hello-world' },
      openInNewTab: null,
      platform: null,
      accessibleLabel: null,
    };

    expect(inlineLinkDocQuery.parse(raw)).toEqual(raw);
  });

  it('links a nested landing page to its full path', async () => {
    const dataset = [
      {
        _id: 'link-1',
        _type: 'inlineLink',
        label: 'FAQ',
        linkType: LINK_TYPE.INTERNAL,
        internalReference: { _type: 'reference', _ref: 'faq' },
      },
      { _id: 'modules', _type: 'page_landing', slug: { current: 'modules' } },
      {
        _id: 'faq',
        _type: 'page_landing',
        slug: { current: 'faq' },
        parent: { _type: 'reference', _ref: 'modules' },
      },
    ];

    expect(
      await evaluateGroqExpression(inlineLinkDocQuery.query, dataset, null, {
        locale: EN,
      }),
    ).toMatchObject({ internalReference: { slug: 'modules/faq' } });
  });
});
