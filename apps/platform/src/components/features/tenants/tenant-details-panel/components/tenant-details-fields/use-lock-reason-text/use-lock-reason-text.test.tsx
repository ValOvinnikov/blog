import { TENANT_PROVISIONING_STEP } from '@blog/db';
import { TENANT_FIELD_LOCK_KIND } from '@platform/constants/tenant';
import messages from '@platform/i18n/messages/en.json';
import { renderHookWithIntl } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import type { TTenantFieldLockReason } from '@platform/utils/tenant-field-locks/tenant-field-locks';

import { useLockReasonText } from './use-lock-reason-text';

const { tenantDetailsPanel, provisioningStatusView } = messages;
const t = makeEnTranslator();

const LOCK_REASON_CASES: {
  reason: TTenantFieldLockReason;
  text: string;
}[] = [
  {
    reason: {
      kind: TENANT_FIELD_LOCK_KIND.STEP,
      step: TENANT_PROVISIONING_STEP.MAP_DOMAIN,
    },
    text: t('tenantDetailsPanel.fieldLockedReasonStep', {
      step: provisioningStatusView.stepLabel[
        TENANT_PROVISIONING_STEP.MAP_DOMAIN
      ],
    }),
  },
  {
    reason: { kind: TENANT_FIELD_LOCK_KIND.RUNNING },
    text: tenantDetailsPanel.fieldLockedReasonRunning,
  },
  {
    reason: { kind: TENANT_FIELD_LOCK_KIND.SUCCEEDED },
    text: tenantDetailsPanel.fieldLockedReasonSucceeded,
  },
  {
    reason: { kind: TENANT_FIELD_LOCK_KIND.CUSTOM_MAIN_DOMAIN },
    text: tenantDetailsPanel.fieldLockedReasonCustomMainDomain,
  },
  {
    reason: { kind: TENANT_FIELD_LOCK_KIND.ARCHIVED },
    text: tenantDetailsPanel.fieldLockedReasonArchived,
  },
];

describe(useLockReasonText, () => {
  it('gives no text for an unlocked field', () => {
    const { result } = renderHookWithIntl(() => useLockReasonText());

    expect(result.current(undefined)).toBeUndefined();
  });

  it.each(LOCK_REASON_CASES)(
    'states why the field is locked ($reason.kind)',
    ({ reason, text }) => {
      const { result } = renderHookWithIntl(() => useLockReasonText());

      expect(result.current(reason)).toBe(text);
    },
  );
});
