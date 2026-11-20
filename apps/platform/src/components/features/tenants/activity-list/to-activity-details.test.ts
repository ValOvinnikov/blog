import { faker } from '@faker-js/faker';
import { ACTIVITY_DETAIL } from '@platform/constants/activity';
import { TENANT_DETAILS_FIELD } from '@platform/constants/tenant';
import { AUDIT_ACTION } from '@shinefold/config';
import { CAPABILITY, TENANT_PLAN } from '@shinefold/config/constants';
import { ENTITLEMENT_KIND } from '@shinefold/db/constants';

import { toActivityDetails } from './to-activity-details';

faker.seed(6536);

const MOCK_FROM_DOMAIN = faker.internet.domainName();
const MOCK_TO_DOMAIN = faker.internet.domainName();
const MOCK_GRANT_ID = faker.string.uuid();
const MOCK_GRANT_EXPIRES_AT = faker.date.future();
const MOCK_GRANT_NOTE = faker.lorem.sentence();
const MOCK_LANGUAGE_LIMIT = 3;
const NEWSLETTER_GRANT_DETAILS = {
  grantId: MOCK_GRANT_ID,
  kind: ENTITLEMENT_KIND.CAPABILITY,
  key: CAPABILITY.NEWSLETTER,
  value: null,
};

