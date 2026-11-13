import { AUDIT_ACTION } from '@blog/config';
import { TENANT_PLAN } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { ACTIVITY_DETAIL } from '@platform/constants/activity';
import { TENANT_DETAILS_FIELD } from '@platform/constants/tenant';

import { toActivityDetails } from './to-activity-details';

faker.seed(6536);

const MOCK_FROM_DOMAIN = faker.internet.domainName();
const MOCK_TO_DOMAIN = faker.internet.domainName();

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

  it('skips unknown keys and values of the wrong shape', () => {
    const details = toActivityDetails(AUDIT_ACTION.SETTINGS_UPDATED, {
      [faker.lorem.word()]: faker.lorem.word(),
      changedFields: [faker.lorem.word()],
      mainAddressChanged: MOCK_TO_DOMAIN,
    });

    expect(details).toEqual([]);
  });
});
