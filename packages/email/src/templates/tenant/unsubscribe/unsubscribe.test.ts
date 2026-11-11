import {
  MOCK_JAVASCRIPT_URL,
  MOCK_UNSUBSCRIBE_URL,
} from '@blog/email/testing/email-fixtures';

import {
  buildListUnsubscribeHeaders,
  LIST_UNSUBSCRIBE_ONE_CLICK,
} from './unsubscribe';

const MOCK_HTTP_UNSUBSCRIBE_URL = MOCK_UNSUBSCRIBE_URL.replace(
  'https:',
  'http:',
);

describe(buildListUnsubscribeHeaders, () => {
  it('sets one-click headers for an https url', () => {
    expect(buildListUnsubscribeHeaders(MOCK_UNSUBSCRIBE_URL)).toEqual({
      'List-Unsubscribe': `<${MOCK_UNSUBSCRIBE_URL}>`,
      'List-Unsubscribe-Post': LIST_UNSUBSCRIBE_ONE_CLICK,
    });
  });

  it.each([
    ['an http url', MOCK_HTTP_UNSUBSCRIBE_URL],
    ['a javascript url', MOCK_JAVASCRIPT_URL],
  ])('sets no headers for %s', (_name, url) => {
    expect(buildListUnsubscribeHeaders(url)).toEqual({});
  });
});
