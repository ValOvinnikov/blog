import { adminRoutes } from '@platform/utils/routes/routes';

import { toLegalPageUrls } from './legal-page-urls';

describe(toLegalPageUrls, () => {
  it("points both pages at the admin panel's own placeholder pages", () => {
    expect(toLegalPageUrls()).toEqual({
      terms: adminRoutes.terms(),
      privacy: adminRoutes.privacy(),
    });
  });
});
