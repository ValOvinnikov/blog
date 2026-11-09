import type { ArticleText } from '@blog/config';
import { PORTABLE_TEXT_BLOCK_TYPE } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query/query';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { faker } from '@faker-js/faker';

import { portableTextBodyItemFragment } from './portable-text-body-item';

faker.seed(6517);

const MOCK_COOKIE_LIST_KEY = faker.string.uuid();

const bodyItemQuery = q.star
  .filterByType(PORTABLE_TEXT_BLOCK_TYPE.COOKIE_LIST)
  .slice(0)
  .as<ArticleText[number]>()
  .project(portableTextBodyItemFragment);

describe('portableTextBodyItemFragment', () => {
  it('projects a cookie-list block as a cookie-list block', async () => {
    const raw = await evaluateGroqExpression(
      bodyItemQuery.query,
      [
        {
          _type: PORTABLE_TEXT_BLOCK_TYPE.COOKIE_LIST,
          _key: MOCK_COOKIE_LIST_KEY,
        },
      ],
      undefined,
    );

    expect(bodyItemQuery.parse(raw)).toMatchObject({
      _type: PORTABLE_TEXT_BLOCK_TYPE.COOKIE_LIST,
      _key: MOCK_COOKIE_LIST_KEY,
    });
  });
});