describe(toActivityDetails, () => {
  it('describes nothing for an event without details', () => {
    expect(toActivityDetails(AUDIT_ACTION.SETTINGS_UPDATED, null)).toEqual([]);
  });

  it('describes the changed fields and a sent Studio invite of a tenant-details save', () => {
    const details = toActivityDetails(AUDIT_ACTION.SETTINGS_UPDATED, {
      plan: TENANT_PLAN.GROWTH,
      changedFields: [TENANT_DETAILS_FIELD.OWNER_EMAIL],
      studioReinviteRequested: true,
      studioReinviteUnsent: false,
    });

    expect(details).toEqual([
      {
        kind: ACTIVITY_DETAIL.CHANGED_FIELDS,
        fields: [TENANT_DETAILS_FIELD.OWNER_EMAIL],
      },
      { kind: ACTIVITY_DETAIL.STUDIO_INVITE_SENT },
    ]);
  });

  it('describes the plan a tenant was created on', () => {
    const details = toActivityDetails(AUDIT_ACTION.CREATED, {
      plan: TENANT_PLAN.FREE,
    });

    expect(details).toEqual([
      { kind: ACTIVITY_DETAIL.PLAN, plan: TENANT_PLAN.FREE },
    ]);
  });

  it('describes a main address change from one domain to the other', () => {
    const details = toActivityDetails(AUDIT_ACTION.SETTINGS_UPDATED, {
      mainAddressChanged: { from: MOCK_FROM_DOMAIN, to: MOCK_TO_DOMAIN },
    });

    expect(details).toEqual([
      {
        kind: ACTIVITY_DETAIL.MAIN_ADDRESS_CHANGED,
        from: MOCK_FROM_DOMAIN,
        to: MOCK_TO_DOMAIN,
      },
    ]);
  });

  it('describes an operator plan change in place of the changed plan field', () => {
    const details = toActivityDetails(AUDIT_ACTION.SETTINGS_UPDATED, {
      changedFields: [TENANT_DETAILS_FIELD.NAME, TENANT_DETAILS_FIELD.PLAN],
      planChanged: { from: TENANT_PLAN.GROWTH, to: TENANT_PLAN.STARTER },
    });

    expect(details).toEqual([
      {
        kind: ACTIVITY_DETAIL.CHANGED_FIELDS,
        fields: [TENANT_DETAILS_FIELD.NAME],
      },
      {
        kind: ACTIVITY_DETAIL.PLAN_CHANGED,
        from: TENANT_PLAN.GROWTH,
        to: TENANT_PLAN.STARTER,
      },
    ]);
  });

  it('skips unknown keys and values of the wrong shape', () => {
    const details = toActivityDetails(AUDIT_ACTION.SETTINGS_UPDATED, {
      [faker.lorem.word()]: faker.lorem.word(),
      changedFields: [faker.lorem.word()],
      mainAddressChanged: MOCK_TO_DOMAIN,
    });

    expect(details).toEqual([]);
  });

  it('names the item, expiry and note of a grant', () => {
    const details = toActivityDetails(AUDIT_ACTION.ENTITLEMENT_GRANTED, {
      ...NEWSLETTER_GRANT_DETAILS,
      expiresAt: MOCK_GRANT_EXPIRES_AT.toISOString(),
      note: MOCK_GRANT_NOTE,
    });

    expect(details).toEqual([
      {
        kind: ACTIVITY_DETAIL.GRANT_ITEM,
        item: {
          kind: ENTITLEMENT_KIND.CAPABILITY,
          key: CAPABILITY.NEWSLETTER,
          value: null,
        },
      },
      { kind: ACTIVITY_DETAIL.GRANT_EXPIRY, expiresAt: MOCK_GRANT_EXPIRES_AT },
      { kind: ACTIVITY_DETAIL.GRANT_NOTE, note: MOCK_GRANT_NOTE },
    ]);
  });

  it('describes a revoked grant without an expiry or note as lasting until revoked', () => {
    const details = toActivityDetails(AUDIT_ACTION.ENTITLEMENT_REVOKED, {
      ...NEWSLETTER_GRANT_DETAILS,
      expiresAt: null,
      note: null,
    });

    expect(details).toEqual([
      {
        kind: ACTIVITY_DETAIL.GRANT_ITEM,
        item: {
          kind: ENTITLEMENT_KIND.CAPABILITY,
          key: CAPABILITY.NEWSLETTER,
          value: null,
        },
      },
      { kind: ACTIVITY_DETAIL.GRANT_UNTIL_REVOKED },
    ]);
  });

  it('carries the language count of a languages grant', () => {
    const details = toActivityDetails(AUDIT_ACTION.ENTITLEMENT_GRANTED, {
      grantId: MOCK_GRANT_ID,
      kind: ENTITLEMENT_KIND.LOCALE_LIMIT,
      key: ENTITLEMENT_KIND.LOCALE_LIMIT,
      value: MOCK_LANGUAGE_LIMIT,
      expiresAt: null,
      note: null,
    });

    expect(details).toContainEqual({
      kind: ACTIVITY_DETAIL.GRANT_ITEM,
      item: {
        kind: ENTITLEMENT_KIND.LOCALE_LIMIT,
        key: ENTITLEMENT_KIND.LOCALE_LIMIT,
        value: MOCK_LANGUAGE_LIMIT,
      },
    });
  });

  it('names only the item of a language raise closing the earlier grant', () => {
    const details = toActivityDetails(AUDIT_ACTION.ENTITLEMENT_REVOKED, {
      grantId: MOCK_GRANT_ID,
      kind: ENTITLEMENT_KIND.LOCALE_LIMIT,
      key: ENTITLEMENT_KIND.LOCALE_LIMIT,
      replacedBy: faker.string.uuid(),
    });

    expect(details).toEqual([
      {
        kind: ACTIVITY_DETAIL.GRANT_ITEM,
        item: {
          kind: ENTITLEMENT_KIND.LOCALE_LIMIT,
          key: ENTITLEMENT_KIND.LOCALE_LIMIT,
          value: null,
        },
      },
    ]);
  });

  it('describes nothing for a grant whose details name no item', () => {
    const details = toActivityDetails(AUDIT_ACTION.ENTITLEMENT_GRANTED, {
      grantId: MOCK_GRANT_ID,
      kind: faker.lorem.word(),
      note: MOCK_GRANT_NOTE,
    });

    expect(details).toEqual([]);
  });
});
