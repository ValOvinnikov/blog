import { LINK_TYPE } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query/query';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { inlineLinkFragment } from './inline-link';

const { EN, NL } = LOCALE_ISO_CODES;

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

  it('links a topic to its topic page in the request language', async () => {
    const dataset = [
      {
        _id: 'link-1',
        _type: 'inlineLink',
        label: 'Design',
        linkType: LINK_TYPE.INTERNAL,
        internalReference: { _type: 'reference', _ref: 'design' },
      },
      { _id: 'design', _type: 'blog_topic' },
      {
        _id: 'design-nl',
        _type: 'page_topic',
        topic: { _type: 'reference', _ref: 'design' },
        slug: { current: 'ontwerp' },
        language: NL,
      },
    ];
    function resolve(locale: string): Promise<unknown> {
      return evaluateGroqExpression(inlineLinkDocQuery.query, dataset, null, {
        locale,
      });
    }

    expect(await resolve(NL)).toMatchObject({
      internalReference: { slug: 'ontwerp' },
    });
    expect(await resolve(EN)).toMatchObject({
      internalReference: { slug: null },
    });
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
