import { FETCH_SITE } from '@platform/constants/request';
import { MOCK_PLATFORM_ORIGIN } from '@platform/testing/auth/fixtures';
import {
  MOCK_CROSS_ORIGIN_STUDIO_REQUEST_HEADERS,
  MOCK_STUDIO_REQUEST_HEADERS,
  studioJsonRequest,
} from '@platform/testing/newsletter-post-send/fixtures';
import { MEDIA_TYPE, REQUEST_HEADER, routes } from '@shinefold/config';

import { isSameOriginJsonRequest } from './studio-route-request';

const PATH = routes.newsletterPostSendNow();
const MOCK_HEADERS_WITHOUT_ORIGIN = {
  [REQUEST_HEADER.CONTENT_TYPE]: MEDIA_TYPE.JSON,
};

const isAccepted = (headers: Record<string, string>): boolean =>
  isSameOriginJsonRequest(studioJsonRequest(PATH, {}, headers));

describe(isSameOriginJsonRequest, () => {
  it.each(
    Object.entries<Record<string, string>>({
      'JSON from the platform origin': MOCK_STUDIO_REQUEST_HEADERS,
      'JSON with a charset': {
        ...MOCK_STUDIO_REQUEST_HEADERS,
        [REQUEST_HEADER.CONTENT_TYPE]: `${MEDIA_TYPE.JSON}; charset=utf-8`,
      },
      'JSON with no Origin but a same-origin fetch site': {
        ...MOCK_HEADERS_WITHOUT_ORIGIN,
        [REQUEST_HEADER.SEC_FETCH_SITE]: FETCH_SITE.SAME_ORIGIN,
      },
    }),
  )('accepts %s', (_case, headers) => {
    expect(isAccepted(headers)).toBe(true);
  });

  it.each(
    Object.entries<Record<string, string>>({
      'another origin': MOCK_CROSS_ORIGIN_STUDIO_REQUEST_HEADERS,
      'the platform with a non-JSON body': {
        ...MOCK_STUDIO_REQUEST_HEADERS,
        [REQUEST_HEADER.CONTENT_TYPE]: MEDIA_TYPE.TEXT,
      },
      'the platform with no Content-Type': {
        [REQUEST_HEADER.ORIGIN]: MOCK_PLATFORM_ORIGIN,
      },
      'a same-site page with no Origin': {
        ...MOCK_HEADERS_WITHOUT_ORIGIN,
        [REQUEST_HEADER.SEC_FETCH_SITE]: FETCH_SITE.SAME_SITE,
      },
      'nowhere it names': MOCK_HEADERS_WITHOUT_ORIGIN,
    }),
  )('refuses a request from %s', (_case, headers) => {
    expect(isAccepted(headers)).toBe(false);
  });
});
