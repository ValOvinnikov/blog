import { SANITY_WEBHOOK_OPERATION } from '@shinefold/config';

import { isLandingRoutePurged } from './is-landing-route-purged';

const { UPDATE, DELETE } = SANITY_WEBHOOK_OPERATION;
const REDIRECT_TYPE = 'redirect';
const LANDING_TYPE = 'page_landing';

describe(isLandingRoutePurged, () => {
  it.each([
    {
      case: 'a prefix redirect',
      type: REDIRECT_TYPE,
      operation: UPDATE,
      redirect: { isPrefix: true },
    },
    {
      case: 'a redirect from a webhook that sends a null isPrefix',
      type: REDIRECT_TYPE,
      operation: UPDATE,
      redirect: { isPrefix: null },
    },
    {
      case: 'a redirect from a webhook that sends no isPrefix',
      type: REDIRECT_TYPE,
      operation: UPDATE,
      redirect: {},
    },
    {
      case: 'a deleted landing page',
      type: LANDING_TYPE,
      operation: DELETE,
      redirect: {},
    },
  ])('purges the landing route for $case', (input) => {
    expect(isLandingRoutePurged(input)).toBe(true);
  });

  it.each([
    {
      case: 'an exact redirect update',
      type: REDIRECT_TYPE,
      operation: UPDATE,
      redirect: { isPrefix: false },
    },
    {
      case: 'an exact redirect delete',
      type: REDIRECT_TYPE,
      operation: DELETE,
      redirect: { isPrefix: false },
    },
    {
      case: 'a landing page update',
      type: LANDING_TYPE,
      operation: UPDATE,
      redirect: {},
    },
    {
      case: 'a deleted tag page',
      type: 'page_tag',
      operation: DELETE,
      redirect: {},
    },
    {
      case: 'a deleted post',
      type: 'page_post',
      operation: DELETE,
      redirect: {},
    },
  ])('keeps the landing route for $case', (input) => {
    expect(isLandingRoutePurged(input)).toBe(false);
  });
});
