import { SANITY_WEBHOOK_OPERATION } from '@shinefold/config';

import { isLandingRoutePurged } from './is-landing-route-purged';

const { UPDATE, DELETE } = SANITY_WEBHOOK_OPERATION;
const REDIRECT_TYPE = 'redirect';
const LANDING_TYPE = 'page_landing';

describe(isLandingRoutePurged, () => {
  it.each([
    { case: 'a prefix redirect', isPrefix: true },
    {
      case: 'a redirect from a webhook that sends a null isPrefix',
      isPrefix: null,
    },
    {
      case: 'a redirect from a webhook that sends no isPrefix',
      isPrefix: undefined,
    },
  ])('purges the landing route for $case', ({ isPrefix }) => {
    expect(
      isLandingRoutePurged({
        type: REDIRECT_TYPE,
        operation: UPDATE,
        redirect: { isPrefix },
      }),
    ).toBe(true);
  });

  it.each([UPDATE, DELETE])(
    'keeps the landing route for an exact redirect on %s',
    (operation) => {
      expect(
        isLandingRoutePurged({
          type: REDIRECT_TYPE,
          operation,
          redirect: { isPrefix: false },
        }),
      ).toBe(false);
    },
  );

  it('purges the landing route for a deleted landing page', () => {
    expect(
      isLandingRoutePurged({
        type: LANDING_TYPE,
        operation: DELETE,
        redirect: {},
      }),
    ).toBe(true);
  });

  it.each([
    { type: LANDING_TYPE, operation: UPDATE },
    { type: 'page_tag', operation: DELETE },
    { type: 'page_post', operation: DELETE },
  ])(
    'keeps the landing route for a $type $operation',
    ({ type, operation }) => {
      expect(isLandingRoutePurged({ type, operation, redirect: {} })).toBe(
        false,
      );
    },
  );
});
