import { LINK_TYPE } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query/query';
import {
  MOCK_LINK_LABEL,
  MOCK_POST_SLUG,
  mockReference,
} from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { faker } from '@faker-js/faker';

import { inlineLinkFragment } from './inline-link';

faker.seed(6016);

const { EN } = LOCALE_ISO_CODES;

const MOCK_LINK_ID = faker.string.uuid();
const MOCK_PARENT_PAGE_ID = faker.string.uuid();
const MOCK_PARENT_PAGE_SLUG = faker.lorem.slug(2);
const MOCK_CHILD_PAGE_ID = faker.string.uuid();
const MOCK_CHILD_PAGE_SLUG = faker.lorem.slug(2);

const inlineLinkDocQuery = q.star
  .filterByType('inlineLink')
  .slice(0)
  .project(inlineLinkFragment);

describe('inlineLinkFragment', () => {
  it('keeps an internal post reference through a real parse', () => {
    const raw = {
      label: MOCK_LINK_LABEL,
      linkType: LINK_TYPE.INTERNAL,
      url: null,
      internalReference: { _type: 'page_post', slug: MOCK_POST_SLUG },
      openInNewTab: null,
      platform: null,
      accessibleLabel: null,
    };

    const link = inlineLinkDocQuery.parse(raw);

    expect(link).toEqual(raw);
  });

  it('links a nested landing page to its full path', async () => {
    const dataset = [
      {
        _id: MOCK_LINK_ID,
        _type: 'inlineLink',
        label: MOCK_LINK_LABEL,
        linkType: LINK_TYPE.INTERNAL,
        internalReference: mockReference(MOCK_CHILD_PAGE_ID),
      },
      {
        _id: MOCK_PARENT_PAGE_ID,
        _type: 'page_landing',
        slug: { current: MOCK_PARENT_PAGE_SLUG },
      },
      {
        _id: MOCK_CHILD_PAGE_ID,
        _type: 'page_landing',
        slug: { current: MOCK_CHILD_PAGE_SLUG },
        parent: mockReference(MOCK_PARENT_PAGE_ID),
      },
    ];

    const link = await evaluateGroqExpression(
      inlineLinkDocQuery.query,
      dataset,
      null,
      { locale: EN },
    );

    expect(link).toEqual({
      label: MOCK_LINK_LABEL,
      linkType: LINK_TYPE.INTERNAL,
      url: null,
      internalReference: {
        _type: 'page_landing',
        slug: `${MOCK_PARENT_PAGE_SLUG}/${MOCK_CHILD_PAGE_SLUG}`,
      },
      openInNewTab: null,
      platform: null,
      accessibleLabel: null,
    });
  });
});
