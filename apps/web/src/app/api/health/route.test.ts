import { HTTP_STATUS } from '@shinefold/config';
import { CACHE_CONTROL, CACHE_CONTROL_HEADER } from '@web/constants/http';

import { GET } from './route';

describe(GET, () => {
  it('answers OK', () => {
    expect(GET().status).toBe(HTTP_STATUS.OK);
  });

  it('is never cached by a browser or the CDN', () => {
    expect(GET().headers.get(CACHE_CONTROL_HEADER)).toBe(
      CACHE_CONTROL.PRIVATE_NO_STORE,
    );
  });
});
